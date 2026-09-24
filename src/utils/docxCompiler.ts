import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  PageBreak,
  Header,
  Footer,
  PageNumber,
  convertInchesToTwip,
  LineRuleType,
} from 'docx';
import type { Project } from '../types/project';
import type { ManuscriptNode } from '../types/manuscript';
import type { CompileOptions } from '../types/exportImport';

/**
 * Builds an Office Open XML (.docx) Document model conforming to standard manuscript guidelines:
 * - 1-inch margins
 * - 12 pt Times New Roman serif typography with 1.5 line spacing
 * - 0.5-inch first-line paragraph indentation
 * - Clean title page with un-numbered title-page section properties
 * - Automatic page breaks before parts and chapters
 * - Formatted scene break glyphs (* * *, ###, ---)
 */
export function createDocxDocument(
  project: Project,
  nodes: ManuscriptNode[],
  documents: Record<string, { content_text?: string }>,
  options: CompileOptions
): Document {
  const selectedNodes =
    options.selectedNodeIds && options.selectedNodeIds.length > 0
      ? nodes.filter((n) => options.selectedNodeIds!.includes(n.id) && !n.archived_at)
      : nodes.filter((n) => !n.archived_at);

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

  const sortNodes = (arr: ManuscriptNode[]) =>
    [...arr].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  const paragraphs: Paragraph[] = [];

  // 1. Title Page
  if (options.includeTitlePage) {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: convertInchesToTwip(2), after: convertInchesToTwip(0.4) },
        children: [
          new TextRun({
            text: project.title.toUpperCase(),
            bold: true,
            size: 48, // 24 pt
            font: 'Times New Roman',
          }),
        ],
      })
    );

    if (project.subtitle) {
      paragraphs.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: convertInchesToTwip(0.3) },
          children: [
            new TextRun({
              text: project.subtitle,
              italics: true,
              size: 28, // 14 pt
              font: 'Times New Roman',
            }),
          ],
        })
      );
    }

    if (project.author) {
      paragraphs.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: convertInchesToTwip(0.3) },
          children: [
            new TextRun({
              text: `By ${project.author}`,
              size: 24, // 12 pt
              font: 'Times New Roman',
            }),
          ],
        })
      );
    }

    if (project.genre) {
      paragraphs.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: convertInchesToTwip(0.2) },
          children: [
            new TextRun({
              text: `Genre: ${project.genre}`,
              size: 20, // 10 pt
              font: 'Times New Roman',
              color: '555555',
            }),
          ],
        })
      );
    }

    paragraphs.push(
      new Paragraph({
        children: [new PageBreak()],
      })
    );
  }

  // 2. Table of Contents
  if (options.includeTableOfContents) {
    const chapters = selectedNodes.filter((n) => n.node_type === 'chapter');
    if (chapters.length > 0) {
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          alignment: AlignmentType.CENTER,
          spacing: { before: convertInchesToTwip(0.5), after: convertInchesToTwip(0.4) },
          children: [
            new TextRun({
              text: 'Table of Contents',
              bold: true,
              size: 32, // 16 pt
              font: 'Times New Roman',
            }),
          ],
        })
      );

      chapters.forEach((ch, idx) => {
        paragraphs.push(
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { after: convertInchesToTwip(0.1) },
            children: [
              new TextRun({
                text: `${idx + 1}.  ${ch.title}`,
                size: 24, // 12 pt
                font: 'Times New Roman',
              }),
            ],
          })
        );
      });

      paragraphs.push(
        new Paragraph({
          children: [new PageBreak()],
        })
      );
    }
  }

  // 3. Render Nodes
  let chapterCounter = 0;
  let isFirstContentItem = true;

  const sceneSepText = () => {
    switch (options.sceneSeparator) {
      case '###':
        return '###';
      case '---':
        return '— — —';
      case 'blank_line':
        return '';
      case '* * *':
      default:
        return '* * *';
    }
  };

  const renderNode = (node: ManuscriptNode) => {
    const doc = documents[node.id];
    const text = doc?.content_text?.trim() || '';

    if (node.node_type === 'part') {
      if (!isFirstContentItem) {
        paragraphs.push(new Paragraph({ children: [new PageBreak()] }));
      }
      isFirstContentItem = false;

      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { before: convertInchesToTwip(1), after: convertInchesToTwip(0.4) },
          children: [
            new TextRun({
              text: node.title.toUpperCase(),
              bold: true,
              size: 36, // 18 pt
              font: 'Times New Roman',
            }),
          ],
        })
      );

      if (text) {
        emitParagraphs(text, paragraphs);
      }
    } else if (node.node_type === 'chapter') {
      chapterCounter++;
      let headerTitle = node.title;
      if (options.chapterHeaderFormat === 'numbered_only') {
        headerTitle = `Chapter ${chapterCounter}`;
      } else if (options.chapterHeaderFormat === 'numbered_with_title') {
        headerTitle = `Chapter ${chapterCounter}: ${node.title}`;
      }

      if (!isFirstContentItem) {
        paragraphs.push(new Paragraph({ children: [new PageBreak()] }));
      }
      isFirstContentItem = false;

      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          alignment: AlignmentType.CENTER,
          spacing: { before: convertInchesToTwip(0.8), after: convertInchesToTwip(0.4) },
          children: [
            new TextRun({
              text: headerTitle,
              bold: true,
              size: 32, // 16 pt
              font: 'Times New Roman',
            }),
          ],
        })
      );

      if (text) {
        emitParagraphs(text, paragraphs);
      }
    } else if (node.node_type === 'scene') {
      isFirstContentItem = false;
      const sep = sceneSepText();
      if (sep) {
        paragraphs.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: convertInchesToTwip(0.2), after: convertInchesToTwip(0.2) },
            children: [
              new TextRun({
                text: sep,
                italics: true,
                size: 24,
                font: 'Times New Roman',
              }),
            ],
          })
        );
      } else {
        paragraphs.push(
          new Paragraph({
            spacing: { before: convertInchesToTwip(0.25) },
          })
        );
      }

      if (text) {
        emitParagraphs(text, paragraphs);
      }
    }

    const children = childMap.get(node.id);
    if (children && children.length > 0) {
      sortNodes(children).forEach(renderNode);
    }
  };

  sortNodes(rootNodes).forEach(renderNode);

  return new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Times New Roman',
            size: 24, // 12 pt
          },
          paragraph: {
            spacing: {
              line: 360, // 1.5 line spacing (standard manuscript)
              lineRule: LineRuleType.AUTO,
              before: 0,
              after: 0,
            },
          },
        },
      },
    },
    sections: [
      {
        properties: {
          titlePage: true, // Suppresses headers/footers on page 1 (title page)
          page: {
            margin: {
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { after: 120 },
                children: [
                  new TextRun({
                    text: `${project.author ? `${project.author} / ` : ''}${project.title}`,
                    size: 20, // 10 pt
                    color: '777777',
                    font: 'Times New Roman',
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 22,
                    font: 'Times New Roman',
                  }),
                ],
              }),
            ],
          }),
        },
        children: paragraphs,
      },
    ],
  });
}

function emitParagraphs(text: string, paragraphs: Paragraph[]): void {
  const rawParagraphs = text.split(/\n\s*\n/);
  for (const raw of rawParagraphs) {
    const trimmed = raw.trim();
    if (!trimmed) continue;

    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        indent: {
          firstLine: convertInchesToTwip(0.5), // Standard 0.5-inch paragraph indent
        },
        spacing: {
          line: 360, // 1.5 line spacing
          lineRule: LineRuleType.AUTO,
          before: 0,
          after: 0,
        },
        children: [
          new TextRun({
            text: trimmed,
            size: 24, // 12 pt
            font: 'Times New Roman',
          }),
        ],
      })
    );
  }
}

/**
 * Compiles manuscript into a binary .docx Blob ready for browser download.
 */
export async function compileManuscriptDocx(
  project: Project,
  nodes: ManuscriptNode[],
  documents: Record<string, { content_text?: string }>,
  options: CompileOptions
): Promise<Blob> {
  const doc = createDocxDocument(project, nodes, documents, options);
  return Packer.toBlob(doc);
}

/**
 * Compiles manuscript into an Office Open XML (.docx) Base64 string for direct filesystem persistence.
 */
export async function compileManuscriptDocxBase64(
  project: Project,
  nodes: ManuscriptNode[],
  documents: Record<string, { content_text?: string }>,
  options: CompileOptions
): Promise<string> {
  const doc = createDocxDocument(project, nodes, documents, options);
  return Packer.toBase64String(doc);
}
