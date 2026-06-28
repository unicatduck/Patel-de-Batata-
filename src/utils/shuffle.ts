import { Song } from '../types';

// Fisher-Yates true shuffle
function fisherYates<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Creates a shuffled queue that avoids replaying recently heard songs.
 * Songs in the recent history are moved to the second half of the queue,
 * ensuring maximum variety at the start of each shuffle.
 */
export function createShuffledQueue(
  songs: Song[],
  currentSong: Song | null,
  playHistory: string[]
): Song[] {
  if (songs.length === 0) return [];
  if (songs.length === 1) return [...songs];

  const shuffled = fisherYates(songs);

  // Ensure the currently playing song is NOT the first to play again
  if (currentSong) {
    const idx = shuffled.findIndex(s => s.id === currentSong.id);
    if (idx === 0 && shuffled.length > 1) {
      const swapIdx = 1 + Math.floor(Math.random() * (shuffled.length - 1));
      [shuffled[0], shuffled[swapIdx]] = [shuffled[swapIdx], shuffled[0]];
    }
  }

  if (songs.length <= 4 || playHistory.length === 0) return shuffled;

  // Move recently played songs (up to 1/3 of the history) to the end
  const recentCount = Math.min(playHistory.length, Math.floor(songs.length / 3));
  const recentIds = new Set(playHistory.slice(0, recentCount));

  // Exclude current song from this logic
  if (currentSong) recentIds.delete(currentSong.id);

  const fresh: Song[] = [];
  const stale: Song[] = [];

  for (const song of shuffled) {
    if (recentIds.has(song.id)) {
      stale.push(song);
    } else {
      fresh.push(song);
    }
  }

  // Reshuffle the stale section so their internal order is also random
  return [...fresh, ...fisherYates(stale)];
}

/**
 * Returns the next index in the queue, handling repeat modes.
 * Returns -1 if playback should stop (end of queue, no repeat).
 */
export function getNextIndex(
  currentIndex: number,
  queueLength: number,
  repeatMode: 'none' | 'all' | 'one'
): number {
  if (repeatMode === 'one') return currentIndex;
  if (currentIndex < queueLength - 1) return currentIndex + 1;
  if (repeatMode === 'all') return 0;
  return -1;
}

/**
 * Returns the previous index in the queue.
 */
export function getPrevIndex(
  currentIndex: number,
  queueLength: number,
  repeatMode: 'none' | 'all' | 'one'
): number {
  if (currentIndex > 0) return currentIndex - 1;
  if (repeatMode === 'all') return queueLength - 1;
  return 0;
}
