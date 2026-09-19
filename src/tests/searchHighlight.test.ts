import { describe, it, expect } from 'vitest';
import React from 'react';
import { highlightMatch } from '../utils/textHighlight';

describe('Search Text Highlight Helper', () => {
  it('handles null, undefined, or empty text gracefully', () => {
    expect(highlightMatch(null, 'query')).toBeNull();
    expect(highlightMatch(undefined, 'query')).toBeNull();
    expect(highlightMatch('', 'query')).toBeNull();
  });

  it('returns original text if query is empty or whitespace', () => {
    expect(highlightMatch('A mysterious letter arrived', '')).toBe('A mysterious letter arrived');
    expect(highlightMatch('A mysterious letter arrived', '   ')).toBe('A mysterious letter arrived');
  });

  it('highlights matched word case-insensitively', () => {
    const res = highlightMatch('Detective Vance inspected the desk', 'vance') as React.ReactElement[];
    expect(Array.isArray(res)).toBe(true);

    const markElement = res.find(
      (node) => React.isValidElement(node) && (node.type === 'mark'),
    );
    expect(markElement).toBeDefined();
    expect((markElement as React.ReactElement<{ children: React.ReactNode }>).props.children).toBe('Vance');
  });

  it('supports partial substring matches', () => {
    const res = highlightMatch('The clocktower chimed', 'clock') as React.ReactElement[];
    expect(Array.isArray(res)).toBe(true);

    const markElement = res.find(
      (node) => React.isValidElement(node) && (node.type === 'mark'),
    );
    expect(markElement).toBeDefined();
    expect((markElement as React.ReactElement<{ children: React.ReactNode }>).props.children).toBe('clock');
  });

  it('safely escapes special regex characters in the query', () => {
    expect(() => {
      highlightMatch('Formula (X+Y) is complete', '(X+Y)');
    }).not.toThrow();

    const res = highlightMatch('Formula (X+Y) is complete', '(X+Y)') as React.ReactElement[];
    const markElement = res.find(
      (node) => React.isValidElement(node) && (node.type === 'mark'),
    );
    expect(markElement).toBeDefined();
    expect((markElement as React.ReactElement<{ children: React.ReactNode }>).props.children).toBe('(X+Y)');
  });
});
