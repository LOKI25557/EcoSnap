import { auth } from './firebaseConfig';
import { createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail, Unsubscribe, User as FirebaseUser } from 'firebase/auth';
import { mapAuthError } from '../../utils/authErrors';
import { firestoreService } from './firestoreService';

// TODO: Implement Firebase Authentication methods
export const authService = {
  login: async (email: string, password: string): Promise<FirebaseUser> => {
    if (!email || !password) {
      throw new Error('Email and password are required.');
    }
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      throw mapAuthError(error);
    }
  },
  register: async (email: string, password: string, name: string): Promise<FirebaseUser> => {
    if (!email || !password || !name) {
      throw new Error('Email, password, and name are required.');
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      await updateProfile(user, { displayName: name });
      
      // Create user profile in Firestore
      await firestoreService.createUserProfile(user.uid, {
        email: user.email || email,
        displayName: name,
      });
      
      return user;
    } catch (error) {
      throw mapAuthError(error);
    }
  },
  logout: async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (error) {
      throw mapAuthError(error);
    }
  },
  getCurrentUser: (): FirebaseUser | null => {
    return auth.currentUser;
  },
  onAuthStateChanged: (callback: (user: FirebaseUser | null) => void): Unsubscribe => {
    return onAuthStateChanged(auth, callback);
  },
  resetPassword: async (email: string): Promise<void> => {
    if (!email) {
      throw new Error('Email is required.');
    }
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw mapAuthError(error);
    }
  },
};

