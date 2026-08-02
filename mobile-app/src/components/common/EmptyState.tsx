import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CustomButton from '../CustomButton';

interface EmptyStateProps {
  title: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  title, 
  message, 
  actionText, 
  onAction 
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionText && onAction && (
        <View style={styles.buttonContainer}>
          <CustomButton title={actionText} onPress={onAction} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f3f7f2',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f3d2b',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#2d4137',
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.8,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 250,
  }
});

export default EmptyState;
