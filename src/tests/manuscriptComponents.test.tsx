import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EditorStatus } from '../components/editor/EditorStatus';
import { FindReplaceBar } from '../components/editor/FindReplaceBar';
import { ManuscriptTreeNode } from '../components/manuscript/ManuscriptTreeNode';
import { ManuscriptContext } from '../context/ManuscriptContext';

describe('React Component Tests — Manuscript & Editor', () => {
  describe('EditorStatus Component', () => {
    it('renders save states accurately: saving, unsaved, saved, and error', () => {
      // 1. Saving
      const { rerender } = render(
        <EditorStatus
          saveStatus="saving"
          lastSavedTime={null}
          wordCount={120}
          characterCount={750}
        />
      );
      expect(screen.getByText(/Saving changes/i)).toBeDefined();

      // 2. Unsaved
      rerender(
        <EditorStatus
          saveStatus="unsaved"
          lastSavedTime={null}
          wordCount={120}
          characterCount={750}
        />
      );
      expect(screen.getByText(/Unsaved edits/i)).toBeDefined();

      // 3. Saved
      rerender(
        <EditorStatus
          saveStatus="saved"
          lastSavedTime={new Date('2026-09-19T10:30:00Z')}
          wordCount={120}
          characterCount={750}
        />
      );
      expect(screen.getByText(/Saved/i)).toBeDefined();

      // 4. Error
      rerender(
        <EditorStatus
          saveStatus="error"
          lastSavedTime={null}
          wordCount={120}
          characterCount={750}
        />
      );
      expect(screen.getByText(/Autosave failed/i)).toBeDefined();
    });

    it('displays word count and distinguishes characters with and without spaces', () => {
      render(
        <EditorStatus
          saveStatus="saved"
          lastSavedTime={null}
          wordCount={1842}
          characterCount={10500}
          characterCountNoSpaces={9100}
        />
      );

      expect(screen.getByText(/1,842/)).toBeDefined();
      expect(screen.getByText(/words/)).toBeDefined();
      expect(screen.getByText(/10,500/)).toBeDefined();
      expect(screen.getByText(/9,100 no spaces/)).toBeDefined();
    });
  });

  describe('FindReplaceBar Component', () => {
    it('handles search input, key navigation, and closing with Escape', () => {
      const mockClose = vi.fn();
      render(
        <FindReplaceBar
          editor={null}
          isOpen={true}
          onClose={mockClose}
        />
      );

      const input = screen.getByPlaceholderText(/Find in document/i);
      expect(input).toBeDefined();

      fireEvent.change(input, { target: { value: 'whisper' } });
      expect((input as HTMLInputElement).value).toBe('whisper');

      fireEvent.keyDown(input, { key: 'Escape' });
      expect(mockClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('ManuscriptTreeNode Inline Rename & Interaction', () => {
    const mockTreeNode = {
      node: {
        id: 'node-ch-1',
        project_id: 'demo-novel-1',
        parent_id: null,
        node_type: 'chapter' as const,
        title: 'Chapter 01: The Fog',
        synopsis: 'Introduction to the docks',
        sort_order: 1,
        status: 'draft',
        word_count: 850,
        created_at: '2026-09-19T08:00:00Z',
        updated_at: '2026-09-19T08:30:00Z',
        archived_at: null,
      },
      children: [],
    };

    it('cancels inline rename on Escape without losing original title', async () => {
      const mockRename = vi.fn();
      render(
        <ManuscriptContext.Provider
          value={{
            nodes: [mockTreeNode.node],
            selectedNodeId: 'node-ch-1',
            activeNode: mockTreeNode.node,
            activeDocument: null,
            saveStatus: 'saved',
            lastSavedTime: null,
            isLoading: false,
            error: null,
            selectNode: vi.fn(),
            createNode: vi.fn(),
            renameNode: mockRename,
            updateNodeSynopsis: vi.fn(),
            updateNodeStatus: vi.fn(),
            deleteNode: vi.fn(),
            duplicateNode: vi.fn(),
            moveNode: vi.fn(),
            reorderNodes: vi.fn(),
            saveCurrentDocument: vi.fn(),
            refreshTree: vi.fn(),
          }}
        >
          <ManuscriptTreeNode
            treeNode={mockTreeNode}
            onSelect={vi.fn()}
            selectedId="node-ch-1"
            onDragStart={vi.fn()}
            onDragOver={vi.fn()}
            onDrop={vi.fn()}
          />
        </ManuscriptContext.Provider>
      );

      const titleSpan = screen.getByText('Chapter 01: The Fog');
      expect(titleSpan).toBeDefined();

      // Double click to trigger inline rename
      fireEvent.doubleClick(titleSpan.closest('.group')!);

      const renameInput = screen.getByDisplayValue('Chapter 01: The Fog');
      expect(renameInput).toBeDefined();

      // User changes text but presses Escape
      fireEvent.change(renameInput, { target: { value: 'A Discarded Title' } });
      fireEvent.keyDown(renameInput, { key: 'Escape' });

      expect(mockRename).not.toHaveBeenCalled();
      expect(screen.getByText('Chapter 01: The Fog')).toBeDefined();
    });

    it('submits inline rename on Enter with new title', async () => {
      const mockRename = vi.fn().mockResolvedValue({
        ...mockTreeNode.node,
        title: 'The Journey Begins',
      });

      render(
        <ManuscriptContext.Provider
          value={{
            nodes: [mockTreeNode.node],
            selectedNodeId: 'node-ch-1',
            activeNode: mockTreeNode.node,
            activeDocument: null,
            saveStatus: 'saved',
            lastSavedTime: null,
            isLoading: false,
            error: null,
            selectNode: vi.fn(),
            createNode: vi.fn(),
            renameNode: mockRename,
            updateNodeSynopsis: vi.fn(),
            updateNodeStatus: vi.fn(),
            deleteNode: vi.fn(),
            duplicateNode: vi.fn(),
            moveNode: vi.fn(),
            reorderNodes: vi.fn(),
            saveCurrentDocument: vi.fn(),
            refreshTree: vi.fn(),
          }}
        >
          <ManuscriptTreeNode
            treeNode={mockTreeNode}
            onSelect={vi.fn()}
            selectedId="node-ch-1"
            onDragStart={vi.fn()}
            onDragOver={vi.fn()}
            onDrop={vi.fn()}
          />
        </ManuscriptContext.Provider>
      );

      const row = screen.getByText('Chapter 01: The Fog').closest('.group')!;
      fireEvent.doubleClick(row);

      const renameInput = screen.getByDisplayValue('Chapter 01: The Fog');
      fireEvent.change(renameInput, { target: { value: 'The Journey Begins' } });
      fireEvent.keyDown(renameInput, { key: 'Enter' });

      expect(mockRename).toHaveBeenCalledWith('node-ch-1', 'The Journey Begins');
    });

    it('renders distinct word count badges for each node without bleeding', () => {
      const nodeA = {
        ...mockTreeNode.node,
        id: 'node-a',
        title: 'Chapter 01: The Beginning',
        word_count: 1500,
      };
      const nodeB = {
        ...mockTreeNode.node,
        id: 'node-b',
        title: 'Chapter 02: The Middle',
        word_count: 320,
      };

      const treeA = { node: nodeA, children: [] };
      const treeB = { node: nodeB, children: [] };

      const { rerender } = render(
        <ManuscriptContext.Provider
          value={{
            nodes: [nodeA, nodeB],
            selectedNodeId: 'node-a',
            activeNode: nodeA,
            activeDocument: null,
            saveStatus: 'saved',
            lastSavedTime: null,
            isLoading: false,
            error: null,
            selectNode: vi.fn(),
            createNode: vi.fn(),
            renameNode: vi.fn(),
            updateNodeSynopsis: vi.fn(),
            updateNodeStatus: vi.fn(),
            deleteNode: vi.fn(),
            duplicateNode: vi.fn(),
            moveNode: vi.fn(),
            reorderNodes: vi.fn(),
            saveCurrentDocument: vi.fn(),
            refreshTree: vi.fn(),
          }}
        >
          <ManuscriptTreeNode
            treeNode={treeA}
            onSelect={vi.fn()}
            selectedId="node-a"
            onDragStart={vi.fn()}
            onDragOver={vi.fn()}
            onDrop={vi.fn()}
          />
          <ManuscriptTreeNode
            treeNode={treeB}
            onSelect={vi.fn()}
            selectedId="node-a"
            onDragStart={vi.fn()}
            onDragOver={vi.fn()}
            onDrop={vi.fn()}
          />
        </ManuscriptContext.Provider>
      );

      // Node A shows 1,500w and Node B shows 320w
      expect(screen.getByText('1,500w')).toBeDefined();
      expect(screen.getByText('320w')).toBeDefined();

      // Rerender selecting Node B
      rerender(
        <ManuscriptContext.Provider
          value={{
            nodes: [nodeA, nodeB],
            selectedNodeId: 'node-b',
            activeNode: nodeB,
            activeDocument: null,
            saveStatus: 'saved',
            lastSavedTime: null,
            isLoading: false,
            error: null,
            selectNode: vi.fn(),
            createNode: vi.fn(),
            renameNode: vi.fn(),
            updateNodeSynopsis: vi.fn(),
            updateNodeStatus: vi.fn(),
            deleteNode: vi.fn(),
            duplicateNode: vi.fn(),
            moveNode: vi.fn(),
            reorderNodes: vi.fn(),
            saveCurrentDocument: vi.fn(),
            refreshTree: vi.fn(),
          }}
        >
          <ManuscriptTreeNode
            treeNode={treeA}
            onSelect={vi.fn()}
            selectedId="node-b"
            onDragStart={vi.fn()}
            onDragOver={vi.fn()}
            onDrop={vi.fn()}
          />
          <ManuscriptTreeNode
            treeNode={treeB}
            onSelect={vi.fn()}
            selectedId="node-b"
            onDragStart={vi.fn()}
            onDragOver={vi.fn()}
            onDrop={vi.fn()}
          />
        </ManuscriptContext.Provider>
      );

      // Word counts remain 1,500w and 320w even when selectedNodeId changes to node-b
      expect(screen.getByText('1,500w')).toBeDefined();
      expect(screen.getByText('320w')).toBeDefined();
    });
  });
});
