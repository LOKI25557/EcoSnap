import React from 'react';
import { TouchableOpacity, Text, StyleSheet, GestureResponderEvent } from 'react-native';

interface CustomButtonProps {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  disabled?: boolean;
}

const CustomButton: React.FC<CustomButtonProps> = ({ title, onPress, disabled }) => {
  return (
    <TouchableOpacity style={[styles.button, disabled && styles.disabled]} onPress={onPress} disabled={disabled}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: { padding: 10, backgroundColor: '#007bff', borderRadius: 5, alignItems: 'center' },
  disabled: { backgroundColor: '#cccccc' },
  text: { color: '#ffffff', fontWeight: 'bold' },
});

export default CustomButton;
