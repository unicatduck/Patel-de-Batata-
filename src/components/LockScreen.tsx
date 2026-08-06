import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSecurity } from '../context/SecurityContext';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONT_SIZES, RADIUS, SPACING } from '../theme';

const PIN_LENGTH = 4;
const DIGITS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

export default function LockScreen() {
  const insets = useSafeAreaInsets();
  const { unlock, securityMode, biometricType } = useSecurity();
  const { profile } = useAuth();

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const isSubmitting = useRef(false);

  const shake = useCallback(() => {
    Vibration.vibrate(200);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  const handleBiometric = useCallback(async () => {
    const ok = await unlock();
    if (!ok) setError('Autenticação biométrica falhada');
  }, [unlock]);

  useEffect(() => {
    if (securityMode === 'biometric' || securityMode === 'both') {
      handleBiometric();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDigit = useCallback(async (d: string) => {
    if (d === '⌫') {
      setPin(prev => prev.slice(0, -1));
      setError('');
      return;
    }
    if (d === '') return;
    if (isSubmitting.current) return;

    const next = pin + d;
    if (next.length > PIN_LENGTH) return;
    setPin(next);

    if (next.length === PIN_LENGTH) {
      isSubmitting.current = true;
      const ok = await unlock(next);
      isSubmitting.current = false;
      if (!ok) {
        shake();
        setError('PIN incorreto. Tenta novamente.');
        setPin('');
      }
    }
  }, [pin, unlock, shake]);

  const showBiometric = securityMode === 'biometric' || securityMode === 'both';
  const showPad = securityMode === 'pin' || securityMode === 'both';

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom + SPACING.lg }]}>
      <View style={styles.top}>
        <Text style={styles.appName}>🦆 Patel de Batata</Text>
        {profile && (
          <View style={styles.profileRow}>
            <Text style={styles.profileEmoji}>{profile.emoji}</Text>
            <Text style={styles.profileName}>{profile.name}</Text>
          </View>
        )}
        <Text style={styles.lockLabel}>Aplicação bloqueada</Text>
      </View>

      {showPad && (
        <>
          <Animated.View style={[styles.dotsRow, { transform: [{ translateX: shakeAnim }] }]}>
            {Array.from({ length: PIN_LENGTH }).map((_, i) => (
              <View
                key={i}
                style={[styles.dot, pin.length > i && styles.dotFilled]}
              />
            ))}
          </Animated.View>
          {!!error && <Text style={styles.errorText}>{error}</Text>}
          <View style={styles.pad}>
            {DIGITS.map((d, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.key, d === '' && styles.keyEmpty]}
                onPress={() => d !== '' && handleDigit(d)}
                disabled={d === ''}
                activeOpacity={0.6}
              >
                {d === '⌫'
                  ? <Ionicons name="backspace-outline" size={24} color={COLORS.text} />
                  : <Text style={styles.keyText}>{d}</Text>
                }
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {showBiometric && (
        <TouchableOpacity style={styles.biometricBtn} onPress={handleBiometric}>
          <Ionicons name="finger-print" size={32} color={COLORS.primary} />
          <Text style={styles.biometricLabel}>Usar {biometricType}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  top: {
    alignItems: 'center',
    paddingTop: SPACING.xxl,
    gap: SPACING.sm,
  },
  appName: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  profileEmoji: { fontSize: 24 },
  profileName: {
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  lockLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    marginTop: SPACING.xs,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: SPACING.lg,
    marginVertical: SPACING.xl,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: 'transparent',
  },
  dotFilled: { backgroundColor: COLORS.primary },
  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  pad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 300,
    gap: SPACING.sm,
    justifyContent: 'center',
  },
  key: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyEmpty: { backgroundColor: 'transparent' },
  keyText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.xxl,
    fontWeight: '400',
  },
  biometricBtn: {
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.lg,
  },
  biometricLabel: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
});
