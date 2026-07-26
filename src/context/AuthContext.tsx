import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateId } from '../utils/storage';

export interface UserProfile {
  id: string;
  name: string;
  emoji: string;
  createdAt: number;
}

interface AuthContextType {
  profile: UserProfile | null;
  isSetup: boolean;
  createProfile: (name: string, emoji: string) => Promise<void>;
  updateProfile: (updates: Partial<Pick<UserProfile, 'name' | 'emoji'>>) => Promise<void>;
  deleteProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);
const PROFILE_KEY = '@pdb:userProfile';

const DEFAULT_EMOJIS = ['🎵', '🎶', '🎸', '🥔', '🦆', '🎧', '🎤', '🎹', '🎺', '🥁'];
export const AVATAR_EMOJIS = DEFAULT_EMOJIS;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isSetup, setIsSetup] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(PROFILE_KEY).then(raw => {
      if (raw) {
        try { setProfile(JSON.parse(raw)); } catch (_) {}
      }
      setIsSetup(true);
    });
  }, []);

  const createProfile = useCallback(async (name: string, emoji: string) => {
    const p: UserProfile = { id: generateId(), name, emoji, createdAt: Date.now() };
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(p));
    setProfile(p);
  }, []);

  const updateProfile = useCallback(async (updates: Partial<Pick<UserProfile, 'name' | 'emoji'>>) => {
    setProfile(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteProfile = useCallback(async () => {
    await AsyncStorage.removeItem(PROFILE_KEY);
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider value={{ profile, isSetup, createProfile, updateProfile, deleteProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
