import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import LibraryScreen from '../screens/LibraryScreen';
import SearchScreen from '../screens/SearchScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PlayerScreen from '../screens/PlayerScreen';
import PlaylistDetailScreen from '../screens/PlaylistDetailScreen';
import ArtistScreen from '../screens/ArtistScreen';
import CreatePlaylistScreen from '../screens/CreatePlaylistScreen';
import MiniPlayer from '../components/MiniPlayer';
import { BottomTabParamList, RootStackParamList } from '../types';
import { COLORS, FONT_SIZES } from '../theme';

const Tab = createBottomTabNavigator<BottomTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function TabNavigator() {
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: COLORS.surface,
            borderTopColor: COLORS.border,
            height: 60,
            paddingBottom: 8,
            paddingTop: 4,
          },
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textSecondary,
          tabBarLabelStyle: {
            fontSize: FONT_SIZES.xs,
            fontWeight: '600',
          },
          tabBarIcon: ({ color, size, focused }) => {
            const icons: Record<string, { active: any; inactive: any }> = {
              Home: { active: 'home', inactive: 'home-outline' },
              Library: { active: 'library', inactive: 'library-outline' },
              Search: { active: 'search', inactive: 'search-outline' },
              Settings: { active: 'settings', inactive: 'settings-outline' },
            };
            const name = icons[route.name];
            return (
              <Ionicons
                name={focused ? name.active : name.inactive}
                size={size}
                color={color}
              />
            );
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Início' }} />
        <Tab.Screen name="Library" component={LibraryScreen} options={{ tabBarLabel: 'Biblioteca' }} />
        <Tab.Screen name="Search" component={SearchScreen} options={{ tabBarLabel: 'Pesquisar' }} />
        <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: 'Definições' }} />
      </Tab.Navigator>

      <MiniPlayer />
    </View>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen
        name="Player"
        component={PlayerScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen name="PlaylistDetail" component={PlaylistDetailScreen} />
      <Stack.Screen name="ArtistDetail" component={ArtistScreen} />
      <Stack.Screen
        name="CreatePlaylist"
        component={CreatePlaylistScreen}
        options={{ presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}
