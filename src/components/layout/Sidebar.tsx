import React from 'react';
import {
  Home,
  BookOpen,
  Users,
  MapPin,
  Globe,
  Clock,
  StickyNote,
  Paperclip,
  Trash2,
  Settings,
  FolderOpen,
  Target,
  BarChart2,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

export type ActiveNavTab =
  | 'overview'
  | 'manuscript'
  | 'characters'
  | 'locations'
  | 'worldbuilding'
  | 'timeline'
  | 'notes'
  | 'references'
  | 'goals'
  | 'statistics'
  | 'trash'
  | 'settings';

interface SidebarProps {
  activeTab: ActiveNavTab;
  onSelectTab: (tab: ActiveNavTab) => void;
  onOpenProjects: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onOpenProjects,
}) => {
  const { currentProject } = useProject();

  const navItems: Array<{ id: string; label: string; icon: React.ElementType; badge?: string }> = [
    { id: 'overview', label: 'Project Desk', icon: Home },
    { id: 'manuscript', label: 'Manuscript', icon: BookOpen },
    { id: 'characters', label: 'Characters', icon: Users },
    { id: 'locations', label: 'Locations', icon: MapPin },
    { id: 'worldbuilding', label: 'Worldbuilding', icon: Globe },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'notes', label: 'Notes', icon: StickyNote },
    { id: 'references', label: 'Research & Files', icon: Paperclip },
    { id: 'goals', label: 'Writing Goals', icon: Target },
    { id: 'statistics', label: 'Statistics', icon: BarChart2 },
  ];

  return (
    <aside className="w-60 border-r border-[var(--paper-border)] bg-[var(--paper-desk)] flex flex-col justify-between select-none shrink-0 transition-colors">
      {/* Top Nav Items */}
      <div className="p-3 space-y-1">
        <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
          {currentProject?.title || 'No Project'}
        </div>

        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id as ActiveNavTab)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[var(--paper-surface)] text-[var(--amber-accent)] shadow-xs border border-[var(--paper-border-subtle)]'
                    : 'text-[var(--ink-secondary)] hover:bg-[var(--paper-desk-hover)] hover:text-[var(--ink-primary)]'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-[var(--amber-accent)]' : 'text-[var(--ink-muted)]'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[var(--paper-surface)] border border-[var(--paper-border)] text-[var(--ink-muted)]">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Nav Items */}
      <div className="p-3 border-t border-[var(--paper-border)] space-y-0.5">
        <button
          onClick={onOpenProjects}
          className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-sm font-medium text-[var(--ink-secondary)] hover:bg-[var(--paper-desk-hover)] hover:text-[var(--ink-primary)] transition-colors"
        >
          <FolderOpen className="w-4 h-4 text-[var(--ink-muted)]" />
          <span>All Projects</span>
        </button>

        <button
          onClick={() => onSelectTab('trash')}
          className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'trash'
              ? 'bg-[var(--paper-surface)] text-[var(--ink-primary)]'
              : 'text-[var(--ink-secondary)] hover:bg-[var(--paper-desk-hover)] hover:text-[var(--ink-primary)]'
          }`}
        >
          <Trash2 className="w-4 h-4 text-[var(--ink-muted)]" />
          <span>Trash</span>
        </button>

        <button
          onClick={() => onSelectTab('settings')}
          className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'settings'
              ? 'bg-[var(--paper-surface)] text-[var(--ink-primary)]'
              : 'text-[var(--ink-secondary)] hover:bg-[var(--paper-desk-hover)] hover:text-[var(--ink-primary)]'
          }`}
        >
          <Settings className="w-4 h-4 text-[var(--ink-muted)]" />
          <span>Preferences</span>
        </button>
      </div>
    </aside>
  );
};
