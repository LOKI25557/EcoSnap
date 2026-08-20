import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert, Text, useColorScheme, Platform, Linking } from 'react-native';
import MapView from 'react-native-maps';
import { LocationService } from '../services/location/LocationService';
import { facilityService } from '../services/recycling/facilityService';
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

const MapScreen = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const [userLocation, setUserLocation] = useState<Coordinate | null>(null);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [selectedReport, setSelectedReport] = useState<CommunityReport | null>(null);
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

  const handleNavigate = () => {
    if (selectedFacility) {
      LocationAnalyticsService.trackNavigationClick();
      const url = Platform.select({
        ios: `maps://app?daddr=${selectedFacility.latitude},${selectedFacility.longitude}`,
        android: `google.navigation:q=${selectedFacility.latitude},${selectedFacility.longitude}`,
      });
      if (url) {
        Linking.openURL(url).catch((err) => {
          console.error('Failed to open navigation app:', err);
          Alert.alert('Error', 'Could not open navigation application.');
        });
      }
    }
  };

  const handleNavigateReport = () => {
    if (selectedReport && selectedReport.latitude !== undefined && selectedReport.longitude !== undefined) {
      LocationAnalyticsService.trackNavigationClick();
      const url = Platform.select({
        ios: `maps://app?daddr=${selectedReport.latitude},${selectedReport.longitude}`,
        android: `google.navigation:q=${selectedReport.latitude},${selectedReport.longitude}`,
      });
      if (url) {
        Linking.openURL(url).catch((err) => {
          console.error('Failed to open navigation app:', err);
          Alert.alert('Error', 'Could not open navigation application.');
        });
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
        {facilities.map((facility) => (
          <FacilityMarker
            key={facility.id}
            facility={facility}
            onPress={() => handleFacilityPress(facility)}
          />
        ))}

        {reports.map((report) => (
          <CommunityReportMarker
            key={report.id}
            report={report}
            onPress={() => handleReportPress(report)}
          />
        ))}
      </MapView>

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
  detailsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});

export default MapScreen;


