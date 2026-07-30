import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Card from '../Card';

interface ScoreCardProps {
  score: number;
}

const ScoreCard: React.FC<ScoreCardProps> = ({ score }) => {
  let message = '';
  let color = '#2d6a4f';

  if (score >= 80) {
    message = 'Eco Legend!';
    color = '#166534';
  } else if (score >= 50) {
    message = 'Great Job!';
    color = '#2d6a4f';
  } else if (score >= 20) {
    message = 'Keep Going!';
    color = '#d97706';
  } else {
    message = 'Start Scanning!';
    color = '#991b1b';
  }

  return (
    <Card>
      <View style={styles.container}>
        <View style={styles.leftCol}>
          <Text style={styles.title}>Sustainability Score</Text>
          <Text style={styles.message}>{message}</Text>
        </View>
        <View style={[styles.scoreCircle, { borderColor: color }]}>
          <Text style={[styles.score, { color }]}>{score}</Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftCol: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4a3b2a',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: '#6a5b47',
  },
  scoreCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  score: {
    fontSize: 20,
    fontWeight: 'bold',
  }
});

export default ScoreCard;
