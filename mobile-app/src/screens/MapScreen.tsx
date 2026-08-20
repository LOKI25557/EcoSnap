import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert, Text, useColorScheme, Platform, Linking, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import MapView from 'react-native-maps';
import { LocationService } from '../services/location/LocationService';
import { facilityService } from '../services/recycling/facilityService';
import { mapsService } from '../services/location/mapsService';
import { Facility } from '../types/Facility';
import { FacilityMarker } from '../components/maps/FacilityMarker';
import { FacilityDetailsCard } from '../components/maps/FacilityDetailsCard';
import { LocationAnalyticsService } from '../services/location/LocationAnalyticsService';
import { Coordinate } from '../services/location/DistanceCalculator';
import { authService } from '../services/firebase/authService';
import { communityReportRepository } from '../services/firebase/communityReportRepository';
import { CommunityReport } from '../types/CommunityReport';
import { CommunityReportMarker } from '../components/maps/CommunityReportMarker';
import { CommunityReportDetailsCard } from '../components/maps/CommunityReportDetailsCard';

type FilterType = 'all' | 'recycling' | 'ewaste' | 'donation' | 'reports';

const MapScreen = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const [userLocation, setUserLocation] = useState<Coordinate | null>(null);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [selectedReport, setSelectedReport] = useState<CommunityReport | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchFacilities = useCallback(async (location: Coordinate) => {
    try {
      // Search for facilities in a 10km radius
      const nearby = await facilityService.searchNearbyFacilities(location.latitude, location.longitude, 10000);
      setFacilities(nearby);
    } catch (error) {
      console.error('Error fetching facilities:', error);
      Alert.alert('Error', 'Failed to load recycling facilities.');
    }
  }, []);

  const fetchReports = useCallback(async () => {
    const user = authService.getCurrentUser();
    if (!user) return;

    try {
      const response = await communityReportRepository.list({ userId: user.uid });
      setReports(response.items);
    } catch (error) {
      console.error('Error fetching community reports:', error);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    const location = await LocationService.getCurrentLocation();
    if (location) {
      setUserLocation(location);
      await Promise.all([
        fetchFacilities(location),
        fetchReports(),
      ]);
    } else {
      Alert.alert('Location Error', 'Could not determine your location. Showing default map view.');
      const defaultLoc = { latitude: 37.7749, longitude: -122.4194 };
      setUserLocation(defaultLoc);
      await Promise.all([
        fetchFacilities(defaultLoc),
        fetchReports(),
      ]);
    }
    setLoading(false);
  }, [fetchFacilities, fetchReports]);

  useEffect(() => {
    loadData();
    return () => {
      LocationService.stopWatchingLocation();
    };
  }, [loadData]);

  // Memoized filtered facilities
  const filteredFacilities = useMemo(() => {
    let result = facilities;

    if (filter === 'recycling') {
      result = result.filter((f) => f.type === 'recycling_center');
    } else if (filter === 'ewaste') {
      result = result.filter((f) => f.type === 'ewaste_facility' || f.type === 'e_waste_center');
    } else if (filter === 'donation') {
      result = result.filter((f) => f.type === 'donation_center');
    } else if (filter === 'reports') {
      return [];
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(query) ||
          f.address.toLowerCase().includes(query) ||
          (f.acceptedMaterials && f.acceptedMaterials.some((m) => m.toLowerCase().includes(query)))
      );
    }

    return result;
  }, [facilities, filter, searchQuery]);

  // Memoized filtered reports
  const filteredReports = useMemo(() => {
    if (filter !== 'all' && filter !== 'reports') {
      return [];
    }

    let result = reports;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.description.toLowerCase().includes(query) ||
          (r.address && r.address.toLowerCase().includes(query)) ||
          r.type.toLowerCase().includes(query)
      );
    }

    return result;
  }, [reports, filter, searchQuery]);

  const handleFacilityPress = (facility: Facility) => {
    setSelectedReport(null);
    setSelectedFacility(facility);
    if (facility.distanceMeters !== undefined) {
      LocationAnalyticsService.trackVisit(facility.id, facility.distanceMeters / 1000);
    }
  };

  const handleReportPress = (report: CommunityReport) => {
    setSelectedFacility(null);
    setSelectedReport(report);
  };

  const handleNavigate = async () => {
    if (selectedFacility) {
      LocationAnalyticsService.trackNavigationClick();
      const success = await mapsService.launchNavigation(selectedFacility.latitude, selectedFacility.longitude);
      if (!success) {
        Alert.alert('Error', 'Could not open navigation application.');
      }
    }
  };

  const handleNavigateReport = async () => {
    if (selectedReport && selectedReport.latitude !== undefined && selectedReport.longitude !== undefined) {
      LocationAnalyticsService.trackNavigationClick();
      const success = await mapsService.launchNavigation(selectedReport.latitude, selectedReport.longitude);
      if (!success) {
        Alert.alert('Error', 'Could not open navigation application.');
      }
    }
  };

  if (loading || !userLocation) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Locating nearest centers...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation
        showsMyLocationButton
        userInterfaceStyle={isDarkMode ? 'dark' : 'light'}
      >
        {filteredFacilities.map((facility) => (
          <FacilityMarker
            key={facility.id}
            facility={facility}
            onPress={() => handleFacilityPress(facility)}
          />
        ))}

        {filteredReports.map((report) => (
          <CommunityReportMarker
            key={report.id}
            report={report}
            onPress={() => handleReportPress(report)}
          />
        ))}
      </MapView>

      {/* Floating Filter and Search Bar */}
      <View style={styles.headerContainer}>
        <View style={styles.searchBarContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, address, or materials..."
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setSelectedFacility(null);
              setSelectedReport(null);
            }}
            placeholderTextColor="#888"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScrollView}
          contentContainerStyle={styles.filterContent}
        >
          <TouchableOpacity
            style={[styles.filterChip, filter === 'all' && styles.activeFilterChip]}
            onPress={() => {
              setFilter('all');
              setSelectedFacility(null);
              setSelectedReport(null);
            }}
          >
            <Text style={[styles.filterChipText, filter === 'all' && styles.activeFilterChipText]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filter === 'recycling' && styles.activeFilterChip]}
            onPress={() => {
              setFilter('recycling');
              setSelectedFacility(null);
              setSelectedReport(null);
            }}
          >
            <Text style={[styles.filterChipText, filter === 'recycling' && styles.activeFilterChipText]}>Recycling</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filter === 'ewaste' && styles.activeFilterChip]}
            onPress={() => {
              setFilter('ewaste');
              setSelectedFacility(null);
              setSelectedReport(null);
            }}
          >
            <Text style={[styles.filterChipText, filter === 'ewaste' && styles.activeFilterChipText]}>E-Waste</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filter === 'donation' && styles.activeFilterChip]}
            onPress={() => {
              setFilter('donation');
              setSelectedFacility(null);
              setSelectedReport(null);
            }}
          >
            <Text style={[styles.filterChipText, filter === 'donation' && styles.activeFilterChipText]}>Donation</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filter === 'reports' && styles.activeFilterChip]}
            onPress={() => {
              setFilter('reports');
              setSelectedFacility(null);
              setSelectedReport(null);
            }}
          >
            <Text style={[styles.filterChipText, filter === 'reports' && styles.activeFilterChipText]}>Community Reports</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Empty State Overlay */}
      {filteredFacilities.length === 0 && filteredReports.length === 0 && (
        <View style={styles.emptyStateOverlay}>
          <Text style={styles.emptyStateText}>No facilities or reports match your search.</Text>
        </View>
      )}

      {selectedFacility && (
        <View style={styles.detailsContainer}>
          <FacilityDetailsCard
            facility={selectedFacility}
            onClose={() => setSelectedFacility(null)}
            onNavigate={handleNavigate}
          />
        </View>
      )}

      {selectedReport && (
        <View style={styles.detailsContainer}>
          <CommunityReportDetailsCard
            report={selectedReport}
            onClose={() => setSelectedReport(null)}
            onNavigate={handleNavigateReport}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  headerContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  searchBarContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    alignItems: 'center',
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
    height: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  clearButton: {
    padding: 6,
  },
  clearButtonText: {
    fontSize: 14,
    color: '#999',
    fontWeight: 'bold',
  },
  filterScrollView: {
    marginTop: 12,
  },
  filterContent: {
    paddingRight: 16,
  },
  filterChip: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  activeFilterChip: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  filterChipText: {
    fontSize: 12,
    color: '#555',
    fontWeight: '600',
  },
  activeFilterChipText: {
    color: '#FFF',
  },
  emptyStateOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 170 : 140,
    left: 32,
    right: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '500',
  },
  detailsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});

export default MapScreen;



