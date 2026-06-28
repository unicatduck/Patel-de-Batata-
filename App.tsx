import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LibraryProvider } from './src/context/LibraryContext';
import { PlayerProvider } from './src/context/PlayerContext';
import AppNavigator from './src/navigation/AppNavigator';
import { COLORS } from './src/theme';

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

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer theme={navTheme}>
          <LibraryProvider>
            <PlayerProvider>
              <AppNavigator />
              <StatusBar style="light" />
            </PlayerProvider>
          </LibraryProvider>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
