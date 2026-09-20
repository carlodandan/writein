import type { Project } from '../types/project';
import type { ManuscriptNode } from '../types/manuscript';
import type { CompileOptions, CompileResult } from '../types/exportImport';
import { countWordsAndCharacters } from './wordCount';

/**
 * Compiles selected manuscript nodes into the configured export format.
 */
export function compileManuscript(
  project: Project,
  nodes: ManuscriptNode[],
  documents: Record<string, { content_text?: string; word_count?: number }>,
  options: CompileOptions
): CompileResult {
  const selectedNodes = options.selectedNodeIds && options.selectedNodeIds.length > 0
    ? nodes.filter((n) => options.selectedNodeIds!.includes(n.id) && !n.archived_at)
    : nodes.filter((n) => !n.archived_at);

  // Separate hierarchy into roots and children
  // A node is a root if it has no parent, OR if its parent is not among the selected nodes
  const rootNodes = selectedNodes.filter(
    (n) => !n.parent_id || !selectedNodes.some((p) => p.id === n.parent_id)
  );
  const childMap = new Map<string, ManuscriptNode[]>();
  selectedNodes.forEach((n) => {
    if (n.parent_id && selectedNodes.some((p) => p.id === n.parent_id)) {
      if (!childMap.has(n.parent_id)) childMap.set(n.parent_id, []);
      childMap.get(n.parent_id)!.push(n);
    }
  });

  // Sort function
  const sortNodes = (arr: ManuscriptNode[]) =>
    [...arr].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  let output = '';
  let chapterCounter = 0;

  const sceneSepText = () => {
    switch (options.sceneSeparator) {
      case '###':
        return '\n\n###\n\n';
      case '---':
        return '\n\n---\n\n';
      case 'blank_line':
        return '\n\n\n';
      case '* * *':
      default:
        return '\n\n* * *\n\n';
    }
  };

  const formatChapterHeading = (title: string, count: number, format: CompileOptions['format']) => {
    let headerText = title;
    if (options.chapterHeaderFormat === 'numbered_only') {
      headerText = `Chapter ${count}`;
    } else if (options.chapterHeaderFormat === 'numbered_with_title') {
      headerText = `Chapter ${count}: ${title}`;
    }

    if (format === 'markdown') {
      return `\n\n## ${headerText}\n\n`;
    } else if (format === 'html') {
      return `<h2 class="chapter-title">${escapeHtml(headerText)}</h2>\n`;
    } else {
      return `\n\n${headerText.toUpperCase()}\n\n`;
    }
  };

  // 1. Title Page
  if (options.includeTitlePage) {
    if (options.format === 'markdown') {
      output += `# ${project.title}\n`;
      if (project.subtitle) output += `*${project.subtitle}*\n\n`;
      if (project.author) output += `**By ${project.author}**\n\n`;
      if (project.genre) output += `Genre: ${project.genre}\n\n`;
      output += `---\n\n`;
    } else if (options.format === 'html') {
      output += `<div class="title-page">
  <h1 class="book-title">${escapeHtml(project.title)}</h1>
  ${project.subtitle ? `<h2 class="book-subtitle">${escapeHtml(project.subtitle)}</h2>` : ''}
  ${project.author ? `<p class="book-author">By ${escapeHtml(project.author)}</p>` : ''}
  ${project.genre ? `<p class="book-genre">${escapeHtml(project.genre)}</p>` : ''}
</div>
<div class="page-break"></div>\n`;
    } else {
      output += `${project.title.toUpperCase()}\n`;
      if (project.subtitle) output += `${project.subtitle}\n`;
      if (project.author) output += `By ${project.author}\n`;
      output += `\n${'='.repeat(40)}\n\n`;
    }
  }

  // 2. Table of Contents
  if (options.includeTableOfContents) {
    const chapters = selectedNodes.filter((n) => n.node_type === 'chapter');
    if (chapters.length > 0) {
      if (options.format === 'markdown') {
        output += `### Table of Contents\n\n`;
        chapters.forEach((ch, idx) => {
          output += `${idx + 1}. ${ch.title}\n`;
        });
        output += `\n---\n\n`;
      } else if (options.format === 'html') {
        output += `<div class="toc-page">
  <h2>Table of Contents</h2>
  <ul class="toc-list">
    ${chapters.map((ch, idx) => `<li><span class="toc-num">${idx + 1}.</span> ${escapeHtml(ch.title)}</li>`).join('\n    ')}
  </ul>
</div>
<div class="page-break"></div>\n`;
      } else {
        output += `TABLE OF CONTENTS\n\n`;
        chapters.forEach((ch, idx) => {
          output += `  ${idx + 1}. ${ch.title}\n`;
        });
        output += `\n${'-'.repeat(40)}\n\n`;
      }
    }
  }

  // 3. Compile Nodes
  const renderNode = (node: ManuscriptNode) => {
    const doc = documents[node.id];
    const text = doc?.content_text?.trim() || '';

    if (node.node_type === 'part') {
      if (options.format === 'markdown') {
        output += `\n\n# ${node.title}\n\n`;
      } else if (options.format === 'html') {
        output += `<div class="page-break"></div>\n<h1 class="part-title">${escapeHtml(node.title)}</h1>\n`;
      } else {
        output += `\n\n${'#'.repeat(30)}\n${node.title.toUpperCase()}\n${'#'.repeat(30)}\n\n`;
      }
      if (text) {
        output += formatBodyText(text, options.format);
      }
    } else if (node.node_type === 'chapter') {
      chapterCounter++;
      output += formatChapterHeading(node.title, chapterCounter, options.format);
      if (text) {
        output += formatBodyText(text, options.format);
      }
    } else if (node.node_type === 'scene') {
      if (options.format === 'markdown') {
        output += sceneSepText();
      } else if (options.format === 'html') {
        output += `<div class="scene-separator">* * *</div>\n`;
      } else {
        output += `\n\n* * *\n\n`;
      }
      if (text) {
        output += formatBodyText(text, options.format);
      }
    }

    // Render children
    const children = childMap.get(node.id);
    if (children && children.length > 0) {
      sortNodes(children).forEach(renderNode);
    }
  };

  sortNodes(rootNodes).forEach(renderNode);

  // If HTML format, wrap with complete HTML document & print-ready CSS
  if (options.format === 'html') {
    output = wrapInHtmlDocument(project.title, output);
  }

  const counts = countWordsAndCharacters(output);
  const extension = options.format === 'markdown' ? 'md' : options.format === 'html' ? 'html' : 'txt';
  const sanitizedTitle = project.title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'manuscript';

  return {
    fileName: `${sanitizedTitle}.${extension}`,
    content: output,
    wordCount: counts.words,
    characterCount: counts.characters,
  };
}

function formatBodyText(text: string, format: CompileOptions['format']): string {
  if (format === 'html') {
    return text
      .split(/\n\s*\n/)
      .map((para) => `<p>${escapeHtml(para.trim())}</p>`)
      .join('\n') + '\n';
  }
  return text + '\n\n';
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function wrapInHtmlDocument(title: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Lora:ital,wght@0,400;0,600;1,400&display=swap');
    
    body {
      font-family: 'Lora', Georgia, 'Times New Roman', serif;
      font-size: 12pt;
      line-height: 1.8;
      color: #1a1a1a;
      background-color: #faf8f5;
      margin: 0;
      padding: 3rem;
      display: flex;
      justify-content: center;
    }
    .manuscript-container {
      max-width: 42rem;
      width: 100%;
      background: #fff;
      padding: 4rem;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      border-radius: 4px;
    }
    h1, h2, h3 {
      font-family: 'Playfair Display', Georgia, serif;
      font-weight: 700;
      color: #111;
      text-align: center;
    }
    .title-page {
      text-align: center;
      padding: 6rem 0 8rem;
    }
    .book-title {
      font-size: 28pt;
      margin-bottom: 0.5rem;
    }
    .book-subtitle {
      font-size: 14pt;
      font-style: italic;
      color: #555;
      margin-bottom: 2rem;
    }
    .book-author {
      font-size: 13pt;
      margin-bottom: 0.5rem;
    }
    .book-genre {
      font-size: 10pt;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #777;
    }
    .chapter-title {
      font-size: 18pt;
      margin-top: 4rem;
      margin-bottom: 2rem;
    }
    .part-title {
      font-size: 22pt;
      margin-top: 5rem;
      margin-bottom: 3rem;
    }
    p {
      text-indent: 1.5rem;
      margin: 0 0 0.5rem;
      text-align: justify;
    }
    p:first-of-type, .chapter-title + p, .part-title + p {
      text-indent: 0;
    }
    .scene-separator {
      text-align: center;
      letter-spacing: 0.5em;
      margin: 2rem 0;
      color: #777;
    }
    .page-break {
      page-break-after: always;
      border-bottom: 1px dashed #e5e5e5;
      margin: 3rem 0;
    }
    @media print {
      body { background: #fff; padding: 0; }
      .manuscript-container { box-shadow: none; padding: 0; max-width: none; }
      .page-break { border-bottom: none; }
    }
  </style>
</head>
<body>
  <div class="manuscript-container">
    ${bodyContent}
  </div>
</body>
</html>`;
}
