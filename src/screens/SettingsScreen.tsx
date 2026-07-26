import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useLibrary } from '../context/LibraryContext';
import ArtworkPlaceholder from '../components/ArtworkPlaceholder';
import { buildCleanFilename, formatDuration } from '../utils/format';
import { RootStackParamList, Song } from '../types';
import { COLORS, FONT_SIZES, RADIUS, SPACING } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Section = 'main' | 'rename' | 'sources';

const AUDIO_FORMATS = 'MP3 · FLAC · AAC · M4A · OGG · WAV · OPUS · WMA · AMR';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const {
    songs,
    getSongsNeedingRename,
    renameSong,
    getDisplayInfo,
    renameMap,
    createArtistPlaylists,
    scanLibrary,
    playlists,
    showAllAudio,
    setShowAllAudio,
    customSongs,
    importMusicFiles,
    removeCustomSong,
  } = useLibrary();

  const [activeSection, setActiveSection] = useState<Section>('main');
  const [importing, setImporting] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editArtist, setEditArtist] = useState('');

  const songsToRename = getSongsNeedingRename();
  const autoPlaylists = playlists.filter(p => p.isAutoPlaylist).length;

  const handleEditSong = (song: Song) => {
    const { title, artist } = getDisplayInfo(song);
    setEditingSong(song);
    setEditTitle(title);
    setEditArtist(artist);
  };

  const handleSaveRename = async () => {
    if (!editingSong || !editTitle.trim()) return;
    await renameSong(editingSong.id, editTitle.trim(), editArtist.trim() || undefined);
    setEditingSong(null);
  };

  const handleAutoRenameAll = async () => {
    const toRename = getSongsNeedingRename();
    for (const song of toRename) {
      const suggested = buildCleanFilename(song.title, song.artist, song.filename);
      const cleanTitle = suggested.replace(/\.[^.]+$/, '').replace(/^.+ - /, '');
      await renameSong(song.id, cleanTitle, song.artist !== 'Desconhecido' ? song.artist : undefined);
    }
    Alert.alert('Concluído', `${toRename.length} músicas renomeadas com sucesso.`);
  };

  const handleCreateArtistPlaylists = async () => {
    await createArtistPlaylists();
    Alert.alert('Concluído', 'Playlists de artistas criadas automaticamente.');
  };

  const handleRescan = async () => {
    await scanLibrary();
    Alert.alert('Concluído', 'Biblioteca atualizada.');
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      await importMusicFiles();
    } finally {
      setImporting(false);
    }
  };

  const handleRemoveCustom = (song: Song) => {
    Alert.alert(
      'Remover ficheiro',
      `Remover "${song.title}" da biblioteca?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover', style: 'destructive', onPress: () => removeCustomSong(song.id) },
      ]
    );
  };

  if (activeSection === 'sources') {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setActiveSection('main')}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ficheiros Importados</Text>
          <TouchableOpacity onPress={handleImport} disabled={importing}>
            {importing
              ? <ActivityIndicator size="small" color={COLORS.primary} />
              : <Ionicons name="add" size={26} color={COLORS.primary} />
            }
          </TouchableOpacity>
        </View>

        {customSongs.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cloud-download-outline" size={56} color={COLORS.textTertiary} />
            <Text style={styles.emptyTitle}>Nenhum ficheiro importado</Text>
            <Text style={styles.emptySubtitle}>
              Usa o botão + para importar músicas do Google Drive, OneDrive, armazenamento local, etc.
            </Text>
            <Text style={styles.formatsLabel}>{AUDIO_FORMATS}</Text>
          </View>
        ) : (
          <FlatList
            data={customSongs}
            keyExtractor={s => s.id}
            renderItem={({ item }) => {
              const { title, artist } = getDisplayInfo(item);
              return (
                <View style={styles.importedRow}>
                  <ArtworkPlaceholder title={title} artist={artist} size={44} />
                  <View style={styles.renameInfo}>
                    <Text style={styles.renameTitle} numberOfLines={1}>{title}</Text>
                    <Text style={styles.renameArtist} numberOfLines={1}>
                      {artist}{item.duration > 0 ? ` · ${formatDuration(item.duration)}` : ''}
                    </Text>
                    <Text style={styles.renameFilename} numberOfLines={1}>{item.filename}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemoveCustom(item)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              );
            }}
            ListHeaderComponent={
              <View style={styles.sourcesHeader}>
                <Text style={styles.sourcesHeaderText}>
                  {customSongs.length} ficheiro(s) importado(s)
                </Text>
                <Text style={styles.formatsLabel}>{AUDIO_FORMATS}</Text>
              </View>
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120 }}
          />
        )}
      </View>
    );
  }

  if (editingSong) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setEditingSong(null)}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Renomear Música</Text>
          <TouchableOpacity onPress={handleSaveRename}>
            <Text style={styles.saveBtn}>Guardar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.renameForm}>
          <ArtworkPlaceholder
            title={editTitle}
            artist={editArtist}
            size={80}
            borderRadius={RADIUS.md}
          />
          <Text style={styles.originalFilename} numberOfLines={1}>
            Ficheiro: {editingSong.filename}
          </Text>

          <Text style={styles.label}>Título</Text>
          <TextInput
            style={styles.input}
            value={editTitle}
            onChangeText={setEditTitle}
            placeholder="Título da música"
            placeholderTextColor={COLORS.textTertiary}
          />

          <Text style={styles.label}>Artista</Text>
          <TextInput
            style={styles.input}
            value={editArtist}
            onChangeText={setEditArtist}
            placeholder="Nome do artista"
            placeholderTextColor={COLORS.textTertiary}
          />

          <Text style={styles.previewLabel}>Pré-visualização</Text>
          <View style={styles.preview}>
            <Text style={styles.previewTitle}>{editTitle || '—'}</Text>
            <Text style={styles.previewArtist}>{editArtist || 'Desconhecido'}</Text>
          </View>
        </View>
      </View>
    );
  }

  if (activeSection === 'rename') {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setActiveSection('main')}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Renomear Músicas</Text>
          {songsToRename.length > 0 && (
            <TouchableOpacity onPress={handleAutoRenameAll}>
              <Text style={styles.saveBtn}>Auto-renomear</Text>
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={songs}
          keyExtractor={s => s.id}
          renderItem={({ item }) => {
            const { title, artist } = getDisplayInfo(item);
            const isRenamed = !!renameMap[item.id];
            return (
              <TouchableOpacity
                style={styles.renameRow}
                onPress={() => handleEditSong(item)}
              >
                <ArtworkPlaceholder title={title} artist={artist} size={44} />
                <View style={styles.renameInfo}>
                  <Text style={styles.renameTitle} numberOfLines={1}>{title}</Text>
                  <Text style={styles.renameArtist} numberOfLines={1}>{artist}</Text>
                  <Text style={styles.renameFilename} numberOfLines={1}>
                    {item.filename}
                  </Text>
                </View>
                {isRenamed ? (
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                ) : (
                  <Ionicons name="create-outline" size={20} color={COLORS.textSecondary} />
                )}
              </TouchableOpacity>
            );
          }}
          ListHeaderComponent={
            songsToRename.length > 0 ? (
              <View style={styles.renameHeader}>
                <Ionicons name="warning-outline" size={18} color={COLORS.primary} />
                <Text style={styles.renameHeaderText}>
                  {songsToRename.length} músicas com nomes a melhorar
                </Text>
              </View>
            ) : (
              <View style={styles.renameHeader}>
                <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                <Text style={[styles.renameHeaderText, { color: COLORS.success }]}>
                  Todos os nomes parecem corretos!
                </Text>
              </View>
            )
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.mainContent, { paddingTop: insets.top }]}
    >
      <Text style={styles.title}>Definições</Text>

      <SectionBlock title="Biblioteca">
        <SettingRow
          icon="refresh"
          label="Atualizar biblioteca"
          subtitle="Procura novas músicas no dispositivo"
          onPress={handleRescan}
        />
        <SettingRow
          icon="person-add"
          label="Criar playlists por artista"
          subtitle={`${autoPlaylists} playlists automáticas já criadas`}
          onPress={handleCreateArtistPlaylists}
        />
      </SectionBlock>

      <SectionBlock title="Músicas">
        <SettingRow
          icon="create"
          label="Renomear músicas"
          subtitle={`${songsToRename.length} músicas com nomes a melhorar`}
          onPress={() => setActiveSection('rename')}
          badge={songsToRename.length > 0 ? songsToRename.length : undefined}
        />
        <SettingToggle
          icon="headset"
          label="Incluir todos os áudios"
          subtitle="Mostra tons de chamada, notificações e clipes curtos"
          value={showAllAudio}
          onToggle={setShowAllAudio}
        />
      </SectionBlock>

      <SectionBlock title="Fontes de Música">
        <SettingRow
          icon="cloud-download"
          label="Importar ficheiros de áudio"
          subtitle={`Google Drive, OneDrive, armazenamento local e mais`}
          onPress={handleImport}
          badge={importing ? undefined : undefined}
        />
        <SettingRow
          icon="folder-open"
          label="Gerir ficheiros importados"
          subtitle={customSongs.length > 0 ? `${customSongs.length} ficheiro(s) importado(s)` : 'Nenhum ficheiro importado ainda'}
          onPress={() => setActiveSection('sources')}
          badge={customSongs.length > 0 ? customSongs.length : undefined}
        />
        <View style={styles.formatsRow}>
          <Ionicons name="musical-notes" size={14} color={COLORS.textTertiary} />
          <Text style={styles.formatsInline}>Formatos: {AUDIO_FORMATS}</Text>
        </View>
      </SectionBlock>

      <SectionBlock title="Perfil">
        <SettingRow
          icon="person-circle"
          label="Conta"
          subtitle="Cria ou edita o teu perfil local"
          onPress={() => navigation.navigate('Account')}
        />
        <SettingRow
          icon="shield-checkmark"
          label="Segurança"
          subtitle="PIN e autenticação biométrica"
          onPress={() => navigation.navigate('Security')}
        />
      </SectionBlock>

      <SectionBlock title="Sobre">
        <View style={styles.aboutBox}>
          <Text style={styles.appName}>🥔 Patel de Batata</Text>
          <Text style={styles.appVersion}>Versão 1.0.0</Text>
          <Text style={styles.appDesc}>
            O teu leitor de música com shuffle verdadeiro e playlists automáticas por artista.
          </Text>
          <Text style={styles.appStat}>{songs.length} músicas · {playlists.length} playlists</Text>
        </View>
      </SectionBlock>
    </ScrollView>
  );
}

function SectionBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.block}>
      <Text style={styles.blockTitle}>{title}</Text>
      <View style={styles.blockContent}>{children}</View>
    </View>
  );
}

function SettingRow({
  icon,
  label,
  subtitle,
  onPress,
  badge,
}: {
  icon: any;
  label: string;
  subtitle?: string;
  onPress: () => void;
  badge?: number;
}) {
  return (
    <TouchableOpacity style={styles.settingRow} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={20} color={COLORS.primary} />
      </View>
      <View style={styles.settingText}>
        <Text style={styles.settingLabel}>{label}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {badge != null && badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
    </TouchableOpacity>
  );
}

function SettingToggle({
  icon,
  label,
  subtitle,
  value,
  onToggle,
}: {
  icon: any;
  label: string;
  subtitle?: string;
  value: boolean;
  onToggle: (val: boolean) => void;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={20} color={COLORS.primary} />
      </View>
      <View style={styles.settingText}>
        <Text style={styles.settingLabel}>{label}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: COLORS.card, true: COLORS.primary }}
        thumbColor={COLORS.text}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  mainContent: {
    paddingBottom: 120,
  },
  title: {
    color: COLORS.text,
    fontSize: FONT_SIZES.xxl,
    fontWeight: '800',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
  saveBtn: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
  },
  block: {
    marginBottom: SPACING.lg,
  },
  blockTitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xs,
  },
  blockContent: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(245,166,35,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingText: {
    flex: 1,
    gap: 2,
  },
  settingLabel: {
    color: COLORS.text,
    fontSize: FONT_SIZES.base,
    fontWeight: '500',
  },
  settingSubtitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.xs,
  },
  badge: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: COLORS.background,
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
  aboutBox: {
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  appName: {
    color: COLORS.text,
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
  },
  appVersion: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
  },
  appDesc: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    lineHeight: 20,
    marginTop: SPACING.xs,
  },
  appStat: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    marginTop: SPACING.xs,
  },
  // Sources section
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    gap: SPACING.sm,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  formatsLabel: {
    color: COLORS.textTertiary,
    fontSize: FONT_SIZES.xs,
    textAlign: 'center',
    marginTop: SPACING.xs,
    letterSpacing: 0.5,
  },
  sourcesHeader: {
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  sourcesHeaderText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  importedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    gap: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  formatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  formatsInline: {
    color: COLORS.textTertiary,
    fontSize: FONT_SIZES.xs,
    flex: 1,
  },
  // Rename section
  renameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    padding: SPACING.md,
    backgroundColor: COLORS.card,
    margin: SPACING.md,
    borderRadius: RADIUS.md,
  },
  renameHeaderText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    flex: 1,
  },
  renameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    gap: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  renameInfo: {
    flex: 1,
    gap: 1,
  },
  renameTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  renameArtist: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.xs,
  },
  renameFilename: {
    color: COLORS.textTertiary,
    fontSize: 10,
  },
  // Edit form
  renameForm: {
    padding: SPACING.md,
    gap: SPACING.sm,
    alignItems: 'center',
  },
  originalFilename: {
    color: COLORS.textTertiary,
    fontSize: FONT_SIZES.xs,
    alignSelf: 'stretch',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    alignSelf: 'flex-start',
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    color: COLORS.text,
    fontSize: FONT_SIZES.base,
    alignSelf: 'stretch',
  },
  previewLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    alignSelf: 'flex-start',
    marginTop: SPACING.xs,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  preview: {
    alignSelf: 'stretch',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  previewTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
  previewArtist: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
  },
});
