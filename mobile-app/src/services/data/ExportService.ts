import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { detectionHistoryService } from '../history/DetectionHistoryService';
import { ecoPointsService } from '../points/EcoPointsService';
import { badgeService } from '../badges/BadgeService';
import { challengeService } from '../challenges/ChallengeService';
import { goalService } from '../dashboard/GoalService';
import { profileService } from '../profile/ProfileService';
import { environmentalImpactService } from '../dashboard/EnvironmentalImpactService';

export class ExportService {
  async exportAsJson(): Promise<void> {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      console.warn('Sharing is not available on this platform');
      return;
    }

    const data = await this.gatherAllData();
    const fileUri = FileSystem.documentDirectory + 'ecosnap_export.json';
    
    await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(data, null, 2));
    await Sharing.shareAsync(fileUri, { mimeType: 'application/json', dialogTitle: 'Export EcoSnap Data' });
  }

  async exportAsCsv(): Promise<void> {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      console.warn('Sharing is not available on this platform');
      return;
    }

    const history = await detectionHistoryService.getHistory();
    let csv = 'ID,Date,Category,Confidence,Points\n';
    
    history.forEach(item => {
      const date = new Date(item.timestamp).toISOString();
      const category = item.response.result.primaryCategory;
      const confidence = item.response.result.confidence;
      // We don't store points directly in history item, but it's okay for basic export
      csv += `${item.id},${date},${category},${confidence},0\n`;
    });

    const fileUri = FileSystem.documentDirectory + 'ecosnap_history.csv';
    await FileSystem.writeAsStringAsync(fileUri, csv);
    await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Export EcoSnap CSV' });
  }

  private async gatherAllData() {
    const history = await detectionHistoryService.getHistory();
    const profile = await profileService.getProfile();
    const points = await ecoPointsService.getPoints();
    const badges = await badgeService.getBadges();
    const challenges = await challengeService.getChallenges();
    const goals = await goalService.getGoals();
    const impact = environmentalImpactService.getComprehensiveImpact(history);

    return {
      exportDate: new Date().toISOString(),
      profile,
      history,
      points,
      badges,
      challenges,
      goals,
      impact,
    };
  }
}

export const exportService = new ExportService();
