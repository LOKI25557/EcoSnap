import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Badge } from '../../types/Badge';

interface Props {
  badge: Badge;
}

export const BadgeCard: React.FC<Props> = ({ badge }) => {
  return (
    <View style={[styles.card, !badge.isUnlocked && styles.lockedCard]}>
      <Text style={styles.icon}>{badge.icon}</Text>
      <Text style={styles.title}>{badge.title}</Text>
      <Text style={styles.description} numberOfLines={2}>{badge.description}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    width: 110,
    marginRight: 12,
    elevation: 2,
    marginBottom: 4,
  },
  lockedCard: {
    opacity: 0.5,
    backgroundColor: '#f5f5f5',
  },
  icon: {
    fontSize: 32,
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  description: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  }
});
