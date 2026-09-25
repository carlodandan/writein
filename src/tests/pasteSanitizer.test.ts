import { describe, it, expect } from 'vitest';
import { sanitizePastedHTML, convertHtmlToPlainParagraphs } from '../utils/pasteSanitizer';

describe('pasteSanitizer', () => {
  describe('match-style behavior', () => {
    it('strips inline styles, classes, and colors while keeping bold and italic', () => {
      const input = `
        <p style="font-family: Arial; font-size: 24px; color: red; background-color: yellow;">
          This is <span style="font-weight: bold; color: blue;">bold text</span> and <i>italic text</i>.
        </p>
      `;

      const result = sanitizePastedHTML(input, 'match-style');

      // Styles and classes stripped
      expect(result).not.toContain('font-family');
      expect(result).not.toContain('color:');
      expect(result).not.toContain('background-color');
      expect(result).not.toContain('font-size');
      expect(result).not.toContain('style=');

      // Semantic tags preserved
      expect(result).toContain('<strong>bold text</strong>');
      expect(result).toContain('<i>italic text</i>');
      expect(result).toContain('<p>');
    });

    it('handles Google Docs clipboard HTML with normal-weight outer <b> tag and 700-weight spans', () => {
      const googleDocsHtml = `
        <b style="font-weight:normal;" id="docs-internal-guid-1234">
          <p dir="ltr" style="line-height:1.38;margin-top:0pt;margin-bottom:0pt;">
            <span style="font-size:11pt;font-family:Arial;color:#000000;font-weight:400;">Normal beginning. </span>
            <span style="font-size:11pt;font-family:Arial;color:#000000;font-weight:700;">Bold announcement! </span>
            <span style="font-size:11pt;font-family:Arial;color:#000000;font-style:italic;">Italic whisper.</span>
          </p>
        </b>
      `;

      const result = sanitizePastedHTML(googleDocsHtml, 'match-style');

      // The outer b tag with normal weight should not make the entire paragraph bold
      expect(result).not.toContain('<b>Normal beginning');
      expect(result).not.toContain('<strong>Normal beginning');

      // The font-weight:700 span should be converted to <strong>
      expect(result).toContain('<strong>Bold announcement! </strong>');

      // The font-style:italic span should be converted to <em>
      expect(result).toContain('<em>Italic whisper.</em>');

      // All Google Docs styles, ids, and dirs stripped
      expect(result).not.toContain('docs-internal-guid');
      expect(result).not.toContain('dir="ltr"');
      expect(result).not.toContain('style=');
    });

    it('cleans Microsoft Word HTML with MsoNormal classes and style blocks', () => {
      const wordHtml = `
        <html>
          <head>
            <style>
              p.MsoNormal { font-family: "Calibri", sans-serif; color: #1F3864; font-size: 11pt; }
            </style>
          </head>
          <body>
            <p class="MsoNormal" style="margin-bottom:0cm;line-height:normal;background:white">
              <span style="font-size:12.0pt;font-family:'Times New Roman',serif;color:#333333">
                Chapter one was dark. <b>The raven</b> croaked loudly.
              </span>
            </p>
          </body>
        </html>
      `;

      const result = sanitizePastedHTML(wordHtml, 'match-style');

      expect(result).not.toContain('<style>');
      expect(result).not.toContain('MsoNormal');
      expect(result).not.toContain('Calibri');
      expect(result).not.toContain('1F3864');
      expect(result).not.toContain('style=');
      expect(result).toContain('<b>The raven</b>');
      expect(result).toContain('Chapter one was dark.');
    });

    it('converts minor headings (h4-h6) to h3 and unwraps divs into paragraphs', () => {
      const input = `
        <div><h4>Sub-heading level 4</h4></div>
        <div>Just a regular paragraph inside a div container.</div>
      `;

      const result = sanitizePastedHTML(input, 'match-style');

      expect(result).toContain('<h3>Sub-heading level 4</h3>');
      expect(result).not.toContain('<h4>');
      expect(result).toContain('<p>Just a regular paragraph inside a div container.</p>');
      expect(result).not.toContain('<div>');
    });

    it('strips images, svg, and scripts', () => {
      const input = `
        <p>Text before <img src="https://example.com/ad.png" alt="ad" /> text after.</p>
        <script>alert('xss');</script>
        <svg><circle r="10" /></svg>
      `;

      const result = sanitizePastedHTML(input, 'match-style');

      expect(result).not.toContain('<img');
      expect(result).not.toContain('<script');
      expect(result).not.toContain('<svg');
      expect(result).toContain('<p>Text before  text after.</p>');
    });
  });

  describe('plain-text behavior', () => {
    it('converts HTML content to clean unformatted paragraphs', () => {
      const input = `
        <h1 style="color: red;">Title</h1>
        <p>Paragraph with <b>bold</b> and <span style="font-style: italic;">italics</span>.</p>
        <p>Second paragraph with <a href="https://example.com">a link</a>.</p>
      `;

      const result = sanitizePastedHTML(input, 'plain-text');

      expect(result).toContain('<p>Title</p>');
      expect(result).toContain('<p>Paragraph with bold and italics.</p>');
      expect(result).toContain('<p>Second paragraph with a link.</p>');
      expect(result).not.toContain('<b>');
      expect(result).not.toContain('<i>');
      expect(result).not.toContain('<em>');
      expect(result).not.toContain('<h1>');
      expect(result).not.toContain('<a href');
    });

    it('escapes HTML special characters in plain text mode', () => {
      const input = `<p>5 &lt; 10 &amp; 20 &gt; 15</p>`;
      const result = sanitizePastedHTML(input, 'plain-text');

      expect(result).toContain('&lt;');
      expect(result).toContain('&amp;');
      expect(result).toContain('&gt;');
    });
  });

  describe('keep-format behavior', () => {
    it('passes through original HTML untouched', () => {
      const rawHtml = '<div class="custom-class" style="color: magenta;">Unchanged content</div>';
      const result = sanitizePastedHTML(rawHtml, 'keep-format');

      expect(result).toBe(rawHtml);
    });
  });

  describe('edge cases', () => {
    it('returns empty string for empty or non-string input', () => {
      expect(sanitizePastedHTML('', 'match-style')).toBe('');
      // @ts-expect-error testing invalid type
      expect(sanitizePastedHTML(null, 'match-style')).toBe('');
      // @ts-expect-error testing invalid type
      expect(sanitizePastedHTML(undefined, 'match-style')).toBe('');
    });

    it('convertHtmlToPlainParagraphs falls back to raw text lines', () => {
      const plainString = 'First line\nSecond line\nThird line';
      const result = convertHtmlToPlainParagraphs(plainString);

      expect(result).toBe('<p>First line</p><p>Second line</p><p>Third line</p>');
    });
  });
});
