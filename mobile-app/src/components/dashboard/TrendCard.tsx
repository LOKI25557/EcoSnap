import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Card from '../Card';
import { TrendData } from '../../types/Dashboard';

interface TrendCardProps {
  trend: TrendData;
}

const TrendCard: React.FC<TrendCardProps> = ({ trend }) => {
  return (
    <Card>
      <Text style={styles.title}>Activity Trends</Text>
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.value}>{trend.currentStreak}</Text>
          <Text style={styles.label}>Day Streak</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.value}>{Math.round(trend.averageItemsPerDay)}</Text>
          <Text style={styles.label}>Avg / Day</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.value}>{trend.highestDay?.itemsProcessed || 0}</Text>
          <Text style={styles.label}>Best Day</Text>
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
  statsRow: {
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
    color: '#d97706',
  },
  label: {
    fontSize: 12,
    color: '#6a5b47',
    marginTop: 4,
  }
});

export default TrendCard;
