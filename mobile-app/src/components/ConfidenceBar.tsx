import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ConfidenceBarProps {
  confidencePercent: number;
  label?: string;
}

const ConfidenceBar: React.FC<ConfidenceBarProps> = ({ confidencePercent, label }) => {
  // Determine color based on confidence level
  const getColor = () => {
    if (confidencePercent >= 80) return '#4CAF50'; // Green
    if (confidencePercent >= 50) return '#FFEB3B'; // Yellow
    return '#F44336'; // Red
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label || 'Confidence'}</Text>
        <Text style={styles.percentage}>{confidencePercent.toFixed(1)}%</Text>
      </View>
      <View style={styles.track}>
        <View 
          style={[
            styles.fill, 
            { width: `${Math.max(0, Math.min(100, confidencePercent))}%`, backgroundColor: getColor() }
          ]} 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    color: '#666',
  },
  percentage: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  track: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  }
});

export default ConfidenceBar;
