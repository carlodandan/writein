import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Users,
  MapPin,
  Clock,
  FileText,
  Paperclip,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FolderOpen,
  Link2,
} from 'lucide-react';
import { attachmentService } from '../../services/attachmentService';
import { RelatedContentItem, RelatedContentResponse } from '../../types/attachment';
import { ActiveNavTab } from '../layout/Sidebar';

interface RelatedContentPanelProps {
  projectId: string;
  entityType: 'chapter' | 'manuscript' | 'character' | 'location' | 'timeline' | 'note' | string;
  entityId: string;
  entityTitle?: string;
  onNavigate?: (tab: ActiveNavTab, entityId?: string) => void;
  compact?: boolean;
  className?: string;
}

export const RelatedContentPanel: React.FC<RelatedContentPanelProps> = ({
  projectId,
  entityType,
  entityId,
  entityTitle,
  onNavigate,
  compact = false,
  className = '',
}) => {
  const [data, setData] = useState<RelatedContentResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const loadRelatedContent = useCallback(async () => {
    if (!projectId || !entityId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await attachmentService.getRelatedContent(projectId, entityType, entityId);
      setData(res);
    } catch (err) {
      console.error('Failed to load related content:', err);
      setError('Unable to load connections');
    } finally {
      setLoading(false);
    }
  }, [projectId, entityType, entityId]);

  useEffect(() => {
    loadRelatedContent();
  }, [loadRelatedContent]);

  const toggleSection = (section: string) => {
    setCollapsed((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleOpenAttachment = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await attachmentService.openAttachment(id);
    } catch (err) {
      console.error('Failed to open attachment:', err);
    }
  };

  const handleRevealFolder = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await attachmentService.revealAttachmentFolder(id);
    } catch (err) {
      console.error('Failed to reveal attachment folder:', err);
    }
  };

  const totalConnections = data
    ? data.chapters.length +
      data.characters.length +
      data.locations.length +
      data.timeline_events.length +
      data.notes.length +
      data.attachments.length
    : 0;

  if (loading) {
    return (
      <div className={`p-3 space-y-2 rounded-lg bg-[var(--paper-desk)]/50 border border-[var(--paper-border-subtle)] animate-pulse ${className}`}>
        <div className="h-3 bg-[var(--paper-border)] rounded w-1/3" />
        <div className="h-8 bg-[var(--paper-border-subtle)] rounded" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 text-xs text-[var(--ink-muted)] ${className}`}>
        {error}
      </div>
    );
  }

  const sections: Array<{
    key: string;
    title: string;
    icon: React.ElementType;
    color: string;
    badgeBg: string;
    items: RelatedContentItem[];
  }> = [
    {
      key: 'chapters',
      title: 'Manuscript Chapters',
      icon: BookOpen,
      color: 'text-sky-500',
      badgeBg: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
      items: data?.chapters || [],
    },
    {
      key: 'characters',
      title: 'Characters',
      icon: Users,
      color: 'text-amber-500',
      badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      items: data?.characters || [],
    },
    {
      key: 'locations',
      title: 'Locations & Setting',
      icon: MapPin,
      color: 'text-emerald-500',
      badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      items: data?.locations || [],
    },
    {
      key: 'timeline',
      title: 'Timeline Events',
      icon: Clock,
      color: 'text-purple-500',
      badgeBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      items: data?.timeline_events || [],
    },
    {
      key: 'notes',
      title: 'Linked Notes',
      icon: FileText,
      color: 'text-yellow-500',
      badgeBg: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
      items: data?.notes || [],
    },
    {
      key: 'attachments',
      title: 'References & Files',
      icon: Paperclip,
      color: 'text-rose-500',
      badgeBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      items: data?.attachments || [],
    },
  ].filter((s) => s.items.length > 0);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
          <Link2 className="w-3.5 h-3.5 text-[var(--amber-accent)]" />
          <span>Connected Information</span>
          <span className="ml-1 text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--paper-desk)] text-[var(--ink-secondary)] border border-[var(--paper-border-subtle)]">
            {totalConnections}
          </span>
        </div>
      </div>

      {totalConnections === 0 ? (
        <div className="p-4 text-center rounded-lg border border-dashed border-[var(--paper-border)] bg-[var(--paper-desk)]/30 text-xs text-[var(--ink-muted)]">
          No direct connections mapped for {entityTitle ? `"${entityTitle}"` : 'this item'}.
          <div className="text-[11px] mt-1 text-[var(--ink-muted)]/80">
            Characters in scenes, locations in timeline events, and attachments will automatically appear here.
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {sections.map((sec) => {
            const Icon = sec.icon;
            const isCollapsed = !!collapsed[sec.key];

            return (
              <div
                key={sec.key}
                className="rounded-lg border border-[var(--paper-border-subtle)] bg-[var(--paper-surface)] overflow-hidden shadow-2xs"
              >
                {/* Collapsible header */}
                <button
                  type="button"
                  onClick={() => toggleSection(sec.key)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-[var(--paper-desk)]/50 hover:bg-[var(--paper-desk)] transition-colors text-xs font-medium text-[var(--ink-secondary)]"
                >
                  <div className="flex items-center space-x-2">
                    <Icon className={`w-3.5 h-3.5 ${sec.color}`} />
                    <span>{sec.title}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--paper-surface)] text-[var(--ink-muted)] border border-[var(--paper-border-subtle)]">
                      {sec.items.length}
                    </span>
                  </div>
                  {isCollapsed ? (
                    <ChevronRight className="w-3.5 h-3.5 text-[var(--ink-muted)]" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-[var(--ink-muted)]" />
                  )}
                </button>

                {/* Items List */}
                {!isCollapsed && (
                  <div className="divide-y divide-[var(--paper-border-subtle)] p-1">
                    {sec.items.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          if (onNavigate) {
                            onNavigate(item.target_tab as ActiveNavTab, item.target_id);
                          }
                        }}
                        className={`group flex items-center justify-between p-2 rounded-md hover:bg-[var(--paper-desk)] cursor-pointer transition-colors ${
                          compact ? 'text-xs' : 'text-xs sm:text-sm'
                        }`}
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="font-medium text-[var(--ink-primary)] truncate group-hover:text-[var(--amber-accent)] transition-colors">
                            {item.title}
                          </div>
                          {item.subtitle && (
                            <div className="text-[11px] text-[var(--ink-muted)] truncate mt-0.5">
                              {item.subtitle}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-1.5 shrink-0">
                          {item.badge && (
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase font-medium ${sec.badgeBg}`}
                            >
                              {item.badge}
                            </span>
                          )}

                          {item.entity_type === 'attachment' && (
                            <div className="flex items-center space-x-1">
                              <button
                                type="button"
                                onClick={(e) => handleOpenAttachment(e, item.id)}
                                title="Open file in system default viewer"
                                className="p-1 rounded hover:bg-[var(--paper-surface)] text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleRevealFolder(e, item.id)}
                                title="Reveal in File Explorer"
                                className="p-1 rounded hover:bg-[var(--paper-surface)] text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                              >
                                <FolderOpen className="w-3 h-3" />
                              </button>
                            </div>
                          )}

                          {onNavigate && (
                            <ChevronRight className="w-3.5 h-3.5 text-[var(--ink-muted)] group-hover:text-[var(--ink-primary)] group-hover:translate-x-0.5 transition-transform" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
