import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PredictionResult } from '../types/DetectionResult';
import ConfidenceBar from './ConfidenceBar';
import { WASTE_CATEGORIES_INFO } from '../constants/wasteCategories';

interface PredictionListProps {
  predictions: PredictionResult[];
}

const PredictionList: React.FC<PredictionListProps> = ({ predictions }) => {
  if (!predictions || predictions.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Top Predictions</Text>
      {predictions.map((pred, index) => {
        const info = WASTE_CATEGORIES_INFO[pred.category];
        return (
          <View key={`${pred.category}-${index}`} style={styles.item}>
            <View style={styles.labelContainer}>
              <View style={[styles.colorDot, { backgroundColor: info?.color || '#ccc' }]} />
              <Text style={styles.categoryName}>{pred.category}</Text>
            </View>
            <ConfidenceBar confidencePercent={pred.confidencePercent} label=" " />
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 15,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  item: {
    marginBottom: 8,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: -15, // offset confidence bar label space
    zIndex: 1,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 14,
    color: '#444',
  }
});

export default PredictionList;
