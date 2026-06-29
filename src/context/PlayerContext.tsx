import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  Event,
  RepeatMode as TrackRepeatMode,
  State,
  useActiveTrack,
  usePlaybackState,
  useProgress,
} from 'react-native-track-player';
import { RepeatMode, Song } from '../types';
import { createShuffledQueue } from '../utils/shuffle';
import { useLibrary } from './LibraryContext';

interface PlayerContextType {
  currentSong: Song | null;
  queue: Song[];
  currentIndex: number;
  isPlaying: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  position: number;
  duration: number;
  isLoading: boolean;
  volume: number;

  playSong: (song: Song, queue?: Song[]) => Promise<void>;
  playQueue: (songs: Song[], startIndex?: number) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  playNext: () => Promise<void>;
  playPrev: () => Promise<void>;
  toggleShuffle: () => Promise<void>;
  toggleRepeat: () => void;
  seekTo: (positionMs: number) => Promise<void>;
  addToQueue: (song: Song) => void;
  setVolume: (v: number) => Promise<void>;
}

function songToTrack(song: Song) {
  return {
    id: song.id,
    url: song.uri,
    title: song.title,
    artist: song.artist,
    album: song.album,
    duration: song.duration / 1000,
  };
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const { addToRecentlyPlayed, addToPlayHistory, playHistory } = useLibrary();

  // TrackPlayer reactive hooks
  const progress = useProgress(500);
  const playbackState = usePlaybackState();
  const activeTrack = useActiveTrack();

  // App state
  const [queue, setQueue] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('none');
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolumeState] = useState(1.0);

  // Refs to access current values inside async callbacks without stale closures
  const queueRef = useRef<Song[]>([]);
  const currentIndexRef = useRef(0);
  const isShuffleRef = useRef(false);
  const playHistoryRef = useRef(playHistory);
  const addToRecentlyPlayedRef = useRef(addToRecentlyPlayed);
  const addToPlayHistoryRef = useRef(addToPlayHistory);
  const isSetup = useRef(false);

  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);
  useEffect(() => { isShuffleRef.current = isShuffle; }, [isShuffle]);
  useEffect(() => { playHistoryRef.current = playHistory; }, [playHistory]);
  useEffect(() => { addToRecentlyPlayedRef.current = addToRecentlyPlayed; }, [addToRecentlyPlayed]);
  useEffect(() => { addToPlayHistoryRef.current = addToPlayHistory; }, [addToPlayHistory]);

  // Derive values from TrackPlayer hooks
  const currentSong = activeTrack
    ? queueRef.current.find(s => s.id === activeTrack.id) ?? null
    : null;

  const isPlaying = playbackState.state === State.Playing;

  // TrackPlayer uses seconds; our API uses milliseconds throughout
  const position = Math.floor((progress.position ?? 0) * 1000);
  const duration = Math.floor((progress.duration ?? 0) * 1000);

  // One-time TrackPlayer setup
  useEffect(() => {
    if (isSetup.current) return;
    isSetup.current = true;

    (async () => {
      try {
        await TrackPlayer.setupPlayer({ maxCacheSize: 1024 * 5 });
        await TrackPlayer.updateOptions({
          android: {
            appKilledPlaybackBehavior:
              AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
          },
          capabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.SkipToNext,
            Capability.SkipToPrevious,
            Capability.SeekTo,
          ],
          compactCapabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.SkipToNext,
            Capability.SkipToPrevious,
          ],
        });
      } catch (e) {
        console.warn('TrackPlayer setup error:', e);
      }
    })();
  }, []);

  // Record history and sync currentIndex when track auto-advances
  useEffect(() => {
    if (!activeTrack) return;
    addToRecentlyPlayedRef.current(activeTrack.id);
    addToPlayHistoryRef.current(activeTrack.id);

    const idx = queueRef.current.findIndex(s => s.id === activeTrack.id);
    if (idx >= 0) {
      setCurrentIndex(idx);
      currentIndexRef.current = idx;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTrack?.id]);

  const loadQueue = useCallback(async (songs: Song[], startIndex: number) => {
    setIsLoading(true);
    try {
      await TrackPlayer.reset();
      await TrackPlayer.add(songs.map(songToTrack));
      await TrackPlayer.skip(startIndex);
      await TrackPlayer.play();
      setCurrentIndex(startIndex);
      currentIndexRef.current = startIndex;
    } catch (e) {
      console.warn('Load queue error:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const playSong = useCallback(
    async (song: Song, incomingQueue?: Song[]) => {
      const baseQueue = incomingQueue ?? [song];
      let finalQueue: Song[];
      let startIndex: number;

      if (isShuffleRef.current) {
        finalQueue = createShuffledQueue(baseQueue, song, playHistoryRef.current);
        const songIdx = finalQueue.findIndex(s => s.id === song.id);
        if (songIdx > 0) {
          finalQueue.splice(songIdx, 1);
          finalQueue.unshift(song);
        }
        startIndex = 0;
      } else {
        finalQueue = baseQueue;
        startIndex = baseQueue.findIndex(s => s.id === song.id);
        if (startIndex < 0) startIndex = 0;
      }

      setQueue(finalQueue);
      queueRef.current = finalQueue;
      await loadQueue(finalQueue, startIndex);
    },
    [loadQueue]
  );

  const playQueue = useCallback(
    async (songs: Song[], startIndex = 0) => {
      if (songs.length === 0) return;
      let finalQueue: Song[];
      let finalIndex: number;

      if (isShuffleRef.current) {
        const songAtStart = songs[startIndex];
        finalQueue = createShuffledQueue(songs, null, playHistoryRef.current);
        const idx = finalQueue.findIndex(s => s.id === songAtStart?.id);
        if (idx > 0) {
          finalQueue.splice(idx, 1);
          finalQueue.unshift(songAtStart);
        }
        finalIndex = 0;
      } else {
        finalQueue = songs;
        finalIndex = startIndex;
      }

      setQueue(finalQueue);
      queueRef.current = finalQueue;
      await loadQueue(finalQueue, finalIndex);
    },
    [loadQueue]
  );

  const togglePlayPause = useCallback(async () => {
    const state = await TrackPlayer.getPlaybackState();
    if (state.state === State.Playing) {
      await TrackPlayer.pause();
    } else {
      await TrackPlayer.play();
    }
  }, []);

  const playNext = useCallback(async () => {
    await TrackPlayer.skipToNext().catch(() => {});
  }, []);

  const playPrev = useCallback(async () => {
    const prog = await TrackPlayer.getProgress();
    if (prog.position > 3) {
      await TrackPlayer.seekTo(0);
    } else {
      await TrackPlayer.skipToPrevious().catch(() => TrackPlayer.seekTo(0));
    }
  }, []);

  const toggleShuffle = useCallback(async () => {
    const next = !isShuffleRef.current;
    isShuffleRef.current = next;
    setIsShuffle(next);

    if (next && queueRef.current.length > 0) {
      const current = queueRef.current[currentIndexRef.current];
      if (!current) return;
      const remaining = queueRef.current.filter((_, i) => i !== currentIndexRef.current);
      const shuffled = createShuffledQueue(remaining, current, playHistoryRef.current);
      const newQueue = [current, ...shuffled];
      setQueue(newQueue);
      queueRef.current = newQueue;
      setCurrentIndex(0);
      currentIndexRef.current = 0;

      try {
        const prog = await TrackPlayer.getProgress();
        await TrackPlayer.reset();
        await TrackPlayer.add(newQueue.map(songToTrack));
        await TrackPlayer.skip(0);
        await TrackPlayer.seekTo(prog.position);
        await TrackPlayer.play();
      } catch (e) {
        console.warn('Shuffle rebuild error:', e);
      }
    }
  }, []);

  const toggleRepeat = useCallback(() => {
    setRepeatMode(prev => {
      const modes: RepeatMode[] = ['none', 'all', 'one'];
      const next = modes[(modes.indexOf(prev) + 1) % modes.length];

      const tpMode =
        next === 'one' ? TrackRepeatMode.Track :
        next === 'all' ? TrackRepeatMode.Queue :
        TrackRepeatMode.Off;

      TrackPlayer.setRepeatMode(tpMode);
      return next;
    });
  }, []);

  const seekTo = useCallback(async (positionMs: number) => {
    await TrackPlayer.seekTo(positionMs / 1000);
  }, []);

  const setVolume = useCallback(async (v: number) => {
    const clamped = Math.min(1, Math.max(0, v));
    setVolumeState(clamped);
    await TrackPlayer.setVolume(clamped);
  }, []);

  const addToQueue = useCallback((song: Song) => {
    setQueue(prev => {
      const updated = [...prev, song];
      queueRef.current = updated;
      TrackPlayer.add(songToTrack(song));
      return updated;
    });
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        currentSong,
        queue,
        currentIndex,
        isPlaying,
        isShuffle,
        repeatMode,
        position,
        duration,
        isLoading,
        volume,
        playSong,
        playQueue,
        togglePlayPause,
        playNext,
        playPrev,
        toggleShuffle,
        toggleRepeat,
        seekTo,
        addToQueue,
        setVolume,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer(): PlayerContextType {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used inside PlayerProvider');
  return ctx;
}
