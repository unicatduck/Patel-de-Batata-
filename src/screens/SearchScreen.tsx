import React, { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLibrary } from '../context/LibraryContext';
import SongItem from '../components/SongItem';
import { COLORS, FONT_SIZES, RADIUS, SPACING } from '../theme';

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const { searchSongs, songs } = useLibrary();
  const [query, setQuery] = useState('');

  const results = query.trim() ? searchSongs(query) : [];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Pesquisar</Text>

      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={COLORS.textSecondary} />
        <TextInput
          style={styles.input}
          placeholder="Músicas, artistas, álbuns…"
          placeholderTextColor={COLORS.textTertiary}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Ionicons
            name="close-circle"
            size={18}
            color={COLORS.textSecondary}
            onPress={() => setQuery('')}
          />
        )}
      </View>

      {query.trim() ? (
        <FlatList
          data={results}
          keyExtractor={s => s.id}
          renderItem={({ item }) => (
            <SongItem song={item} queue={results} />
          )}
          ListHeaderComponent={
            results.length > 0 ? (
              <Text style={styles.resultCount}>
                {results.length} resultado{results.length !== 1 ? 's' : ''}
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={48} color={COLORS.textTertiary} />
              <Text style={styles.emptyText}>Sem resultados para «{query}»</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        />
      ) : (
        <View style={styles.placeholder}>
          <Ionicons name="musical-note-outline" size={72} color={COLORS.textTertiary} />
          <Text style={styles.placeholderText}>
            Pesquisa por título, artista ou álbum
          </Text>
          <Text style={styles.placeholderSub}>
            {songs.length} músicas na biblioteca
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  title: {
    color: COLORS.text,
    fontSize: FONT_SIZES.xxl,
    fontWeight: '800',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    marginHorizontal: SPACING.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs + 2,
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: FONT_SIZES.base,
  },
  resultCount: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.xs,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xs,
  },
  empty: {
    alignItems: 'center',
    gap: SPACING.sm,
    paddingTop: SPACING.xl,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.base,
    textAlign: 'center',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    paddingBottom: 80,
  },
  placeholderText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
  },
  placeholderSub: {
    color: COLORS.textTertiary,
    fontSize: FONT_SIZES.sm,
  },
});
