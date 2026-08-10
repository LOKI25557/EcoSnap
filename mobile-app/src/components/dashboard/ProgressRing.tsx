import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProgressRingProps {
  score: number;
  maxScore?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

const ProgressRing: React.FC<ProgressRingProps> = ({ 
  score, 
  size = 120, 
  strokeWidth = 10,
  color = '#2d6a4f'
}) => {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View style={[
        styles.circle, 
        { 
          width: size, 
          height: size, 
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: color
        }
      ]}>
        <Text style={[styles.scoreText, { color }]}>{Math.round(score)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  circle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 32,
    fontWeight: 'bold',
  }
});

export default ProgressRing;
