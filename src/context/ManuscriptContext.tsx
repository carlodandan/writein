import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import type {
  DocumentContent,
  ManuscriptNode,
  NodeType,
  ReorderItem,
  SaveDocumentInput,
} from '../types/manuscript';
import { manuscriptService } from '../services/manuscriptService';
import { useProject } from './ProjectContext';
import { getNextDefaultTitle, validateHierarchy, hasCycle } from '../utils/manuscriptHierarchy';

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';

interface ManuscriptContextType {
  nodes: ManuscriptNode[];
  selectedNodeId: string | null;
  activeNode: ManuscriptNode | null;
  activeDocument: DocumentContent | null;
  saveStatus: SaveStatus;
  lastSavedTime: Date | null;
  isLoading: boolean;
  error: string | null;
  selectNode: (id: string | null) => Promise<void>;
  createNode: (type: NodeType, parentId?: string | null, customTitle?: string) => Promise<ManuscriptNode>;
  renameNode: (id: string, newTitle: string) => Promise<ManuscriptNode>;
  updateNodeSynopsis: (id: string, synopsis: string) => Promise<void>;
  updateNodeStatus: (id: string, status: string) => Promise<void>;
  deleteNode: (id: string) => Promise<void>;
  duplicateNode: (id: string) => Promise<ManuscriptNode>;
  moveNode: (nodeId: string, targetParentId: string | null, targetSortOrder: number) => Promise<void>;
  reorderNodes: (items: ReorderItem[]) => Promise<void>;
  saveCurrentDocument: (
    contentJson: string,
    contentText: string,
    wordCount: number,
    characterCount: number,
    targetNodeId?: string
  ) => Promise<void>;
  refreshTree: (nodeIdToSelect?: string) => Promise<void>;
}

export const ManuscriptContext = createContext<ManuscriptContextType | undefined>(undefined);

export const ManuscriptProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentProject, refreshProjects } = useProject();

  const [nodes, setNodes] = useState<ManuscriptNode[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeDocument, setActiveDocument] = useState<DocumentContent | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const activeNode = nodes.find((n) => n.id === selectedNodeId) || null;

  const refreshTree = useCallback(async (nodeIdToSelect?: string) => {
    if (!currentProject) {
      setNodes([]);
      setSelectedNodeId(null);
      setActiveDocument(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const tree = await manuscriptService.getManuscriptTree(currentProject.id);
      setNodes(tree);

      // If nodeIdToSelect specified, select it; otherwise keep prev or select first node
      if (tree.length > 0) {
        setSelectedNodeId((prev) => {
          if (nodeIdToSelect && tree.some((n) => n.id === nodeIdToSelect)) {
            return nodeIdToSelect;
          }
          if (prev && tree.some((n) => n.id === prev)) {
            return prev;
          }
          const defaultSelect = tree.find((n) => n.node_type === 'scene') || tree[0];
          return defaultSelect.id;
        });
      } else {
        setSelectedNodeId(null);
        setActiveDocument(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load manuscript tree');
    } finally {
      setIsLoading(false);
    }
  }, [currentProject]);

  useEffect(() => {
    refreshTree();
  }, [refreshTree]);

  // Load document when selectedNodeId changes
  useEffect(() => {
    if (!selectedNodeId) {
      setActiveDocument(null);
      return;
    }

    let isCancelled = false;
    manuscriptService
      .getDocument(selectedNodeId)
      .then((doc) => {
        if (!isCancelled) {
          setActiveDocument(doc);
          setSaveStatus('saved');
          setLastSavedTime(new Date(doc.last_edited_at));
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error('Failed to fetch document content:', err);
          setError('Failed to load document content');
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [selectedNodeId]);

  const selectNode = async (id: string | null) => {
    setSelectedNodeId(id);
  };

  const handleCreateNode = async (
    type: NodeType,
    parentId: string | null = null,
    customTitle?: string
  ): Promise<ManuscriptNode> => {
    if (!currentProject) throw new Error('No active project');

    // Hierarchy validation
    const parentNode = parentId ? nodes.find((n) => n.id === parentId) : null;
    const parentType = parentNode ? parentNode.node_type : null;
    const check = validateHierarchy(type, parentType);
    if (!check.valid) {
      throw new Error(check.error || 'Invalid node hierarchy');
    }

    const title = customTitle || getNextDefaultTitle(nodes, type, parentId);

    const created = await manuscriptService.createNode({
      project_id: currentProject.id,
      parent_id: parentId,
      node_type: type,
      title,
    });

    await refreshTree(created.id);
    setSelectedNodeId(created.id);
    return created;
  };

  const handleRenameNode = async (id: string, newTitle: string): Promise<ManuscriptNode> => {
    const trimmed = newTitle.trim();
    if (!trimmed) throw new Error('Title cannot be empty');

    const updated = await manuscriptService.updateNode(id, { title: trimmed });
    setNodes((prev) => prev.map((n) => (n.id === id ? updated : n)));
    return updated;
  };

  const handleUpdateSynopsis = async (id: string, synopsis: string) => {
    const updated = await manuscriptService.updateNode(id, { synopsis });
    setNodes((prev) => prev.map((n) => (n.id === id ? updated : n)));
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    const updated = await manuscriptService.updateNode(id, { status });
    setNodes((prev) => prev.map((n) => (n.id === id ? updated : n)));
  };

  const handleDeleteNode = async (id: string) => {
    await manuscriptService.deleteNode(id);
    await refreshTree();
    await refreshProjects();
  };

  const handleDuplicateNode = async (id: string): Promise<ManuscriptNode> => {
    const duplicated = await manuscriptService.duplicateNode(id);
    await refreshTree();
    setSelectedNodeId(duplicated.id);
    return duplicated;
  };

  const handleMoveNode = async (
    nodeId: string,
    targetParentId: string | null,
    targetSortOrder: number
  ) => {
    if (hasCycle(nodes, nodeId, targetParentId)) {
      throw new Error('Cannot move a section into its own child or itself');
    }

    await manuscriptService.moveNode({
      node_id: nodeId,
      target_parent_id: targetParentId,
      target_sort_order: targetSortOrder,
    });
    await refreshTree();
  };

  const handleReorderNodes = async (items: ReorderItem[]) => {
    // Optimistic UI update
    setNodes((prev) => {
      const copy = [...prev];
      for (const item of items) {
        const found = copy.find((n) => n.id === item.id);
        if (found) {
          found.sort_order = item.sort_order;
          found.parent_id = item.parent_id;
        }
      }
      return copy.sort((a, b) => a.sort_order - b.sort_order);
    });

    await manuscriptService.reorderNodes(items);
  };

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveCurrentDocument = useCallback(
    async (
      contentJson: string,
      contentText: string,
      wordCount: number,
      characterCount: number,
      targetNodeId?: string
    ) => {
      const nodeToSave = targetNodeId || selectedNodeId;
      if (!nodeToSave) return;

      // Avoid unnecessary database writes if no changes exist
      if (
        activeDocument &&
        activeDocument.node_id === nodeToSave &&
        activeDocument.content_json === contentJson &&
        activeDocument.content_text === contentText
      ) {
        setSaveStatus('saved');
        return;
      }

      setSaveStatus('saving');

      try {
        const payload: SaveDocumentInput = {
          node_id: nodeToSave,
          content_json: contentJson,
          content_text: contentText,
          word_count: wordCount,
          character_count: characterCount,
        };

        const savedDoc = await manuscriptService.saveDocument(payload);
        if (nodeToSave === selectedNodeId) {
          setActiveDocument(savedDoc);
        }
        setSaveStatus('saved');
        setLastSavedTime(new Date());

        // Update local node word count for target node ONLY
        setNodes((prev) =>
          prev.map((n) => (n.id === nodeToSave ? { ...n, word_count: wordCount } : n))
        );

        // Periodically refresh project total words
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
          refreshProjects();
        }, 3000);
      } catch (err: any) {
        console.error('Failed to save document:', err);
        setSaveStatus('error');
        setError(err.message || 'Failed to save document content');
      }
    },
    [selectedNodeId, activeDocument, refreshProjects]
  );

  return (
    <ManuscriptContext.Provider
      value={{
        nodes,
        selectedNodeId,
        activeNode,
        activeDocument,
        saveStatus,
        lastSavedTime,
        isLoading,
        error,
        selectNode,
        createNode: handleCreateNode,
        renameNode: handleRenameNode,
        updateNodeSynopsis: handleUpdateSynopsis,
        updateNodeStatus: handleUpdateStatus,
        deleteNode: handleDeleteNode,
        duplicateNode: handleDuplicateNode,
        moveNode: handleMoveNode,
        reorderNodes: handleReorderNodes,
        saveCurrentDocument,
        refreshTree,
      }}
    >
      {children}
    </ManuscriptContext.Provider>
  );
};

export function useManuscript() {
  const context = useContext(ManuscriptContext);
  if (!context) {
    throw new Error('useManuscript must be used within a ManuscriptProvider');
  }
  return context;
}
