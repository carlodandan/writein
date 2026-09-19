import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Paperclip,
  Plus,
  Search,
  FileText,
  Image as ImageIcon,
  FileCode,
  Music,
  Archive,
  Trash2,
  ExternalLink,
  FolderOpen,
  Edit2,
  X,
  AlertCircle,
  Users,
  MapPin,
  BookOpen,
  StickyNote,
  Eye,
} from 'lucide-react';
import { useProject } from '../../../context/ProjectContext';
import { attachmentService } from '../../../services/attachmentService';
import { characterService } from '../../../services/characterService';
import { locationService } from '../../../services/locationService';
import { manuscriptService } from '../../../services/manuscriptService';
import { noteService } from '../../../services/noteService';
import {
  Attachment,
  SaveAttachmentPayload,
  UpdateAttachmentInput,
} from '../../../types/attachment';
import { Character } from '../../../types/character';
import { Location } from '../../../types/location';
import { ManuscriptNode } from '../../../types/manuscript';
import { Note } from '../../../types/note';

const TYPE_ICONS: Record<string, React.ElementType> = {
  image: ImageIcon,
  pdf: FileText,
  doc: FileText,
  document: FileText,
  audio: Music,
  archive: Archive,
  other: FileCode,
};

function formatBytes(bytes: number, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

interface ReferenceWorkspaceProps {
  selectedAttachmentId?: string | null;
}

export const ReferenceWorkspace: React.FC<ReferenceWorkspaceProps> = ({
  selectedAttachmentId,
}) => {
  const { currentProject } = useProject();
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');

  // Entities for linking
  const [characters, setCharacters] = useState<Character[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [chapters, setChapters] = useState<ManuscriptNode[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAttachment, setEditingAttachment] = useState<Attachment | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Form Fields
  const [fileName, setFileName] = useState('');
  const [sourcePath, setSourcePath] = useState('');
  const [base64Data, setBase64Data] = useState<string | null>(null);
  const [entityType, setEntityType] = useState<string>('');
  const [entityId, setEntityId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    if (!currentProject) return;
    try {
      setLoading(true);
      const [atts, chars, locs, tree, nts] = await Promise.all([
        attachmentService.getAttachments(currentProject.id),
        characterService.getCharacters(currentProject.id),
        locationService.getLocations(currentProject.id),
        manuscriptService.getManuscriptTree(currentProject.id),
        noteService.getNotes(currentProject.id),
      ]);
      setAttachments(atts);
      setCharacters(chars);
      setLocations(locs);
      setChapters(tree);
      setNotes(nts);
    } catch (err) {
      console.error('Failed to load references data:', err);
    } finally {
      setLoading(false);
    }
  }, [currentProject]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (selectedAttachmentId && attachments.length > 0) {
      const match = attachments.find((a) => a.id === selectedAttachmentId);
      if (match && match.file_type === 'image') {
        const src = match.relative_path?.startsWith('data:')
          ? match.relative_path
          : `asset://localhost/${match.file_path.replace(/\\/g, '/')}`;
        setPreviewImage(src);
      }
    }
  }, [selectedAttachmentId, attachments]);

  // Handle local file picker
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setSourcePath(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const res = ev.target?.result as string;
      setBase64Data(res);
    };
    reader.readAsDataURL(file);
  };

  // Open modal for new reference
  const handleOpenAdd = () => {
    setEditingAttachment(null);
    setFileName('');
    setSourcePath('');
    setBase64Data(null);
    setEntityType('');
    setEntityId('');
    setDescription('');
    setModalError(null);
    setIsModalOpen(true);
  };

  // Open modal for edit reference
  const handleOpenEdit = (att: Attachment) => {
    setEditingAttachment(att);
    setFileName(att.file_name);
    setSourcePath(att.file_path);
    setBase64Data(null);
    setEntityType(att.entity_type || '');
    setEntityId(att.entity_id || '');
    setDescription(att.description || '');
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject) return;

    if (!fileName.trim()) {
      setModalError('Reference name is required.');
      return;
    }

    try {
      setSaving(true);
      setModalError(null);

      if (editingAttachment) {
        const input: UpdateAttachmentInput = {
          file_name: fileName.trim(),
          description: description.trim() || null,
          entity_type: entityType || null,
          entity_id: entityId || null,
        };
        const updated = await attachmentService.updateAttachment(editingAttachment.id, input);
        setAttachments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      } else {
        const payload: SaveAttachmentPayload = {
          project_id: currentProject.id,
          file_name: fileName.trim(),
          base64_data: base64Data,
          source_path: sourcePath.trim() || null,
          entity_type: entityType || null,
          entity_id: entityId || null,
          description: description.trim() || null,
        };
        const created = await attachmentService.saveAttachmentFile(payload);
        setAttachments((prev) => [created, ...prev]);
      }

      setIsModalOpen(false);
    } catch (err: unknown) {
      console.error('Failed to save attachment:', err);
      setModalError(
        err instanceof Error ? err.message : 'Failed to save attachment reference.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (att: Attachment) => {
    if (window.confirm(`Permanently remove attachment "${att.file_name}"?`)) {
      await attachmentService.deleteAttachment(att.id);
      setAttachments((prev) => prev.filter((a) => a.id !== att.id));
    }
  };

  const handleOpen = async (att: Attachment) => {
    try {
      await attachmentService.openAttachment(att.id);
    } catch (err) {
      console.error('Failed to open attachment:', err);
      alert(`Could not open file: ${err instanceof Error ? err.message : 'File missing'}`);
    }
  };

  const handleReveal = async (att: Attachment) => {
    try {
      await attachmentService.revealAttachmentFolder(att.id);
    } catch (err) {
      console.error('Failed to reveal folder:', err);
    }
  };

  // Helper to resolve entity label
  const getEntityLabel = (type?: string | null, id?: string | null) => {
    if (!type || !id) return null;
    switch (type.toLowerCase()) {
      case 'character': {
        const c = characters.find((x) => x.id === id);
        return c ? { name: c.name, type: 'Character', icon: Users, color: 'text-amber-600 dark:text-amber-400' } : null;
      }
      case 'location': {
        const l = locations.find((x) => x.id === id);
        return l ? { name: l.name, type: 'Location', icon: MapPin, color: 'text-emerald-600 dark:text-emerald-400' } : null;
      }
      case 'chapter':
      case 'manuscript': {
        const ch = chapters.find((x) => x.id === id);
        return ch ? { name: ch.title, type: 'Chapter', icon: BookOpen, color: 'text-sky-600 dark:text-sky-400' } : null;
      }
      case 'note': {
        const n = notes.find((x) => x.id === id);
        return n ? { name: n.title, type: 'Note', icon: StickyNote, color: 'text-violet-600 dark:text-violet-400' } : null;
      }
      default:
        return null;
    }
  };

  const filtered = useMemo(() => {
    return attachments.filter((att) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        att.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (att.description &&
          att.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (att.relative_path &&
          att.relative_path.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType =
        typeFilter === 'all' ||
        att.file_type.toLowerCase() === typeFilter.toLowerCase();

      const matchesEntity =
        entityFilter === 'all' ||
        (entityFilter === 'none' && !att.entity_type) ||
        (att.entity_type && att.entity_type.toLowerCase() === entityFilter.toLowerCase());

      return matchesSearch && matchesType && matchesEntity;
    });
  }, [attachments, searchQuery, typeFilter, entityFilter]);

  if (!currentProject) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-[var(--ink-muted)]">
        Please select or open a project first.
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--paper-bg)]">
      {/* Top Header */}
      <div className="p-4 border-b border-[var(--paper-border)] bg-[var(--paper-surface)] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-[var(--paper-desk)] border border-[var(--paper-border-subtle)] text-[var(--amber-accent)]">
              <Paperclip className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[var(--ink-primary)] font-serif-novel">
                Research & Local Attachments
              </h1>
              <p className="text-xs text-[var(--ink-muted)]">
                Manage local reference files, character portraits, maps, PDFs, and scene moodboards
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-[var(--amber-accent)] hover:bg-[var(--amber-accent)]/90 text-white text-xs font-semibold shadow-2xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Reference</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-[var(--ink-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reference name, notes, path..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[var(--paper-border)] bg-[var(--paper-desk)] text-[var(--ink-primary)] placeholder-[var(--ink-muted)] focus:outline-hidden focus:border-[var(--amber-accent)]"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-[var(--paper-border)] bg-[var(--paper-desk)] text-[var(--ink-secondary)] focus:outline-hidden"
          >
            <option value="all">All File Types</option>
            <option value="image">Images</option>
            <option value="pdf">PDF Documents</option>
            <option value="document">Text & Docs</option>
            <option value="audio">Audio Tracks</option>
            <option value="archive">Archives</option>
          </select>

          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-[var(--paper-border)] bg-[var(--paper-desk)] text-[var(--ink-secondary)] focus:outline-hidden"
          >
            <option value="all">All Associations</option>
            <option value="none">Project-wide Only</option>
            <option value="character">Characters</option>
            <option value="location">Locations</option>
            <option value="chapter">Chapters</option>
            <option value="note">Notes</option>
          </select>

          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="p-1.5 rounded-lg bg-[var(--paper-desk)] hover:bg-[var(--paper-desk-hover)] text-[var(--ink-muted)]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Content Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-xs text-[var(--ink-muted)]">
            Loading attachments...
          </div>
        ) : attachments.length === 0 ? (
          <div className="text-center py-20 bg-[var(--paper-surface)] border border-dashed border-[var(--paper-border)] rounded-2xl p-8 max-w-xl mx-auto">
            <Paperclip className="w-12 h-12 text-[var(--ink-muted)] mx-auto mb-3 opacity-30" />
            <h3 className="text-base font-semibold text-[var(--ink-primary)]">
              No references yet
            </h3>
            <p className="text-xs text-[var(--ink-muted)] mt-1.5 max-w-md mx-auto leading-relaxed">
              Add images, documents, and research material to your project.
            </p>
            <button
              onClick={handleOpenAdd}
              className="mt-4 inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-[var(--amber-accent)] hover:bg-[var(--amber-accent)]/90 text-white text-xs font-semibold shadow-2xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Reference</span>
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-[var(--ink-muted)]">
            <p className="text-sm">No references match your active filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((att) => {
              const Icon = TYPE_ICONS[att.file_type.toLowerCase()] || FileCode;
              const entityInfo = getEntityLabel(att.entity_type, att.entity_id);
              const isImage = att.file_type.toLowerCase() === 'image';
              const isDataUrl = att.file_path.startsWith('data:image/');

              return (
                <div
                  key={att.id}
                  className="bg-[var(--paper-surface)] border border-[var(--paper-border)] hover:border-[var(--paper-border-focus)] rounded-xl p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Visual Preview / Type Icon Header */}
                    {isImage ? (
                      <div
                        onClick={() => setPreviewImage(isDataUrl ? att.file_path : null)}
                        className="w-full h-36 mb-3 rounded-lg overflow-hidden bg-[var(--paper-desk)] border border-[var(--paper-border-subtle)] flex items-center justify-center relative cursor-pointer group/thumb"
                      >
                        {isDataUrl ? (
                          <img
                            src={att.file_path}
                            alt={att.file_name}
                            className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-[var(--ink-muted)]">
                            <ImageIcon className="w-8 h-8 opacity-40 mb-1" />
                            <span className="text-[11px] font-mono">Image Reference</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium space-x-1">
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Image</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="p-2.5 rounded-lg bg-[var(--paper-desk)] border border-[var(--paper-border-subtle)] text-[var(--amber-accent)]">
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--paper-desk)] border border-[var(--paper-border-subtle)] text-[var(--ink-secondary)]">
                          {att.file_type}
                        </span>
                      </div>
                    )}

                    {/* Title and Notes */}
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <h3
                        onClick={() => handleOpen(att)}
                        className="text-sm font-bold text-[var(--ink-primary)] truncate cursor-pointer hover:text-[var(--amber-accent)] transition-colors flex-1"
                        title={att.file_name}
                      >
                        {att.file_name}
                      </h3>
                      <span className="text-[10px] font-mono text-[var(--ink-muted)] shrink-0 ml-1">
                        {formatBytes(att.file_size)}
                      </span>
                    </div>

                    {att.description && (
                      <p className="text-xs text-[var(--ink-secondary)] font-serif-novel line-clamp-2 leading-relaxed mb-2">
                        {att.description}
                      </p>
                    )}

                    {/* Entity association badge */}
                    {entityInfo && (
                      <div className="flex items-center space-x-1.5 mt-2 px-2 py-1 rounded bg-[var(--paper-desk)] border border-[var(--paper-border-subtle)] text-xs text-[var(--ink-secondary)]">
                        <entityInfo.icon className={`w-3.5 h-3.5 ${entityInfo.color} shrink-0`} />
                        <span className="font-semibold text-[10px] uppercase text-[var(--ink-muted)]">
                          {entityInfo.type}:
                        </span>
                        <span className="font-medium truncate">{entityInfo.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions footer */}
                  <div className="mt-4 pt-2.5 border-t border-[var(--paper-border-subtle)] flex items-center justify-between text-xs text-[var(--ink-muted)]">
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleOpen(att)}
                        className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-[var(--paper-desk)] text-[var(--ink-secondary)] transition-colors"
                        title="Open file in system default application"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Open</span>
                      </button>

                      <button
                        onClick={() => handleReveal(att)}
                        className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-[var(--paper-desk)] text-[var(--ink-secondary)] transition-colors"
                        title="Reveal file in Windows Explorer folder"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Folder</span>
                      </button>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleOpenEdit(att)}
                        className="p-1 rounded hover:bg-[var(--paper-desk)] text-[var(--ink-muted)] hover:text-[var(--ink-primary)] transition-colors"
                        title="Edit reference & association"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDelete(att)}
                        className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 text-[var(--ink-muted)] hover:text-rose-500 transition-colors"
                        title="Delete reference"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Reference Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div
            className="w-full max-w-lg bg-[var(--paper-surface)] rounded-xl shadow-xl border border-[var(--paper-border)] overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--paper-border)] bg-[var(--paper-desk)]">
              <div className="flex items-center space-x-2">
                <Paperclip className="w-5 h-5 text-[var(--amber-accent)]" />
                <h2 className="text-base font-semibold text-[var(--ink-primary)]">
                  {editingAttachment ? 'Edit Reference' : 'Add Local Reference'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-[var(--ink-muted)] hover:text-[var(--ink-primary)] rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
              {modalError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300 text-sm flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Local File Picker (for new references) */}
              {!editingAttachment && (
                <div>
                  <label className="block text-xs font-semibold text-[var(--ink-secondary)] uppercase tracking-wider mb-1">
                    Select Local File (or input path)
                  </label>
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    className="w-full text-xs text-[var(--ink-secondary)] file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-[var(--paper-border)] file:text-xs file:bg-[var(--paper-desk)] hover:file:bg-[var(--paper-desk-hover)] file:text-[var(--ink-primary)] cursor-pointer"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[var(--ink-secondary)] uppercase tracking-wider mb-1">
                  Reference Title / Filename *
                </label>
                <input
                  type="text"
                  required
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="e.g., worldmap.png, Clara_portrait.jpg"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--paper-border)] bg-[var(--paper-desk)] text-[var(--ink-primary)] focus:outline-hidden focus:border-[var(--amber-accent)]"
                />
              </div>

              {/* Entity Association Selector (Requirement 19) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--ink-secondary)] uppercase tracking-wider mb-1">
                    Associate With Entity
                  </label>
                  <select
                    value={entityType}
                    onChange={(e) => {
                      setEntityType(e.target.value);
                      setEntityId('');
                    }}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--paper-border)] bg-[var(--paper-desk)] text-[var(--ink-primary)] focus:outline-hidden focus:border-[var(--amber-accent)]"
                  >
                    <option value="">None (Project-wide)</option>
                    <option value="character">Character</option>
                    <option value="location">Location</option>
                    <option value="chapter">Chapter</option>
                    <option value="note">Story Note</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--ink-secondary)] uppercase tracking-wider mb-1">
                    Select Entity
                  </label>
                  <select
                    disabled={!entityType}
                    value={entityId}
                    onChange={(e) => setEntityId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--paper-border)] bg-[var(--paper-desk)] text-[var(--ink-primary)] focus:outline-hidden focus:border-[var(--amber-accent)] disabled:opacity-40"
                  >
                    <option value="">-- Choose entity --</option>
                    {entityType === 'character' &&
                      characters.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.role})
                        </option>
                      ))}
                    {entityType === 'location' &&
                      locations.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}
                    {entityType === 'chapter' &&
                      chapters.map((ch) => (
                        <option key={ch.id} value={ch.id}>
                          {ch.title}
                        </option>
                      ))}
                    {entityType === 'note' &&
                      notes.map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.title}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--ink-secondary)] uppercase tracking-wider mb-1">
                  Research Context & Notes
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Historical context, visual cues, or worldbuilding reference..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--paper-border)] bg-[var(--paper-desk)] text-[var(--ink-primary)] focus:outline-hidden focus:border-[var(--amber-accent)] font-serif-novel"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[var(--paper-border)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm rounded-lg border border-[var(--paper-border)] hover:bg-[var(--paper-desk)] text-[var(--ink-secondary)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-sm rounded-lg bg-[var(--amber-accent)] hover:bg-[var(--amber-accent)]/90 text-white font-medium transition-colors shadow-2xs disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingAttachment ? 'Update Reference' : 'Add Reference'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Image Preview Lightbox */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={previewImage}
              alt="Reference Preview"
              className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};
