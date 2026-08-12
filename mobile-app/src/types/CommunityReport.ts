export type CommunityReportType = 'illegal_dumping' | 'overflowing_bin' | 'waste_accumulation' | 'recycling_issue' | 'other';
export type CommunityReportStatus = 'pending' | 'resolved' | 'investigating' | 'dismissed';

export interface CommunityReport {
  id: string;
  userId: string;
  type: CommunityReportType;
  description: string;
  latitude: number;
  longitude: number;
  address?: string;
  status: CommunityReportStatus;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}
