import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LocationService } from '../../services/location/LocationService';
import { RecyclingCenterService } from '../../services/recycling/RecyclingCenterService';
import { CenterSearch, CenterWithDistance } from '../../services/recycling/CenterSearch';
import { CenterFilter } from '../../services/recycling/CenterFilter';
import { CenterList } from './CenterList';
import Card from '../Card';

interface NearbyRecommendationsProps {
  wasteCategory: string;
}

export const NearbyRecommendations: React.FC<NearbyRecommendationsProps> = ({ wasteCategory }) => {
  const [loading, setLoading] = useState(true);
  const [centers, setCenters] = useState<CenterWithDistance[]>([]);

  useEffect(() => {
    let mounted = true;

    const loadRecommendations = async () => {
      setLoading(true);
      try {
        const location = await LocationService.getCurrentLocation();
        const allCenters = await RecyclingCenterService.getAllCenters();
        
        let filteredCenters = allCenters;
        
        // Use the waste category to filter centers
        if (wasteCategory) {
          filteredCenters = CenterFilter.byMaterial(allCenters, wasteCategory);
          // If no centers found for this specific waste, fallback to all centers
          if (filteredCenters.length === 0) {
            filteredCenters = allCenters;
          }
        }

        if (location) {
          const sorted = CenterSearch.sortByNearest(filteredCenters, location);
          if (mounted) setCenters(sorted.slice(0, 3)); // Top 3 recommendations
        } else {
          // If no location, just show first 3
          const defaultSorted = filteredCenters.map(c => ({...c, distanceKm: 0}));
          if (mounted) setCenters(defaultSorted.slice(0, 3));
        }
      } catch (error) {
        console.error('Error loading recommendations', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadRecommendations();

    return () => {
      mounted = false;
    };
  }, [wasteCategory]);

  if (loading) {
    return (
      <Card style={styles.card}>
        <Text style={styles.title}>Finding Nearby Centers...</Text>
        <ActivityIndicator size="small" color="#4CAF50" style={styles.loader} />
      </Card>
    );
  }

  if (centers.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recommended Drop-offs</Text>
      <CenterList centers={centers} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 15,
  },
  card: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    marginLeft: 5,
  },
  loader: {
    marginTop: 10,
  },
});
