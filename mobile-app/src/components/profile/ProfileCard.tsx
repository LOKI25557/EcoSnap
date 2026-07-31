import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { UserProfile } from '../../types/Profile';

interface Props {
  profile: UserProfile;
}

export const ProfileCard: React.FC<Props> = ({ profile }) => {
  return (
    <View style={styles.card}>
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarText}>{profile.name.charAt(0)}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{profile.name}</Text>
        <Text style={styles.date}>Joined: {new Date(profile.joinedDate).toLocaleDateString()}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  date: {
    color: '#666',
    marginTop: 4,
  }
});
