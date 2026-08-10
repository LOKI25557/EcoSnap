import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Button, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { profileService } from '../services/profile/ProfileService';
import { reminderService } from '../services/reminders/ReminderService';
import { exportService } from '../services/data/ExportService';
import { backupService } from '../services/data/BackupService';
import { ProfileCard } from '../components/profile/ProfileCard';
import { ReminderCard } from '../components/profile/ReminderCard';
import { ExportCard } from '../components/profile/ExportCard';
import { BackupCard } from '../components/profile/BackupCard';
import { UserProfile } from '../types/Profile';
import { Reminder } from '../types/Reminder';
import { useAuth } from '../context/AuthContext';

const ProfileScreen = () => {
  const { user: authUser, logout, isLoading: isAuthLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const p = await profileService.getProfile();
      const r = await reminderService.getReminders();
      setProfile(p);
      setReminders(r);
    } catch (e) {
      console.error(e);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleToggleReminder = async (id: string, isEnabled: boolean) => {
    await reminderService.toggleReminder(id, isEnabled);
    await loadData();
  };

  if (isAuthLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!profile) return null;

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <ProfileCard profile={profile} />

      {authUser && (
        <View style={styles.authInfoCard}>
          <Text style={styles.cardTitle}>Account Details</Text>
          <Text style={styles.cardText}>Email: {authUser.email}</Text>
          <Text style={styles.cardText}>Score: {authUser.score}</Text>
        </View>
      )}
      
      <Text style={styles.sectionTitle}>Reminders</Text>
      {reminders.map(r => (
        <ReminderCard key={r.id} reminder={r} onToggle={handleToggleReminder} />
      ))}

      <Text style={styles.sectionTitle}>Data Management</Text>
      <ExportCard 
        onExportJson={() => exportService.exportAsJson()} 
        onExportCsv={() => exportService.exportAsCsv()} 
      />
      <BackupCard 
        onBackup={() => backupService.createBackup()}
        onRestore={() => {}} 
      />
      
      <View style={styles.logoutContainer}>
        <Button title="Log Out" onPress={logout} color="#ff3b30" />
      </View>
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F5F5F5',
    padding: 16,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 8,
    color: '#333',
  },
  authInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  cardText: {
    fontSize: 14,
    color: '#666',
    marginVertical: 2,
  },
  logoutContainer: {
    marginTop: 20,
    marginBottom: 10,
  },
});

export default ProfileScreen;
