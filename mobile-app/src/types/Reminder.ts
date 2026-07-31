export interface Reminder {
  id: string;
  title: string;
  body: string;
  type: 'daily' | 'weekly' | 'custom' | 'streak';
  time: string; // HH:mm
  dayOfWeek?: number; // 0-6 for weekly
  isEnabled: boolean;
}
