export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  score: number;
  createdAt: Date;
  updatedAt: Date;
}
