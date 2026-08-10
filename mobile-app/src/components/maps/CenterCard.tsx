import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { DistanceBadge } from './DistanceBadge';
import { CenterWithDistance } from '../../services/recycling/CenterSearch';

interface CenterCardProps {
  center: CenterWithDistance;
  onPress?: (center: CenterWithDistance) => void;
  onNavigate?: (center: CenterWithDistance) => void;
}

export const CenterCard: React.FC<CenterCardProps> = ({ center, onPress, onNavigate }) => {
  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => onPress && onPress(center)}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <Text style={styles.name}>{center.name}</Text>
        <DistanceBadge distanceKm={center.distanceKm} />
      </View>

      <Text style={styles.address}>{center.address}</Text>

      <View style={styles.materialsContainer}>
        {center.acceptedMaterials.map((material, index) => (
          <View key={index} style={styles.materialChip}>
            <Text style={styles.materialText}>{material}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.rating}>⭐ {center.rating.toFixed(1)}</Text>
        <TouchableOpacity style={styles.navButton} onPress={() => onNavigate && onNavigate(center)}>
          <Text style={styles.navButtonText}>Navigate</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  materialsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  materialChip: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  materialText: {
    fontSize: 12,
    color: '#444',
    textTransform: 'capitalize',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  navButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  navButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
