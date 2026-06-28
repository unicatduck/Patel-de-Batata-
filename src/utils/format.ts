/**
 * Formats milliseconds to M:SS
 */
export function formatDuration(ms: number): string {
  if (!ms || ms <= 0) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Parses a filename (without extension) into title and artist.
 * Handles common patterns:
 *   "Artist - Title"
 *   "01 - Title"
 *   "01. Title"
 *   "Title"
 */
export function parseFilename(filename: string): { title: string; artist: string } {
  // Remove file extension
  const name = filename.replace(/\.[^.]+$/, '').trim();

  // Pattern: "Something - Something else"
  const dashMatch = name.match(/^(.+?)\s*-\s*(.+)$/);
  if (dashMatch) {
    const left = dashMatch[1].trim();
    const right = dashMatch[2].trim();

    // If left part is purely numeric, treat it as a track number
    if (/^\d+$/.test(left)) {
      return { title: right, artist: 'Desconhecido' };
    }

    return { title: right, artist: left };
  }

  // Pattern: "01. Title" or "01 Title"
  const trackMatch = name.match(/^\d+\.?\s+(.+)$/);
  if (trackMatch) {
    return { title: trackMatch[1].trim(), artist: 'Desconhecido' };
  }

  return { title: name, artist: 'Desconhecido' };
}

/**
 * Generates a clean suggested filename from title and artist.
 * Result: "Artist - Title.ext"
 */
export function buildCleanFilename(title: string, artist: string, originalFilename: string): string {
  const ext = originalFilename.match(/\.[^.]+$/)?.[0] ?? '.mp3';
  if (artist && artist !== 'Desconhecido') {
    return `${artist} - ${title}${ext}`;
  }
  return `${title}${ext}`;
}

/**
 * Checks if a filename looks "messy" (has track numbers, underscores, etc.)
 * and suggests a rename.
 */
export function needsRename(filename: string, metaTitle?: string, metaArtist?: string): boolean {
  const name = filename.replace(/\.[^.]+$/, '');

  // Has leading track number
  if (/^\d+[\s._-]/.test(name)) return true;

  // Has underscores instead of spaces
  if (name.includes('_')) return true;

  // Metadata title differs significantly from filename
  if (metaTitle && metaTitle.toLowerCase() !== name.toLowerCase()) {
    return levenshtein(metaTitle.toLowerCase(), name.toLowerCase()) > 3;
  }

  return false;
}

function levenshtein(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}
