import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface AchievementCardProps {
  title: string;
  description: string;
  unlocked: boolean;
  iconName: string;
}

export const AchievementCard: React.FC<AchievementCardProps> = ({ title, description, unlocked, iconName }) => {
  return (
    <View style={[styles.card, unlocked ? styles.unlocked : styles.locked]}>
      <Text style={styles.icon}>{iconName}</Text>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  unlocked: {
    opacity: 1,
  },
  locked: {
    opacity: 0.5,
  },
  icon: {
    fontSize: 24,
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    color: '#666',
  },
});
