import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useLibrary } from '../context/LibraryContext';
import { usePlayer } from '../context/PlayerContext';
import SongItem from '../components/SongItem';
import { RootStackParamList, Song } from '../types';
import { COLORS, FONT_SIZES, RADIUS, SPACING } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PlaylistDetail'>;

export default function PlaylistDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<Props['route']>();
  const { playlistId } = route.params;

  const { getPlaylistById, getSongById, deletePlaylist, removeSongFromPlaylist } = useLibrary();
  const { playQueue, playSong } = usePlayer();

  const playlist = getPlaylistById(playlistId);

  if (!playlist) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.notFound}>Playlist não encontrada</Text>
      </View>
    );
  }

  const songs: Song[] = playlist.songIds
    .map(id => getSongById(id))
    .filter(Boolean) as Song[];

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Playlist',
      `Tens a certeza que queres eliminar «${playlist.name}»?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deletePlaylist(playlistId);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleRemoveSong = (songId: string) => {
    Alert.alert(
      'Remover da Playlist',
      'Remover esta música da playlist?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => removeSongFromPlaylist(playlistId, songId),
        },
      ]
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={['#1a1200', '#0D0D0D']} style={styles.hero}>
        <View style={styles.heroTopRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          {!playlist.isAutoPlaylist && (
            <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={22} color={COLORS.error} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.playlistIconLarge}>
          <Ionicons
            name={playlist.isAutoPlaylist ? 'person' : 'musical-notes'}
            size={44}
            color={COLORS.primary}
          />
        </View>

        <Text style={styles.playlistName}>{playlist.name}</Text>
        {playlist.description && (
          <Text style={styles.playlistDesc}>{playlist.description}</Text>
        )}
        <Text style={styles.songCount}>{songs.length} músicas</Text>

        {songs.length > 0 && (
          <View style={styles.heroActions}>
            <TouchableOpacity
              style={styles.playBtn}
              onPress={() => playQueue(songs, 0)}
            >
              <Ionicons name="play" size={20} color={COLORS.background} />
              <Text style={styles.playBtnText}>Reproduzir</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.shuffleBtn}
              onPress={() => playSong(songs[Math.floor(Math.random() * songs.length)], songs)}
            >
              <Ionicons name="shuffle" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>

      <FlatList
        data={songs}
        keyExtractor={s => s.id}
        renderItem={({ item }) => (
          <SongItem
            song={item}
            queue={songs}
            onLongPress={!playlist.isAutoPlaylist ? s => handleRemoveSong(s.id) : undefined}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="musical-notes-outline" size={48} color={COLORS.textTertiary} />
            <Text style={styles.emptyText}>Sem músicas nesta playlist</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  notFound: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 100,
    fontSize: FONT_SIZES.md,
  },
  hero: {
    alignItems: 'center',
    paddingBottom: SPACING.lg,
    gap: SPACING.xs,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    justifyContent: 'space-between',
    padding: SPACING.sm,
  },
  backBtn: {
    padding: SPACING.xs,
  },
  deleteBtn: {
    padding: SPACING.xs,
  },
  playlistIconLarge: {
    width: 110,
    height: 110,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  playlistName: {
    color: COLORS.text,
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    textAlign: 'center',
    paddingHorizontal: SPACING.md,
  },
  playlistDesc: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
  },
  songCount: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
  },
  heroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  playBtnText: {
    color: COLORS.background,
    fontWeight: '700',
    fontSize: FONT_SIZES.sm,
  },
  shuffleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    gap: SPACING.md,
    paddingTop: SPACING.xxl,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.base,
  },
});
