import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { Facility } from '../../types/Facility';

interface FacilityMarkerProps {
  facility: Facility;
  onPress?: () => void;
}

export const FacilityMarker: React.FC<FacilityMarkerProps> = ({ facility, onPress }) => {
  let markerColor = '#4CAF50'; // Default: recycling_center
  let containerColor = 'rgba(76, 175, 80, 0.3)';

  if (facility.type === 'ewaste_facility') {
    markerColor = '#FF9800'; // Orange
    containerColor = 'rgba(255, 152, 0, 0.3)';
  } else if (facility.type === 'donation_center') {
    markerColor = '#9C27B0'; // Purple
    containerColor = 'rgba(156, 39, 176, 0.3)';
  }

  return (
    <Marker
      coordinate={{ latitude: facility.latitude, longitude: facility.longitude }}
      title={facility.name}
      description={facility.address}
      onPress={onPress}
    >
      <View style={[styles.markerContainer, { backgroundColor: containerColor }]}>
        <View style={[styles.markerCore, { backgroundColor: markerColor }]} />
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerCore: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFF',
  },
});
