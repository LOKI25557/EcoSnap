import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
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

const ProfileScreen = () => {
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

  if (!profile) return null;

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <ProfileCard profile={profile} />
      
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 8,
    color: '#333',
  }
});

export default ProfileScreen;

