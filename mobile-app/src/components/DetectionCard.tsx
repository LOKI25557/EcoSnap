import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Card from './Card';
import ConfidenceBar from './ConfidenceBar';
import ImpactCard from './ImpactCard';
import PredictionList from './PredictionList';
import { DetectionResponse } from '../types/DetectionResult';
import { recyclingKnowledgeBase } from '../utils/recyclingKnowledgeBase';
import { WASTE_CATEGORIES_INFO } from '../constants/wasteCategories';

interface DetectionCardProps {
  response: DetectionResponse;
}

const DetectionCard: React.FC<DetectionCardProps> = ({ response }) => {
  const { result, metadata } = response;
  const knowledge = recyclingKnowledgeBase.getKnowledge(result.primaryCategory);
  const categoryInfo = WASTE_CATEGORIES_INFO[result.primaryCategory];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Card style={styles.mainCard}>
        <View style={styles.header}>
          <View style={[styles.colorBadge, { backgroundColor: categoryInfo?.color || '#ccc' }]} />
          <View>
            <Text style={styles.categoryTitle}>{knowledge.displayName}</Text>
            <Text style={styles.modelInfo}>Model: {metadata.modelVersion} | {metadata.totalLatencyMs ? `${metadata.totalLatencyMs.toFixed(0)}ms total` : `${metadata.inferenceTimeMs.toFixed(0)}ms`}</Text>
          </View>
        </View>

        <ConfidenceBar confidencePercent={result.confidencePercent} label="Primary Confidence" />

        <View style={styles.disposalContainer}>
          <Text style={styles.sectionTitle}>Disposal Method</Text>
          <Text style={styles.disposalText}>{knowledge.disposalMethod}</Text>
        </View>

        {knowledge.recyclingInstructions && knowledge.recyclingInstructions.length > 0 && (
          <View style={styles.instructionsContainer}>
            <Text style={styles.sectionTitle}>How to Prepare</Text>
            {knowledge.recyclingInstructions.map((inst, idx) => (
              <Text key={idx} style={styles.listItem}>• {inst}</Text>
            ))}
          </View>
        )}

      </Card>

      <ImpactCard knowledge={knowledge} />
      
      {result.topPredictions && result.topPredictions.length > 1 && (
        <Card style={styles.predictionsCard}>
          <PredictionList predictions={result.topPredictions} />
        </Card>
      )}

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  scrollContent: {
    padding: 15,
    paddingBottom: 40,
  },
  mainCard: {
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  colorBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 12,
  },
  categoryTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  modelInfo: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  disposalContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
    marginBottom: 8,
  },
  disposalText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  instructionsContainer: {
    marginTop: 15,
  },
  listItem: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
    marginBottom: 4,
    marginLeft: 8,
  },
  predictionsCard: {
    marginTop: 15,
  }
});

export default DetectionCard;
