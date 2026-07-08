import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Card from '../components/Card';
import CustomButton from '../components/CustomButton';
import LoadingSpinner from '../components/LoadingSpinner';
import { useApp } from '../context/AppContext';
import { WasteCategory, WASTE_CATEGORIES_INFO } from '../constants/wasteCategories';
import { detectionService } from '../services/ai/detectionService';
import { recommendationService } from '../services/ai/recommendationService';
import { analyticsService } from '../services/ai/analyticsService';
import { recyclingKnowledgeBase } from '../utils/recyclingKnowledgeBase';
import { calculateScore } from '../utils/calculateScore';
import { formatDate } from '../utils/formatDate';
import { WasteItem } from '../types/WasteItem';

const SAMPLE_IMAGE_URI = 'demo://eco-snap-sample-image';

const CameraScreen = () => {
  const { addScan, latestScan } = useApp();
  const [isScanning, setIsScanning] = useState(false);
  const [currentDetection, setCurrentDetection] = useState<WasteItem | null>(latestScan);

  const activeCategory = currentDetection?.category ?? WasteCategory.UNKNOWN;
  const categoryInfo = WASTE_CATEGORIES_INFO[activeCategory];
  const recommendation = useMemo(
    () => recommendationService.getBinRecommendation(activeCategory),
    [activeCategory]
  );
  const knowledge = useMemo(
    () => recyclingKnowledgeBase.getKnowledge(activeCategory),
    [activeCategory]
  );

  const runDemoScan = async () => {
    setIsScanning(true);

    try {
      const detection = await detectionService.detectWaste(SAMPLE_IMAGE_URI);
      const scannedItem: WasteItem = {
        id: `scan-${Date.now()}`,
        userId: 'demo-user',
        category: detection.category,
        confidenceScore: detection.confidence,
        imageUrl: SAMPLE_IMAGE_URI,
        detectedAt: new Date(),
        pointsAwarded: calculateScore(detection.category),
      };

      addScan(scannedItem);
      setCurrentDetection(scannedItem);
    } catch (error) {
      console.error('Failed to run demo scan:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const impactSummary = useMemo(() => {
    const items = currentDetection ? [currentDetection] : [];
    return analyticsService.getUserImpact('demo-user', items);
  }, [currentDetection]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>AI Waste Scanner</Text>
      <Text style={styles.subtitle}>
        Phase 2 connects the camera flow to detection, recommendations, and impact tracking.
      </Text>

      <Card style={styles.heroCard}>
        <Text style={styles.sectionTitle}>Latest Detection</Text>
        <Text style={styles.category}>{categoryInfo.description}</Text>
        <Text style={styles.detail}>Category: {activeCategory}</Text>
        <Text style={styles.detail}>Confidence: {Math.round((currentDetection?.confidenceScore ?? 0) * 100)}%</Text>
        <Text style={styles.detail}>Points: {currentDetection?.pointsAwarded ?? 0}</Text>
        <Text style={styles.detail}>Captured: {currentDetection ? formatDate(currentDetection.detectedAt) : 'No scan yet'}</Text>
      </Card>

      <CustomButton title={isScanning ? 'Scanning...' : 'Run Demo Scan'} onPress={runDemoScan} disabled={isScanning} />
      {isScanning ? <LoadingSpinner /> : null}

      <Card>
        <Text style={styles.sectionTitle}>Disposal Guidance</Text>
        <Text style={styles.detail}>Bin: {recommendation.bin}</Text>
        <Text style={styles.detail}>{recommendation.instruction}</Text>
        <Text style={styles.detail}>Recyclable: {recommendation.recyclable ? 'Yes' : 'No'}</Text>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Knowledge Base</Text>
        <Text style={styles.detail}>{knowledge.description}</Text>
        <Text style={styles.detail}>Decomposition: {knowledge.decompositionTime ?? 'Not available'}</Text>
        <Text style={styles.detail}>Landfill impact: {knowledge.landfillImpact}</Text>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Impact Summary</Text>
        <Text style={styles.detail}>CO2 Saved: {impactSummary.co2SavedKg.toFixed(2)} kg</Text>
        <Text style={styles.detail}>Waste Diverted: {impactSummary.wasteDivertedKg.toFixed(2)} kg</Text>
        <Text style={styles.detail}>Sustainability Score: {impactSummary.sustainabilityScore}/100</Text>
        <Text style={styles.detail}>Recycling Rate: {impactSummary.recyclingRate}%</Text>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
    backgroundColor: '#f3f7f2',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f3d2b',
  },
  subtitle: {
    color: '#4b6354',
    lineHeight: 20,
  },
  heroCard: {
    backgroundColor: '#e8f5e9',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    color: '#173224',
  },
  category: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#244b34',
  },
  detail: {
    color: '#2d4137',
    marginBottom: 6,
    lineHeight: 20,
  },
});

export default CameraScreen;
