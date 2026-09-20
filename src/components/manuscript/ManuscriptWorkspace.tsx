import React, { useState, useEffect } from 'react';
import { ManuscriptTree } from './ManuscriptTree';
import { Editor } from '../editor/Editor';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useManuscript } from '../../context/ManuscriptContext';

interface ManuscriptWorkspaceProps {
  isDistractionFree?: boolean;
  selectedChapterId?: string | null;
}

export const ManuscriptWorkspace: React.FC<ManuscriptWorkspaceProps> = ({
  isDistractionFree = false,
  selectedChapterId,
}) => {
  const [isTreeVisible, setIsTreeVisible] = useState(true);
  const { selectedNodeId, selectNode } = useManuscript();

  useEffect(() => {
    if (selectedChapterId && selectedChapterId !== selectedNodeId) {
      selectNode(selectedChapterId);
    }
  }, [selectedChapterId]);

  if (isDistractionFree) {
    return <Editor isDistractionFree={true} />;
  }

  return (
    <div className="flex-1 flex h-full overflow-hidden relative">
      {/* Tree Pane */}
      {isTreeVisible ? (
        <div className="flex h-full">
          <ManuscriptTree />
          <button
            type="button"
            onClick={() => setIsTreeVisible(false)}
            className="w-4 h-full hover:bg-[var(--paper-desk-hover)] flex items-center justify-center text-[var(--ink-muted)] hover:text-[var(--ink-primary)] transition-colors border-r border-[var(--paper-border)] z-10"
            title="Collapse Manuscript Tree"
          >
            <PanelLeftClose className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div className="h-full border-r border-[var(--paper-border)] bg-[var(--paper-desk)] flex flex-col items-center py-3 select-none shrink-0 w-9">
          <button
            type="button"
            onClick={() => setIsTreeVisible(true)}
            className="p-1.5 rounded-md hover:bg-[var(--paper-desk-hover)] text-[var(--ink-muted)] hover:text-[var(--ink-primary)] transition-colors"
            title="Open Manuscript Tree"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Editor Pane */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Editor isDistractionFree={false} />
      </div>
    </div>
  );
};
