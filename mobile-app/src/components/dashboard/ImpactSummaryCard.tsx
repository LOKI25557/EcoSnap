import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Card from '../Card';

interface ImpactSummaryCardProps {
  totalItems: number;
  co2Saved: number;
  wasteDiverted: number;
}

const ImpactSummaryCard: React.FC<ImpactSummaryCardProps> = ({ totalItems, co2Saved, wasteDiverted }) => {
  return (
    <Card>
      <Text style={styles.title}>Impact Summary</Text>
      <View style={styles.grid}>
        <View style={styles.statBox}>
          <Text style={styles.value}>{totalItems}</Text>
          <Text style={styles.label}>Items Sorted</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.value}>{co2Saved} kg</Text>
          <Text style={styles.label}>CO₂ Saved</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.value}>{wasteDiverted} kg</Text>
          <Text style={styles.label}>Diverted</Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: '#4a3b2a',
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  value: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d6a4f',
  },
  label: {
    fontSize: 12,
    color: '#6a5b47',
    marginTop: 4,
    textAlign: 'center',
  },
});

export default ImpactSummaryCard;
