import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { User } from '../types/User';
import { authService } from '../services/firebase/authService';
import { firestoreService } from '../services/firebase/firestoreService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const defaultAuthContextValue: AuthContextType = {
  user: null,
  isLoading: true,
  loading: true,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  resetPassword: async () => {},
};

export const AuthContext = createContext<AuthContextType>(defaultAuthContextValue);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Subscribe to Firebase auth state changes
    const unsubscribe = authService.onAuthStateChanged(async (firebaseUser) => {
      setIsLoading(true);
      if (firebaseUser) {
        try {
          let profile = await firestoreService.getUserProfile(firebaseUser.uid);
          if (!profile) {
            // Document might not have been created yet, fallback to local details
            profile = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || '',
              photoURL: firebaseUser.photoURL || '',
              score: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
              name: firebaseUser.displayName || 'Eco Warrior',
              avatar: firebaseUser.photoURL || '',
              preferredLanguage: 'en',
              themePreference: 'system',
              notificationPreferences: {
                dailyReminders: true,
                streakAlerts: true,
                challenges: true,
                quietHoursStart: '22:00',
                quietHoursEnd: '08:00',
              },
              favoriteCategories: [],
              dailyGoal: 5,
              weeklyGoal: 30,
              monthlyGoal: 120,
              joinedDate: Date.now(),
              totalAchievements: 0,
            };
          }
          setUser(profile);
        } catch (error) {
          console.error('Error fetching user profile in auth listener:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    // Unsubscribe on unmount
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await authService.login(email, password);
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      await authService.register(email, password, name);
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await authService.resetPassword(email);
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        loading: isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
