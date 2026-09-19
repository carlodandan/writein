import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import { EditorToolbar } from './EditorToolbar';
import { EditorStatus } from './EditorStatus';
import { FindReplaceBar } from './FindReplaceBar';
import { useManuscript } from '../../context/ManuscriptContext';
import { countWordsAndCharacters } from '../../utils/wordCount';
import { PenTool } from 'lucide-react';

interface EditorProps {
  isDistractionFree?: boolean;
}

export const Editor: React.FC<EditorProps> = ({ isDistractionFree = false }) => {
  const {
    activeNode,
    activeDocument,
    saveStatus,
    lastSavedTime,
    saveCurrentDocument,
    renameNode,
  } = useManuscript();

  const [isFindOpen, setIsFindOpen] = useState(false);
  const [liveWordCount, setLiveWordCount] = useState(0);
  const [liveCharCount, setLiveCharCount] = useState(0);
  const [liveCharNoSpaces, setLiveCharNoSpaces] = useState(0);

  // Convenient page title editing
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');

  useEffect(() => {
    if (activeNode) {
      setTitleInput(activeNode.title);
      setIsEditingTitle(false);
    }
  }, [activeNode?.id, activeNode?.title]);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorRef = useRef<any>(null);

  const performSave = useCallback(
    (editorInstance: any) => {
      if (!editorInstance) return;
      const json = JSON.stringify(editorInstance.getJSON());
      const text = editorInstance.getText();
      const counts = countWordsAndCharacters(text);

      setLiveWordCount(counts.words);
      setLiveCharCount(counts.characters);
      setLiveCharNoSpaces(counts.charactersNoSpaces);

      saveCurrentDocument(json, text, counts.words, counts.characters);
    },
    [saveCurrentDocument]
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder: 'The morning mist clung to the damp stones...',
      }),
    ],
    editorProps: {
      attributes: {
        class:
          'font-serif-novel prose dark:prose-invert max-w-none focus:outline-hidden text-base leading-relaxed text-[var(--ink-primary)] min-h-[500px]',
      },
    },
    onUpdate: ({ editor: ed }) => {
      const text = ed.getText();
      const counts = countWordsAndCharacters(text);
      setLiveWordCount(counts.words);
      setLiveCharCount(counts.characters);
      setLiveCharNoSpaces(counts.charactersNoSpaces);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        performSave(ed);
      }, 1000);
    },
  });

  editorRef.current = editor;

  // Sync content when active document changes
  useEffect(() => {
    if (!editor || !activeDocument) return;

    // Check if content differs to prevent resetting cursor
    if (activeDocument.content_json) {
      try {
        const parsed = JSON.parse(activeDocument.content_json);
        editor.commands.setContent(parsed);
      } catch {
        editor.commands.setContent(activeDocument.content_text || '');
      }
    } else {
      editor.commands.setContent(activeDocument.content_text || '');
    }

    const counts = countWordsAndCharacters(activeDocument.content_text);
    setLiveWordCount(counts.words);
    setLiveCharCount(counts.characters);
    setLiveCharNoSpaces(counts.charactersNoSpaces);
  }, [editor, activeDocument]);

  // Unsaved content protection: flush pending save when switching chapters or on page unload
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current && editorRef.current) {
        clearTimeout(debounceTimerRef.current);
        performSave(editorRef.current);
      }
    };
  }, [activeNode?.id, performSave]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (debounceTimerRef.current && editorRef.current) {
        clearTimeout(debounceTimerRef.current);
        performSave(editorRef.current);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [performSave]);

  // Keyboard shortcuts listener: Ctrl+S and Ctrl+F
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        performSave(editorRef.current);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsFindOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [performSave]);

  if (!activeNode) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 select-none text-[var(--ink-muted)]">
        <div className="text-center space-y-2">
          <PenTool className="w-8 h-8 mx-auto text-[var(--ink-muted)] opacity-40" />
          <p className="text-sm">Select a chapter or scene from the manuscript tree to start writing.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--paper-bg)] overflow-hidden">
      {/* Editor Toolbar (hidden in distraction-free mode if requested) */}
      {!isDistractionFree && (
        <EditorToolbar
          editor={editor}
          onToggleFind={() => setIsFindOpen(!isFindOpen)}
          isFindOpen={isFindOpen}
        />
      )}

      {/* Find & Replace Bar */}
      <FindReplaceBar
        editor={editor}
        isOpen={isFindOpen}
        onClose={() => setIsFindOpen(false)}
      />

      {/* Writing Surface */}
      <div className="flex-1 overflow-y-auto px-6 py-10 flex justify-center">
        <div
          className={`w-full bg-[var(--paper-surface)] border border-[var(--paper-border)] shadow-xs rounded-xl transition-all duration-200 ${
            isDistractionFree
              ? 'max-w-3xl p-14 sm:p-20 my-2'
              : 'max-w-3xl p-10 sm:p-14 my-4'
          }`}
        >
          {/* Chapter / Scene Header */}
          <div className="mb-8 pb-4 border-b border-[var(--paper-border-subtle)]">
            <span className="text-[11px] uppercase tracking-widest font-mono text-[var(--ink-muted)] block mb-1">
              {activeNode.node_type}
            </span>
            {isEditingTitle ? (
              <input
                type="text"
                autoFocus
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onBlur={async () => {
                  if (titleInput.trim() && titleInput.trim() !== activeNode.title) {
                    await renameNode(activeNode.id, titleInput.trim());
                  } else {
                    setTitleInput(activeNode.title);
                  }
                  setIsEditingTitle(false);
                }}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    if (titleInput.trim() && titleInput.trim() !== activeNode.title) {
                      await renameNode(activeNode.id, titleInput.trim());
                    } else {
                      setTitleInput(activeNode.title);
                    }
                    setIsEditingTitle(false);
                  } else if (e.key === 'Escape') {
                    setTitleInput(activeNode.title);
                    setIsEditingTitle(false);
                  }
                }}
                className="font-serif-novel text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink-primary)] bg-transparent border-b-2 border-[var(--amber-accent)] focus:outline-hidden w-full"
              />
            ) : (
              <h1
                onClick={() => setIsEditingTitle(true)}
                title="Click to edit title"
                className="font-serif-novel text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink-primary)] cursor-pointer hover:opacity-80 transition-opacity"
              >
                {activeNode.title}
              </h1>
            )}
            {activeNode.synopsis && (
              <p className="font-serif-novel text-sm text-[var(--ink-secondary)] italic mt-1.5">
                {activeNode.synopsis}
              </p>
            )}
          </div>

          {/* TipTap Rich Text Editor Surface */}
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Editor Status Bar */}
      <EditorStatus
        saveStatus={saveStatus}
        lastSavedTime={lastSavedTime}
        wordCount={liveWordCount}
        characterCount={liveCharCount}
        characterCountNoSpaces={liveCharNoSpaces}
      />
    </div>
  );
};
