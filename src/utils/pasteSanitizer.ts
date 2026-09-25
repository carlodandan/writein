import type { PasteBehavior } from '../types/phase5';

/**
 * Escapes characters for safe inclusion in HTML.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Replaces an element with its child nodes.
 */
function unwrap(el: Element) {
  const parent = el.parentNode;
  if (!parent) return;
  while (el.firstChild) {
    parent.insertBefore(el.firstChild, el);
  }
  parent.removeChild(el);
}

/**
 * Checks if an element has an ancestor with any of the specified tag names.
 */
function hasAncestor(el: Element, tagNames: string[]): boolean {
  let curr = el.parentElement;
  while (curr && curr.tagName.toLowerCase() !== 'body') {
    if (tagNames.includes(curr.tagName.toLowerCase())) return true;
    curr = curr.parentElement;
  }
  return false;
}

/**
 * Wraps all children of an element inside a wrapper element.
 */
function wrapInner(el: Element, wrapper: HTMLElement) {
  while (el.firstChild) {
    wrapper.appendChild(el.firstChild);
  }
  el.appendChild(wrapper);
}

/**
 * Converts HTML into clean plain-text paragraph tags (<p>text</p>).
 */
export function convertHtmlToPlainParagraphs(html: string): string {
  if (!html || typeof html !== 'string') return '';

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Remove script and style tags
  const removable = doc.querySelectorAll('script, style, noscript, meta, link, xml, iframe');
  removable.forEach((el) => el.remove());

  const blockSelector = 'p, h1, h2, h3, h4, h5, h6, li, blockquote, div, tr';
  const blocks = Array.from(doc.querySelectorAll(blockSelector));

  const paragraphs: string[] = [];

  if (blocks.length > 0) {
    blocks.forEach((el) => {
      // Don't treat container divs that have nested block elements as separate paragraphs
      if (el.tagName.toLowerCase() === 'div' && el.querySelector(blockSelector)) {
        return;
      }
      const text = el.textContent?.trim();
      if (text) {
        paragraphs.push(`<p>${escapeHtml(text)}</p>`);
      }
    });
  }

  // Fallback if no block elements were identified
  if (paragraphs.length === 0) {
    const rawText = doc.body.textContent || '';
    const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      paragraphs.push(`<p>${escapeHtml(line)}</p>`);
    }
  }

  return paragraphs.join('');
}

/**
 * Sanitizes pasted HTML for 'match-style' mode:
 * - Retains semantic text formatting: bold (strong/b), italic (em/i), strikethrough (s/del), underline (u),
 *   headings (h1-h3), blockquotes, lists, linebreaks.
 * - Converts style-based marks (e.g. Google Docs/Word font-weight:700 or font-style:italic) into semantic tags.
 * - Strips all inline styles (font-family, font-size, color, background-color, line-height).
 * - Strips all classes (e.g. MsoNormal, Tailwind classes).
 * - Removes non-semantic wrappers (font, unstyled span, empty divs).
 * - Strips images and script/style tags.
 */
function sanitizeMatchStyleHTML(doc: Document): string {
  // 1. Remove non-content tags
  const unwanted = doc.querySelectorAll(
    'style, script, noscript, meta, link, xml, iframe, svg, canvas, form, input, button, select, textarea, img'
  );
  unwanted.forEach((el) => el.remove());

  // Remove HTML comments
  const removeComments = (node: Node) => {
    for (let i = node.childNodes.length - 1; i >= 0; i--) {
      const child = node.childNodes[i];
      if (child.nodeType === 8) {
        node.removeChild(child);
      } else if (child.nodeType === 1) {
        removeComments(child);
      }
    }
  };
  removeComments(doc.body);

  // 2. Handle Google Docs quirk where whole clipboard is wrapped in <b style="font-weight:normal">
  const boldTags = Array.from(doc.querySelectorAll('b, strong'));
  boldTags.forEach((el) => {
    const htmlEl = el as HTMLElement;
    const fw = htmlEl.style?.fontWeight;
    if (fw === 'normal' || fw === '400') {
      unwrap(el);
    }
  });

  // 3. Convert style-based bold / italic / strike / underline on spans/fonts into semantic elements
  const styledElements = Array.from(doc.querySelectorAll('*')).filter((el) => {
    return el instanceof HTMLElement && el.getAttribute('style');
  }) as HTMLElement[];

  // Process innermost first
  for (let i = styledElements.length - 1; i >= 0; i--) {
    const el = styledElements[i];
    const fw = el.style.fontWeight;
    const isBold = fw === 'bold' || fw === 'bolder' || (parseInt(fw, 10) >= 600);
    const isItalic = el.style.fontStyle === 'italic' || el.style.fontStyle === 'oblique';
    const textDec = el.style.textDecoration || '';
    const isStrike = textDec.includes('line-through');
    const isUnderline = textDec.includes('underline');

    const tagName = el.tagName.toLowerCase();
    if (tagName === 'span' || tagName === 'font') {
      if (isBold && !hasAncestor(el, ['strong', 'b'])) {
        wrapInner(el, doc.createElement('strong'));
      }
      if (isItalic && !hasAncestor(el, ['em', 'i'])) {
        wrapInner(el, doc.createElement('em'));
      }
      if (isStrike && !hasAncestor(el, ['s', 'strike', 'del'])) {
        wrapInner(el, doc.createElement('s'));
      }
      if (isUnderline && !hasAncestor(el, ['u'])) {
        wrapInner(el, doc.createElement('u'));
      }
    }
  }

  // 4. Normalize headings (h4..h6 -> h3)
  const minorHeadings = doc.querySelectorAll('h4, h5, h6');
  minorHeadings.forEach((h) => {
    const h3 = doc.createElement('h3');
    while (h.firstChild) h3.appendChild(h.firstChild);
    h.replaceWith(h3);
  });

  // 5. Unwrap non-semantic containers
  const containerTags = doc.querySelectorAll('section, article, main, header, footer, aside, nav, font');
  containerTags.forEach((c) => unwrap(c));

  // 6. Handle divs: unwrap if they contain blocks, or convert to <p> if they contain inline text
  const divs = Array.from(doc.querySelectorAll('div'));
  divs.forEach((div) => {
    const hasBlockChild = div.querySelector('p, h1, h2, h3, blockquote, ul, ol, div');
    if (hasBlockChild) {
      unwrap(div);
    } else {
      const p = doc.createElement('p');
      while (div.firstChild) p.appendChild(div.firstChild);
      div.replaceWith(p);
    }
  });

  // 7. Strip styling, class, id, dir, and other foreign attributes
  const allElements = doc.querySelectorAll('*');
  allElements.forEach((el) => {
    const tag = el.tagName.toLowerCase();
    const attrs = Array.from(el.attributes);
    for (const attr of attrs) {
      const name = attr.name.toLowerCase();
      if (tag === 'a' && name === 'href') {
        continue;
      }
      if (tag === 'li' && name === 'value') {
        continue;
      }
      el.removeAttribute(attr.name);
    }
  });

  // 8. Unwrap all now-unstyled spans
  const spans = doc.querySelectorAll('span');
  spans.forEach((s) => unwrap(s));

  // 9. Remove redundant completely empty paragraphs (<p></p>), preserving <p><br></p>
  const paragraphs = Array.from(doc.querySelectorAll('p'));
  paragraphs.forEach((p) => {
    if (!p.hasChildNodes() || (p.childNodes.length === 1 && p.textContent === '')) {
      if (!p.querySelector('br')) {
        p.remove();
      }
    }
  });

  return doc.body.innerHTML;
}

/**
 * Sanitizes pasted clipboard HTML according to the user's selected preference:
 * - 'match-style': Inherits editor typography & theme while preserving semantic marks (bold, italic, etc.).
 * - 'keep-format': Retains original clipboard HTML structure and styles as permitted by TipTap.
 * - 'plain-text': Converts content to unformatted plain-text paragraphs.
 */
export function sanitizePastedHTML(
  html: string,
  behavior: PasteBehavior = 'match-style'
): string {
  if (behavior === 'keep-format') {
    return html;
  }

  if (!html || typeof html !== 'string') {
    return '';
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  if (behavior === 'plain-text') {
    return convertHtmlToPlainParagraphs(html);
  }

  return sanitizeMatchStyleHTML(doc);
}
