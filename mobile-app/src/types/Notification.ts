export type NotificationType =
  | 'pickup_created'
  | 'pickup_scheduled'
  | 'pickup_assigned'
  | 'pickup_completed'
  | 'pickup_cancelled'
  | 'report_under_review'
  | 'report_verified'
  | 'report_rejected'
  | 'report_resolved'
  | 'review_update'
  | 'general'
  | 'pickup_update'
  | 'community_update'
  | 'recycling_reminder'
  | 'system';

export type NotificationData = Record<string, string | number | boolean | null>;

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  message?: string; // Fallback for old message field
  data?: NotificationData;
  read: boolean;
  isRead?: boolean; // For legacy support
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  imageUrl?: string;
  actionUrl?: string;
}

export interface NotificationPreferences {
  // Member 1 preferences
  pickupUpdates: boolean;
  communityReports: boolean;
  reviews: boolean;
  general: boolean;
  marketing: boolean;

  // Member 2 reminders
  dailyReminders?: boolean;
  streakAlerts?: boolean;
  challenges?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

export interface DeviceToken {
  deviceId: string;
  userId: string;
  pushToken: string;
  platform: 'ios' | 'android' | 'web';
  createdAt: Date;
  updatedAt: Date;
  lastSeenAt: Date;
}

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: NotificationData;
  expiresAt?: Date;
  imageUrl?: string;
  actionUrl?: string;
}

