import React, { useCallback } from 'react';
import {
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
import ArtworkPlaceholder from '../components/ArtworkPlaceholder';
import { formatDuration } from '../utils/format';
import { COLORS, FONT_SIZES, RADIUS, SPACING } from '../theme';

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
    togglePlayPause,
    playNext,
    playPrev,
    toggleShuffle,
    toggleRepeat,
    seekTo,
  } = usePlayer();
  const { getDisplayInfo } = useLibrary();

  const { title, artist } = currentSong
    ? getDisplayInfo(currentSong)
    : { title: '', artist: '' };

  const progress = duration > 0 ? position / duration : 0;

  const handleSeek = useCallback(
    (pct: number) => {
      seekTo(Math.floor(pct * duration));
    },
    [duration, seekTo]
  );

  const repeatIcon =
    repeatMode === 'one' ? 'repeat-sharp' :
    repeatMode === 'all' ? 'repeat' : 'repeat';

  const repeatColor =
    repeatMode === 'none' ? COLORS.textSecondary : COLORS.primary;

  if (!currentSong) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <Text style={styles.empty}>Nenhuma música a tocar</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#1a1200', '#0D0D0D']}
      style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom + SPACING.md }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-down" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>A TOCAR</Text>
        <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="ellipsis-horizontal" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Artwork */}
      <View style={styles.artworkContainer}>
        <ArtworkPlaceholder
          title={title}
          artist={artist}
          size={280}
          borderRadius={RADIUS.lg}
        />
      </View>

      {/* Song info */}
      <View style={styles.songInfo}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        <Text style={styles.artist} numberOfLines={1}>{artist}</Text>
      </View>

      {/* Progress */}
      <View style={styles.progressSection}>
        <SeekBar progress={progress} onSeek={handleSeek} />
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

        <TouchableOpacity onPress={playPrev} style={styles.mainBtn}>
          <Ionicons name="play-skip-back" size={34} color={COLORS.text} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={togglePlayPause}
          style={styles.playBtn}
          activeOpacity={0.85}
        >
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={36}
            color={COLORS.background}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={playNext} style={styles.mainBtn}>
          <Ionicons name="play-skip-forward" size={34} color={COLORS.text} />
        </TouchableOpacity>

        <TouchableOpacity onPress={toggleRepeat} style={styles.sideBtn}>
          <Ionicons
            name={repeatMode === 'one' ? 'repeat-sharp' : 'repeat'}
            size={26}
            color={repeatColor}
          />
          {repeatMode === 'one' && (
            <Text style={styles.repeatOne}>1</Text>
          )}
          {repeatMode !== 'none' && repeatMode !== 'one' && <View style={styles.dot} />}
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

// Simple tap-to-seek bar
function SeekBar({ progress, onSeek }: { progress: number; onSeek: (pct: number) => void }) {
  return (
    <TouchableOpacity
      style={styles.seekBar}
      activeOpacity={1}
      onPress={(e) => {
        const x = e.nativeEvent.locationX;
        // We don't have layout width here easily, so use 80% of assumed width
        // A proper implementation would use onLayout
        onSeek(Math.min(1, Math.max(0, x / 300)));
      }}
    >
      <View style={styles.seekTrack}>
        <View style={[styles.seekFill, { width: `${progress * 100}%` }]} />
        <View style={[styles.seekThumb, { left: `${progress * 100}%` }]} />
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
  headerTitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  artworkContainer: {
    alignItems: 'center',
    marginTop: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  songInfo: {
    marginBottom: SPACING.lg,
    gap: SPACING.xs,
  },
  title: {
    color: COLORS.text,
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
  },
  artist: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
  },
  progressSection: {
    marginBottom: SPACING.lg,
  },
  seekBar: {
    paddingVertical: SPACING.sm,
  },
  seekTrack: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    position: 'relative',
  },
  seekFill: {
    height: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  seekThumb: {
    position: 'absolute',
    top: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.text,
    marginLeft: -8,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  },
  time: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.xs,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.sm,
  },
  sideBtn: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainBtn: {
    padding: SPACING.xs,
  },
  playBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.primary,
    marginTop: 3,
  },
  repeatOne: {
    position: 'absolute',
    bottom: -2,
    right: 0,
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '700',
  },
});
