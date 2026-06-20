import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from './src/context/AppContext';
import { AuthProvider } from './src/context/AuthContext';
import MainNavigator from './src/navigation/MainNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <AuthProvider>
          <MainNavigator />
        </AuthProvider>
      </AppProvider>
    </SafeAreaProvider>
  );
}
