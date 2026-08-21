import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView } from 'react-native';
import { Facility, FacilityType } from '../../types/Facility';
import { mapsService } from '../../services/location/mapsService';

interface FacilityDetailsCardProps {
  facility: Facility;
  onClose: () => void;
  onNavigate: () => void;
}

export const FacilityDetailsCard: React.FC<FacilityDetailsCardProps> = ({
  facility,
  onClose,
  onNavigate,
}) => {
  const handleCall = () => {
    if (facility.phone) {
      Linking.openURL(`tel:${facility.phone}`);
    }
  };

  const handleWebsite = () => {
    if (facility.website) {
      Linking.openURL(facility.website);
    }
  };

  // Get display type
  const getTypeDisplay = (type: FacilityType) => {
    switch (type) {
      case 'recycling_center':
        return 'Recycling Center';
      case 'ewaste_facility':
        return 'E-Waste Facility';
      case 'donation_center':
        return 'Donation Center';
      default:
        return 'Facility';
    }
  };

  // Get color for type badge
  const getTypeBadgeColor = (type: FacilityType) => {
    switch (type) {
      case 'recycling_center':
        return '#4CAF50';
      case 'ewaste_facility':
        return '#FF9800';
      case 'donation_center':
        return '#9C27B0';
      default:
        return '#2196F3';
    }
  };

  const formatOpeningHours = (oh: any) => {
    if (!oh) return '';
    if (typeof oh === 'string') return oh;
    if (oh.is24Hours) return 'Open 24 Hours';
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    return days
      .map((day) => {
        const range = oh[day];
        const dayLabel = day.charAt(0).toUpperCase() + day.slice(1);
        if (!range) return `${dayLabel}: Closed`;
        return `${dayLabel}: ${range.open} - ${range.close}`;
      })
      .join('\n');
  };

  const distanceText = facility.distanceMeters !== undefined 
    ? mapsService.formatDistance(facility.distanceMeters)
    : '';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.name}>{facility.name}</Text>
          {facility.verified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓ Verified</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.badgeRow}>
          <View style={[styles.typeBadge, { backgroundColor: getTypeBadgeColor(facility.type) }]}>
            <Text style={styles.typeBadgeText}>{getTypeDisplay(facility.type)}</Text>
          </View>
          {distanceText ? (
            <View style={styles.distanceBadge}>
              <Text style={styles.distanceBadgeText}>📍 {distanceText}</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.sectionTitle}>Address</Text>
        <Text style={styles.text}>{facility.address}</Text>

        {facility.openingHours ? (
          <>
            <Text style={styles.sectionTitle}>Opening Hours</Text>
            <Text style={styles.text}>{formatOpeningHours(facility.openingHours)}</Text>
          </>
        ) : null}

        {facility.acceptedMaterials && facility.acceptedMaterials.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Accepted Materials</Text>
            <View style={styles.materialsContainer}>
              {facility.acceptedMaterials.map((material, index) => (
                <View key={index} style={styles.materialChip}>
                  <Text style={styles.materialText}>{material}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        <View style={styles.actionRow}>
          {facility.phone ? (
            <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
              <Text style={styles.actionText}>📞 Call</Text>
            </TouchableOpacity>
          ) : null}
          {facility.website ? (
            <TouchableOpacity style={styles.actionButton} onPress={handleWebsite}>
              <Text style={styles.actionText}>🌐 Website</Text>
            </TouchableOpacity>
          ) : null}
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
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  verifiedBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  verifiedText: {
    color: '#2E7D32',
    fontSize: 11,
    fontWeight: 'bold',
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
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  typeBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  distanceBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  distanceBadgeText: {
    color: '#1565C0',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
    marginTop: 14,
    marginBottom: 6,
  },
  text: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  materialsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    marginBottom: 4,
  },
  materialChip: {
    backgroundColor: '#F5F5F5',
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
    marginTop: 18,
    marginBottom: 12,
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
    marginBottom: 8,
  },
  navButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
