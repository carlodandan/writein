import React, { useState, useEffect } from 'react';
import { HeaderBar } from './HeaderBar';
import { Sidebar, ActiveNavTab } from './Sidebar';
import { Inspector } from './Inspector';
import { StatusBar } from './StatusBar';

interface AppLayoutProps {
  activeTab: ActiveNavTab;
  onSelectTab: (tab: ActiveNavTab) => void;
  onOpenProjectList: () => void;
  onOpenNewProject: () => void;
  onOpenSettings: () => void;
  onOpenSearch?: () => void;
  isDistractionFree: boolean;
  onSetDistractionFree: (val: boolean) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  activeTab,
  onSelectTab,
  onOpenProjectList,
  onOpenNewProject,
  onOpenSettings,
  onOpenSearch,
  isDistractionFree,
  onSetDistractionFree,
  children,
}) => {
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);

  // Keyboard shortcut listener for Esc and Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDistractionFree) {
        onSetDistractionFree(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenSearch?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDistractionFree, onSetDistractionFree, onOpenSearch]);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[var(--paper-bg)] text-[var(--ink-primary)]">
      {/* Header bar (hidden in distraction-free mode) */}
      {!isDistractionFree && (
        <HeaderBar
          onOpenProjectList={onOpenProjectList}
          onOpenNewProject={onOpenNewProject}
          onToggleDistractionFree={() => onSetDistractionFree(true)}
          isDistractionFree={isDistractionFree}
          onOpenSettings={onOpenSettings}
          onOpenSearch={onOpenSearch}
        />
      )}

      {/* Main 3-pane body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar (hidden in distraction-free mode) */}
        {!isDistractionFree && (
          <Sidebar
            activeTab={activeTab}
            onSelectTab={onSelectTab}
            onOpenProjects={onOpenProjectList}
          />
        )}

        {/* Central Workspace */}
        <main className="flex-1 flex flex-col overflow-y-auto bg-[var(--paper-bg)] relative">
          {children}
        </main>

        {/* Inspector Panel (hidden in distraction-free mode) */}
        {!isDistractionFree && (
          <Inspector
            isOpen={isInspectorOpen}
            onToggle={() => setIsInspectorOpen(!isInspectorOpen)}
            onNavigate={onSelectTab}
          />
        )}
      </div>

      {/* Status Bar */}
      <StatusBar
        isDistractionFree={isDistractionFree}
        onExitDistractionFree={() => onSetDistractionFree(false)}
      />
    </div>
  );
};
