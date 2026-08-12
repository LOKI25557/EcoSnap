import * as FileSystem from 'expo-file-system';
import { UserProfile } from '../../types/Profile';
import { WasteCategory } from '../../constants/wasteCategories';

const PROFILE_FILE_PATH = FileSystem.documentDirectory + 'user_profile.json';

const DEFAULT_PROFILE: UserProfile = {
  id: '',
  email: '',
  displayName: 'Eco Warrior',
  photoURL: '',
  score: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  name: 'Eco Warrior',
  avatar: '',
  preferredLanguage: 'en',
  themePreference: 'system',
  notificationPreferences: {
    dailyReminders: true,
    streakAlerts: true,
    challenges: true,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
  },
  favoriteCategories: [WasteCategory.PLASTIC, WasteCategory.PAPER],
  dailyGoal: 5,
  weeklyGoal: 30,
  monthlyGoal: 120,
  joinedDate: Date.now(),
  totalAchievements: 0,
};

class ProfileService {
  private profileCache: UserProfile | null = null;

  async getProfile(): Promise<UserProfile> {
    if (this.profileCache) {
      return this.profileCache;
    }

    try {
      const info = await FileSystem.getInfoAsync(PROFILE_FILE_PATH);
      if (!info.exists) {
        this.profileCache = { ...DEFAULT_PROFILE };
        await this.saveProfile(this.profileCache);
        return this.profileCache;
      }

      const content = await FileSystem.readAsStringAsync(PROFILE_FILE_PATH);
      const parsed = JSON.parse(content) as UserProfile;
      
      // Merge with default to ensure new fields are populated if they didn't exist
      this.profileCache = { ...DEFAULT_PROFILE, ...parsed };
      return this.profileCache;
    } catch (error) {
      console.error('Failed to load profile', error);
      return { ...DEFAULT_PROFILE };
    }
  }

  async saveProfile(profile: UserProfile): Promise<void> {
    try {
      await FileSystem.writeAsStringAsync(PROFILE_FILE_PATH, JSON.stringify(profile));
      this.profileCache = profile;
    } catch (error) {
      console.error('Failed to save profile', error);
      throw error;
    }
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const current = await this.getProfile();
    const updated = { ...current, ...updates };
    await this.saveProfile(updated);
    return updated;
  }
}

export const profileService = new ProfileService();
