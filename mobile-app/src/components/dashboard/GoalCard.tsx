import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Goal } from '../../types/Goal';
import GoalProgress from './GoalProgress';

interface GoalCardProps {
  goal: Goal;
}

const GoalCard: React.FC<GoalCardProps> = ({ goal }) => {
  return (
    <View style={[styles.container, goal.isCompleted && styles.completedContainer]}>
      <View style={styles.header}>
        <Text style={styles.title}>{goal.title}</Text>
        {goal.isCompleted && <Text style={styles.badge}>Completed</Text>}
      </View>
      <Text style={styles.description}>{goal.description}</Text>
      <GoalProgress current={goal.currentProgress} target={goal.target} />
      <Text style={styles.reward}>Reward: {goal.rewardPoints} pts</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0d8c8',
  },
  completedContainer: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3a2f22',
  },
  badge: {
    fontSize: 12,
    color: '#166534',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  description: {
    fontSize: 13,
    color: '#6a5b47',
    marginTop: 4,
    marginBottom: 12,
  },
  reward: {
    fontSize: 12,
    color: '#d97706',
    fontWeight: 'bold',
    marginTop: 8,
  }
});

export default GoalCard;
