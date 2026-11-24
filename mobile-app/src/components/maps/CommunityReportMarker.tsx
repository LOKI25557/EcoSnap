import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { CommunityReport } from '../../types/CommunityReport';

interface CommunityReportMarkerProps {
  report: CommunityReport;
  onPress?: () => void;
}

export const CommunityReportMarker: React.FC<CommunityReportMarkerProps> = ({ report, onPress }) => {
  if (report.latitude === undefined || report.longitude === undefined) {
    return null;
  }

  let markerColor = '#E64A19'; // Default: overflowing_bin
  let containerColor = 'rgba(230, 74, 25, 0.3)';

  switch (report.type) {
    case 'illegal_dumping':
      markerColor = '#D32F2F'; // Red
      containerColor = 'rgba(211, 47, 47, 0.3)';
      break;
    case 'overflowing_bin':
      markerColor = '#FF5722'; // Deep Orange
      containerColor = 'rgba(255, 87, 34, 0.3)';
      break;
    case 'damaged_bin':
      markerColor = '#FFC107'; // Amber
      containerColor = 'rgba(255, 193, 7, 0.3)';
      break;
    case 'recycling_facility_issue':
      markerColor = '#00BCD4'; // Cyan
      containerColor = 'rgba(0, 188, 212, 0.3)';
      break;
    case 'other':
      markerColor = '#9E9E9E'; // Grey
      containerColor = 'rgba(158, 158, 158, 0.3)';
      break;
  }

  return (
    <Marker
      coordinate={{ latitude: report.latitude, longitude: report.longitude }}
      title={report.type.replace('_', ' ')}
      description={report.description}
      onPress={onPress}
    >
      <View style={[styles.markerContainer, { backgroundColor: containerColor }]}>
        <View style={[styles.markerTriangle]} />
        <View style={[styles.markerCore, { backgroundColor: markerColor }]} />
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFF',
  },
  markerCore: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  markerTriangle: {
    position: 'absolute',
    bottom: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
    borderRightWidth: 4,
    borderRightColor: 'transparent',
    borderTopWidth: 6,
    borderTopColor: '#FFF',
  },
});
