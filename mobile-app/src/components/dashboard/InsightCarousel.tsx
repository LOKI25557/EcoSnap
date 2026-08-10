import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { PersonalizedInsight } from '../../services/insights/PersonalizationService';

interface Props {
  insight: PersonalizedInsight;
}

export const InsightCarousel: React.FC<Props> = ({ insight }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const cards = [
    { title: 'Daily Tip', content: insight.dailyTip, emoji: '💡' },
    { title: 'Habit Analysis', content: insight.habitAnalysis, emoji: '📈' },
    { title: 'Your Strength', content: insight.strength, emoji: '💪' },
    { title: 'Area to Improve', content: insight.improvementArea, emoji: '🎯' },
    { title: 'Yearly Estimate', content: insight.yearlyImpactEstimate, emoji: '🌍' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const newIndex = Math.round(e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width);
          setActiveIndex(newIndex);
        }}
      >
        {cards.map((card, i) => (
          <View key={i} style={styles.cardContainer}>
            <View style={styles.card}>
              <Text style={styles.emoji}>{card.emoji}</Text>
              <Text style={styles.title}>{card.title}</Text>
              <Text style={styles.content}>{card.content}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
      <View style={styles.pagination}>
        {cards.map((_, i) => (
          <View key={i} style={[styles.dot, i === activeIndex && styles.activeDot]} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  cardContainer: {
    width: 300, // Fixed width for horizontal scrolling
    paddingRight: 12,
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    height: 140,
    elevation: 2,
    borderTopWidth: 4,
    borderTopColor: '#2196F3',
  },
  emoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  content: {
    fontSize: 14,
    color: '#666',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#2196F3',
  }
});
