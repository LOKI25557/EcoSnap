import React from 'react';
import { FlatList, StyleSheet, View, Text } from 'react-native';
import { CenterCard } from './CenterCard';
import { CenterWithDistance } from '../../services/recycling/CenterSearch';

interface CenterListProps {
  centers: CenterWithDistance[];
  onCenterPress?: (center: CenterWithDistance) => void;
  onNavigate?: (center: CenterWithDistance) => void;
}

export const CenterList: React.FC<CenterListProps> = ({ centers, onCenterPress, onNavigate }) => {
  if (centers.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No recycling centers found nearby.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={centers}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <CenterCard 
          center={item} 
          onPress={onCenterPress} 
          onNavigate={onNavigate} 
        />
      )}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    paddingBottom: 20,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});
