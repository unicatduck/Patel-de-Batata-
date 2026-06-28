import React from 'react';
import {
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
import ArtworkPlaceholder from '../components/ArtworkPlaceholder';
import { RootStackParamList } from '../types';
import { COLORS, FONT_SIZES, RADIUS, SPACING } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ArtistDetail'>;

export default function ArtistScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<Props['route']>();
  const { artist } = route.params;

  const { getSongsByArtist, createPlaylist, playlists } = useLibrary();
  const { playQueue, playSong } = usePlayer();

  const songs = getSongsByArtist(artist);

  const hasPlaylist = playlists.some(
    p => p.isAutoPlaylist && p.autoType === 'artist' && p.autoValue === artist
  );

  const handleSavePlaylist = async () => {
    if (!hasPlaylist) {
      await createPlaylist(artist, songs.map(s => s.id));
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={['#1a1200', '#0D0D0D']} style={styles.heroGradient}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        <ArtworkPlaceholder title={artist} artist={artist} size={100} borderRadius={50} />
        <Text style={styles.artistName}>{artist}</Text>
        <Text style={styles.songCount}>{songs.length} músicas</Text>

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

          {!hasPlaylist && (
            <TouchableOpacity style={styles.saveBtn} onPress={handleSavePlaylist}>
              <Ionicons name="bookmark-outline" size={20} color={COLORS.text} />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <FlatList
        data={songs}
        keyExtractor={s => s.id}
        renderItem={({ item }) => (
          <SongItem song={item} queue={songs} />
        )}
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
  heroGradient: {
    alignItems: 'center',
    paddingBottom: SPACING.lg,
    paddingTop: SPACING.sm,
    gap: SPACING.xs,
  },
  backBtn: {
    alignSelf: 'flex-start',
    padding: SPACING.sm,
    marginLeft: SPACING.xs,
  },
  artistName: {
    color: COLORS.text,
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    textAlign: 'center',
    paddingHorizontal: SPACING.md,
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
  saveBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
