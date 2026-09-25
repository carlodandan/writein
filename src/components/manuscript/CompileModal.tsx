import React, { useState, useEffect } from 'react';
import {
  X,
  BookDown,
  FileText,
  Code,
  Globe,
  Download,
  Eye,
  Sliders,
  FileType,
  FolderOpen,
  CheckCircle2,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { useManuscript } from '../../context/ManuscriptContext';
import { exportService } from '../../services/exportService';
import { manuscriptService } from '../../services/manuscriptService';
import { compileManuscriptDocxBase64 } from '../../utils/docxCompiler';
import type {
  CompileOptions,
  CompileResult,
  ExportFormat,
  ChapterHeaderFormat,
  SceneSeparator,
} from '../../types/exportImport';

interface CompileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CompileModal: React.FC<CompileModalProps> = ({ isOpen, onClose }) => {
  const { currentProject } = useProject();
  const { nodes } = useManuscript();

  const [activeTab, setActiveTab] = useState<'configure' | 'preview'>('configure');
  const [format, setFormat] = useState<ExportFormat>('markdown');
  const [includeTitlePage, setIncludeTitlePage] = useState(true);
  const [includeTableOfContents, setIncludeTableOfContents] = useState(true);
  const [chapterHeaderFormat, setChapterHeaderFormat] = useState<ChapterHeaderFormat>('numbered_with_title');
  const [sceneSeparator, setSceneSeparator] = useState<SceneSeparator>('* * *');

  const [isCompiling, setIsCompiling] = useState(false);
  const [compileResult, setCompileResult] = useState<CompileResult | null>(null);
  const [isExportingBible, setIsExportingBible] = useState(false);
  const [exportStatus, setExportStatus] = useState<{ path?: string | null; message: string; isError?: boolean } | null>(null);

  useEffect(() => {
    if (isOpen && currentProject) {
      setExportStatus(null);
      handleGeneratePreview();
    }
  }, [
    isOpen,
    currentProject?.id,
    format,
    includeTitlePage,
    includeTableOfContents,
    chapterHeaderFormat,
    sceneSeparator,
  ]);

  const handleGeneratePreview = async () => {
    if (!currentProject) return;
    try {
      const options: CompileOptions = {
        format,
        includeTitlePage,
        includeTableOfContents,
        chapterHeaderFormat,
        sceneSeparator,
      };
      const result = await exportService.compileManuscript(currentProject.id, options);
      setCompileResult(result);
    } catch (err) {
      console.warn('Failed to compile manuscript preview:', err);
    }
  };

  const handleExportManuscript = async () => {
    if (!currentProject || !compileResult) return;
    setIsCompiling(true);
    setExportStatus(null);
    try {
      if (format === 'docx') {
        const activeNodes = (nodes || []).filter((n) => !n.archived_at);
        const docMap: Record<string, { content_text?: string }> = {};

        await Promise.all(
          activeNodes.map(async (n) => {
            const doc = await manuscriptService.getDocument(n.id);
            docMap[n.id] = { content_text: doc.content_text };
          })
        );

        const options: CompileOptions = {
          format,
          includeTitlePage,
          includeTableOfContents,
          chapterHeaderFormat,
          sceneSeparator,
        };

        const b64 = await compileManuscriptDocxBase64(currentProject, nodes, docMap, options);
        const fileName =
          compileResult.fileName ||
          (compileResult as any).file_name ||
          `${currentProject.title.toLowerCase().replace(/\s+/g, '_')}.docx`;

        const res = await exportService.exportAndSaveFile({
          fileName,
          contentBase64: b64,
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          extensions: ['docx'],
          filterName: 'Word Document',
        });

        if (res.saved) {
          setExportStatus({
            path: res.filePath,
            message: res.filePath ? `Exported: ${fileName}` : `Downloaded: ${fileName}`,
          });
        }
      } else {
        const mimeType =
          format === 'html' ? 'text/html' : format === 'markdown' ? 'text/markdown' : 'text/plain';
        const ext = format === 'html' ? 'html' : format === 'markdown' ? 'md' : 'txt';
        const fileName =
          compileResult.fileName ||
          (compileResult as any).file_name ||
          `${currentProject.title.toLowerCase().replace(/\s+/g, '_')}.${ext}`;

        const res = await exportService.exportAndSaveFile({
          fileName,
          contentText: compileResult.content,
          mimeType,
          extensions: [ext],
          filterName:
            format === 'html'
              ? 'HTML Document'
              : format === 'markdown'
              ? 'Markdown Document'
              : 'Text Document',
        });

        if (res.saved) {
          setExportStatus({
            path: res.filePath,
            message: res.filePath ? `Exported: ${fileName}` : `Downloaded: ${fileName}`,
          });
        }
      }
    } catch (err: any) {
      console.warn('Export failed:', err);
      setExportStatus({
        message: `Export failed: ${err?.message || 'Unknown error'}`,
        isError: true,
      });
    } finally {
      setIsCompiling(false);
    }
  };

  const handleExportStoryBible = async () => {
    if (!currentProject) return;
    setIsExportingBible(true);
    setExportStatus(null);
    try {
      const result = await exportService.exportStoryBible(currentProject.id, 'markdown');
      const fileName =
        result.fileName ||
        (result as any).file_name ||
        `${currentProject.title.toLowerCase().replace(/\s+/g, '_')}_story_bible.md`;

      const res = await exportService.exportAndSaveFile({
        fileName,
        contentText: result.content,
        mimeType: 'text/markdown',
        extensions: ['md'],
        filterName: 'Markdown Document',
      });

      if (res.saved) {
        setExportStatus({
          path: res.filePath,
          message: res.filePath ? `Exported: ${fileName}` : `Downloaded: ${fileName}`,
        });
      }
    } catch (err: any) {
      console.warn('Story bible export failed:', err);
      setExportStatus({
        message: `Story bible export failed: ${err?.message || 'Unknown error'}`,
        isError: true,
      });
    } finally {
      setIsExportingBible(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-[var(--paper-surface)] border border-[var(--paper-border)] w-full max-w-4xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-14 border-b border-[var(--paper-border)] px-6 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <BookDown className="w-5 h-5 text-[var(--amber-accent)]" />
            <h2 className="font-serif-novel text-lg font-bold text-[var(--ink-primary)]">
              Compile & Export Manuscript
            </h2>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex bg-[var(--paper-desk)] p-1 rounded-lg border border-[var(--paper-border-subtle)] text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('configure')}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'configure'
                    ? 'bg-[var(--paper-surface)] text-[var(--amber-accent)] font-semibold shadow-xs'
                    : 'text-[var(--ink-muted)] hover:text-[var(--ink-primary)]'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Configure</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'preview'
                    ? 'bg-[var(--paper-surface)] text-[var(--amber-accent)] font-semibold shadow-xs'
                    : 'text-[var(--ink-muted)] hover:text-[var(--ink-primary)]'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Live Preview</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--paper-desk-hover)] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'configure' ? (
            <div className="p-8 max-w-2xl mx-auto space-y-8 text-sm">
              {/* Target Format */}
              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)] block">
                  Export Format
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { id: 'docx', label: 'MS Word (.docx)', icon: FileType, desc: 'Office Open XML standard' },
                    { id: 'markdown', label: 'Markdown (.md)', icon: Code, desc: 'Preserves headings & styling' },
                    { id: 'text', label: 'Plain Text (.txt)', icon: FileText, desc: 'Standard submission format' },
                    { id: 'html', label: 'Printable HTML (.html)', icon: Globe, desc: 'Book layout for print to PDF' },
                  ].map((f) => {
                    const Icon = f.icon;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFormat(f.id as ExportFormat)}
                        className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                          format === f.id
                            ? 'border-[var(--amber-accent)] bg-[var(--paper-desk)] shadow-xs text-[var(--ink-primary)] ring-1 ring-[var(--amber-accent)]'
                            : 'border-[var(--paper-border-subtle)] hover:bg-[var(--paper-desk-hover)] text-[var(--ink-secondary)]'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <Icon className="w-4 h-4 text-[var(--amber-accent)]" />
                          <span className="font-semibold text-xs">{f.label}</span>
                        </div>
                        <span className="text-[11px] text-[var(--ink-muted)] mt-1.5">{f.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Front Matter & Structure */}
              <div className="space-y-3 pt-4 border-t border-[var(--paper-border-subtle)]">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)] block">
                  Manuscript Structure
                </label>
                <div className="space-y-2">
                  <label className="flex items-center justify-between p-3 rounded-lg border border-[var(--paper-border-subtle)] bg-[var(--paper-desk)] cursor-pointer">
                    <div>
                      <div className="text-xs font-medium text-[var(--ink-primary)]">Include Title Page</div>
                      <div className="text-[11px] text-[var(--ink-muted)]">
                        Generates title, subtitle, author, and genre header
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={includeTitlePage}
                      onChange={(e) => setIncludeTitlePage(e.target.checked)}
                      className="w-4 h-4 accent-[var(--amber-accent)] rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-lg border border-[var(--paper-border-subtle)] bg-[var(--paper-desk)] cursor-pointer">
                    <div>
                      <div className="text-xs font-medium text-[var(--ink-primary)]">Include Table of Contents</div>
                      <div className="text-[11px] text-[var(--ink-muted)]">
                        Generates a chapter list at the front of the manuscript
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={includeTableOfContents}
                      onChange={(e) => setIncludeTableOfContents(e.target.checked)}
                      className="w-4 h-4 accent-[var(--amber-accent)] rounded cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Formatting Styles */}
              <div className="space-y-4 pt-4 border-t border-[var(--paper-border-subtle)]">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)] block">
                  Chapter & Scene Formatting
                </label>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <span className="text-xs font-medium text-[var(--ink-secondary)]">Chapter Heading Style</span>
                    <select
                      value={chapterHeaderFormat}
                      onChange={(e) => setChapterHeaderFormat(e.target.value as ChapterHeaderFormat)}
                      className="w-full text-xs p-2 rounded-lg border border-[var(--paper-border-subtle)] bg-[var(--paper-desk)] text-[var(--ink-primary)] focus:outline-hidden"
                    >
                      <option value="numbered_with_title">Chapter 1: Title</option>
                      <option value="numbered_only">Chapter 1</option>
                      <option value="title_only">Title Only</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-xs font-medium text-[var(--ink-secondary)]">Scene Break Separator</span>
                    <select
                      value={sceneSeparator}
                      onChange={(e) => setSceneSeparator(e.target.value as SceneSeparator)}
                      className="w-full text-xs p-2 rounded-lg border border-[var(--paper-border-subtle)] bg-[var(--paper-desk)] text-[var(--ink-primary)] focus:outline-hidden"
                    >
                      <option value="* * *">* * * (Traditional)</option>
                      <option value="###">### (Markdown style)</option>
                      <option value="---">--- (Horizontal Rule)</option>
                      <option value="blank_line">Blank Line Only</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Extra: Story Bible Export Button */}
              <div className="p-4 rounded-xl border border-[var(--paper-border-subtle)] bg-[var(--paper-desk)] flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-[var(--ink-primary)] flex items-center gap-1.5">
                    <span>Story Bible Dossier</span>
                  </div>
                  <p className="text-[11px] text-[var(--ink-muted)] mt-0.5">
                    Export all characters, locations, lore, notes, and timeline into a reference dossier (.md)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportStoryBible}
                  disabled={isExportingBible}
                  className="px-3 py-1.5 rounded-md border border-[var(--paper-border)] bg-[var(--paper-surface)] text-xs font-medium text-[var(--ink-primary)] hover:bg-[var(--paper-desk-hover)] transition-colors shrink-0"
                >
                  {isExportingBible ? 'Exporting...' : 'Export Dossier'}
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              {compileResult && (() => {
                const fileName = compileResult.fileName || (compileResult as any).file_name || 'manuscript';
                const wordCount = compileResult.wordCount ?? (compileResult as any).word_count ?? 0;
                const charCount = compileResult.characterCount ?? (compileResult as any).character_count ?? 0;
                return (
                  <div className="h-9 border-b border-[var(--paper-border)] bg-[var(--paper-desk)] px-6 flex items-center justify-between text-xs text-[var(--ink-muted)] font-mono">
                    <span>File: {fileName}</span>
                    <span>
                      {wordCount.toLocaleString()} words • {charCount.toLocaleString()} chars
                    </span>
                  </div>
                );
              })()}
              <div className="flex-1 p-6 overflow-y-auto font-mono text-xs text-[var(--ink-primary)] bg-[var(--paper-bg)] whitespace-pre-wrap selection:bg-[var(--amber-accent)]/20">
                {compileResult?.content || 'Generating preview...'}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--paper-border)] bg-[var(--paper-surface)] flex items-center justify-between">
          <div className="flex items-center space-x-3 text-xs">
            <span className="text-[var(--ink-muted)] font-mono">
              {nodes.filter((n) => !n.archived_at).length} sections selected
            </span>
            {exportStatus && (
              <div
                className={`flex items-center space-x-2 px-2.5 py-1 rounded-md border text-xs ${
                  exportStatus.isError
                    ? 'text-red-500 bg-red-500/10 border-red-500/20'
                    : 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                }`}
              >
                {!exportStatus.isError && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                <span className="truncate max-w-[240px]">{exportStatus.message}</span>
                {exportStatus.path && (
                  <button
                    type="button"
                    onClick={() => exportService.revealInFolder(exportStatus.path!)}
                    className="ml-1.5 flex items-center space-x-1 underline hover:opacity-80 font-semibold shrink-0 cursor-pointer"
                  >
                    <FolderOpen className="w-3 h-3" />
                    <span>Show in Folder</span>
                  </button>
                )}
              </div>
            )}
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
              onClick={handleExportManuscript}
              disabled={isCompiling || !compileResult}
              className="flex items-center space-x-2 px-5 py-2 rounded-lg bg-[var(--amber-accent)] text-white text-xs font-medium hover:opacity-90 transition-opacity shadow-xs disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isCompiling ? 'Compiling...' : 'Compile & Download'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
