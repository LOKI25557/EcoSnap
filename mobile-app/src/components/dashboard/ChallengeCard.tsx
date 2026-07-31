import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Challenge } from '../../types/Challenge';

interface Props {
  challenge: Challenge;
}

export const ChallengeCard: React.FC<Props> = ({ challenge }) => {
  const progressPercent = Math.min((challenge.progress / challenge.target) * 100, 100);

  return (
    <View style={[styles.card, challenge.isCompleted && styles.completedCard]}>
      <View style={styles.header}>
        <Text style={styles.title}>{challenge.title}</Text>
        <Text style={styles.reward}>+{challenge.rewardPoints} pts</Text>
      </View>
      <Text style={styles.description}>{challenge.description}</Text>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
        </View>
        <Text style={styles.progressText}>{challenge.progress} / {challenge.target}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  completedCard: {
    borderLeftColor: '#4CAF50',
    opacity: 0.8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  reward: {
    color: '#FF9800',
    fontWeight: 'bold',
  },
  description: {
    color: '#666',
    marginBottom: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
    marginRight: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2196F3',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
  }
});
