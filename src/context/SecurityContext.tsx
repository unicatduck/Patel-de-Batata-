import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

export type SecurityMode = 'none' | 'pin' | 'biometric' | 'both';

interface SecurityContextType {
  isLocked: boolean;
  securityMode: SecurityMode;
  biometricAvailable: boolean;
  biometricType: string;
  unlock: (pin?: string) => Promise<boolean>;
  lock: () => void;
  setupPin: (pin: string) => Promise<void>;
  enableBiometric: () => Promise<boolean>;
  disableSecurity: () => Promise<void>;
  disableBiometric: () => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  changePin: (oldPin: string, newPin: string) => Promise<boolean>;
}

const SecurityContext = createContext<SecurityContextType | null>(null);

const SECURITY_MODE_KEY = '@pdb:securityMode';
const PIN_HASH_KEY = '@pdb:pinHash';

function hashPin(pin: string): string {
  let h = 5381;
  for (let i = 0; i < pin.length; i++) {
    h = ((h << 5) + h) ^ pin.charCodeAt(i);
    h = h >>> 0;
  }
  return `pdb_${h.toString(16)}`;
}

export function SecurityProvider({ children }: { children: React.ReactNode }) {
  const [isLocked, setIsLocked] = useState(false);
  const [securityMode, setSecurityMode] = useState<SecurityMode>('none');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState('Biometria');

  useEffect(() => {
    const init = async () => {
      const [hasHw, supportedTypes, enrolled] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.supportedAuthenticationTypesAsync(),
        LocalAuthentication.isEnrolledAsync(),
      ]);

      const available = hasHw && supportedTypes.length > 0 && enrolled;
      setBiometricAvailable(available);

      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType('Face ID');
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType('Impressão Digital');
      }

      const savedMode = await SecureStore.getItemAsync(SECURITY_MODE_KEY);
      if (savedMode && savedMode !== 'none') {
        setSecurityMode(savedMode as SecurityMode);
        setIsLocked(true);
      }
    };
    init();
  }, []);

  const verifyPin = useCallback(async (pin: string): Promise<boolean> => {
    const stored = await SecureStore.getItemAsync(PIN_HASH_KEY);
    return stored === hashPin(pin);
  }, []);

  const unlock = useCallback(async (pin?: string): Promise<boolean> => {
    if (securityMode === 'none') {
      setIsLocked(false);
      return true;
    }

    // Only trigger biometric when no PIN was explicitly provided.
    // When the user types their PIN, skip the biometric prompt entirely.
    if (!pin && (securityMode === 'biometric' || securityMode === 'both')) {
      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Desbloqueia o Patel de Batata',
          cancelLabel: 'Cancelar',
          fallbackLabel: 'Usar PIN',
          disableDeviceFallback: false,
        });
        if (result.success) {
          setIsLocked(false);
          return true;
        }
      } catch (_) {}
      if (securityMode === 'biometric') return false;
    }

    if ((securityMode === 'pin' || securityMode === 'both') && pin) {
      const valid = await verifyPin(pin);
      if (valid) {
        setIsLocked(false);
        return true;
      }
      return false;
    }

    return false;
  }, [securityMode, verifyPin]);

  const lock = useCallback(() => {
    if (securityMode !== 'none') setIsLocked(true);
  }, [securityMode]);

  const setupPin = useCallback(async (pin: string) => {
    await SecureStore.setItemAsync(PIN_HASH_KEY, hashPin(pin));
    const newMode: SecurityMode = biometricAvailable ? 'both' : 'pin';
    await SecureStore.setItemAsync(SECURITY_MODE_KEY, newMode);
    setSecurityMode(newMode);
    setIsLocked(false);
  }, [biometricAvailable]);

  const enableBiometric = useCallback(async (): Promise<boolean> => {
    if (!biometricAvailable) return false;
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirma para ativar biometria',
        cancelLabel: 'Cancelar',
      });
      if (result.success) {
        const hasPin = await SecureStore.getItemAsync(PIN_HASH_KEY);
        const newMode: SecurityMode = hasPin ? 'both' : 'biometric';
        await SecureStore.setItemAsync(SECURITY_MODE_KEY, newMode);
        setSecurityMode(newMode);
        return true;
      }
    } catch (_) {}
    return false;
  }, [biometricAvailable]);

  const disableSecurity = useCallback(async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(SECURITY_MODE_KEY),
      SecureStore.deleteItemAsync(PIN_HASH_KEY),
    ]);
    setSecurityMode('none');
    setIsLocked(false);
  }, []);

  const disableBiometric = useCallback(async () => {
    if (securityMode === 'both') {
      // Keep PIN hash, just switch mode to pin-only
      await SecureStore.setItemAsync(SECURITY_MODE_KEY, 'pin');
      setSecurityMode('pin');
    } else if (securityMode === 'biometric') {
      await Promise.all([
        SecureStore.deleteItemAsync(SECURITY_MODE_KEY),
        SecureStore.deleteItemAsync(PIN_HASH_KEY),
      ]);
      setSecurityMode('none');
      setIsLocked(false);
    }
  }, [securityMode]);

  const changePin = useCallback(async (oldPin: string, newPin: string): Promise<boolean> => {
    const valid = await verifyPin(oldPin);
    if (!valid) return false;
    await SecureStore.setItemAsync(PIN_HASH_KEY, hashPin(newPin));
    return true;
  }, [verifyPin]);

  return (
    <SecurityContext.Provider value={{
      isLocked, securityMode, biometricAvailable, biometricType,
      unlock, lock, setupPin, enableBiometric, disableSecurity, disableBiometric, verifyPin, changePin,
    }}>
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurity(): SecurityContextType {
  const ctx = useContext(SecurityContext);
  if (!ctx) throw new Error('useSecurity must be inside SecurityProvider');
  return ctx;
}
