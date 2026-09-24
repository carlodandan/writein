import React, { useState } from 'react';
import {
  X,
  Upload,
  FileText,
  BookOpen,
  Layers,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { useManuscript } from '../../context/ManuscriptContext';
import { importService } from '../../services/importService';
import type { ImportDetectedNode, ImportPreview } from '../../types/exportImport';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose }) => {
  const { currentProject, refreshProjects } = useProject();
  const { refreshTree } = useManuscript();

  const [rawText, setRawText] = useState('');
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'paste' | 'file'>('paste');

  const handleTextChange = (text: string) => {
    setRawText(text);
    if (text.trim()) {
      const p = importService.previewImport(text);
      setPreview(p);
    } else {
      setPreview(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = (event.target?.result as string) || '';
      handleTextChange(content);
    };
    reader.readAsText(file);
  };

  const handleCommitImport = async () => {
    const nodes = preview?.detectedNodes || (preview as any)?.detected_nodes;
    if (!currentProject || !preview || !nodes || nodes.length === 0) return;
    setIsImporting(true);
    try {
      await importService.commitImport({
        projectId: currentProject.id,
        items: nodes,
      });
      await refreshTree();
      await refreshProjects();
      onClose();
    } catch (err) {
      console.warn('Failed to commit import:', err);
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-[var(--paper-surface)] border border-[var(--paper-border)] w-full max-w-3xl h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-14 border-b border-[var(--paper-border)] px-6 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Upload className="w-5 h-5 text-[var(--amber-accent)]" />
            <h2 className="font-serif-novel text-lg font-bold text-[var(--ink-primary)]">
              Import Manuscript Draft
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--paper-desk-hover)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="px-6 pt-4 pb-2 border-b border-[var(--paper-border-subtle)] flex items-center space-x-3 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`px-3 py-1.5 rounded-md transition-colors font-medium ${
              activeTab === 'paste'
                ? 'bg-[var(--paper-desk)] text-[var(--amber-accent)] shadow-xs'
                : 'text-[var(--ink-muted)] hover:text-[var(--ink-primary)]'
            }`}
          >
            Paste Text / Markdown
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('file')}
            className={`px-3 py-1.5 rounded-md transition-colors font-medium ${
              activeTab === 'file'
                ? 'bg-[var(--paper-desk)] text-[var(--amber-accent)] shadow-xs'
                : 'text-[var(--ink-muted)] hover:text-[var(--ink-primary)]'
            }`}
          >
            Upload File (.md, .txt)
          </button>
        </div>

        {/* Body Split View */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Input */}
          <div className="w-1/2 p-5 border-r border-[var(--paper-border)] flex flex-col">
            {activeTab === 'file' ? (
              <div className="flex-1 border-2 border-dashed border-[var(--paper-border)] rounded-xl flex flex-col items-center justify-center p-6 text-center space-y-3 bg-[var(--paper-desk)]">
                <FileText className="w-10 h-10 text-[var(--ink-muted)] opacity-50" />
                <div>
                  <label className="cursor-pointer text-xs font-semibold text-[var(--amber-accent)] hover:underline">
                    Choose a file
                    <input
                      type="file"
                      accept=".txt,.md,.markdown"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <span className="text-xs text-[var(--ink-muted)]"> or drag & drop here</span>
                </div>
                <p className="text-[11px] text-[var(--ink-muted)]">
                  Supported formats: Markdown (.md) or Plain Text (.txt)
                </p>
              </div>
            ) : (
              <textarea
                value={rawText}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder="Paste your manuscript draft or outline here...&#10;&#10;Use '# Part', '## Chapter', or standard 'Chapter 1: Title' lines to automatically split into chapters."
                className="flex-1 w-full p-3.5 rounded-xl border border-[var(--paper-border-subtle)] bg-[var(--paper-desk)] text-xs font-mono text-[var(--ink-primary)] placeholder-[var(--ink-muted)] resize-none focus:outline-hidden focus:ring-1 focus:ring-[var(--amber-accent)]"
              />
            )}
          </div>

          {/* Right: Smart Detection Preview */}
          <div className="w-1/2 p-5 overflow-y-auto bg-[var(--paper-bg)] flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                Detected Structure
              </span>
              {preview && (() => {
                const totalNodes = preview.totalNodes ?? (preview as any).total_nodes ?? 0;
                const totalWords = preview.totalWords ?? (preview as any).total_words ?? 0;
                return (
                  <span className="text-xs font-mono text-[var(--amber-accent)] font-semibold">
                    {totalNodes} section(s) • {totalWords.toLocaleString()} words
                  </span>
                );
              })()}
            </div>

            {preview && ((preview.detectedNodes || (preview as any).detected_nodes)?.length ?? 0) > 0 ? (
              <div className="space-y-2 flex-1">
                {(preview.detectedNodes || (preview as any).detected_nodes).map(
                  (node: ImportDetectedNode, idx: number) => (
                    <DetectedNodeCard key={idx} node={node} />
                  )
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-[var(--ink-muted)] space-y-2">
                <Sparkles className="w-8 h-8 opacity-30 mx-auto" />
                <p className="text-xs">Paste text or upload a file to preview recognized chapters and scenes.</p>
                <p className="text-[10px] max-w-xs">
                  WriteIn recognizes Markdown headers (#, ##, ###) and conventional titles like "Chapter 1", "CHAPTER TWO", or "PROLOGUE".
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--paper-border)] bg-[var(--paper-surface)] flex items-center justify-between">
          <div className="text-xs text-[var(--ink-muted)]">
            Importing will add chapters to <span className="font-semibold text-[var(--ink-primary)]">{currentProject?.title}</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[var(--paper-border)] text-xs font-medium text-[var(--ink-secondary)] hover:bg-[var(--paper-desk-hover)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCommitImport}
              disabled={
                isImporting ||
                !preview ||
                ((preview.detectedNodes || (preview as any).detected_nodes)?.length ?? 0) === 0
              }
              className="flex items-center space-x-2 px-5 py-2 rounded-lg bg-[var(--amber-accent)] text-white text-xs font-medium hover:opacity-90 transition-opacity shadow-xs disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isImporting ? 'Importing...' : 'Import into Manuscript'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DetectedNodeCard: React.FC<{ node: ImportDetectedNode }> = ({ node }) => {
  const nodeType = node.nodeType || (node as any).node_type;
  const wordCount = node.wordCount ?? (node as any).word_count ?? 0;
  const children = node.children || (node as any).children;

  return (
    <div className="p-2.5 rounded-lg border border-[var(--paper-border-subtle)] bg-[var(--paper-surface)] text-xs space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {nodeType === 'part' ? (
            <Layers className="w-3.5 h-3.5 text-purple-500" />
          ) : nodeType === 'chapter' ? (
            <BookOpen className="w-3.5 h-3.5 text-[var(--amber-accent)]" />
          ) : (
            <FileText className="w-3.5 h-3.5 text-blue-500" />
          )}
          <span className="font-medium text-[var(--ink-primary)] truncate max-w-[180px]">
            {node.title}
          </span>
        </div>
        <span className="text-[10px] font-mono text-[var(--ink-muted)]">
          {wordCount.toLocaleString()} w
        </span>
      </div>

      {children && children.length > 0 && (
        <div className="pl-4 pt-1 border-l-2 border-[var(--paper-border)] space-y-1">
          {children.map((ch: ImportDetectedNode, idx: number) => (
            <DetectedNodeCard key={idx} node={ch} />
          ))}
        </div>
      )}
    </div>
  );
};
