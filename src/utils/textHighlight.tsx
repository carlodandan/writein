import React from 'react';

/**
 * Highlights matches within a string based on a search query.
 * Case-insensitive, supports partial matches, wraps matches in <mark>.
 */
export function highlightMatch(
  text: string | null | undefined,
  query: string,
): React.ReactNode {
  if (!text) return null;
  if (!query || !query.trim()) return text;

  const q = query.trim();
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, i) =>
    part.toLowerCase() === q.toLowerCase() ? (
      <mark
        key={i}
        className="bg-amber-200/70 dark:bg-amber-900/60 text-amber-900 dark:text-amber-100 font-bold rounded-2xs px-0.5"
      >
        {part}
      </mark>
    ) : (
      part
    ),
  );
}
