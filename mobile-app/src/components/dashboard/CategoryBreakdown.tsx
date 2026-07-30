import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Card from '../Card';
import { WasteCategory } from '../../constants/wasteCategories';

interface CategoryBreakdownProps {
  breakdown: Record<WasteCategory, { count: number; percentage: number }>;
}

const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({ breakdown }) => {
  const entries = Object.entries(breakdown).filter(([, stats]) => stats.count > 0);

  if (entries.length === 0) {
    return (
      <Card>
        <Text style={styles.title}>Category Breakdown</Text>
        <Text style={styles.empty}>No data available.</Text>
      </Card>
    );
  }

  return (
    <Card>
      <Text style={styles.title}>Waste Categories</Text>
      <View style={styles.list}>
        {entries.map(([category, stats]) => (
          <View key={category} style={styles.row}>
            <View style={styles.labelContainer}>
              <Text style={styles.categoryName}>{category}</Text>
              <Text style={styles.count}>{stats.count} items</Text>
            </View>
            <View style={styles.barContainer}>
              <View style={[styles.bar, { width: `${stats.percentage}%` }]} />
              <Text style={styles.percentage}>{stats.percentage}%</Text>
            </View>
          </View>
        ))}
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
  empty: {
    color: '#6a5b47',
    textAlign: 'center',
    paddingVertical: 10,
  },
  list: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelContainer: {
    flex: 1,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3a2f22',
  },
  count: {
    fontSize: 12,
    color: '#6a5b47',
  },
  barContainer: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bar: {
    height: 8,
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  percentage: {
    fontSize: 12,
    color: '#6a5b47',
    minWidth: 35,
    textAlign: 'right',
  }
});

export default CategoryBreakdown;
