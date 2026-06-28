import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useLibrary } from '../context/LibraryContext';
import { usePlayer } from '../context/PlayerContext';
import SongItem from '../components/SongItem';
import ArtworkPlaceholder from '../components/ArtworkPlaceholder';
import { RootStackParamList } from '../types';
import { COLORS, FONT_SIZES, RADIUS, SPACING } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Tab = 'songs' | 'playlists' | 'artists';

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const {
    songs, playlists, isLoading, scanLibrary, getArtists, getDisplayInfo,
    createArtistPlaylists,
  } = useLibrary();
  const { playQueue } = usePlayer();

  const [tab, setTab] = useState<Tab>('songs');

  const artists = getArtists();
  const userPlaylists = playlists.filter(p => !p.isAutoPlaylist);
  const autoPlaylists = playlists.filter(p => p.isAutoPlaylist);

  const handleScan = async () => {
    await scanLibrary();
    await createArtistPlaylists();
  };

  const TabBar = () => (
    <View style={styles.tabBar}>
      {(['songs', 'playlists', 'artists'] as Tab[]).map(t => (
        <TouchableOpacity
          key={t}
          onPress={() => setTab(t)}
          style={[styles.tab, tab === t && styles.tabActive]}
        >
          <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
            {t === 'songs' ? 'Músicas' : t === 'playlists' ? 'Playlists' : 'Artistas'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Biblioteca</Text>
        <TouchableOpacity onPress={handleScan} style={styles.scanBtn} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Ionicons name="refresh" size={22} color={COLORS.primary} />
          )}
        </TouchableOpacity>
      </View>

      {/* Action buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('CreatePlaylist', {})}
        >
          <Ionicons name="add" size={18} color={COLORS.primary} />
          <Text style={styles.actionText}>Nova Playlist</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={handleScan}>
          <Ionicons name="musical-notes" size={18} color={COLORS.primary} />
          <Text style={styles.actionText}>Procurar músicas</Text>
        </TouchableOpacity>
      </View>

      <TabBar />

      {tab === 'songs' && (
        <FlatList
          data={songs}
          keyExtractor={s => s.id}
          renderItem={({ item }) => (
            <SongItem song={item} queue={songs} />
          )}
          ListHeaderComponent={
            songs.length > 0 ? (
              <TouchableOpacity
                style={styles.playAllRow}
                onPress={() => playQueue(songs, 0)}
              >
                <Ionicons name="play-circle" size={44} color={COLORS.primary} />
                <View>
                  <Text style={styles.playAllTitle}>Reproduzir tudo</Text>
                  <Text style={styles.playAllSub}>{songs.length} músicas</Text>
                </View>
              </TouchableOpacity>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon="musical-notes-outline"
              message={isLoading ? 'A carregar músicas…' : 'Nenhuma música encontrada.\nToca em «Procurar músicas».'}
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        />
      )}

      {tab === 'playlists' && (
        <FlatList
          data={[...userPlaylists, ...autoPlaylists]}
          keyExtractor={p => p.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.playlistRow}
              onPress={() => navigation.navigate('PlaylistDetail', { playlistId: item.id })}
            >
              <View style={[styles.playlistIcon, item.isAutoPlaylist && styles.autoIcon]}>
                <Ionicons
                  name={item.isAutoPlaylist ? 'person' : 'musical-notes'}
                  size={22}
                  color={COLORS.primary}
                />
              </View>
              <View style={styles.playlistMeta}>
                <Text style={styles.playlistName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.playlistSub}>
                  {item.isAutoPlaylist ? 'Automática · ' : ''}{item.songIds.length} músicas
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <EmptyState
              icon="list-outline"
              message="Ainda não tens playlists.\nToca em «Nova Playlist» para criar uma,\nou em «Procurar músicas» para criar automaticamente por artista."
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        />
      )}

      {tab === 'artists' && (
        <FlatList
          data={artists}
          keyExtractor={a => a}
          renderItem={({ item: artist }) => (
            <TouchableOpacity
              style={styles.artistRow}
              onPress={() => navigation.navigate('ArtistDetail', { artist })}
            >
              <ArtworkPlaceholder title={artist} artist={artist} size={50} borderRadius={25} />
              <Text style={styles.artistName} numberOfLines={1}>{artist}</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <EmptyState icon="person-outline" message="Nenhum artista encontrado." />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        />
      )}
    </View>
  );
}

function EmptyState({ icon, message }: { icon: any; message: string }) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={52} color={COLORS.textTertiary} />
      <Text style={styles.emptyText}>{message}</Text>
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
    paddingVertical: SPACING.md,
  },
  title: {
    color: COLORS.text,
    fontSize: FONT_SIZES.xxl,
    fontWeight: '800',
  },
  scanBtn: {
    padding: SPACING.xs,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs + 2,
  },
  actionText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  tab: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.card,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  tabTextActive: {
    color: COLORS.background,
  },
  playAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  playAllTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
  },
  playAllSub: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.xs,
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  playlistIcon: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoIcon: {
    backgroundColor: 'rgba(245,166,35,0.12)',
  },
  playlistMeta: {
    flex: 1,
    gap: 2,
  },
  playlistName: {
    color: COLORS.text,
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },
  playlistSub: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.xs,
  },
  artistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  artistName: {
    flex: 1,
    color: COLORS.text,
    fontSize: FONT_SIZES.base,
    fontWeight: '500',
  },
  empty: {
    alignItems: 'center',
    gap: SPACING.md,
    paddingTop: SPACING.xxl,
    paddingHorizontal: SPACING.xl,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.base,
    textAlign: 'center',
    lineHeight: 22,
  },
});
