import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { Reminder } from '../../types/Reminder';

interface Props {
  reminder: Reminder;
  onToggle: (id: string, isEnabled: boolean) => void;
}

export const ReminderCard: React.FC<Props> = ({ reminder, onToggle }) => {
  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.title}>{reminder.title}</Text>
        <Text style={styles.time}>{reminder.time} ({reminder.type})</Text>
      </View>
      <Switch 
        value={reminder.isEnabled} 
        onValueChange={(val) => onToggle(reminder.id, val)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  time: {
    fontSize: 14,
    color: '#666',
  },
});
