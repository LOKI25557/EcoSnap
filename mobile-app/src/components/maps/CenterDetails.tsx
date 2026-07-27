import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView } from 'react-native';
import { CenterWithDistance } from '../../services/recycling/CenterSearch';
import { DistanceBadge } from './DistanceBadge';

interface CenterDetailsProps {
  center: CenterWithDistance;
  onClose: () => void;
  onNavigate: () => void;
}

export const CenterDetails: React.FC<CenterDetailsProps> = ({ center, onClose, onNavigate }) => {
  const handleCall = () => {
    Linking.openURL(`tel:${center.contactNumber}`);
  };

  const handleWebsite = () => {
    if (center.website) {
      Linking.openURL(center.website);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.name}>{center.name}</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.badgeRow}>
          <DistanceBadge distanceKm={center.distanceKm} />
          <Text style={styles.rating}>⭐ {center.rating.toFixed(1)}</Text>
        </View>

        <Text style={styles.sectionTitle}>Address</Text>
        <Text style={styles.text}>{center.address}</Text>

        <Text style={styles.sectionTitle}>Opening Hours</Text>
        <Text style={styles.text}>{center.openingHours}</Text>

        <Text style={styles.sectionTitle}>Accepted Materials</Text>
        <View style={styles.materialsContainer}>
          {center.acceptedMaterials.map((material, index) => (
            <View key={index} style={styles.materialChip}>
              <Text style={styles.materialText}>{material}</Text>
            </View>
          ))}
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
            <Text style={styles.actionText}>📞 Call</Text>
          </TouchableOpacity>
          {center.website && (
            <TouchableOpacity style={styles.actionButton} onPress={handleWebsite}>
              <Text style={styles.actionText}>🌐 Website</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.navButton} onPress={onNavigate}>
          <Text style={styles.navButtonText}>Navigate Here</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 16,
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 20,
    color: '#999',
    fontWeight: 'bold',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  rating: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  materialsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  materialChip: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  materialText: {
    fontSize: 12,
    color: '#444',
    textTransform: 'capitalize',
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 24,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  navButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  navButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
