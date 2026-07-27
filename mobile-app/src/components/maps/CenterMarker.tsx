import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Marker, Callout } from 'react-native-maps';
import { RecyclingCenter } from '../../services/recycling/types';

interface CenterMarkerProps {
  center: RecyclingCenter;
  onPress?: () => void;
}

export const CenterMarker: React.FC<CenterMarkerProps> = ({ center, onPress }) => {
  return (
    <Marker
      coordinate={center.coordinate}
      title={center.name}
      description={center.acceptedMaterials.join(', ')}
      onPress={onPress}
    >
      <View style={styles.markerContainer}>
        <View style={styles.markerCore} />
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    width: 24,
    height: 24,
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerCore: {
    width: 12,
    height: 12,
    backgroundColor: '#4CAF50',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFF',
  },
});
