import React, { useState } from 'react';
import {
  Plus,
  Bookmark,
  Book,
  FileText,
  Layers,
} from 'lucide-react';
import { useManuscript } from '../../context/ManuscriptContext';
import { buildTreeHierarchy } from '../../utils/manuscriptHierarchy';
import { ManuscriptTreeNode } from './ManuscriptTreeNode';

export const ManuscriptTree: React.FC = () => {
  const {
    nodes,
    selectedNodeId,
    selectNode,
    createNode,
    reorderNodes,
    moveNode,
  } = useManuscript();

  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);

  const treeHierarchy = buildTreeHierarchy(nodes);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.stopPropagation();
    setDraggedNodeId(id);
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedNodeId || draggedNodeId === targetId) {
      setDraggedNodeId(null);
      return;
    }

    const dragged = nodes.find((n) => n.id === draggedNodeId);
    const target = nodes.find((n) => n.id === targetId);
    if (!dragged || !target) {
      setDraggedNodeId(null);
      return;
    }

    try {
      // If dropping onto a part or chapter that can contain the dragged node:
      if (
        (dragged.node_type === 'chapter' && target.node_type === 'part') ||
        (dragged.node_type === 'scene' && target.node_type === 'chapter')
      ) {
        // Move inside target
        await moveNode(dragged.id, target.id, 9999);
      } else {
        // Reorder alongside target (same parent)
        const targetParentId = target.parent_id;
        const siblings = nodes
          .filter((n) => n.parent_id === targetParentId)
          .sort((a, b) => a.sort_order - b.sort_order);

        const withoutDragged = siblings.filter((n) => n.id !== dragged.id);
        const targetIndex = withoutDragged.findIndex((n) => n.id === target.id);

        withoutDragged.splice(targetIndex, 0, dragged);

        const items = withoutDragged.map((item, idx) => ({
          id: item.id,
          parent_id: targetParentId,
          sort_order: idx + 1,
        }));

        await reorderNodes(items);
      }
    } catch (err: any) {
      console.warn('Invalid drop/move:', err);
    } finally {
      setDraggedNodeId(null);
    }
  };

  const totalWords = nodes.reduce((sum, n) => sum + (n.word_count || 0), 0);

  return (
    <div className="w-68 border-r border-[var(--paper-border)] bg-[var(--paper-desk)] flex flex-col h-full select-none shrink-0 transition-colors">
      {/* Header & Quick Action Buttons */}
      <div className="p-3 border-b border-[var(--paper-border)] space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-[var(--ink-primary)]">
            <Layers className="w-4 h-4 text-[var(--amber-accent)]" />
            <span className="font-serif-novel text-sm">Manuscript</span>
          </div>
          <span className="text-[10px] font-mono text-[var(--ink-muted)]">
            {totalWords.toLocaleString()} words
          </span>
        </div>

        {/* Create Buttons */}
        <div className="grid grid-cols-3 gap-1 text-[11px]">
          <button
            type="button"
            onClick={() => createNode('part')}
            className="px-1.5 py-1 rounded bg-[var(--paper-surface)] hover:bg-[var(--paper-desk-hover)] border border-[var(--paper-border)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] flex items-center justify-center space-x-1 transition-colors"
            title="Create a new Part at root level"
          >
            <Bookmark className="w-3 h-3 text-[var(--amber-accent)]" />
            <span>Part</span>
          </button>

          <button
            type="button"
            onClick={() => {
              // If selected node is a Part, place chapter inside it, otherwise at root
              const selected = nodes.find((n) => n.id === selectedNodeId);
              const parentId = selected?.node_type === 'part' ? selected.id : null;
              createNode('chapter', parentId);
            }}
            className="px-1.5 py-1 rounded bg-[var(--paper-surface)] hover:bg-[var(--paper-desk-hover)] border border-[var(--paper-border)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] flex items-center justify-center space-x-1 transition-colors"
            title="Create a new Chapter"
          >
            <Book className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            <span>Chapter</span>
          </button>

          <button
            type="button"
            onClick={() => {
              // Place scene inside currently selected chapter, or first chapter found
              const selected = nodes.find((n) => n.id === selectedNodeId);
              let chapterId = selected?.node_type === 'chapter' ? selected.id : null;
              if (!chapterId && selected?.node_type === 'scene' && selected.parent_id) {
                chapterId = selected.parent_id;
              }
              if (!chapterId) {
                const firstChap = nodes.find((n) => n.node_type === 'chapter');
                chapterId = firstChap?.id || null;
              }
              if (chapterId) {
                createNode('scene', chapterId);
              } else {
                // If no chapters exist, create a chapter first
                createNode('chapter').then((newChap) => {
                  createNode('scene', newChap.id);
                });
              }
            }}
            className="px-1.5 py-1 rounded bg-[var(--paper-surface)] hover:bg-[var(--paper-desk-hover)] border border-[var(--paper-border)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] flex items-center justify-center space-x-1 transition-colors"
            title="Create a new Scene inside selected Chapter"
          >
            <FileText className="w-3 h-3 text-[var(--ink-muted)]" />
            <span>Scene</span>
          </button>
        </div>
      </div>

      {/* Nodes Tree List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {nodes.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-3">
            <Book className="w-8 h-8 mx-auto text-[var(--ink-muted)] opacity-40" />
            <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
              No chapters yet. Start writing your manuscript by creating your first chapter.
            </p>
            <button
              type="button"
              onClick={() => createNode('chapter')}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--amber-accent)] hover:bg-[var(--amber-accent-hover)] text-white shadow-xs transition-colors flex items-center space-x-1 mx-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Chapter</span>
            </button>
          </div>
        ) : (
          treeHierarchy.map((item) => (
            <ManuscriptTreeNode
              key={item.node.id}
              treeNode={item}
              level={0}
              onSelect={selectNode}
              selectedId={selectedNodeId}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />
          ))
        )}
      </div>

      {/* Tree Footer Info */}
      <div className="p-2.5 border-t border-[var(--paper-border)] text-[11px] text-[var(--ink-muted)] flex items-center justify-between">
        <span>
          {nodes.filter((n) => n.node_type === 'chapter').length} chapters •{' '}
          {nodes.filter((n) => n.node_type === 'scene').length} scenes
        </span>
      </div>
    </div>
  );
};
