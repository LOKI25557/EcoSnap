import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Card from './Card';
import { WasteKnowledge } from '../utils/recyclingKnowledgeBase';

interface ImpactCardProps {
  knowledge: WasteKnowledge;
}

const ImpactCard: React.FC<ImpactCardProps> = ({ knowledge }) => {
  return (
    <Card style={styles.card}>
      <Text style={styles.title}>Environmental Impact</Text>
      
      <View style={styles.statRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Recyclable</Text>
          <Text style={[styles.statValue, { color: knowledge.recyclable ? '#4CAF50' : '#F44336' }]}>
            {knowledge.recyclable ? 'Yes' : 'No'}
          </Text>
        </View>
        
        {knowledge.decompositionTime && (
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Decomposition</Text>
            <Text style={styles.statValue}>{knowledge.decompositionTime}</Text>
          </View>
        )}
      </View>

      <Text style={styles.impactText}>{knowledge.landfillImpact}</Text>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F5F9F6',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
    marginTop: 15,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 10,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 6,
    marginRight: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  impactText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
  }
});

export default ImpactCard;
