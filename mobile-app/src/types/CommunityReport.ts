export interface CommunityReport {
  id: string;
  userId: string;
  location: {
    latitude: number;
    longitude: number;
  };
  description: string;
  imageUrl?: string;
  resolved: boolean;
  createdAt: Date;
}
