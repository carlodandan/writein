import { describe, it, expect } from 'vitest';
import { countWords, countWordsAndCharacters } from '../utils/wordCount';

describe('Word and Character Counting', () => {
  it('counts simple words correctly', () => {
    expect(countWords("Hello world")).toBe(2);
  });

  it('handles empty documents, null and undefined', () => {
    expect(countWords("")).toBe(0);
    expect(countWords("   ")).toBe(0);
    expect(countWords(null)).toBe(0);
    expect(countWords(undefined)).toBe(0);
    expect(countWordsAndCharacters("").characters).toBe(0);
  });

  it('handles punctuation properly', () => {
    expect(countWords("Hello, world! Are you ready?")).toBe(5);
    expect(countWords("End of sentence... Another begins.")).toBe(5);
  });

  it('handles line breaks and multiple spaces', () => {
    const text = "Chapter One\n\nIt was a dark   and stormy\r\nnight.";
    expect(countWords(text)).toBe(9);
  });

  it('handles dialogue and quotes', () => {
    const dialogue = '"I don\'t think so," she whispered. "Wait for me!"';
    // Words: "I", "don't", "think", "so", "she", "whispered", "Wait", "for", "me"
    expect(countWords(dialogue)).toBe(9);
  });

  it('handles em-dashes and hyphens', () => {
    // Em-dash separates two words
    expect(countWords("love—hate")).toBe(2);
    expect(countWords("silence--broken")).toBe(2);
    // Hyphenated word
    expect(countWords("state-of-the-art")).toBe(1);
  });

  it('handles numbers embedded in prose', () => {
    expect(countWords("In 2024, there were 42 cats.")).toBe(6);
  });

  it('handles Unicode accents and characters', () => {
    expect(countWords("Café résumé mañana")).toBe(3);
    expect(countWords("Die süße schöne Welt")).toBe(4);
  });

  it('returns character count with and without spaces', () => {
    const result = countWordsAndCharacters("Hello World!");
    expect(result.characters).toBe(12);
    expect(result.charactersNoSpaces).toBe(11);
    expect(result.words).toBe(2);
  });
});
