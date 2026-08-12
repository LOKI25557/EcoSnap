import { User } from './User';
import { WasteCategory } from '../constants/wasteCategories';

export interface UserProfile extends User {
  name: string;
  avatar: string; // URI or base64
  preferredLanguage: string;
  themePreference: 'light' | 'dark' | 'system';
  notificationPreferences: {
    dailyReminders: boolean;
    streakAlerts: boolean;
    challenges: boolean;
    quietHoursStart: string; // HH:mm
    quietHoursEnd: string; // HH:mm
  };
  favoriteCategories: WasteCategory[];
  dailyGoal: number;
  weeklyGoal: number;
  monthlyGoal: number;
  joinedDate: number;
  totalAchievements: number;
}
