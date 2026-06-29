import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Audio, AVPlaybackStatus, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { RepeatMode, Song } from '../types';
import { createShuffledQueue, getNextIndex, getPrevIndex } from '../utils/shuffle';
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

  playSong: (song: Song, queue?: Song[]) => Promise<void>;
  playQueue: (songs: Song[], startIndex?: number) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  playNext: () => Promise<void>;
  playPrev: () => Promise<void>;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  seekTo: (positionMs: number) => Promise<void>;
  addToQueue: (song: Song) => void;
  volume: number;
  setVolume: (v: number) => Promise<void>;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const { addToRecentlyPlayed, addToPlayHistory, playHistory } = useLibrary();

  const soundRef = useRef<Audio.Sound | null>(null);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [queue, setQueue] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('none');
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolumeState] = useState(1.0);

  // Keep refs for use inside callbacks
  const currentIndexRef = useRef(currentIndex);
  const queueRef = useRef(queue);
  const repeatModeRef = useRef(repeatMode);
  const isShuffleRef = useRef(isShuffle);
  const playHistoryRef = useRef(playHistory);

  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);
  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => { repeatModeRef.current = repeatMode; }, [repeatMode]);
  useEffect(() => { isShuffleRef.current = isShuffle; }, [isShuffle]);
  useEffect(() => { playHistoryRef.current = playHistory; }, [playHistory]);

  // Configure audio session on mount
  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      playThroughEarpieceAndroid: false,
    });

    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  const onPlaybackStatusUpdate = useCallback(
    (status: AVPlaybackStatus) => {
      if (!status.isLoaded) return;
      setPosition(status.positionMillis ?? 0);
      setDuration(status.durationMillis ?? 0);
      setIsPlaying(status.isPlaying);

      if (status.didJustFinish && !status.isLooping) {
        const idx = currentIndexRef.current;
        const q = queueRef.current;
        const next = getNextIndex(idx, q.length, repeatModeRef.current);
        if (next >= 0) {
          loadAndPlayIndex(next);
        } else {
          setIsPlaying(false);
          setPosition(0);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const loadAndPlayIndex = useCallback(
    async (index: number) => {
      const q = queueRef.current;
      if (index < 0 || index >= q.length) return;

      const song = q[index];
      setIsLoading(true);

      try {
        // Unload previous
        if (soundRef.current) {
          await soundRef.current.stopAsync().catch(() => {});
          await soundRef.current.unloadAsync().catch(() => {});
          soundRef.current = null;
        }

        const { sound } = await Audio.Sound.createAsync(
          { uri: song.uri },
          { shouldPlay: true, progressUpdateIntervalMillis: 500 },
          onPlaybackStatusUpdate
        );

        soundRef.current = sound;
        setCurrentSong(song);
        setCurrentIndex(index);
        setIsPlaying(true);
        setPosition(0);

        await addToRecentlyPlayed(song.id);
        await addToPlayHistory(song.id);
      } catch (e) {
        console.warn('Load error:', e);
      } finally {
        setIsLoading(false);
      }
    },
    [addToPlayHistory, addToRecentlyPlayed, onPlaybackStatusUpdate]
  );

  const playSong = useCallback(
    async (song: Song, incomingQueue?: Song[]) => {
      const baseQueue = incomingQueue ?? [song];
      let finalQueue: Song[];
      let startIndex: number;

      if (isShuffle) {
        finalQueue = createShuffledQueue(baseQueue, song, playHistoryRef.current);
        // Put the requested song first
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
      await loadAndPlayIndex(startIndex);
    },
    [isShuffle, loadAndPlayIndex]
  );

  const playQueue = useCallback(
    async (songs: Song[], startIndex = 0) => {
      if (songs.length === 0) return;
      let finalQueue: Song[];
      let finalIndex: number;

      if (isShuffle) {
        const songAtStart = songs[startIndex];
        finalQueue = createShuffledQueue(songs, null, playHistoryRef.current);
        // Keep the requested start song first
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
      await loadAndPlayIndex(finalIndex);
    },
    [isShuffle, loadAndPlayIndex]
  );

  const togglePlayPause = useCallback(async () => {
    if (!soundRef.current) return;
    const status = await soundRef.current.getStatusAsync();
    if (!status.isLoaded) return;

    if (status.isPlaying) {
      await soundRef.current.pauseAsync();
    } else {
      await soundRef.current.playAsync();
    }
  }, []);

  const playNext = useCallback(async () => {
    const next = getNextIndex(currentIndexRef.current, queueRef.current.length, repeatModeRef.current);
    if (next >= 0) {
      await loadAndPlayIndex(next);
    }
  }, [loadAndPlayIndex]);

  const playPrev = useCallback(async () => {
    // If more than 3 seconds in, restart current song
    if (position > 3000 && soundRef.current) {
      await soundRef.current.setPositionAsync(0);
      return;
    }
    const prev = getPrevIndex(currentIndexRef.current, queueRef.current.length, repeatModeRef.current);
    await loadAndPlayIndex(prev);
  }, [loadAndPlayIndex, position]);

  const toggleShuffle = useCallback(() => {
    setIsShuffle(prev => {
      const next = !prev;
      isShuffleRef.current = next;

      if (next) {
        // Reshuffle remaining queue, keeping current song in place
        const current = queueRef.current[currentIndexRef.current];
        const remaining = queueRef.current.filter((_, i) => i !== currentIndexRef.current);
        const shuffled = createShuffledQueue(remaining, current, playHistoryRef.current);
        const newQueue = [current, ...shuffled];
        setQueue(newQueue);
        queueRef.current = newQueue;
        setCurrentIndex(0);
        currentIndexRef.current = 0;
      } else {
        // Restore linear order would require storing original — for simplicity keep current queue
        // The user can re-open a playlist to reset to linear
      }

      return next;
    });
  }, []);

  const toggleRepeat = useCallback(() => {
    setRepeatMode(prev => {
      const modes: RepeatMode[] = ['none', 'all', 'one'];
      const next = modes[(modes.indexOf(prev) + 1) % modes.length];
      repeatModeRef.current = next;

      // expo-av handles 'one' repeat natively via isLooping
      if (soundRef.current) {
        soundRef.current.setIsLoopingAsync(next === 'one');
      }

      return next;
    });
  }, []);

  const seekTo = useCallback(async (positionMs: number) => {
    if (!soundRef.current) return;
    await soundRef.current.setPositionAsync(positionMs);
  }, []);

  const setVolume = useCallback(async (v: number) => {
    const clamped = Math.min(1, Math.max(0, v));
    setVolumeState(clamped);
    if (soundRef.current) {
      await soundRef.current.setVolumeAsync(clamped);
    }
  }, []);

  const addToQueue = useCallback((song: Song) => {
    setQueue(prev => {
      const updated = [...prev, song];
      queueRef.current = updated;
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
        playSong,
        playQueue,
        togglePlayPause,
        playNext,
        playPrev,
        toggleShuffle,
        toggleRepeat,
        seekTo,
        addToQueue,
        volume,
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
