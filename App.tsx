import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as WebBrowser from 'expo-web-browser';
import { LibraryProvider } from './src/context/LibraryContext';
import { PlayerProvider } from './src/context/PlayerContext';
import { SecurityProvider, useSecurity } from './src/context/SecurityContext';
import { AuthProvider } from './src/context/AuthContext';
import { GoogleAuthProvider } from './src/context/GoogleAuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import LockScreen from './src/components/LockScreen';
import { COLORS } from './src/theme';

WebBrowser.maybeCompleteAuthSession();

const navTheme = {
  dark: true,
  colors: {
    primary: COLORS.primary,
    background: COLORS.background,
    card: COLORS.surface,
    text: COLORS.text,
    border: COLORS.border,
    notification: COLORS.primary,
  },
};

function AppShell() {
  const { isLocked } = useSecurity();
  if (isLocked) return <LockScreen />;
  return (
    <NavigationContainer theme={navTheme}>
      <LibraryProvider>
        <PlayerProvider>
          <AppNavigator />
          <StatusBar style="light" />
        </PlayerProvider>
      </LibraryProvider>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SecurityProvider>
          <AuthProvider>
            <GoogleAuthProvider>
              <AppShell />
            </GoogleAuthProvider>
          </AuthProvider>
        </SecurityProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
