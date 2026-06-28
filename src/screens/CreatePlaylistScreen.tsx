import React, { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useLibrary } from '../context/LibraryContext';
import { useLibrary as useLib } from '../context/LibraryContext';
import ArtworkPlaceholder from '../components/ArtworkPlaceholder';
import { RootStackParamList, Song } from '../types';
import { COLORS, FONT_SIZES, RADIUS, SPACING } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'CreatePlaylist'>;

export default function CreatePlaylistScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<Props['route']>();

  const { songs, createPlaylist, getDisplayInfo } = useLibrary();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selected, setSelected] = useState<Set<string>>(
    new Set(route.params?.initialSongIds ?? [])
  );
  const [search, setSearch] = useState('');

  const filtered = search
    ? songs.filter(s => {
        const { title, artist } = getDisplayInfo(s);
        const q = search.toLowerCase();
        return title.toLowerCase().includes(q) || artist.toLowerCase().includes(q);
      })
    : songs;

  const toggleSong = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    await createPlaylist(name.trim(), Array.from(selected), description.trim() || undefined);
    navigation.goBack();
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={26} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Nova Playlist</Text>
        <TouchableOpacity
          onPress={handleCreate}
          disabled={!name.trim()}
          style={[styles.createBtn, !name.trim() && styles.createBtnDisabled]}
        >
          <Text style={styles.createBtnText}>Criar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.nameInput}
          placeholder="Nome da playlist"
          placeholderTextColor={COLORS.textTertiary}
          value={name}
          onChangeText={setName}
          maxLength={80}
        />
        <TextInput
          style={styles.descInput}
          placeholder="Descrição (opcional)"
          placeholderTextColor={COLORS.textTertiary}
          value={description}
          onChangeText={setDescription}
          maxLength={200}
          multiline
        />
      </View>

      <View style={styles.songSection}>
        <View style={styles.songSectionHeader}>
          <Text style={styles.sectionTitle}>
            Adicionar músicas ({selected.size} selecionadas)
          </Text>
        </View>

        <View style={styles.searchRow}>
          <Ionicons name="search" size={16} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Filtrar músicas…"
            placeholderTextColor={COLORS.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={s => s.id}
          renderItem={({ item }) => {
            const { title, artist } = getDisplayInfo(item);
            const isSelected = selected.has(item.id);
            return (
              <TouchableOpacity
                style={[styles.songRow, isSelected && styles.songRowSelected]}
                onPress={() => toggleSong(item.id)}
                activeOpacity={0.7}
              >
                <ArtworkPlaceholder title={title} artist={artist} size={44} />
                <View style={styles.songInfo}>
                  <Text style={styles.songTitle} numberOfLines={1}>{title}</Text>
                  <Text style={styles.songArtist} numberOfLines={1}>{artist}</Text>
                </View>
                <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                  {isSelected && <Ionicons name="checkmark" size={14} color={COLORS.background} />}
                </View>
              </TouchableOpacity>
            );
          }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
  createBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  createBtnDisabled: {
    opacity: 0.4,
  },
  createBtnText: {
    color: COLORS.background,
    fontWeight: '700',
    fontSize: FONT_SIZES.sm,
  },
  form: {
    padding: SPACING.md,
    gap: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  nameInput: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  descInput: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    color: COLORS.text,
    fontSize: FONT_SIZES.sm,
    minHeight: 60,
  },
  songSection: {
    flex: 1,
  },
  songSectionHeader: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.sm,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    gap: SPACING.xs,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: FONT_SIZES.sm,
  },
  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    gap: SPACING.sm,
  },
  songRowSelected: {
    backgroundColor: 'rgba(245,166,35,0.08)',
  },
  songInfo: {
    flex: 1,
    gap: 2,
  },
  songTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  songArtist: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.xs,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
});
