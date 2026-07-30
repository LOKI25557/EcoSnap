import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Card from '../Card';
import { DailyStat } from '../../types/Dashboard';

interface ChartCardProps {
  data: DailyStat[];
}

const ChartCard: React.FC<ChartCardProps> = ({ data }) => {
  if (data.length === 0) {
    return (
      <Card>
        <Text style={styles.title}>Recent Activity</Text>
        <Text style={styles.emptyText}>No data available yet. Start scanning!</Text>
      </Card>
    );
  }

  // Very simple pure View-based bar chart to avoid external dependencies
  const recentData = data.slice(-7); // Last 7 days
  const maxItems = Math.max(...recentData.map(d => d.itemsProcessed), 1);
  const chartHeight = 100;

  return (
    <Card>
      <Text style={styles.title}>Recent Activity</Text>
      <View style={styles.chartContainer}>
        {recentData.map((day, index) => {
          const height = (day.itemsProcessed / maxItems) * chartHeight;
          const dateLabel = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' });
          return (
            <View key={index} style={styles.barColumn}>
              <Text style={styles.barValue}>{day.itemsProcessed > 0 ? day.itemsProcessed : ''}</Text>
              <View style={[styles.bar, { height: Math.max(height, 5) }]} />
              <Text style={styles.barLabel}>{dateLabel}</Text>
            </View>
          );
        })}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    color: '#4a3b2a',
  },
  emptyText: {
    color: '#6a5b47',
    textAlign: 'center',
    paddingVertical: 20,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 140,
    paddingBottom: 20,
  },
  barColumn: {
    alignItems: 'center',
    width: 30,
  },
  barValue: {
    fontSize: 10,
    color: '#6a5b47',
    marginBottom: 4,
  },
  bar: {
    width: 20,
    backgroundColor: '#3b82f6',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  barLabel: {
    fontSize: 10,
    color: '#6a5b47',
    marginTop: 8,
    position: 'absolute',
    bottom: -20,
  }
});

export default ChartCard;
