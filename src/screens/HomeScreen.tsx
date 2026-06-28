import React from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useLibrary } from '../context/LibraryContext';
import { usePlayer } from '../context/PlayerContext';
import ArtworkPlaceholder from '../components/ArtworkPlaceholder';
import { RootStackParamList } from '../types';
import { COLORS, FONT_SIZES, RADIUS, SPACING } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { songs, playlists, recentlyPlayed, getDisplayInfo, getSongById } = useLibrary();
  const { playSong, playQueue } = usePlayer();

  const recentSongs = recentlyPlayed
    .slice(0, 10)
    .map(id => getSongById(id))
    .filter(Boolean) as typeof songs;

  const userPlaylists = playlists.filter(p => !p.isAutoPlaylist);
  const artistPlaylists = playlists.filter(p => p.isAutoPlaylist && p.autoType === 'artist');

  const handlePlayAll = () => {
    if (songs.length > 0) playQueue(songs, 0);
  };

  const handleShuffleAll = () => {
    if (songs.length > 0) {
      const idx = Math.floor(Math.random() * songs.length);
      playSong(songs[idx], songs);
    }
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Amber gradient header */}
      <LinearGradient
        colors={['rgba(245,166,35,0.28)', 'rgba(245,166,35,0.06)', 'transparent']}
        style={[styles.headerGradient, { paddingTop: insets.top + SPACING.sm }]}
      >
        <Text style={styles.greeting}>Boa música! 🥔</Text>
        <Text style={styles.headline}>Patel de Batata</Text>

        {/* Quick actions */}
        <View style={styles.quickRow}>
          <TouchableOpacity style={styles.quickBtn} onPress={handlePlayAll}>
            <Ionicons name="play" size={20} color={COLORS.background} />
            <Text style={styles.quickBtnText}>Reproduzir tudo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickBtn, styles.quickBtnSecondary]} onPress={handleShuffleAll}>
            <Ionicons name="shuffle" size={20} color={COLORS.primary} />
            <Text style={[styles.quickBtnText, { color: COLORS.primary }]}>Aleatório</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Recently played */}
      {recentSongs.length > 0 && (
        <Section title="Ouvido Recentemente">
          <FlatList
            horizontal
            data={recentSongs}
            keyExtractor={s => s.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: SPACING.sm, paddingHorizontal: SPACING.md }}
            renderItem={({ item }) => {
              const { title, artist } = getDisplayInfo(item);
              return (
                <TouchableOpacity
                  style={styles.recentCard}
                  onPress={() => playSong(item, recentSongs)}
                >
                  <ArtworkPlaceholder title={title} artist={artist} size={80} borderRadius={RADIUS.md} />
                  <Text style={styles.recentTitle} numberOfLines={1}>{title}</Text>
                  <Text style={styles.recentArtist} numberOfLines={1}>{artist}</Text>
                </TouchableOpacity>
              );
            }}
          />
        </Section>
      )}

      {/* Playlists */}
      {userPlaylists.length > 0 && (
        <Section
          title="As Minhas Playlists"
          onMore={() => navigation.navigate('MainTabs' as any)}
        >
          {userPlaylists.slice(0, 4).map(pl => (
            <TouchableOpacity
              key={pl.id}
              style={styles.playlistRow}
              onPress={() => navigation.navigate('PlaylistDetail', { playlistId: pl.id })}
            >
              <View style={styles.playlistIcon}>
                <Ionicons name="musical-notes" size={22} color={COLORS.primary} />
              </View>
              <View style={styles.playlistInfo}>
                <Text style={styles.playlistName} numberOfLines={1}>{pl.name}</Text>
                <Text style={styles.playlistCount}>{pl.songIds.length} músicas</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
            </TouchableOpacity>
          ))}
        </Section>
      )}

      {/* Artist playlists */}
      {artistPlaylists.length > 0 && (
        <Section title="Artistas">
          <FlatList
            horizontal
            data={artistPlaylists.slice(0, 10)}
            keyExtractor={p => p.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: SPACING.sm, paddingHorizontal: SPACING.md }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.artistCard}
                onPress={() => navigation.navigate('ArtistDetail', { artist: item.autoValue! })}
              >
                <ArtworkPlaceholder
                  title={item.name}
                  artist={item.name}
                  size={80}
                  borderRadius={40}
                />
                <Text style={styles.artistName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.artistCount}>{item.songIds.length} músicas</Text>
              </TouchableOpacity>
            )}
          />
        </Section>
      )}

      {/* Empty state */}
      {songs.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyDuck}>🥔🎧</Text>
          <Text style={styles.emptyTitle}>Sem músicas encontradas</Text>
          <Text style={styles.emptyText}>
            Vai a Biblioteca → toca em «Procurar músicas» para carregar a tua coleção.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

function Section({
  title,
  children,
  onMore,
}: {
  title: string;
  children: React.ReactNode;
  onMore?: () => void;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {onMore && (
          <TouchableOpacity onPress={onMore}>
            <Text style={styles.sectionMore}>Ver tudo</Text>
          </TouchableOpacity>
        )}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingBottom: SPACING.xxl + 80,
  },
  headerGradient: {
    paddingBottom: SPACING.lg,
    marginBottom: SPACING.xs,
  },
  greeting: {
    color: COLORS.primaryLight,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    paddingHorizontal: SPACING.md,
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  headline: {
    color: COLORS.text,
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '800',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  quickRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  quickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.sm + 4,
    elevation: 6,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  quickBtnSecondary: {
    backgroundColor: 'rgba(245,166,35,0.12)',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    elevation: 0,
    shadowOpacity: 0,
  },
  quickBtnText: {
    color: COLORS.background,
    fontWeight: '700',
    fontSize: FONT_SIZES.sm,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
  sectionMore: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.sm,
  },
  recentCard: {
    width: 110,
    gap: SPACING.xs,
  },
  recentTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  recentArtist: {
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
    width: 48,
    height: 48,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playlistInfo: {
    flex: 1,
    gap: 2,
  },
  playlistName: {
    color: COLORS.text,
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },
  playlistCount: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.xs,
  },
  artistCard: {
    width: 100,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  artistName: {
    color: COLORS.text,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
  artistCount: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.xs,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: SPACING.xxl,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },
  emptyDuck: {
    fontSize: 56,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.base,
    textAlign: 'center',
    lineHeight: 22,
  },
});
