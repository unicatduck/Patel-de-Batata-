import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as SecureStore from 'expo-secure-store';
import { GOOGLE_CONFIG } from '../config/google';

const ACCESS_TOKEN_KEY = '@pdb:googleAccessToken';
const USER_INFO_KEY = '@pdb:googleUserInfo';

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

interface GoogleAuthContextType {
  googleUser: GoogleUser | null;
  isSigningIn: boolean;
  accessToken: string | null;
  isConfigured: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const GoogleAuthContext = createContext<GoogleAuthContextType | null>(null);

export function GoogleAuthProvider({ children }: { children: React.ReactNode }) {
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const [, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_CONFIG.webClientId || undefined,
    androidClientId: GOOGLE_CONFIG.androidClientId || undefined,
    scopes: [
      'profile',
      'email',
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/drive.appdata',
    ],
  });

  useEffect(() => {
    SecureStore.getItemAsync(ACCESS_TOKEN_KEY).then(token => {
      if (token) setAccessToken(token);
    });
    SecureStore.getItemAsync(USER_INFO_KEY).then(raw => {
      if (raw) { try { setGoogleUser(JSON.parse(raw)); } catch (_) {} }
    });
  }, []);

  const handleToken = useCallback(async (token: string) => {
    setAccessToken(token);
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
    try {
      const res = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const user: GoogleUser = {
        id: data.id ?? '',
        email: data.email ?? '',
        name: data.name ?? '',
        picture: data.picture,
      };
      setGoogleUser(user);
      await SecureStore.setItemAsync(USER_INFO_KEY, JSON.stringify(user));
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      const token = response.authentication?.accessToken;
      if (token) handleToken(token);
    }
    if (response?.type === 'success' || response?.type === 'error' || response?.type === 'dismiss') {
      setIsSigningIn(false);
    }
  }, [response, handleToken]);

  const signIn = useCallback(async () => {
    if (!GOOGLE_CONFIG.configured) return;
    setIsSigningIn(true);
    try {
      await promptAsync();
    } catch (_) {
      setIsSigningIn(false);
    }
  }, [promptAsync]);

  const signOut = useCallback(async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_INFO_KEY),
    ]);
    setGoogleUser(null);
    setAccessToken(null);
  }, []);

  return (
    <GoogleAuthContext.Provider value={{
      googleUser, isSigningIn, accessToken,
      isConfigured: GOOGLE_CONFIG.configured,
      signIn, signOut,
    }}>
      {children}
    </GoogleAuthContext.Provider>
  );
}

export function useGoogleAuth(): GoogleAuthContextType {
  const ctx = useContext(GoogleAuthContext);
  if (!ctx) throw new Error('useGoogleAuth must be inside GoogleAuthProvider');
  return ctx;
}
