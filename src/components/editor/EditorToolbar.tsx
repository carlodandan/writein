import React from 'react';
import type { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Minus,
  Undo,
  Redo,
  Search,
  History,
  SlidersHorizontal,
} from 'lucide-react';

interface EditorToolbarProps {
  editor: Editor | null;
  onToggleFind: () => void;
  isFindOpen: boolean;
  onToggleHistory?: () => void;
  onTogglePreferences?: () => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  editor,
  onToggleFind,
  isFindOpen,
  onToggleHistory,
  onTogglePreferences,
}) => {
  if (!editor) return null;

  const btnClass = (isActive: boolean, disabled: boolean = false) =>
    `p-1.5 rounded transition-colors ${
      disabled
        ? 'opacity-30 cursor-not-allowed text-[var(--ink-muted)]'
        : isActive
        ? 'bg-[var(--paper-desk)] text-[var(--amber-accent)] font-semibold shadow-xs'
        : 'text-[var(--ink-secondary)] hover:bg-[var(--paper-desk-hover)] hover:text-[var(--ink-primary)]'
    }`;

  const divider = <div className="w-[1px] h-4 bg-[var(--paper-border)] mx-1 self-center" />;

  return (
    <div className="h-10 border-b border-[var(--paper-border)] bg-[var(--paper-surface)] flex items-center px-3 gap-0.5 select-none overflow-x-auto shrink-0 transition-colors">
      {/* Headings */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={btnClass(editor.isActive('heading', { level: 1 }))}
        title="Chapter Title (H1)"
      >
        <Heading1 className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={btnClass(editor.isActive('heading', { level: 2 }))}
        title="Section Title (H2)"
      >
        <Heading2 className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={btnClass(editor.isActive('heading', { level: 3 }))}
        title="Subhead (H3)"
      >
        <Heading3 className="w-4 h-4" />
      </button>

      {divider}

      {/* Inline Formatting */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={btnClass(editor.isActive('bold'))}
        title="Bold (Ctrl+B)"
      >
        <Bold className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={btnClass(editor.isActive('italic'))}
        title="Italic (Ctrl+I)"
      >
        <Italic className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={btnClass(editor.isActive('underline'))}
        title="Underline (Ctrl+U)"
      >
        <UnderlineIcon className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={btnClass(editor.isActive('strike'))}
        title="Strikethrough"
      >
        <Strikethrough className="w-4 h-4" />
      </button>

      {divider}

      {/* Block Formats */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={btnClass(editor.isActive('blockquote'))}
        title="Blockquote (> space)"
      >
        <Quote className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={btnClass(editor.isActive('bulletList'))}
        title="Bullet List (- space)"
      >
        <List className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={btnClass(editor.isActive('orderedList'))}
        title="Numbered List (1. space)"
      >
        <ListOrdered className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        className={btnClass(false)}
        title="Scene Break / Horizontal Rule (---)"
      >
        <Minus className="w-4 h-4" />
      </button>

      {divider}

      {/* Alignment */}
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        className={btnClass(editor.isActive({ textAlign: 'left' }))}
        title="Align Left"
      >
        <AlignLeft className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        className={btnClass(editor.isActive({ textAlign: 'center' }))}
        title="Align Center"
      >
        <AlignCenter className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        className={btnClass(editor.isActive({ textAlign: 'right' }))}
        title="Align Right"
      >
        <AlignRight className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        className={btnClass(editor.isActive({ textAlign: 'justify' }))}
        title="Justify"
      >
        <AlignJustify className="w-4 h-4" />
      </button>

      {divider}

      {/* Undo / Redo */}
      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className={btnClass(false, !editor.can().undo())}
        title="Undo (Ctrl+Z)"
      >
        <Undo className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className={btnClass(false, !editor.can().redo())}
        title="Redo (Ctrl+Y)"
      >
        <Redo className="w-4 h-4" />
      </button>

      {/* Find, History & Preferences */}
      <div className="ml-auto flex items-center space-x-0.5">
        {onToggleHistory && (
          <button
            type="button"
            onClick={onToggleHistory}
            className={btnClass(false)}
            title="Version History & Snapshots"
          >
            <History className="w-4 h-4" />
          </button>
        )}

        {onTogglePreferences && (
          <button
            type="button"
            onClick={onTogglePreferences}
            className={btnClass(false)}
            title="Editor Preferences (Fonts, Spacing)"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        )}

        {divider}

        <button
          type="button"
          onClick={onToggleFind}
          className={btnClass(isFindOpen)}
          title="Find within document (Ctrl+F)"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
