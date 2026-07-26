import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth, AVATAR_EMOJIS } from '../context/AuthContext';
import { useLibrary } from '../context/LibraryContext';
import { COLORS, FONT_SIZES, RADIUS, SPACING } from '../theme';

type SubView = 'main' | 'create' | 'edit';

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { profile, createProfile, updateProfile, deleteProfile } = useAuth();
  const { songs, playlists, favorites } = useLibrary();

  const [view, setView] = useState<SubView>('main');
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(AVATAR_EMOJIS[0]);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Nome obrigatório', 'Introduz um nome para o teu perfil.');
      return;
    }
    await createProfile(name.trim(), emoji);
    setView('main');
  };

  const handleUpdate = async () => {
    if (!name.trim()) return;
    await updateProfile({ name: name.trim(), emoji });
    setView('main');
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar perfil',
      'Tens a certeza? As tuas preferências locais serão mantidas.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => { deleteProfile(); setView('main'); } },
      ]
    );
  };

  const openEdit = () => {
    if (!profile) return;
    setName(profile.name);
    setEmoji(profile.emoji);
    setView('edit');
  };

  if (view === 'create' || view === 'edit') {
    const isEdit = view === 'edit';
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { setView('main'); setName(''); }}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEdit ? 'Editar Perfil' : 'Criar Perfil'}</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.formContent}>
          <View style={styles.emojiPreview}>
            <Text style={styles.emojiLarge}>{emoji}</Text>
          </View>

          <Text style={styles.label}>Escolhe um avatar</Text>
          <View style={styles.emojiGrid}>
            {AVATAR_EMOJIS.map(e => (
              <TouchableOpacity
                key={e}
                style={[styles.emojiBtn, emoji === e && styles.emojiBtnActive]}
                onPress={() => setEmoji(e)}
              >
                <Text style={styles.emojiOption}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Nome</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="O teu nome"
            placeholderTextColor={COLORS.textTertiary}
            autoFocus
            maxLength={30}
          />

          <TouchableOpacity
            style={styles.saveBtn}
            onPress={isEdit ? handleUpdate : handleCreate}
          >
            <Text style={styles.saveBtnText}>{isEdit ? 'Guardar' : 'Criar Perfil'}</Text>
          </TouchableOpacity>

          {isEdit && (
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={18} color={COLORS.error} />
              <Text style={styles.deleteBtnText}>Eliminar perfil</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Conta</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.noProfileContent}>
          <Text style={styles.noProfileEmoji}>🦆</Text>
          <Text style={styles.noProfileTitle}>Sem perfil</Text>
          <Text style={styles.noProfileDesc}>
            Cria um perfil para personalizar a tua experiência e guardar as tuas preferências.
          </Text>

          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => { setName(''); setEmoji(AVATAR_EMOJIS[0]); setView('create'); }}
          >
            <Ionicons name="person-add" size={20} color={COLORS.background} />
            <Text style={styles.createBtnText}>Criar Perfil</Text>
          </TouchableOpacity>

          <View style={styles.googleNote}>
            <Ionicons name="logo-google" size={18} color={COLORS.textTertiary} />
            <Text style={styles.googleNoteText}>
              Início de sessão com Google disponível em breve
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Conta</Text>
        <TouchableOpacity onPress={openEdit}>
          <Ionicons name="create-outline" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.profileCard}>
          <Text style={styles.profileCardEmoji}>{profile.emoji}</Text>
          <Text style={styles.profileCardName}>{profile.name}</Text>
          <Text style={styles.profileCardSince}>
            Membro desde {new Date(profile.createdAt).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <StatBox label="Músicas" value={songs.length} icon="musical-notes" />
          <StatBox label="Playlists" value={playlists.filter(p => !p.isAutoPlaylist).length} icon="list" />
          <StatBox label="Favoritos" value={favorites.size} icon="heart" />
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={18} color={COLORS.textSecondary} />
          <Text style={styles.infoText}>
            As tuas músicas, playlists e preferências são guardadas localmente neste dispositivo.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function StatBox({ label, value, icon }: { label: string; value: number; icon: any }) {
  return (
    <View style={styles.statBox}>
      <Ionicons name={icon} size={20} color={COLORS.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
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
  noProfileContent: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: SPACING.xl, gap: SPACING.md,
  },
  noProfileEmoji: { fontSize: 60 },
  noProfileTitle: { color: COLORS.text, fontSize: FONT_SIZES.xl, fontWeight: '800' },
  noProfileDesc: {
    color: COLORS.textSecondary, fontSize: FONT_SIZES.sm,
    textAlign: 'center', lineHeight: 22,
  },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, marginTop: SPACING.sm,
  },
  createBtnText: { color: COLORS.background, fontWeight: '700', fontSize: FONT_SIZES.base },
  googleNote: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginTop: SPACING.md,
  },
  googleNoteText: { color: COLORS.textTertiary, fontSize: FONT_SIZES.xs },
  profileCard: {
    alignItems: 'center', padding: SPACING.xl, gap: SPACING.sm,
  },
  profileCardEmoji: { fontSize: 64 },
  profileCardName: { color: COLORS.text, fontSize: FONT_SIZES.xxl, fontWeight: '800' },
  profileCardSince: { color: COLORS.textSecondary, fontSize: FONT_SIZES.sm },
  statsRow: {
    flexDirection: 'row', gap: SPACING.sm,
    marginHorizontal: SPACING.md, marginBottom: SPACING.md,
  },
  statBox: {
    flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    padding: SPACING.md, alignItems: 'center', gap: SPACING.xs,
    borderWidth: 1, borderColor: COLORS.border,
  },
  statValue: { color: COLORS.text, fontSize: FONT_SIZES.xl, fontWeight: '800' },
  statLabel: { color: COLORS.textSecondary, fontSize: FONT_SIZES.xs },
  infoCard: {
    flexDirection: 'row', gap: SPACING.sm, alignItems: 'flex-start',
    margin: SPACING.md, padding: SPACING.md,
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
  },
  infoText: {
    flex: 1, color: COLORS.textSecondary, fontSize: FONT_SIZES.xs, lineHeight: 18,
  },
  formContent: { padding: SPACING.md, gap: SPACING.sm },
  emojiPreview: {
    alignSelf: 'center', width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  emojiLarge: { fontSize: 40 },
  emojiGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm,
    justifyContent: 'center', marginBottom: SPACING.sm,
  },
  emojiBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center',
  },
  emojiBtnActive: {
    borderWidth: 2, borderColor: COLORS.primary, backgroundColor: 'rgba(245,166,35,0.15)',
  },
  emojiOption: { fontSize: 24 },
  label: { color: COLORS.textSecondary, fontSize: FONT_SIZES.sm, fontWeight: '600' },
  input: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.sm,
    padding: SPACING.sm, color: COLORS.text, fontSize: FONT_SIZES.base,
  },
  saveBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.full,
    padding: SPACING.md, alignItems: 'center', marginTop: SPACING.md,
  },
  saveBtnText: { color: COLORS.background, fontWeight: '700', fontSize: FONT_SIZES.base },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    alignSelf: 'center', marginTop: SPACING.lg, padding: SPACING.sm,
  },
  deleteBtnText: { color: COLORS.error, fontSize: FONT_SIZES.sm },
});
