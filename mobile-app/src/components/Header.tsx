import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 15, backgroundColor: '#ffffff', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#dddddd' },
  title: { fontSize: 20, fontWeight: 'bold' },
});

export default Header;
