import React, { createContext, useState, ReactNode } from 'react';
import { User } from '../types/User';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  // TODO: add login/logout functions
}

export const AuthContext = createContext<AuthContextType>({ user: null, isLoading: false });

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => React.useContext(AuthContext);
