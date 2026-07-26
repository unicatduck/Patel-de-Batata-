import React, { useCallback, useRef } from 'react';
import {
  Alert,
  Image,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { usePlayer } from '../context/PlayerContext';
import { useLibrary } from '../context/LibraryContext';
import { formatDuration } from '../utils/format';
import { COLORS, FONT_SIZES, RADIUS, SPACING } from '../theme';

// Duck images for each player state
const DUCK_IMAGES = {
  playing:  require('../../assets/duck-playing.jpg'),
  paused:   require('../../assets/duck-paused.jpg'),
  favorite: require('../../assets/duck-favorite.jpg'),
  repeat:   require('../../assets/duck-repeat.jpg'),
  loud:     require('../../assets/duck-loud.jpg'),
} as const;

function getDuckImage(isPlaying: boolean, isFav: boolean, repeatMode: string, volume: number) {
  if (!isPlaying) return DUCK_IMAGES.paused;
  if (isFav)     return DUCK_IMAGES.favorite;
  if (volume > 0.75) return DUCK_IMAGES.loud;
  if (repeatMode !== 'none') return DUCK_IMAGES.repeat;
  return DUCK_IMAGES.playing;
}

export default function PlayerScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const {
    currentSong,
    isPlaying,
    isShuffle,
    repeatMode,
    position,
    duration,
    volume,
    togglePlayPause,
    playNext,
    playPrev,
    toggleShuffle,
    toggleRepeat,
    seekTo,
    setVolume,
  } = usePlayer();
  const { getDisplayInfo, isFavorite, toggleFavorite, removeSongFromLibrary } = useLibrary();

  const { title, artist } = currentSong
    ? getDisplayInfo(currentSong)
    : { title: '', artist: '' };

  const isFav = currentSong ? isFavorite(currentSong.id) : false;
  const progress = duration > 0 ? position / duration : 0;
  const duckImage = getDuckImage(isPlaying, isFav, repeatMode, volume);

  const handleSeek = useCallback(
    (pct: number) => seekTo(Math.floor(pct * duration)),
    [duration, seekTo]
  );

  const handleOptions = useCallback(() => {
    if (!currentSong) return;
    Alert.alert(
      title,
      artist,
      [
        {
          text: 'Eliminar da biblioteca',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Eliminar música',
              `Remover "${title}" da biblioteca? Esta ação não pode ser desfeita.`,
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Eliminar',
                  style: 'destructive',
                  onPress: async () => {
                    await removeSongFromLibrary(currentSong.id);
                    playNext();
                  },
                },
              ]
            );
          },
        },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  }, [currentSong, title, artist, removeSongFromLibrary, playNext]);

  if (!currentSong) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <Text style={styles.empty}>Nenhuma música a tocar</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['rgba(245,166,35,0.35)', 'rgba(245,166,35,0.08)', '#0D0D0D', '#0D0D0D']}
      locations={[0, 0.28, 0.55, 1]}
      style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom + SPACING.lg }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-down" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerSub}>A TOCAR</Text>
          <Text style={styles.headerArtist} numberOfLines={1}>{artist}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => currentSong && toggleFavorite(currentSong.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isFav ? 'heart' : 'heart-outline'}
              size={24}
              color={isFav ? '#FF4D6D' : COLORS.text}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleOptions}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="ellipsis-vertical" size={22} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Duck artwork */}
      <View style={styles.artworkContainer}>
        <View style={styles.artworkShadow}>
          <Image source={duckImage} style={styles.duckImage} resizeMode="cover" />
        </View>
      </View>

      {/* Song info */}
      <View style={styles.songInfo}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        <Text style={styles.artistLabel} numberOfLines={1}>{artist}</Text>
      </View>

      {/* Seek bar */}
      <View style={styles.progressSection}>
        <SliderBar value={progress} onSeek={handleSeek} accentColor={COLORS.primary} />
        <View style={styles.timeRow}>
          <Text style={styles.time}>{formatDuration(position)}</Text>
          <Text style={styles.time}>{formatDuration(duration)}</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity onPress={toggleShuffle} style={styles.sideBtn}>
          <Ionicons
            name="shuffle"
            size={26}
            color={isShuffle ? COLORS.primary : COLORS.textSecondary}
          />
          {isShuffle && <View style={styles.dot} />}
        </TouchableOpacity>

        <TouchableOpacity onPress={playPrev} style={styles.skipBtn}>
          <Ionicons name="play-skip-back" size={32} color={COLORS.text} />
        </TouchableOpacity>

        <TouchableOpacity onPress={togglePlayPause} style={styles.playBtn} activeOpacity={0.82}>
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={38}
            color={COLORS.background}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={playNext} style={styles.skipBtn}>
          <Ionicons name="play-skip-forward" size={32} color={COLORS.text} />
        </TouchableOpacity>

        <TouchableOpacity onPress={toggleRepeat} style={styles.sideBtn}>
          <Ionicons
            name={repeatMode === 'one' ? 'repeat-sharp' : 'repeat'}
            size={26}
            color={repeatMode !== 'none' ? COLORS.primary : COLORS.textSecondary}
          />
          {repeatMode === 'one' && <Text style={styles.repeatOne}>1</Text>}
          {repeatMode === 'all' && <View style={styles.dot} />}
        </TouchableOpacity>
      </View>

      {/* Volume */}
      <View style={styles.volumeRow}>
        <Ionicons
          name={volume === 0 ? 'volume-mute' : volume < 0.4 ? 'volume-low' : 'volume-high'}
          size={18}
          color={COLORS.textSecondary}
        />
        <View style={styles.volumeSlider}>
          <SliderBar value={volume} onSeek={setVolume} accentColor={COLORS.textSecondary} thin />
        </View>
        <Ionicons name="volume-high" size={18} color={volume > 0.75 ? COLORS.primary : COLORS.textSecondary} />
      </View>
    </LinearGradient>
  );
}

function SliderBar({
  value,
  onSeek,
  accentColor,
  thin,
}: {
  value: number;
  onSeek: (v: number) => void;
  accentColor: string;
  thin?: boolean;
}) {
  const widthRef = useRef(1);
  const trackH = thin ? 3 : 5;
  const thumbSize = thin ? 12 : 17;

  return (
    <TouchableOpacity
      style={{ paddingVertical: SPACING.sm }}
      activeOpacity={1}
      onLayout={(e: LayoutChangeEvent) => { widthRef.current = e.nativeEvent.layout.width; }}
      onPress={(e) => {
        const x = e.nativeEvent.locationX;
        onSeek(Math.min(1, Math.max(0, x / widthRef.current)));
      }}
    >
      <View style={[styles.seekTrack, { height: trackH, borderRadius: trackH / 2 }]}>
        <View
          style={[
            styles.seekFill,
            { width: `${Math.min(value * 100, 100)}%`, height: trackH, borderRadius: trackH / 2, backgroundColor: accentColor },
          ]}
        />
        <View
          style={[
            styles.seekThumb,
            {
              left: `${Math.min(value * 100, 100)}%` as any,
              width: thumbSize,
              height: thumbSize,
              borderRadius: thumbSize / 2,
              marginLeft: -(thumbSize / 2),
              top: -(thumbSize / 2 - trackH / 2),
            },
          ]}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.lg,
  },
  empty: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 100,
    fontSize: FONT_SIZES.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
  },
  headerBtn: {
    width: 40,
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    width: 64,
    justifyContent: 'flex-end',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  headerSub: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    letterSpacing: 2,
  },
  headerArtist: {
    color: COLORS.text,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    opacity: 0.8,
  },
  artworkContainer: {
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  artworkShadow: {
    elevation: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    borderRadius: RADIUS.lg + 4,
  },
  duckImage: {
    width: 270,
    height: 270,
    borderRadius: RADIUS.lg + 4,
  },
  songInfo: {
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  title: {
    color: COLORS.text,
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    lineHeight: 30,
  },
  artistLabel: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },
  progressSection: {
    marginBottom: SPACING.md,
  },
  seekTrack: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    position: 'relative',
  },
  seekFill: {},
  seekThumb: {
    position: 'absolute',
    backgroundColor: COLORS.text,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -SPACING.xs,
  },
  time: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  sideBtn: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  skipBtn: {
    padding: SPACING.xs,
  },
  playBtn: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 16,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.primary,
  },
  repeatOne: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '700',
  },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  volumeSlider: {
    flex: 1,
  },
});
