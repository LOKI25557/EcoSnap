export type CommunityReportType =
  | 'illegal_dumping'
  | 'overflowing_bin'
  | 'damaged_bin'
  | 'recycling_facility_issue'
  | 'other';

export type CommunityReportStatus =
  | 'pending'
  | 'under_review'
  | 'verified'
  | 'resolved'
  | 'rejected';

export interface CommunityReport {
  id: string;
  userId: string;
  type: CommunityReportType;
  description: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  photoUrl?: string;
  photoPath?: string; // Firebase storage path
  status: CommunityReportStatus;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  rejectedAt?: Date;
}

export interface CreateCommunityReportInput {
  userId: string;
  type: CommunityReportType;
  description: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  photoUrl?: string;
  photoPath?: string;
}

export interface UpdateCommunityReportInput {
  type?: CommunityReportType;
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  photoUrl?: string;
  photoPath?: string;
  status?: CommunityReportStatus;
}
