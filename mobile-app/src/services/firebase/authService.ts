import { auth } from './firebaseConfig';
import { createUserWithEmailAndPassword, updateProfile, User as FirebaseUser } from 'firebase/auth';
import { mapAuthError } from '../../utils/authErrors';

// TODO: Implement Firebase Authentication methods
export const authService = {
  login: async () => { /* TODO */ },
  register: async (email: string, password: string, name: string): Promise<FirebaseUser> => {
    if (!email || !password || !name) {
      throw new Error('Email, password, and name are required.');
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      await updateProfile(user, { displayName: name });
      
      return user;
    } catch (error) {
      throw mapAuthError(error);
    }
  },
  logout: async () => { /* TODO */ },
  getCurrentUser: () => { /* TODO */ return null; },
};

