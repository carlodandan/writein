import type { ImportDetectedNode, ImportPreview } from '../types/exportImport';
import { countWordsAndCharacters } from './wordCount';

/**
 * Parses Markdown or conventional manuscript text into an import preview tree.
 */
export function parseManuscriptText(rawText: string): ImportPreview {
  const trimmed = rawText.trim();
  if (!trimmed) {
    return { totalNodes: 0, totalWords: 0, detectedNodes: [] };
  }

  // Check if text is primarily Markdown headings
  const hasMarkdownHeadings = /^#{1,3}\s+.+$/m.test(trimmed);

  if (hasMarkdownHeadings) {
    return parseMarkdownStructure(trimmed);
  } else {
    return parseConventionalStructure(trimmed);
  }
}

function parseMarkdownStructure(text: string): ImportPreview {
  const lines = text.split('\n');
  const detectedNodes: ImportDetectedNode[] = [];
  let currentPart: ImportDetectedNode | null = null;
  let currentChapter: ImportDetectedNode | null = null;
  let currentScene: ImportDetectedNode | null = null;

  let currentBuffer: string[] = [];

  const flushBuffer = () => {
    const content = currentBuffer.join('\n').trim();
    if (content) {
      const counts = countWordsAndCharacters(content);
      if (currentScene) {
        currentScene.contentText = content;
        currentScene.wordCount = counts.words;
        currentScene.characterCount = counts.characters;
      } else if (currentChapter) {
        currentChapter.contentText = content;
        currentChapter.wordCount = counts.words;
        currentChapter.characterCount = counts.characters;
      } else if (currentPart) {
        currentPart.contentText = content;
        currentPart.wordCount = counts.words;
        currentPart.characterCount = counts.characters;
      }
    }
    currentBuffer = [];
  };

  let order = 1;

  for (const line of lines) {
    const h1Match = line.match(/^#\s+(.+)$/);
    const h2Match = line.match(/^##\s+(.+)$/);
    const h3Match = line.match(/^###\s+(.+)$/);

    if (h1Match) {
      flushBuffer();
      currentScene = null;
      currentChapter = null;
      currentPart = {
        nodeType: 'part',
        title: h1Match[1].trim(),
        contentText: '',
        wordCount: 0,
        characterCount: 0,
        orderIndex: order++,
        children: [],
      };
      detectedNodes.push(currentPart);
    } else if (h2Match) {
      flushBuffer();
      currentScene = null;
      currentChapter = {
        nodeType: 'chapter',
        title: h2Match[1].trim(),
        contentText: '',
        wordCount: 0,
        characterCount: 0,
        orderIndex: order++,
        children: [],
      };
      if (currentPart) {
        currentPart.children = currentPart.children || [];
        currentPart.children.push(currentChapter);
      } else {
        detectedNodes.push(currentChapter);
      }
    } else if (h3Match) {
      flushBuffer();
      currentScene = {
        nodeType: 'scene',
        title: h3Match[1].trim(),
        contentText: '',
        wordCount: 0,
        characterCount: 0,
        orderIndex: order++,
      };
      if (currentChapter) {
        currentChapter.children = currentChapter.children || [];
        currentChapter.children.push(currentScene);
      } else {
        // Scene without chapter: create a parent chapter
        const fallbackChapter: ImportDetectedNode = {
          nodeType: 'chapter',
          title: 'Imported Chapter',
          contentText: '',
          wordCount: 0,
          characterCount: 0,
          orderIndex: order++,
          children: [currentScene],
        };
        detectedNodes.push(fallbackChapter);
        currentChapter = fallbackChapter;
      }
    } else {
      currentBuffer.push(line);
    }
  }

  flushBuffer();

  // If no sections were identified, wrap everything in one chapter
  if (detectedNodes.length === 0) {
    const counts = countWordsAndCharacters(text);
    detectedNodes.push({
      nodeType: 'chapter',
      title: 'Imported Draft',
      contentText: text,
      wordCount: counts.words,
      characterCount: counts.characters,
      orderIndex: 1,
    });
  }

  return calculatePreviewTotals(detectedNodes);
}

function parseConventionalStructure(text: string): ImportPreview {
  const lines = text.split('\n');
  const detectedNodes: ImportDetectedNode[] = [];

  // Patterns for conventional headers
  // e.g. "Chapter 1", "Chapter 1: The Pier", "CHAPTER ONE", "PROLOGUE", "Part 1", "ACT I"
  const chapterRegex = /^(?:chapter\s+(\d+|[ivxlcdm]+)|prologue|epilogue)(?:\s*[:\-–]\s*(.+))?$/i;
  const partRegex = /^(?:part\s+(\d+|[ivxlcdm]+)|book\s+(\d+|[ivxlcdm]+)|act\s+([ivxlcdm]+))(?:\s*[:\-–]\s*(.+))?$/i;

  let currentPart: ImportDetectedNode | null = null;
  let currentChapter: ImportDetectedNode | null = null;
  let currentBuffer: string[] = [];
  let order = 1;

  const flushBuffer = () => {
    const content = currentBuffer.join('\n').trim();
    if (content) {
      const counts = countWordsAndCharacters(content);
      if (currentChapter) {
        currentChapter.contentText = content;
        currentChapter.wordCount = counts.words;
        currentChapter.characterCount = counts.characters;
      } else if (currentPart) {
        currentPart.contentText = content;
        currentPart.wordCount = counts.words;
        currentPart.characterCount = counts.characters;
      }
    }
    currentBuffer = [];
  };

  for (const line of lines) {
    const trimmedLine = line.trim();

    const partMatch = trimmedLine.match(partRegex);
    const chapterMatch = trimmedLine.match(chapterRegex);

    if (partMatch) {
      flushBuffer();
      currentChapter = null;
      currentPart = {
        nodeType: 'part',
        title: trimmedLine,
        contentText: '',
        wordCount: 0,
        characterCount: 0,
        orderIndex: order++,
        children: [],
      };
      detectedNodes.push(currentPart);
    } else if (chapterMatch) {
      flushBuffer();
      currentChapter = {
        nodeType: 'chapter',
        title: trimmedLine,
        contentText: '',
        wordCount: 0,
        characterCount: 0,
        orderIndex: order++,
        children: [],
      };
      if (currentPart) {
        currentPart.children = currentPart.children || [];
        currentPart.children.push(currentChapter);
      } else {
        detectedNodes.push(currentChapter);
      }
    } else {
      currentBuffer.push(line);
    }
  }

  flushBuffer();

  // If no sections were identified, wrap everything in a single chapter
  if (detectedNodes.length === 0) {
    const counts = countWordsAndCharacters(text);
    detectedNodes.push({
      nodeType: 'chapter',
      title: 'Imported Draft',
      contentText: text,
      wordCount: counts.words,
      characterCount: counts.characters,
      orderIndex: 1,
    });
  }

  return calculatePreviewTotals(detectedNodes);
}

function calculatePreviewTotals(nodes: ImportDetectedNode[]): ImportPreview {
  let totalNodes = 0;
  let totalWords = 0;

  const countRecursive = (list: ImportDetectedNode[]) => {
    for (const item of list) {
      totalNodes++;
      totalWords += item.wordCount;
      if (item.children && item.children.length > 0) {
        countRecursive(item.children);
      }
    }
  };

  countRecursive(nodes);

  return {
    totalNodes,
    totalWords,
    detectedNodes: nodes,
  };
}
