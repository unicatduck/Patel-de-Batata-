import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { usePlayer } from '../context/PlayerContext';
import { useLibrary } from '../context/LibraryContext';
import ArtworkPlaceholder from './ArtworkPlaceholder';
import { RootStackParamList } from '../types';
import { COLORS, FONT_SIZES, RADIUS, SPACING } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function MiniPlayer() {
  const navigation = useNavigation<Nav>();
  const { currentSong, isPlaying, togglePlayPause, playNext, position, duration } = usePlayer();
  const { getDisplayInfo } = useLibrary();

  if (!currentSong) return null;

  const { title, artist } = getDisplayInfo(currentSong);
  const progress = duration > 0 ? position / duration : 0;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => navigation.navigate('Player')}
      activeOpacity={0.92}
    >
      <ArtworkPlaceholder title={title} artist={artist} size={44} borderRadius={RADIUS.md} />

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <Text style={styles.artist} numberOfLines={1}>{artist}</Text>
      </View>

      <TouchableOpacity
        style={styles.playBtn}
        onPress={e => { e.stopPropagation(); togglePlayPause(); }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons
          name={isPlaying ? 'pause' : 'play'}
          size={20}
          color={COLORS.background}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.nextBtn}
        onPress={e => { e.stopPropagation(); playNext(); }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="play-skip-forward" size={20} color={COLORS.textSecondary} />
      </TouchableOpacity>

      {/* Progress bar at bottom */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.sm,
    marginBottom: SPACING.xs,
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245,166,35,0.15)',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: COLORS.text,
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },
  artist: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.xs,
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtn: {
    padding: SPACING.xs,
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(245,166,35,0.15)',
    borderBottomLeftRadius: RADIUS.lg,
    borderBottomRightRadius: RADIUS.lg,
  },
  progressFill: {
    height: 3,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: RADIUS.lg,
  },
});
