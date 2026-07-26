import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useSecurity } from '../context/SecurityContext';
import { COLORS, FONT_SIZES, RADIUS, SPACING } from '../theme';

type SubView = 'main' | 'setupPin' | 'changePin';

export default function SecurityScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const {
    securityMode, biometricAvailable, biometricType,
    setupPin, enableBiometric, disableSecurity, changePin,
  } = useSecurity();

  const [view, setView] = useState<SubView>('main');
  const [pin1, setPin1] = useState('');
  const [pin2, setPin2] = useState('');
  const [oldPin, setOldPin] = useState('');
  const [loading, setLoading] = useState(false);

  const isPinActive = securityMode === 'pin' || securityMode === 'both';
  const isBiometricActive = securityMode === 'biometric' || securityMode === 'both';
  const isSecurityActive = securityMode !== 'none';

  const handleSetupPin = async () => {
    if (pin1.length < 4) {
      Alert.alert('PIN inválido', 'O PIN deve ter pelo menos 4 dígitos.');
      return;
    }
    if (pin1 !== pin2) {
      Alert.alert('PINs não coincidem', 'Os dois PINs introduzidos não são iguais.');
      return;
    }
    setLoading(true);
    await setupPin(pin1);
    setLoading(false);
    setPin1('');
    setPin2('');
    setView('main');
    Alert.alert('PIN ativado', 'O teu PIN foi configurado com sucesso.');
  };

  const handleChangePin = async () => {
    if (pin1.length < 4 || pin1 !== pin2) {
      Alert.alert('Erro', 'Verifica os PINs introduzidos.');
      return;
    }
    setLoading(true);
    const ok = await changePin(oldPin, pin1);
    setLoading(false);
    if (ok) {
      setOldPin(''); setPin1(''); setPin2('');
      setView('main');
      Alert.alert('PIN alterado', 'O teu PIN foi atualizado com sucesso.');
    } else {
      Alert.alert('PIN incorreto', 'O PIN atual introduzido está incorreto.');
    }
  };

  const handleToggleBiometric = async () => {
    if (isBiometricActive) {
      Alert.alert(
        'Desativar biometria',
        'Tens a certeza que queres desativar a autenticação biométrica?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Desativar',
            style: 'destructive',
            onPress: async () => {
              if (securityMode === 'biometric') await disableSecurity();
            },
          },
        ]
      );
    } else {
      const ok = await enableBiometric();
      if (!ok) Alert.alert('Falhou', 'Não foi possível ativar a autenticação biométrica.');
    }
  };

  const handleDisableAll = () => {
    Alert.alert(
      'Remover segurança',
      'Tens a certeza que queres remover toda a proteção da app?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover', style: 'destructive', onPress: disableSecurity },
      ]
    );
  };

  if (view === 'setupPin' || view === 'changePin') {
    const isChanging = view === 'changePin';
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { setView('main'); setPin1(''); setPin2(''); setOldPin(''); }}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isChanging ? 'Alterar PIN' : 'Configurar PIN'}</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.formContent}>
          <Ionicons name="lock-closed" size={56} color={COLORS.primary} style={{ alignSelf: 'center', marginBottom: SPACING.lg }} />

          {isChanging && (
            <>
              <Text style={styles.label}>PIN atual</Text>
              <TextInput
                style={styles.input}
                value={oldPin}
                onChangeText={setOldPin}
                secureTextEntry
                keyboardType="number-pad"
                maxLength={8}
                placeholder="PIN atual"
                placeholderTextColor={COLORS.textTertiary}
              />
            </>
          )}

          <Text style={styles.label}>Novo PIN (mínimo 4 dígitos)</Text>
          <TextInput
            style={styles.input}
            value={pin1}
            onChangeText={setPin1}
            secureTextEntry
            keyboardType="number-pad"
            maxLength={8}
            placeholder="Novo PIN"
            placeholderTextColor={COLORS.textTertiary}
          />

          <Text style={styles.label}>Confirmar PIN</Text>
          <TextInput
            style={styles.input}
            value={pin2}
            onChangeText={setPin2}
            secureTextEntry
            keyboardType="number-pad"
            maxLength={8}
            placeholder="Repete o PIN"
            placeholderTextColor={COLORS.textTertiary}
          />

          <TouchableOpacity
            style={[styles.saveBtn, loading && { opacity: 0.6 }]}
            onPress={isChanging ? handleChangePin : handleSetupPin}
            disabled={loading}
          >
            <Text style={styles.saveBtnText}>{isChanging ? 'Alterar PIN' : 'Ativar PIN'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Segurança</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.statusCard}>
          <Ionicons
            name={isSecurityActive ? 'shield-checkmark' : 'shield-outline'}
            size={40}
            color={isSecurityActive ? COLORS.success : COLORS.textSecondary}
          />
          <Text style={styles.statusTitle}>
            {isSecurityActive ? 'App protegida' : 'Sem proteção ativa'}
          </Text>
          <Text style={styles.statusDesc}>
            {isSecurityActive
              ? `Modo: ${securityMode === 'both' ? 'PIN + Biometria' : securityMode === 'pin' ? 'PIN' : biometricType}`
              : 'Ativa o PIN ou a biometria para proteger a tua app.'
            }
          </Text>
        </View>

        <SectionBlock title="PIN">
          <SettingRow
            icon="keypad"
            label={isPinActive ? 'PIN ativo' : 'Configurar PIN'}
            subtitle={isPinActive ? 'Toca para alterar o PIN' : 'Protege a app com um PIN numérico'}
            onPress={() => setView(isPinActive ? 'changePin' : 'setupPin')}
            rightEl={isPinActive ? <Ionicons name="checkmark-circle" size={20} color={COLORS.success} /> : undefined}
          />
        </SectionBlock>

        {biometricAvailable && (
          <SectionBlock title={biometricType}>
            <View style={styles.row}>
              <View style={styles.rowIcon}>
                <Ionicons name="finger-print" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>{`Usar ${biometricType}`}</Text>
                <Text style={styles.rowSub}>Desbloqueia com biometria do dispositivo</Text>
              </View>
              <Switch
                value={isBiometricActive}
                onValueChange={handleToggleBiometric}
                trackColor={{ false: COLORS.card, true: COLORS.primary }}
                thumbColor={COLORS.text}
              />
            </View>
          </SectionBlock>
        )}

        {isSecurityActive && (
          <SectionBlock title="Remover">
            <TouchableOpacity style={[styles.row, styles.destructiveRow]} onPress={handleDisableAll}>
              <View style={styles.rowIcon}>
                <Ionicons name="trash-outline" size={20} color={COLORS.error} />
              </View>
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, { color: COLORS.error }]}>Remover toda a proteção</Text>
                <Text style={styles.rowSub}>A app ficará acessível sem autenticação</Text>
              </View>
            </TouchableOpacity>
          </SectionBlock>
        )}
      </ScrollView>
    </View>
  );
}

function SectionBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

function SettingRow({ icon, label, subtitle, onPress, rightEl }: {
  icon: any; label: string; subtitle?: string; onPress: () => void; rightEl?: React.ReactNode;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={20} color={COLORS.primary} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        {subtitle && <Text style={styles.rowSub}>{subtitle}</Text>}
      </View>
      {rightEl ?? <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerTitle: { color: COLORS.text, fontSize: FONT_SIZES.md, fontWeight: '700' },
  statusCard: {
    margin: SPACING.md, padding: SPACING.lg, backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md, alignItems: 'center', gap: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.border,
  },
  statusTitle: { color: COLORS.text, fontSize: FONT_SIZES.md, fontWeight: '700' },
  statusDesc: { color: COLORS.textSecondary, fontSize: FONT_SIZES.sm, textAlign: 'center' },
  section: { marginBottom: SPACING.md },
  sectionTitle: {
    color: COLORS.textSecondary, fontSize: FONT_SIZES.xs, fontWeight: '700',
    letterSpacing: 1, textTransform: 'uppercase',
    paddingHorizontal: SPACING.md, marginBottom: SPACING.xs,
  },
  sectionContent: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: COLORS.border,
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  destructiveRow: {},
  rowIcon: {
    width: 36, height: 36, borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(245,166,35,0.12)', alignItems: 'center', justifyContent: 'center',
  },
  rowText: { flex: 1, gap: 2 },
  rowLabel: { color: COLORS.text, fontSize: FONT_SIZES.base, fontWeight: '500' },
  rowSub: { color: COLORS.textSecondary, fontSize: FONT_SIZES.xs },
  formContent: { padding: SPACING.md, gap: SPACING.sm },
  label: { color: COLORS.textSecondary, fontSize: FONT_SIZES.sm, fontWeight: '600' },
  input: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.sm,
    padding: SPACING.sm, color: COLORS.text, fontSize: FONT_SIZES.md,
    letterSpacing: 8, textAlign: 'center',
  },
  saveBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.full,
    padding: SPACING.md, alignItems: 'center', marginTop: SPACING.md,
  },
  saveBtnText: { color: COLORS.background, fontWeight: '700', fontSize: FONT_SIZES.base },
});
