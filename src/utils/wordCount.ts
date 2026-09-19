export interface WordCountResult {
  words: number;
  characters: number;
  charactersNoSpaces: number;
}

/**
 * Accurately counts words and characters in text.
 * Handles Unicode, dialogue quotes, em-dashes, hyphens, numbers, multiple spaces, and line breaks.
 */
export function countWordsAndCharacters(text: string | null | undefined): WordCountResult {
  if (!text) {
    return { words: 0, characters: 0, charactersNoSpaces: 0 };
  }

  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, '').length;

  // Replace em-dashes, en-dashes, and double hyphens with spaces so words separated by dashes are counted individually
  const normalized = text
    .replace(/[—–]/g, ' ')
    .replace(/--/g, ' ');

  // Match words: sequences of letters, digits, and internal apostrophes/hyphens
  // Unicode aware with \p{L} and \p{N}
  const wordMatches = normalized.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu);

  const words = wordMatches ? wordMatches.length : 0;

  return {
    words,
    characters,
    charactersNoSpaces,
  };
}

export function countWords(text: string | null | undefined): number {
  return countWordsAndCharacters(text).words;
}
