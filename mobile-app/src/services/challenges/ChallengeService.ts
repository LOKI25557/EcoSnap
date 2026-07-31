import * as FileSystem from 'expo-file-system';
import { Challenge } from '../../types/Challenge';
import { HistoryItem } from '../history/DetectionHistoryService';
import { WasteCategory } from '../../constants/wasteCategories';
import { ecoPointsService } from '../points/EcoPointsService';

const CHALLENGES_FILE_PATH = FileSystem.documentDirectory + 'challenges.json';

const DEFAULT_CHALLENGES: Challenge[] = [
  {
    id: 'daily-5-bottles',
    title: 'Daily Recycler',
    description: 'Recycle 5 plastic bottles today',
    difficulty: 'easy',
    rewardPoints: 50,
    type: 'daily',
    target: 5,
    progress: 0,
    category: WasteCategory.PLASTIC,
    isCompleted: false,
    deadline: 0, // Set dynamically
  },
  {
    id: 'weekly-e-waste',
    title: 'E-Waste Warrior',
    description: 'Safely recycle 1 electronic item this week',
    difficulty: 'hard',
    rewardPoints: 500,
    type: 'weekly',
    target: 1,
    progress: 0,
    category: WasteCategory.E_WASTE,
    isCompleted: false,
    deadline: 0,
  }
];

class ChallengeService {
  private cache: Challenge[] | null = null;

  async getChallenges(): Promise<Challenge[]> {
    if (this.cache) return this.cache;
    try {
      const info = await FileSystem.getInfoAsync(CHALLENGES_FILE_PATH);
      if (!info.exists) {
        this.cache = this.initializeDeadlines([...DEFAULT_CHALLENGES]);
        await this.saveChallenges(this.cache);
        return this.cache;
      }
      const content = await FileSystem.readAsStringAsync(CHALLENGES_FILE_PATH);
      let parsed = JSON.parse(content) as Challenge[];
      
      // Reset expired challenges
      let updated = false;
      const now = Date.now();
      parsed = parsed.map(c => {
        if (now > c.deadline) {
          updated = true;
          return { ...c, progress: 0, isCompleted: false, deadline: this.getNewDeadline(c.type) };
        }
        return c;
      });

      this.cache = parsed;
      if (updated) await this.saveChallenges(this.cache);
      
      return this.cache;
    } catch (error) {
      console.error('Failed to load challenges', error);
      return this.initializeDeadlines([...DEFAULT_CHALLENGES]);
    }
  }

  private initializeDeadlines(challenges: Challenge[]): Challenge[] {
    return challenges.map(c => ({
      ...c,
      deadline: this.getNewDeadline(c.type)
    }));
  }

  private getNewDeadline(type: string): number {
    const now = new Date();
    if (type === 'daily') {
      now.setHours(23, 59, 59, 999);
      return now.getTime();
    }
    if (type === 'weekly') {
      const diff = 7 - now.getDay();
      now.setDate(now.getDate() + diff);
      now.setHours(23, 59, 59, 999);
      return now.getTime();
    }
    // Default 30 days for others
    return Date.now() + 30 * 24 * 60 * 60 * 1000;
  }

  async saveChallenges(challenges: Challenge[]): Promise<void> {
    try {
      await FileSystem.writeAsStringAsync(CHALLENGES_FILE_PATH, JSON.stringify(challenges));
      this.cache = challenges;
    } catch (error) {
      console.error('Failed to save challenges', error);
    }
  }

  async evaluateChallenges(history: HistoryItem[]): Promise<Challenge[]> {
    const challenges = await this.getChallenges();
    let updated = false;
    const now = Date.now();

    for (const challenge of challenges) {
      if (challenge.isCompleted || now > challenge.deadline) continue;

      // Filter history to only include items within the current challenge cycle
      // We assume the challenge started at deadline - duration. 
      // For simplicity in this demo, we'll just check items since the start of today for daily, etc.
      let startTime = 0;
      if (challenge.type === 'daily') {
        const d = new Date(); d.setHours(0,0,0,0);
        startTime = d.getTime();
      } else if (challenge.type === 'weekly') {
        const d = new Date(); 
        d.setDate(d.getDate() - d.getDay());
        d.setHours(0,0,0,0);
        startTime = d.getTime();
      }

      const relevantHistory = history.filter(h => h.timestamp >= startTime);
      
      const categoryCounts = relevantHistory.reduce<Record<string, number>>((acc, item) => {
        const cat = item.response.result.primaryCategory;
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {});

      const totalScans = relevantHistory.length;

      let current = 0;
      if (challenge.category) {
        current = categoryCounts[challenge.category] || 0;
      } else {
        current = totalScans;
      }

      if (current !== challenge.progress) {
        challenge.progress = current;
        updated = true;
      }

      if (challenge.progress >= challenge.target && !challenge.isCompleted) {
        challenge.progress = challenge.target;
        challenge.isCompleted = true;
        updated = true;
        
        // Award points
        await ecoPointsService.addPoints({
          id: Date.now().toString(),
          source: 'challenge',
          points: challenge.rewardPoints,
          timestamp: Date.now(),
          description: `Completed Challenge: ${challenge.title}`
        });
      }
    }

    if (updated) {
      await this.saveChallenges(challenges);
    }

    return challenges;
  }
}

export const challengeService = new ChallengeService();
