export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; // Emoji or asset name
  isUnlocked: boolean;
  unlockedAt?: number;
  progress: number;
  target: number;
  rewardPoints: number;
}
