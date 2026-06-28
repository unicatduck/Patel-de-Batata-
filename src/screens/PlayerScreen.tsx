import React, { useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  LayoutChangeEvent,
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
        <TouchableOpacity
          style={styles.headerBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="ellipsis-horizontal" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Artwork */}
      <View style={styles.artworkContainer}>
        <View style={styles.artworkShadow}>
          <ArtworkPlaceholder
            title={title}
            artist={artist}
            size={290}
            borderRadius={RADIUS.lg + 4}
          />
        </View>
      </View>

      {/* Song info */}
      <View style={styles.songInfo}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        <Text style={styles.artistLabel} numberOfLines={1}>{artist}</Text>
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

        <TouchableOpacity onPress={playPrev} style={styles.skipBtn}>
          <Ionicons name="play-skip-back" size={32} color={COLORS.text} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={togglePlayPause}
          style={styles.playBtn}
          activeOpacity={0.82}
        >
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
          {repeatMode === 'one' && (
            <Text style={styles.repeatOne}>1</Text>
          )}
          {repeatMode === 'all' && <View style={styles.dot} />}
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

function SeekBar({ progress, onSeek }: { progress: number; onSeek: (pct: number) => void }) {
  const widthRef = useRef(1);

  return (
    <TouchableOpacity
      style={styles.seekBar}
      activeOpacity={1}
      onLayout={(e: LayoutChangeEvent) => { widthRef.current = e.nativeEvent.layout.width; }}
      onPress={(e) => {
        const x = e.nativeEvent.locationX;
        onSeek(Math.min(1, Math.max(0, x / widthRef.current)));
      }}
    >
      <View style={styles.seekTrack}>
        <View style={[styles.seekFill, { width: `${progress * 100}%` }]} />
        <View style={[styles.seekThumb, { left: `${Math.min(progress * 100, 100)}%` as any }]} />
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
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  artworkShadow: {
    elevation: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    borderRadius: RADIUS.lg + 4,
  },
  songInfo: {
    marginBottom: SPACING.lg,
    gap: SPACING.xs,
    alignItems: 'flex-start',
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
    marginBottom: SPACING.xl,
  },
  seekBar: {
    paddingVertical: SPACING.sm,
  },
  seekTrack: {
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 3,
    position: 'relative',
  },
  seekFill: {
    height: 5,
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  seekThumb: {
    position: 'absolute',
    top: -6,
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: COLORS.text,
    marginLeft: -8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
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
});
