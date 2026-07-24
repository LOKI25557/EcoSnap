import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BinRecommendation } from '../../services/ai/recommendationService';

interface RecommendationCardProps {
  recommendation: BinRecommendation;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({ recommendation }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Dispose in: {recommendation.bin}</Text>
      <Text style={styles.instruction}>{recommendation.instruction}</Text>
      
      {recommendation.preparationSteps && recommendation.preparationSteps.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preparation</Text>
          {recommendation.preparationSteps.map((step, index) => (
            <Text key={index} style={styles.listItem}>• {step}</Text>
          ))}
        </View>
      )}

      {recommendation.environmentalImpact && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Impact</Text>
          <Text style={styles.text}>{recommendation.environmentalImpact}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginVertical: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  instruction: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
  },
  section: {
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  text: {
    fontSize: 14,
    color: '#555',
  },
  listItem: {
    fontSize: 14,
    color: '#555',
    marginLeft: 8,
    marginBottom: 2,
  },
});
