import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  currentStreak: number;
  longestStreak: number;
}

export const StreakCard: React.FC<Props> = ({ currentStreak, longestStreak }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.emoji}>🔥</Text>
      <View style={styles.info}>
        <Text style={styles.title}>{currentStreak} Day Streak!</Text>
        <Text style={styles.subtitle}>Longest: {longestStreak} days</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  emoji: {
    fontSize: 32,
    marginRight: 16,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF9800',
  },
  subtitle: {
    color: '#666',
    marginTop: 4,
  }
});
