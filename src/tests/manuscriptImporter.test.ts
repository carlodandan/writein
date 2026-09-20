import { describe, it, expect } from 'vitest';
import { parseManuscriptText } from '../utils/manuscriptImporter';

describe('Manuscript Smart Importer & Splitter Utility', () => {
  it('parses Markdown headings into Part, Chapter, and Scene hierarchy', () => {
    const markdown = `# Part I: The Frontier

Introduction to the frontier.

## Chapter 1: The Outpost

The dust settled over the wooden roofs.

### Scene 1: Inside the Saloon

Glasses clinked against the counter.

## Chapter 2: The Ambush

Footsteps approached from behind the canyon.
`;

    const preview = parseManuscriptText(markdown);
    expect(preview.totalNodes).toBe(4); // 1 Part + 2 Chapters + 1 Scene
    expect(preview.detectedNodes.length).toBe(1); // 1 root Part

    const part = preview.detectedNodes[0];
    expect(part.nodeType).toBe('part');
    expect(part.title).toBe('Part I: The Frontier');
    expect(part.children?.length).toBe(2);

    const ch1 = part.children![0];
    expect(ch1.nodeType).toBe('chapter');
    expect(ch1.title).toBe('Chapter 1: The Outpost');
    expect(ch1.children?.length).toBe(1);

    const sc1 = ch1.children![0];
    expect(sc1.nodeType).toBe('scene');
    expect(sc1.title).toBe('Scene 1: Inside the Saloon');
    expect(sc1.contentText).toContain('Glasses clinked');
    expect(preview.totalWords).toBeGreaterThan(15);
  });

  it('parses conventional chapter headings (Chapter 1, CHAPTER 2, PROLOGUE)', () => {
    const text = `PROLOGUE
Before the empire fell, the stones were quiet.

Chapter 1: The Messenger
The rider came through the north gate at sunrise.

CHAPTER 2 - The Citadel
The guards stood watch at the iron gates.
`;

    const preview = parseManuscriptText(text);
    expect(preview.totalNodes).toBe(3);
    expect(preview.detectedNodes[0].title).toBe('PROLOGUE');
    expect(preview.detectedNodes[1].title).toBe('Chapter 1: The Messenger');
    expect(preview.detectedNodes[2].title).toBe('CHAPTER 2 - The Citadel');
  });

  it('falls back to single chapter draft for unformatted plain text', () => {
    const text = `Just a continuous stream of thoughts without any chapter titles or headers.
Another paragraph of pure prose.`;

    const preview = parseManuscriptText(text);
    expect(preview.totalNodes).toBe(1);
    expect(preview.detectedNodes[0].title).toBe('Imported Draft');
    expect(preview.detectedNodes[0].contentText).toBe(text);
  });

  it('handles empty input gracefully', () => {
    const preview = parseManuscriptText('   ');
    expect(preview.totalNodes).toBe(0);
    expect(preview.totalWords).toBe(0);
    expect(preview.detectedNodes.length).toBe(0);
  });
});
