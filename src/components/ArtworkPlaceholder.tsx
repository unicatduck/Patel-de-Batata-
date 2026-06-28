import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
  // Generate a consistent color from the first character
  const hue = ((letter.charCodeAt(0) * 47) % 360);
  const bg = `hsl(${hue}, 55%, 28%)`;

  const computedFontSize = fontSize ?? Math.round(size * 0.38);

  return (
    <View
      style={[
        styles.container,
        { width: size, height: size, borderRadius, backgroundColor: bg },
      ]}
    >
      <Text style={[styles.letter, { fontSize: computedFontSize }]}>{letter}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    color: COLORS.text,
    fontWeight: '700',
  },
});
