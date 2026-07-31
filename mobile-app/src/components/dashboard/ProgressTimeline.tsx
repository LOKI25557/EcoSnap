import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface TimelineEvent {
  title: string;
  subtitle: string;
  date: string;
  isCompleted: boolean;
}

interface Props {
  events: TimelineEvent[];
}

export const ProgressTimeline: React.FC<Props> = ({ events }) => {
  return (
    <View style={styles.container}>
      {events.map((event, index) => (
        <View key={index} style={styles.eventRow}>
          <View style={styles.lineColumn}>
            <View style={[styles.dot, event.isCompleted && styles.completedDot]} />
            {index < events.length - 1 && (
              <View style={[styles.line, event.isCompleted && styles.completedLine]} />
            )}
          </View>
          <View style={styles.contentColumn}>
            <Text style={[styles.title, event.isCompleted && styles.completedText]}>{event.title}</Text>
            <Text style={styles.subtitle}>{event.subtitle}</Text>
            <Text style={styles.date}>{event.date}</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    marginBottom: 16,
  },
  eventRow: {
    flexDirection: 'row',
  },
  lineColumn: {
    width: 30,
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ccc',
    marginTop: 4,
  },
  completedDot: {
    backgroundColor: '#4CAF50',
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: '#eee',
    marginVertical: 4,
  },
  completedLine: {
    backgroundColor: '#4CAF50',
  },
  contentColumn: {
    flex: 1,
    paddingBottom: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  completedText: {
    color: '#4CAF50',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  date: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  }
});
