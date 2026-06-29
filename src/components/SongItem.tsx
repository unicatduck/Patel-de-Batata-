import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Song } from '../types';
import { usePlayer } from '../context/PlayerContext';
import { useLibrary } from '../context/LibraryContext';
import { formatDuration } from '../utils/format';
import ArtworkPlaceholder from './ArtworkPlaceholder';
import { COLORS, FONT_SIZES, SPACING } from '../theme';

interface Props {
  song: Song;
  queue?: Song[];
  onLongPress?: (song: Song) => void;
  showDuration?: boolean;
  index?: number;
}

export default function SongItem({ song, queue, onLongPress, showDuration = true, index }: Props) {
  const { playSong, currentSong, isPlaying } = usePlayer();
  const { getDisplayInfo, isFavorite } = useLibrary();

  const { title, artist } = getDisplayInfo(song);
  const isActive = currentSong?.id === song.id;
  const isFav = isFavorite(song.id);

  const handlePress = () => {
    playSong(song, queue);
  };

  return (
    <TouchableOpacity
      style={[styles.container, isActive && styles.containerActive]}
      onPress={handlePress}
      onLongPress={() => onLongPress?.(song)}
      activeOpacity={0.7}
    >
      <ArtworkPlaceholder title={title} artist={artist} size={48} />

      <View style={styles.info}>
        <Text
          style={[styles.title, isActive && styles.titleActive]}
          numberOfLines={1}
        >
          {title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {artist}
        </Text>
      </View>

      <View style={styles.right}>
        {isFav && (
          <Ionicons name="heart" size={14} color="#FF4D6D" style={styles.favIcon} />
        )}
        {isActive && (
          <Ionicons
            name={isPlaying ? 'volume-high' : 'pause'}
            size={16}
            color={COLORS.primary}
            style={styles.playIcon}
          />
        )}
        {showDuration && (
          <Text style={styles.duration}>{formatDuration(song.duration)}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  containerActive: {
    backgroundColor: 'rgba(245, 166, 35, 0.08)',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: COLORS.text,
    fontSize: FONT_SIZES.base,
    fontWeight: '500',
  },
  titleActive: {
    color: COLORS.primary,
  },
  artist: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  favIcon: {
    marginRight: 2,
  },
  playIcon: {
    marginRight: 2,
  },
  duration: {
    color: COLORS.textTertiary,
    fontSize: FONT_SIZES.xs,
    minWidth: 36,
    textAlign: 'right',
  },
});
