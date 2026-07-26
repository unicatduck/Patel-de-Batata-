export interface Song {
  id: string;
  filename: string;
  uri: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // milliseconds
  artwork?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  songIds: string[];
  isAutoPlaylist: boolean;
  autoType?: 'artist' | 'album';
  autoValue?: string;
  createdAt: number;
  updatedAt: number;
}

export type RepeatMode = 'none' | 'all' | 'one';

export interface RenameEntry {
  songId: string;
  displayTitle: string;
  displayArtist?: string;
}

export interface PlayerState {
  currentSong: Song | null;
  queue: Song[];
  currentIndex: number;
  isPlaying: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  position: number;
  duration: number;
  isLoading: boolean;
}

export type RootStackParamList = {
  MainTabs: undefined;
  Player: undefined;
  PlaylistDetail: { playlistId: string };
  ArtistDetail: { artist: string };
  CreatePlaylist: { initialSongIds?: string[] };
  RenameScreen: { songId: string };
  Account: undefined;
  Security: undefined;
};

export type BottomTabParamList = {
  Home: undefined;
  Library: undefined;
  Search: undefined;
  Settings: undefined;
};
