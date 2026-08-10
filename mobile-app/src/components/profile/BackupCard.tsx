import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';

interface Props {
  onBackup: () => void;
  onRestore: () => void;
}

export const BackupCard: React.FC<Props> = ({ onBackup, onRestore }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Backup & Restore</Text>
      <Text style={styles.description}>Secure your data locally and restore when needed.</Text>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.button} onPress={onBackup}>
          <Text style={styles.buttonText}>Create Backup</Text>
        </TouchableOpacity>
        {/* Placeholder for restore, typically requires a document picker which might be out of scope unless we add expo-document-picker */}
        <TouchableOpacity style={[styles.button, styles.restoreButton]} onPress={() => Alert.alert('Restore', 'Use a file manager to overwrite ecosnap_backup.json')}>
          <Text style={styles.buttonText}>Restore Backup</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    color: '#666',
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    backgroundColor: '#FF9800',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  restoreButton: {
    backgroundColor: '#9E9E9E',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  }
});
