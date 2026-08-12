export type NotificationType = 'pickup_update' | 'community_update' | 'recycling_reminder' | 'system';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: Date;
}
