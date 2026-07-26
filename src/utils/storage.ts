import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  PLAYLISTS: '@pdb:playlists',
  RENAME_MAP: '@pdb:renameMap',
  RECENTLY_PLAYED: '@pdb:recentlyPlayed',
  PLAY_HISTORY: '@pdb:playHistory',
  SETTINGS: '@pdb:settings',
  SHOW_ALL_AUDIO: '@pdb:showAllAudio',
  FAVORITES: '@pdb:favorites',
  CUSTOM_SONGS: '@pdb:customSongs',
  HIDDEN_SONGS: '@pdb:hiddenSongs',
};

export { KEYS };

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function loadJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function saveJSON<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('Storage save error:', e);
  }
}
