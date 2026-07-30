import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Insight } from '../../types/Dashboard';

interface InsightCardProps {
  insight: Insight;
}

const InsightCard: React.FC<InsightCardProps> = ({ insight }) => {
  const getColors = () => {
    switch (insight.type) {
      case 'positive': return { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' };
      case 'negative': return { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' };
      case 'info': return { bg: '#e0f2fe', text: '#075985', border: '#bae6fd' };
      default: return { bg: '#f3f4f6', text: '#374151', border: '#e5e7eb' };
    }
  };

  const colors = getColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <Text style={[styles.text, { color: colors.text }]}>{insight.text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  }
});

export default InsightCard;
