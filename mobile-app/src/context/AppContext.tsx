import React, { createContext, useMemo, useState, ReactNode } from 'react';
import { WasteItem } from '../types/WasteItem';

interface AppContextType {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  recentScans: WasteItem[];
  latestScan: WasteItem | null;
  addScan: (scan: WasteItem) => void;
  clearScans: () => void;
}

export const AppContext = createContext<AppContextType>({
  theme: 'light',
  setTheme: () => {},
  recentScans: [],
  latestScan: null,
  addScan: () => {},
  clearScans: () => {},
});

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [recentScans, setRecentScans] = useState<WasteItem[]>([]);

  const addScan = (scan: WasteItem) => {
    setRecentScans(current => [scan, ...current].slice(0, 25));
  };

  const clearScans = () => {
    setRecentScans([]);
  };

  const value = useMemo<AppContextType>(() => ({
    theme,
    setTheme,
    recentScans,
    latestScan: recentScans[0] ?? null,
    addScan,
    clearScans,
  }), [theme, recentScans]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => React.useContext(AppContext);
