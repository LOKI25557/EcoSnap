import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { EcoPoints } from '../../types/EcoPoints';

interface Props {
  points: EcoPoints;
}

export const EcoPointsCard: React.FC<Props> = ({ points }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Eco Points</Text>
      <Text style={styles.score}>{points.totalPoints}</Text>
      <Text style={styles.subtitle}>You are making a real difference!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#4CAF50',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
  },
  title: {
    color: '#E8F5E9',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  score: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#E8F5E9',
    marginTop: 8,
    fontSize: 14,
  }
});
