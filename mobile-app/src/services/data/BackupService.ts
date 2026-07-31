import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export class BackupService {
  private get allFiles() {
    return [
      'user_profile.json',
      'reminders.json',
      'challenges.json',
      'eco_points.json',
      'badges.json',
      'detection_history.json',
      'goals.json',
    ];
  }

  async createBackup(): Promise<void> {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      console.warn('Sharing is not available');
      return;
    }

    const backupData: Record<string, any> = {};

    for (const file of this.allFiles) {
      const path = FileSystem.documentDirectory + file;
      const info = await FileSystem.getInfoAsync(path);
      if (info.exists) {
        const content = await FileSystem.readAsStringAsync(path);
        backupData[file] = JSON.parse(content);
      }
    }

    const backupString = JSON.stringify({
      version: '1.0',
      timestamp: Date.now(),
      data: backupData
    });

    // In a real app we'd zip this, but for React Native without native modules, JSON is safest
    const backupUri = FileSystem.documentDirectory + 'ecosnap_backup.json';
    await FileSystem.writeAsStringAsync(backupUri, backupString);
    
    await Sharing.shareAsync(backupUri, { 
      mimeType: 'application/json', 
      dialogTitle: 'Save EcoSnap Backup' 
    });
  }

  async restoreBackup(jsonString: string): Promise<boolean> {
    try {
      const backup = JSON.parse(jsonString);
      
      if (!backup.version || !backup.data) {
        throw new Error('Invalid backup format');
      }

      for (const [filename, content] of Object.entries(backup.data)) {
        if (this.allFiles.includes(filename)) {
          const path = FileSystem.documentDirectory + filename;
          await FileSystem.writeAsStringAsync(path, JSON.stringify(content));
        }
      }

      return true;
    } catch (error) {
      console.error('Backup restore failed', error);
      return false;
    }
  }
}

export const backupService = new BackupService();
