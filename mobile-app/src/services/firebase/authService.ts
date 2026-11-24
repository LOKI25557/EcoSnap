import { auth } from './firebaseConfig';
import { createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail, Unsubscribe, User as FirebaseUser } from 'firebase/auth';
import { mapAuthError } from '../../utils/authErrors';
import { firestoreService } from './firestoreService';

// Firebase Authentication service layer
export const authService = {
  login: async (email: string, password: string): Promise<FirebaseUser> => {
    if (!email || !password) {
      throw new Error('Email and password are required.');
    }
    const cleanEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      throw new Error('Invalid email address format.');
    }
    try {
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      return userCredential.user;
    } catch (error) {
      throw mapAuthError(error);
    }
  },
  register: async (email: string, password: string, name: string): Promise<FirebaseUser> => {
    if (!email || !password || !name) {
      throw new Error('Email, password, and name are required.');
    }
    const cleanName = name.trim();
    if (!cleanName) {
      throw new Error('Name cannot be empty.');
    }
    const cleanEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      throw new Error('Invalid email address format.');
    }
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const user = userCredential.user;
      
      await updateProfile(user, { displayName: cleanName });
      
      // Create user profile in Firestore
      await firestoreService.createUserProfile(user.uid, {
        email: user.email || cleanEmail,
        displayName: cleanName,
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
    const cleanEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      throw new Error('Invalid email address format.');
    }
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
    } catch (error) {
      throw mapAuthError(error);
    }
  },
};

