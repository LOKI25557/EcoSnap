import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert, Text, useColorScheme } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { LocationService } from '../services/location/LocationService';
import { RecyclingCenterService } from '../services/recycling/RecyclingCenterService';
import { CenterSearch, CenterWithDistance } from '../services/recycling/CenterSearch';
import { Coordinate } from '../services/location/DistanceCalculator';
import { CenterMarker } from '../components/maps/CenterMarker';
import { CenterDetails } from '../components/maps/CenterDetails';
import { LocationAnalyticsService } from '../services/location/LocationAnalyticsService';

const MapScreen = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const [userLocation, setUserLocation] = useState<Coordinate | null>(null);
  const [centers, setCenters] = useState<CenterWithDistance[]>([]);
  const [selectedCenter, setSelectedCenter] = useState<CenterWithDistance | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCenters = useCallback(async (location: Coordinate) => {
    try {
      const allCenters = await RecyclingCenterService.getAllCenters();
      const sorted = CenterSearch.sortByNearest(allCenters, location);
      setCenters(sorted);
    } catch (error) {
      console.error('Error fetching centers:', error);
      Alert.alert('Error', 'Failed to load recycling centers.');
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    const location = await LocationService.getCurrentLocation();
    if (location) {
      setUserLocation(location);
      await fetchCenters(location);
    } else {
      Alert.alert('Location Error', 'Could not determine your location. Showing default map view.');
      // Load centers anyway with a default location (e.g. San Francisco)
      const defaultLoc = { latitude: 37.7749, longitude: -122.4194 };
      setUserLocation(defaultLoc);
      await fetchCenters(defaultLoc);
    }
    setLoading(false);
  }, [fetchCenters]);

  useEffect(() => {
    loadData();
    return () => {
      LocationService.stopWatchingLocation();
    };
  }, [loadData]);

  const handleCenterPress = (center: CenterWithDistance) => {
    setSelectedCenter(center);
    LocationAnalyticsService.trackVisit(center.id, center.distanceKm);
  };

  const handleNavigate = () => {
    if (selectedCenter) {
      LocationAnalyticsService.trackNavigationClick();
      Alert.alert('Navigation', `Navigating to ${selectedCenter.name}... (Simulation)`);
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
        {centers.map(center => (
          <CenterMarker
            key={center.id}
            center={center}
            onPress={() => handleCenterPress(center)}
          />
        ))}
      </MapView>

      {selectedCenter && (
        <View style={styles.detailsContainer}>
          <CenterDetails
            center={selectedCenter}
            onClose={() => setSelectedCenter(null)}
            onNavigate={handleNavigate}
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
