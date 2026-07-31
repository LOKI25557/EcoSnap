import * as Notifications from 'expo-notifications';
import * as FileSystem from 'expo-file-system';
import { Reminder } from '../../types/Reminder';
import { profileService } from '../profile/ProfileService';

const REMINDERS_FILE_PATH = FileSystem.documentDirectory + 'reminders.json';

const DEFAULT_REMINDERS: Reminder[] = [
  {
    id: 'daily-reminder',
    title: 'Time to recycle!',
    body: "Don't forget to scan your daily waste items.",
    type: 'daily',
    time: '20:00',
    isEnabled: true,
  },
  {
    id: 'streak-reminder',
    title: 'Keep your streak alive! 🔥',
    body: "You haven't scanned anything today. Scan an item to keep your streak going!",
    type: 'streak',
    time: '21:00',
    isEnabled: true,
  }
];

class ReminderService {
  private remindersCache: Reminder[] | null = null;

  async init(): Promise<void> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification!');
      return;
    }
    await this.scheduleAllEnabledReminders();
  }

  async getReminders(): Promise<Reminder[]> {
    if (this.remindersCache) return this.remindersCache;
    try {
      const info = await FileSystem.getInfoAsync(REMINDERS_FILE_PATH);
      if (!info.exists) {
        this.remindersCache = [...DEFAULT_REMINDERS];
        await this.saveReminders(this.remindersCache);
        return this.remindersCache;
      }
      const content = await FileSystem.readAsStringAsync(REMINDERS_FILE_PATH);
      this.remindersCache = JSON.parse(content) as Reminder[];
      return this.remindersCache;
    } catch (error) {
      console.error('Failed to load reminders', error);
      return [...DEFAULT_REMINDERS];
    }
  }

  async saveReminders(reminders: Reminder[]): Promise<void> {
    try {
      await FileSystem.writeAsStringAsync(REMINDERS_FILE_PATH, JSON.stringify(reminders));
      this.remindersCache = reminders;
      await this.scheduleAllEnabledReminders();
    } catch (error) {
      console.error('Failed to save reminders', error);
    }
  }

  async toggleReminder(id: string, isEnabled: boolean): Promise<void> {
    const reminders = await this.getReminders();
    const updated = reminders.map(r => r.id === id ? { ...r, isEnabled } : r);
    await this.saveReminders(updated);
  }

  private async scheduleAllEnabledReminders(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    const profile = await profileService.getProfile();
    
    // Check if notifications are globally disabled in profile
    if (!profile.notificationPreferences.dailyReminders) {
      return;
    }

    const reminders = await this.getReminders();
    
    for (const reminder of reminders) {
      if (!reminder.isEnabled) continue;

      if (reminder.type === 'streak' && !profile.notificationPreferences.streakAlerts) {
        continue; // User disabled streak alerts specifically
      }

      const [hour, minute] = reminder.time.split(':').map(Number);
      
      // Basic scheduling (repeats daily)
      if (reminder.type === 'daily' || reminder.type === 'streak' || reminder.type === 'custom') {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: reminder.title,
            body: reminder.body,
          },
          trigger: {
            hour,
            minute,
            repeats: true,
          } as Notifications.DailyTriggerInput,
        });
      } else if (reminder.type === 'weekly' && reminder.dayOfWeek !== undefined) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: reminder.title,
            body: reminder.body,
          },
          trigger: {
            weekday: reminder.dayOfWeek + 1, // Expo uses 1-7 for Sun-Sat
            hour,
            minute,
            repeats: true,
          } as Notifications.WeeklyTriggerInput,
        });
      }
    }
  }
}

export const reminderService = new ReminderService();
