import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface DistanceBadgeProps {
  distanceKm: number;
}

export const DistanceBadge: React.FC<DistanceBadgeProps> = ({ distanceKm }) => {
  const formattedDistance = distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{formattedDistance}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    color: '#2E7D32',
    fontSize: 12,
    fontWeight: '600',
  },
});
