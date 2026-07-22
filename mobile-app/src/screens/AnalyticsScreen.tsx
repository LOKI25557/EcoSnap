import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Card from '../components/Card';
import { useApp } from '../context/AppContext';
import { analyticsService } from '../services/ai/analyticsService';
import { recommendationService } from '../services/ai/recommendationService';
import { WasteCategory } from '../constants/wasteCategories';

const AnalyticsScreen = () => {
  const { recentScans, clearScans } = useApp();

  const report = useMemo(() => {
    return analyticsService.getUserImpact('demo-user', recentScans);
  }, [recentScans]);

  const topCategory = useMemo(() => {
    const counts = recentScans.reduce<Record<string, number>>((acc, scan) => {
      acc[scan.category] = (acc[scan.category] ?? 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts).sort(([, a], [, b]) => b - a)[0]?.[0] ?? WasteCategory.UNKNOWN;
  }, [recentScans]);

  const topTips = recommendationService.getTips('demo-user', recentScans.map(scan => scan.category));

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Impact Dashboard</Text>
      <Text style={styles.subtitle}>
        Live summary of the recent AI scans captured in the Phase 2 flow.
      </Text>

      <Card>
        <Text style={styles.sectionTitle}>Overall Impact</Text>
        <Text style={styles.detail}>Items Processed: {report.totalItemsProcessed}</Text>
        <Text style={styles.detail}>CO2 Saved: {report.co2SavedKg.toFixed(2)} kg</Text>
        <Text style={styles.detail}>Waste Diverted: {report.wasteDivertedKg.toFixed(2)} kg</Text>
        <Text style={styles.detail}>Sustainability Score: {report.sustainabilityScore}/100</Text>
        <Text style={styles.detail}>Recycling Rate: {report.recyclingRate}%</Text>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Current Pattern</Text>
        <Text style={styles.detail}>Most common category: {topCategory}</Text>
        <Text style={styles.detail}>Methane prevented: {report.methanePrevented.toFixed(2)} kg CO2e</Text>
        <Text style={styles.detail}>Trees equivalent: {report.treesPlantedEquivalent.toFixed(2)}</Text>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Category Breakdown</Text>
        {Object.entries(report.categoryBreakdown).length === 0 ? (
          <Text style={styles.detail}>No scans yet. Use the Camera tab to generate sample detections.</Text>
        ) : (
          Object.entries(report.categoryBreakdown).map(([category, stats]) => (
            <View key={category} style={styles.breakdownRow}>
              <Text style={styles.detail}>{category}</Text>
              <Text style={styles.detail}>{stats.count} items</Text>
            </View>
          ))
        )}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Next Actions</Text>
        {report.recommendations.map((recommendation, index) => (
          <Text key={index} style={styles.detail}>• {recommendation}</Text>
        ))}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Personalized Tips</Text>
        {topTips.map((tip, index) => (
          <Text key={index} style={styles.detail}>• {tip}</Text>
        ))}
      </Card>

      <Text style={styles.reset} onPress={clearScans}>
        Clear demo scans
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
    backgroundColor: '#f6f4ef',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#3a2f22',
  },
  subtitle: {
    color: '#6a5b47',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    color: '#4a3b2a',
  },
  detail: {
    color: '#4f4335',
    marginBottom: 6,
    lineHeight: 20,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reset: {
    textAlign: 'center',
    color: '#8a5f2d',
    fontWeight: '700',
    paddingVertical: 12,
  },
});

export default AnalyticsScreen;
