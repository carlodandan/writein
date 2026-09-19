import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Book,
  FileText,
  Bookmark,
  MoreHorizontal,
  Plus,
  Copy,
  Trash2,
  Edit2,
} from 'lucide-react';
import type { TreeNode } from '../../utils/manuscriptHierarchy';
import { useManuscript } from '../../context/ManuscriptContext';

interface ManuscriptTreeNodeProps {
  treeNode: TreeNode;
  level?: number;
  onSelect: (id: string) => void;
  selectedId: string | null;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDrop: (e: React.DragEvent, targetId: string) => void;
}

export const ManuscriptTreeNode: React.FC<ManuscriptTreeNodeProps> = ({
  treeNode,
  level = 0,
  onSelect,
  selectedId,
  onDragStart,
  onDragOver,
  onDrop,
}) => {
  const { node, children } = treeNode;
  const { renameNode, deleteNode, duplicateNode, createNode } = useManuscript();

  const [isExpanded, setIsExpanded] = useState(true);
  const [isRenaming, setIsRenaming] = useState(false);
  const [titleInput, setTitleInput] = useState(node.title);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isSelected = selectedId === node.id;
  const hasChildren = children.length > 0;

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const handleSaveRename = async () => {
    if (titleInput.trim() && titleInput.trim() !== node.title) {
      await renameNode(node.id, titleInput.trim());
    } else {
      setTitleInput(node.title);
    }
    setIsRenaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.stopPropagation();
      handleSaveRename();
    } else if (e.key === 'Escape') {
      e.stopPropagation();
      setTitleInput(node.title);
      setIsRenaming(false);
    }
  };

  const renderIcon = () => {
    switch (node.node_type) {
      case 'part':
        return <Bookmark className="w-3.5 h-3.5 text-[var(--amber-accent)] shrink-0" />;
      case 'chapter':
        return <Book className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />;
      case 'scene':
      default:
        return <FileText className="w-3.5 h-3.5 text-[var(--ink-muted)] shrink-0" />;
    }
  };

  return (
    <div className="select-none text-xs">
      <div
        draggable={!isRenaming}
        onDragStart={(e) => onDragStart(e, node.id)}
        onDragOver={(e) => onDragOver(e, node.id)}
        onDrop={(e) => onDrop(e, node.id)}
        onClick={() => onSelect(node.id)}
        onDoubleClick={() => setIsRenaming(true)}
        style={{ paddingLeft: `${level * 14 + 6}px` }}
        className={`group flex items-center justify-between py-1.5 pr-2 rounded-md cursor-pointer transition-colors ${
          isSelected
            ? 'bg-[var(--paper-surface)] text-[var(--ink-primary)] font-medium border border-[var(--paper-border-subtle)] shadow-2xs'
            : 'text-[var(--ink-secondary)] hover:bg-[var(--paper-desk-hover)] hover:text-[var(--ink-primary)]'
        }`}
      >
        <div className="flex items-center space-x-1.5 min-w-0 flex-1">
          {/* Chevron expand/collapse */}
          {hasChildren ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="p-0.5 rounded hover:bg-[var(--paper-desk)] text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          ) : (
            <span className="w-4 inline-block" />
          )}

          {renderIcon()}

          {/* Title or Inline Edit */}
          {isRenaming ? (
            <input
              ref={inputRef}
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={handleSaveRename}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="px-1 py-0.5 bg-[var(--paper-surface)] border border-[var(--amber-accent)] rounded text-xs text-[var(--ink-primary)] focus:outline-hidden flex-1"
            />
          ) : (
            <span className="truncate flex-1 font-serif-novel text-[13px]">{node.title}</span>
          )}
        </div>

        {/* Word count & Action Menu */}
        <div className="flex items-center space-x-1.5 shrink-0">
          {node.word_count > 0 && !isRenaming && (
            <span className="text-[10px] font-mono text-[var(--ink-muted)]">
              {node.word_count.toLocaleString()}w
            </span>
          )}

          {/* Action Menu Trigger */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-[var(--paper-desk)] text-[var(--ink-muted)] hover:text-[var(--ink-primary)] transition-opacity"
              title="More options"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 top-6 z-30 w-44 bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-lg shadow-lg py-1 text-xs animate-in fade-in zoom-in-95 duration-100">
                {node.node_type === 'part' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      createNode('chapter', node.id);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-[var(--paper-desk)] text-[var(--ink-primary)] flex items-center space-x-2"
                  >
                    <Plus className="w-3.5 h-3.5 text-[var(--amber-accent)]" />
                    <span>Add Chapter</span>
                  </button>
                )}

                {node.node_type === 'chapter' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      createNode('scene', node.id);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-[var(--paper-desk)] text-[var(--ink-primary)] flex items-center space-x-2"
                  >
                    <Plus className="w-3.5 h-3.5 text-[var(--amber-accent)]" />
                    <span>Add Scene</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    setIsRenaming(true);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[var(--paper-desk)] text-[var(--ink-primary)] flex items-center space-x-2"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Rename</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    duplicateNode(node.id);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[var(--paper-desk)] text-[var(--ink-primary)] flex items-center space-x-2"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Duplicate</span>
                </button>

                <div className="border-t border-[var(--paper-border-subtle)] my-1" />

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    if (window.confirm(`Are you sure you want to delete "${node.title}"? This action cannot be undone.`)) {
                      deleteNode(node.id);
                    }
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 flex items-center space-x-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="space-y-0.5 mt-0.5">
          {children.map((child) => (
            <ManuscriptTreeNode
              key={child.node.id}
              treeNode={child}
              level={level + 1}
              onSelect={onSelect}
              selectedId={selectedId}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
            />
          ))}
        </div>
      )}
    </div>
  );
};
