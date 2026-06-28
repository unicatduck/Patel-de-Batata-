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
      activeOpacity={0.95}
    >
      {/* Progress bar at top */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <View style={styles.row}>
        <ArtworkPlaceholder title={title} artist={artist} size={40} borderRadius={RADIUS.sm} />

        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <Text style={styles.artist} numberOfLines={1}>{artist}</Text>
        </View>

        <TouchableOpacity
          style={styles.btn}
          onPress={e => { e.stopPropagation(); togglePlayPause(); }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={24}
            color={COLORS.text}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btn}
          onPress={e => { e.stopPropagation(); playNext(); }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="play-skip-forward" size={22} color={COLORS.text} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    borderRadius: 0,
    overflow: 'hidden',
  },
  progressBar: {
    height: 2,
    backgroundColor: COLORS.border,
  },
  progressFill: {
    height: 2,
    backgroundColor: COLORS.primary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  info: {
    flex: 1,
    gap: 1,
  },
  title: {
    color: COLORS.text,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  artist: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.xs,
  },
  btn: {
    padding: SPACING.xs,
  },
});
