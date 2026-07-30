import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface GoalProgressProps {
  current: number;
  target: number;
}

const GoalProgress: React.FC<GoalProgressProps> = ({ current, target }) => {
  const progressPercent = Math.min((current / target) * 100, 100);

  return (
    <View style={styles.container}>
      <View style={styles.progressBackground}>
        <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
      </View>
      <Text style={styles.text}>{current} / {target}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#e5e5e5',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2d6a4f',
    borderRadius: 4,
  },
  text: {
    fontSize: 12,
    color: '#6a5b47',
    minWidth: 45,
    textAlign: 'right',
  },
});

export default GoalProgress;
