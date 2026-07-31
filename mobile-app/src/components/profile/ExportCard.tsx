import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ExportService } from '../../services/data/ExportService';

interface Props {
  onExportJson: () => void;
  onExportCsv: () => void;
}

export const ExportCard: React.FC<Props> = ({ onExportJson, onExportCsv }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Data Export</Text>
      <Text style={styles.description}>Export your detection history and analytics.</Text>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.button} onPress={onExportJson}>
          <Text style={styles.buttonText}>Export JSON</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.csvButton]} onPress={onExportCsv}>
          <Text style={styles.buttonText}>Export CSV</Text>
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
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  csvButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  }
});
