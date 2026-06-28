import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS } from '../theme';

interface Props {
  title: string;
  artist: string;
  size?: number;
  borderRadius?: number;
  fontSize?: number;
}

export default function ArtworkPlaceholder({
  title,
  artist,
  size = 56,
  borderRadius = RADIUS.sm,
  fontSize,
}: Props) {
  const letter = title?.[0]?.toUpperCase() ?? artist?.[0]?.toUpperCase() ?? '?';
  // Warm hues only (reds → oranges → yellows), matching the icon palette
  const hue = ((letter.charCodeAt(0) * 53) % 80);
  const bg = `hsl(${hue}, 72%, 30%)`;
  const accent = `hsl(${hue}, 80%, 55%)`;

  const computedFontSize = fontSize ?? Math.round(size * 0.36);
  const noteSize = Math.round(size * 0.28);

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius, backgroundColor: bg }]}>
      <Text style={[styles.letter, { fontSize: computedFontSize, color: accent }]}>{letter}</Text>
      <View style={[styles.note, { bottom: size * 0.05, right: size * 0.06 }]}>
        <Ionicons name="musical-note" size={noteSize} color={`${accent}99`} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  letter: {
    fontWeight: '800',
  },
  note: {
    position: 'absolute',
  },
});
