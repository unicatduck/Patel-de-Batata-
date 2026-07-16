import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Alert } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Playlist, RenameEntry, Song } from '../types';
import { parseFilename, stripY2Mate } from '../utils/format';
import { generateId, KEYS, loadJSON, saveJSON } from '../utils/storage';

interface LibraryContextType {
  songs: Song[];
  playlists: Playlist[];
  renameMap: Record<string, RenameEntry>;
  recentlyPlayed: string[];
  playHistory: string[];
  isLoading: boolean;
  permissionGranted: boolean;

  showAllAudio: boolean;
  setShowAllAudio: (val: boolean) => Promise<void>;

  favorites: Set<string>;
  toggleFavorite: (songId: string) => Promise<void>;
  isFavorite: (songId: string) => boolean;

  scanLibrary: () => Promise<void>;
  getDisplayInfo: (song: Song) => { title: string; artist: string };
  getSongById: (id: string) => Song | undefined;
  getPlaylistById: (id: string) => Playlist | undefined;
  getArtists: () => string[];
  getSongsByArtist: (artist: string) => Song[];
  searchSongs: (query: string) => Song[];

  createPlaylist: (name: string, songIds?: string[], description?: string) => Promise<Playlist>;
  deletePlaylist: (id: string) => Promise<void>;
  updatePlaylist: (id: string, updates: Partial<Pick<Playlist, 'name' | 'description'>>) => Promise<void>;
  addSongsToPlaylist: (playlistId: string, songIds: string[]) => Promise<void>;
  removeSongFromPlaylist: (playlistId: string, songId: string) => Promise<void>;
  createArtistPlaylists: () => Promise<void>;

  renameSong: (songId: string, displayTitle: string, displayArtist?: string) => Promise<void>;
  getSongsNeedingRename: () => Song[];

  addToRecentlyPlayed: (songId: string) => Promise<void>;
  addToPlayHistory: (songId: string) => Promise<void>;

  customSongs: Song[];
  importMusicFiles: () => Promise<void>;
  removeCustomSong: (id: string) => Promise<void>;
}

const LibraryContext = createContext<LibraryContextType | null>(null);

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [scannedSongs, setScannedSongs] = useState<Song[]>([]);
  const [customSongs, setCustomSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [renameMap, setRenameMap] = useState<Record<string, RenameEntry>>({});
  const [recentlyPlayed, setRecentlyPlayed] = useState<string[]>([]);
  const [playHistory, setPlayHistory] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [showAllAudio, setShowAllAudioState] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const songsRef = useRef<Song[]>([]);
  const customSongsRef = useRef<Song[]>([]);
  const showAllAudioRef = useRef(false);

  // Merged view: custom songs first (by import order), then scanned songs
  const songs = [
    ...customSongs,
    ...scannedSongs.filter(s => !customSongs.some(c => c.id === s.id)),
  ];

  useEffect(() => {
    songsRef.current = songs;
  }, [songs]);
  useEffect(() => {
    customSongsRef.current = customSongs;
  }, [customSongs]);

  // Bootstrap: load stored data then scan
  useEffect(() => {
    const init = async () => {
      const [storedPlaylists, storedRenameMap, storedRecent, storedHistory, storedShowAll, storedFavs, storedCustom] = await Promise.all([
        loadJSON<Playlist[]>(KEYS.PLAYLISTS, []),
        loadJSON<Record<string, RenameEntry>>(KEYS.RENAME_MAP, {}),
        loadJSON<string[]>(KEYS.RECENTLY_PLAYED, []),
        loadJSON<string[]>(KEYS.PLAY_HISTORY, []),
        loadJSON<boolean>(KEYS.SHOW_ALL_AUDIO, false),
        loadJSON<string[]>(KEYS.FAVORITES, []),
        loadJSON<Song[]>(KEYS.CUSTOM_SONGS, []),
      ]);
      setPlaylists(storedPlaylists);
      setRenameMap(storedRenameMap);
      setRecentlyPlayed(storedRecent);
      setPlayHistory(storedHistory);
      showAllAudioRef.current = storedShowAll;
      setShowAllAudioState(storedShowAll);
      setFavorites(new Set(storedFavs));
      setCustomSongs(storedCustom);
      customSongsRef.current = storedCustom;
      await scanLibrary();
    };
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scanLibrary = useCallback(async () => {
    setIsLoading(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        setPermissionGranted(false);
        setIsLoading(false);
        return;
      }
      setPermissionGranted(true);

      const result: Song[] = [];
      let after: string | undefined;
      let hasMore = true;

      while (hasMore) {
        const page = await MediaLibrary.getAssetsAsync({
          mediaType: MediaLibrary.MediaType.audio,
          first: 200,
          after,
          sortBy: MediaLibrary.SortBy.default,
        });

        for (const asset of page.assets) {
          const raw = asset as any;
          const durationMs = asset.duration ? asset.duration * 1000 : 0;

          // Music-only filter (skip when showAllAudio is enabled)
          if (!showAllAudioRef.current) {
            // Skip very short clips (ringtones, notifications < 30 s)
            if (durationMs > 0 && durationMs < 30_000) continue;
            // Skip files in system audio folders
            const albumName: string = (raw.album ?? '').toLowerCase();
            const systemFolders = ['ringtones', 'notifications', 'alarms', 'toques', 'notificações', 'alarmes'];
            if (systemFolders.some(f => albumName.includes(f))) continue;
          }

          const parsed = parseFilename(asset.filename);
          // expo-media-library may expose title/artist on Android
          const rawTitle: string = raw.title ?? parsed.title;
          const rawArtist: string = raw.artist ?? parsed.artist;
          const album: string = raw.album ?? 'Desconhecido';

          // Strip y2mate prefix from metadata title if present
          const title = stripY2Mate(rawTitle);
          const artist = rawArtist;

          result.push({
            id: asset.id,
            filename: asset.filename,
            uri: asset.uri,
            title,
            artist,
            album,
            duration: durationMs,
          });
        }

        hasMore = page.hasNextPage;
        after = page.endCursor;
      }

      // Sort by artist then title
      result.sort((a, b) => {
        const ac = a.artist.localeCompare(b.artist);
        return ac !== 0 ? ac : a.title.localeCompare(b.title);
      });

      setScannedSongs(result);
    } catch (e) {
      console.warn('Scan error:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleFavorite = useCallback(async (songId: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(songId)) next.delete(songId);
      else next.add(songId);
      saveJSON(KEYS.FAVORITES, Array.from(next));
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (songId: string) => favorites.has(songId),
    [favorites]
  );

  const setShowAllAudio = useCallback(async (val: boolean) => {
    showAllAudioRef.current = val;
    setShowAllAudioState(val);
    await saveJSON(KEYS.SHOW_ALL_AUDIO, val);
    // Re-scan so the new filter is applied immediately
    await scanLibrary();
  }, [scanLibrary]);

  const getDisplayInfo = useCallback(
    (song: Song): { title: string; artist: string } => {
      const entry = renameMap[song.id];
      // Strip y2mate prefix from display title (catches metadata not caught at scan time)
      const title = stripY2Mate(entry?.displayTitle ?? song.title);
      const artist = entry?.displayArtist ?? song.artist;
      return { title, artist };
    },
    [renameMap]
  );

  const getSongById = useCallback(
    (id: string) => songsRef.current.find(s => s.id === id),
    []
  );

  const getPlaylistById = useCallback(
    (id: string) => playlists.find(p => p.id === id),
    [playlists]
  );

  const getArtists = useCallback((): string[] => {
    const artistSet = new Set<string>();
    for (const song of songsRef.current) {
      const { artist } = getDisplayInfo(song);
      if (artist && artist !== 'Desconhecido') artistSet.add(artist);
    }
    return Array.from(artistSet).sort((a, b) => a.localeCompare(b));
  }, [getDisplayInfo]);

  const getSongsByArtist = useCallback(
    (artist: string): Song[] =>
      songsRef.current.filter(s => getDisplayInfo(s).artist === artist),
    [getDisplayInfo]
  );

  const searchSongs = useCallback(
    (query: string): Song[] => {
      const q = query.toLowerCase().trim();
      if (!q) return songsRef.current;
      return songsRef.current.filter(s => {
        const { title, artist } = getDisplayInfo(s);
        return (
          title.toLowerCase().includes(q) ||
          artist.toLowerCase().includes(q) ||
          s.album.toLowerCase().includes(q)
        );
      });
    },
    [getDisplayInfo]
  );

  // --- Playlists ---

  const savePlaylists = useCallback(async (updated: Playlist[]) => {
    setPlaylists(updated);
    await saveJSON(KEYS.PLAYLISTS, updated);
  }, []);

  const createPlaylist = useCallback(
    async (name: string, songIds: string[] = [], description?: string): Promise<Playlist> => {
      const now = Date.now();
      const playlist: Playlist = {
        id: generateId(),
        name,
        description,
        songIds,
        isAutoPlaylist: false,
        createdAt: now,
        updatedAt: now,
      };
      await savePlaylists([...playlists, playlist]);
      return playlist;
    },
    [playlists, savePlaylists]
  );

  const deletePlaylist = useCallback(
    async (id: string) => {
      await savePlaylists(playlists.filter(p => p.id !== id));
    },
    [playlists, savePlaylists]
  );

  const updatePlaylist = useCallback(
    async (id: string, updates: Partial<Pick<Playlist, 'name' | 'description'>>) => {
      await savePlaylists(
        playlists.map(p =>
          p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p
        )
      );
    },
    [playlists, savePlaylists]
  );

  const addSongsToPlaylist = useCallback(
    async (playlistId: string, songIds: string[]) => {
      await savePlaylists(
        playlists.map(p => {
          if (p.id !== playlistId) return p;
          const existing = new Set(p.songIds);
          const merged = [...p.songIds, ...songIds.filter(id => !existing.has(id))];
          return { ...p, songIds: merged, updatedAt: Date.now() };
        })
      );
    },
    [playlists, savePlaylists]
  );

  const removeSongFromPlaylist = useCallback(
    async (playlistId: string, songId: string) => {
      await savePlaylists(
        playlists.map(p =>
          p.id === playlistId
            ? { ...p, songIds: p.songIds.filter(id => id !== songId), updatedAt: Date.now() }
            : p
        )
      );
    },
    [playlists, savePlaylists]
  );

  /**
   * Creates one auto-playlist per artist (skipping artists that already have one).
   */
  const createArtistPlaylists = useCallback(async () => {
    const artists = getArtists();
    const existing = new Set(
      playlists
        .filter(p => p.isAutoPlaylist && p.autoType === 'artist')
        .map(p => p.autoValue)
    );

    const newPlaylists: Playlist[] = [];
    const now = Date.now();

    for (const artist of artists) {
      if (existing.has(artist)) continue;
      const artistSongs = getSongsByArtist(artist);
      if (artistSongs.length === 0) continue;
      newPlaylists.push({
        id: generateId(),
        name: artist,
        songIds: artistSongs.map(s => s.id),
        isAutoPlaylist: true,
        autoType: 'artist',
        autoValue: artist,
        createdAt: now,
        updatedAt: now,
      });
    }

    if (newPlaylists.length > 0) {
      await savePlaylists([...playlists, ...newPlaylists]);
    }
  }, [getArtists, getSongsByArtist, playlists, savePlaylists]);

  // --- Rename ---

  const renameSong = useCallback(
    async (songId: string, displayTitle: string, displayArtist?: string) => {
      const updated = {
        ...renameMap,
        [songId]: { songId, displayTitle, displayArtist },
      };
      setRenameMap(updated);
      await saveJSON(KEYS.RENAME_MAP, updated);
    },
    [renameMap]
  );

  const getSongsNeedingRename = useCallback((): Song[] => {
    return songsRef.current.filter(song => {
      if (renameMap[song.id]) return false; // already renamed
      const name = song.filename.replace(/\.[^.]+$/, '');
      // Messy if has leading numbers, underscores, or metadata differs
      if (/^\d+[\s._-]/.test(name)) return true;
      if (name.includes('_')) return true;
      if (song.title !== name && name !== song.title) {
        // Title from metadata differs from filename
        return true;
      }
      return false;
    });
  }, [renameMap]);

  // --- Custom imported files ---

  const IMPORT_DIR = `${FileSystem.documentDirectory}imported_music/`;

  const importMusicFiles = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        multiple: true,
        copyToCacheDirectory: false,
      });

      if (result.canceled || result.assets.length === 0) return;

      await FileSystem.makeDirectoryAsync(IMPORT_DIR, { intermediates: true });

      const existing = new Set(customSongsRef.current.map(s => s.filename));
      const newSongs: Song[] = [];
      let skipped = 0;

      for (const asset of result.assets) {
        const filename = asset.name ?? asset.uri.split('/').pop() ?? `audio_${Date.now()}`;

        if (existing.has(filename)) {
          skipped++;
          continue;
        }

        const destUri = `${IMPORT_DIR}${Date.now()}_${filename}`;
        await FileSystem.copyAsync({ from: asset.uri, to: destUri });

        const parsed = parseFilename(filename);
        newSongs.push({
          id: generateId(),
          filename,
          uri: destUri,
          title: stripY2Mate(parsed.title),
          artist: parsed.artist,
          album: 'Importado',
          duration: 0,
        });
        existing.add(filename);
      }

      if (newSongs.length === 0) {
        Alert.alert('Sem novidades', skipped > 0 ? `${skipped} ficheiro(s) já estavam importados.` : 'Nenhum ficheiro novo.');
        return;
      }

      const updated = [...customSongsRef.current, ...newSongs];
      setCustomSongs(updated);
      customSongsRef.current = updated;
      await saveJSON(KEYS.CUSTOM_SONGS, updated);

      const msg = skipped > 0
        ? `${newSongs.length} ficheiro(s) importados. ${skipped} já existiam.`
        : `${newSongs.length} ficheiro(s) importados com sucesso.`;
      Alert.alert('Importação concluída', msg);
    } catch (e) {
      console.warn('Import error:', e);
      Alert.alert('Erro', 'Não foi possível importar os ficheiros. Tenta novamente.');
    }
  }, []);

  const removeCustomSong = useCallback(async (id: string) => {
    const song = customSongsRef.current.find(s => s.id === id);
    if (song) {
      await FileSystem.deleteAsync(song.uri, { idempotent: true });
    }
    const updated = customSongsRef.current.filter(s => s.id !== id);
    setCustomSongs(updated);
    customSongsRef.current = updated;
    await saveJSON(KEYS.CUSTOM_SONGS, updated);
  }, []);

  // --- History ---

  const addToRecentlyPlayed = useCallback(
    async (songId: string) => {
      const updated = [songId, ...recentlyPlayed.filter(id => id !== songId)].slice(0, 50);
      setRecentlyPlayed(updated);
      await saveJSON(KEYS.RECENTLY_PLAYED, updated);
    },
    [recentlyPlayed]
  );

  const addToPlayHistory = useCallback(
    async (songId: string) => {
      const updated = [songId, ...playHistory.filter(id => id !== songId)].slice(0, 200);
      setPlayHistory(updated);
      await saveJSON(KEYS.PLAY_HISTORY, updated);
    },
    [playHistory]
  );

  return (
    <LibraryContext.Provider
      value={{
        songs,
        playlists,
        renameMap,
        recentlyPlayed,
        playHistory,
        isLoading,
        permissionGranted,
        showAllAudio,
        setShowAllAudio,
        favorites,
        toggleFavorite,
        isFavorite,
        scanLibrary,
        getDisplayInfo,
        getSongById,
        getPlaylistById,
        getArtists,
        getSongsByArtist,
        searchSongs,
        createPlaylist,
        deletePlaylist,
        updatePlaylist,
        addSongsToPlaylist,
        removeSongFromPlaylist,
        createArtistPlaylists,
        renameSong,
        getSongsNeedingRename,
        addToRecentlyPlayed,
        addToPlayHistory,
        customSongs,
        importMusicFiles,
        removeCustomSong,
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
}

export function useLibrary(): LibraryContextType {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error('useLibrary must be used inside LibraryProvider');
  return ctx;
}
