import React from 'react';
import { View, Text, StyleSheet, Button, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';

const ProfileScreen = () => {
  const { user, logout, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>User Profile</Text>
      {user ? (
        <View style={styles.profileDetails}>
          <Text style={styles.label}>Name: {user.displayName || 'N/A'}</Text>
          <Text style={styles.label}>Email: {user.email}</Text>
          <Text style={styles.label}>Score: {user.score}</Text>
        </View>
      ) : (
        <Text style={styles.label}>No profile information loaded.</Text>
      )}
      <Button title="Log Out" onPress={logout} color="#ff3b30" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  profileDetails: { marginBottom: 30, alignItems: 'center' },
  label: { fontSize: 16, marginVertical: 5 },
});

export default ProfileScreen;
