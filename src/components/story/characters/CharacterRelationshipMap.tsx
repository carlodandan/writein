import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Plus,
  HeartHandshake,
  Users,
  Maximize2,
  Move,
} from 'lucide-react';
import {
  Character,
  CharacterRelationshipWithNames,
} from '../../../types/character';
import {
  calculateCircularLayout,
  calculateFitView,
  getRoleColor,
  GraphNode,
} from '../../../utils/relationshipGraph';

interface CharacterRelationshipMapProps {
  characters: Character[];
  relationships: CharacterRelationshipWithNames[];
  projectId?: string;
  onSelectCharacter: (char: Character) => void;
  onEditRelationship: (rel: CharacterRelationshipWithNames) => void;
  onDeleteRelationship: (rel: CharacterRelationshipWithNames) => void;
  onOpenNewRelationshipModal: () => void;
  onOpenNewCharacterModal: () => void;
}

export const CharacterRelationshipMap: React.FC<CharacterRelationshipMapProps> = ({
  characters,
  relationships,
  projectId,
  onSelectCharacter,
  onEditRelationship,
  onDeleteRelationship,
  onOpenNewRelationshipModal,
  onOpenNewCharacterModal,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [hoveredRelId, setHoveredRelId] = useState<string | null>(null);

  // Drag tracking to distinguish pure click from drag
  const dragStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const hasMovedRef = useRef(false);

  // References for active auto-pan and dragging
  const draggingNodeIdRef = useRef<string | null>(null);
  draggingNodeIdRef.current = draggingNodeId;

  const isPanningRef = useRef(false);
  isPanningRef.current = isPanning;

  const panRef = useRef(pan);
  panRef.current = pan;

  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;

  const mouseClientPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const autoPanAnimationRef = useRef<number | null>(null);

  const storageKey = `writein_rel_positions_${projectId || characters[0]?.project_id || 'default'}`;

  // Helper to load cached node coordinates
  const loadSavedPositions = useCallback((): Record<string, { x: number; y: number }> => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load saved relationship node positions:', e);
    }
    return {};
  }, [storageKey]);

  // Helper to persist node coordinates
  const persistPositions = useCallback(
    (currentNodes: GraphNode[]) => {
      try {
        const positions: Record<string, { x: number; y: number }> = {};
        for (const n of currentNodes) {
          positions[n.id] = { x: Math.round(n.x), y: Math.round(n.y) };
        }
        localStorage.setItem(storageKey, JSON.stringify(positions));
      } catch (e) {
        console.warn('Failed to persist relationship node positions:', e);
      }
    },
    [storageKey],
  );

  // Initialize nodes layout preserving positions
  useEffect(() => {
    if (characters.length === 0) {
      setNodes([]);
      return;
    }

    const width = containerRef.current?.clientWidth || 900;
    const height = containerRef.current?.clientHeight || 600;
    const savedPositions = loadSavedPositions();
    const defaultLayout = calculateCircularLayout(characters, width, height, 110);

    setNodes((prevNodes) => {
      const prevMap = new Map(prevNodes.map((n) => [n.id, n]));

      return defaultLayout.map((node, index) => {
        // Prioritize in-memory state, then localStorage saved position, then default circular
        const inMemory = prevMap.get(node.id);
        if (inMemory) {
          return { ...node, x: inMemory.x, y: inMemory.y };
        }
        const saved = savedPositions[node.id];
        if (saved && typeof saved.x === 'number' && typeof saved.y === 'number') {
          return { ...node, x: saved.x, y: saved.y };
        }
        // Offset new characters slightly if others exist
        if (Object.keys(savedPositions).length > 0) {
          return {
            ...node,
            x: width / 2 + Math.cos((index * 2 * Math.PI) / characters.length) * 180,
            y: height / 2 + Math.sin((index * 2 * Math.PI) / characters.length) * 180,
          };
        }
        return node;
      });
    });
  }, [characters, loadSavedPositions]);

  // Center zoom around a focal point in screen coordinates
  const zoomAroundPoint = useCallback(
    (nextZoom: number, focalScreenX: number, focalScreenY: number) => {
      const clampedZoom = Math.min(Math.max(nextZoom, 0.2), 3.0);
      const currentZoom = zoomRef.current;
      if (Math.abs(clampedZoom - currentZoom) < 0.001) return;

      const currentPan = panRef.current;
      const factor = clampedZoom / currentZoom;
      const newPanX = focalScreenX - (focalScreenX - currentPan.x) * factor;
      const newPanY = focalScreenY - (focalScreenY - currentPan.y) * factor;

      setZoom(Number(clampedZoom.toFixed(2)));
      setPan({ x: Math.round(newPanX), y: Math.round(newPanY) });
    },
    [],
  );

  // Zoom relative to viewport center
  const handleZoomChange = (delta: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const centerX = rect ? rect.width / 2 : 450;
    const centerY = rect ? rect.height / 2 : 300;
    zoomAroundPoint(zoom + delta, centerX, centerY);
  };

  // Fit all nodes comfortably within the visible canvas
  const handleFitView = () => {
    if (!containerRef.current || nodes.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const fit = calculateFitView(nodes, rect.width, rect.height, 90);
    setPan(fit.pan);
    setZoom(fit.zoom);
  };

  // Reset entire layout to a symmetrical circle
  const handleResetLayout = () => {
    const width = containerRef.current?.clientWidth || 900;
    const height = containerRef.current?.clientHeight || 600;
    const freshLayout = calculateCircularLayout(characters, width, height, 120);
    setNodes(freshLayout);
    persistPositions(freshLayout);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Node mouse down
  const handleNodeMouseDown = (e: React.MouseEvent, id: string) => {
    // Only primary mouse button initiates drag
    if (e.button !== 0) return;
    e.stopPropagation();
    setDraggingNodeId(id);
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    hasMovedRef.current = false;
  };

  // Background mouse down (Canvas Panning)
  const handleBackgroundMouseDown = (e: React.MouseEvent) => {
    // Left or Middle click pans
    if (e.button === 0 || e.button === 1) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  // Auto-pan loop when dragging near or outside edges of the screen
  const checkAutoPan = useCallback(() => {
    if (!draggingNodeIdRef.current || !containerRef.current) {
      if (autoPanAnimationRef.current) {
        cancelAnimationFrame(autoPanAnimationRef.current);
        autoPanAnimationRef.current = null;
      }
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = mouseClientPosRef.current.x - rect.left;
    const mouseY = mouseClientPosRef.current.y - rect.top;

    const EDGE_MARGIN = 40;
    let deltaPanX = 0;
    let deltaPanY = 0;

    if (mouseX < EDGE_MARGIN) {
      deltaPanX = Math.min(20, (EDGE_MARGIN - mouseX) * 0.4 + 4);
    } else if (mouseX > rect.width - EDGE_MARGIN) {
      deltaPanX = -Math.min(20, (mouseX - (rect.width - EDGE_MARGIN)) * 0.4 + 4);
    }

    if (mouseY < EDGE_MARGIN) {
      deltaPanY = Math.min(20, (EDGE_MARGIN - mouseY) * 0.4 + 4);
    } else if (mouseY > rect.height - EDGE_MARGIN) {
      deltaPanY = -Math.min(20, (mouseY - (rect.height - EDGE_MARGIN)) * 0.4 + 4);
    }

    if (deltaPanX !== 0 || deltaPanY !== 0) {
      const activeId = draggingNodeIdRef.current;
      const currentZoom = zoomRef.current;

      setPan((prevPan) => {
        const nextPan = {
          x: prevPan.x + deltaPanX,
          y: prevPan.y + deltaPanY,
        };

        // Also update dragged node position in canvas world coordinates
        const canvasX = (mouseClientPosRef.current.x - rect.left - nextPan.x) / currentZoom;
        const canvasY = (mouseClientPosRef.current.y - rect.top - nextPan.y) / currentZoom;

        setNodes((prevNodes) =>
          prevNodes.map((n) =>
            n.id === activeId ? { ...n, x: canvasX, y: canvasY } : n,
          ),
        );

        return nextPan;
      });
    }

    autoPanAnimationRef.current = requestAnimationFrame(checkAutoPan);
  }, []);

  // Global window listeners for smooth, uninterrupted drag and pan across edges
  useEffect(() => {
    if (!draggingNodeId && !isPanning) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      mouseClientPosRef.current = { x: e.clientX, y: e.clientY };

      if (dragStartPosRef.current) {
        const dist = Math.hypot(
          e.clientX - dragStartPosRef.current.x,
          e.clientY - dragStartPosRef.current.y,
        );
        if (dist > 4) {
          hasMovedRef.current = true;
        }
      }

      if (draggingNodeIdRef.current) {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        // Start auto-pan loop if not running
        if (!autoPanAnimationRef.current) {
          autoPanAnimationRef.current = requestAnimationFrame(checkAutoPan);
        }

        const canvasX = (e.clientX - rect.left - panRef.current.x) / zoomRef.current;
        const canvasY = (e.clientY - rect.top - panRef.current.y) / zoomRef.current;

        setNodes((prev) =>
          prev.map((n) =>
            n.id === draggingNodeIdRef.current ? { ...n, x: canvasX, y: canvasY } : n,
          ),
        );
      } else if (isPanningRef.current) {
        setPan({
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        });
      }
    };

    const handleWindowMouseUp = () => {
      if (draggingNodeIdRef.current) {
        persistPositions(nodesRef.current);
      }
      setDraggingNodeId(null);
      setIsPanning(false);
      dragStartPosRef.current = null;

      if (autoPanAnimationRef.current) {
        cancelAnimationFrame(autoPanAnimationRef.current);
        autoPanAnimationRef.current = null;
      }
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
      if (autoPanAnimationRef.current) {
        cancelAnimationFrame(autoPanAnimationRef.current);
        autoPanAnimationRef.current = null;
      }
    };
  }, [draggingNodeId, isPanning, panStart, checkAutoPan, persistPositions]);

  // Wheel listener for smooth trackpad pan and pinch/Ctrl-zoom
  const hasCanvas = characters.length >= 2;
  useEffect(() => {
    if (!hasCanvas) return;
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = container.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;

      if (e.ctrlKey || e.metaKey) {
        // Pinch zoom / Ctrl + Wheel Zoom
        const zoomDelta = -e.deltaY * 0.0025;
        const targetZoom = zoomRef.current * (1 + zoomDelta);
        zoomAroundPoint(targetZoom, cursorX, cursorY);
      } else {
        // Pan gesture (two-finger scroll or wheel)
        setPan((prev) => ({
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY,
        }));
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [hasCanvas, zoomAroundPoint]);

  if (!hasCanvas) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-[var(--paper-bg)]">
        <div className="max-w-md mx-auto text-center space-y-4 p-8 bg-[var(--paper-surface)] rounded-2xl border border-[var(--paper-border)] shadow-xs">
          <Users className="w-12 h-12 mx-auto text-[var(--amber-accent)] opacity-80" />
          <div className="space-y-1">
            <h3 className="font-serif-novel text-base font-semibold text-[var(--ink-primary)]">
              Build Your Character Web
            </h3>
            <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
              Add at least two characters to your story database to visualize alliances, rivalries, family trees, and conflicts on an endless canvas.
            </p>
          </div>
          <button
            onClick={onOpenNewCharacterModal}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-[var(--amber-accent)] text-stone-900 text-xs font-semibold hover:brightness-105 transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create Character</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--paper-bg)] relative select-none">
      {/* Map Control Toolbar */}
      <div className="absolute top-4 left-4 z-10 flex items-center space-x-1.5 bg-[var(--paper-surface)]/95 backdrop-blur-md border border-[var(--paper-border)] p-1.5 rounded-xl shadow-md">
        <button
          onClick={onOpenNewRelationshipModal}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[var(--amber-accent)] text-stone-900 text-xs font-semibold hover:brightness-105 transition-all shadow-xs mr-1"
        >
          <HeartHandshake className="w-3.5 h-3.5" />
          <span>+ Link Characters</span>
        </button>

        <div className="h-4 w-px bg-[var(--paper-border)]" />

        <button
          onClick={() => handleZoomChange(0.15)}
          title="Zoom In"
          className="p-1.5 rounded-lg text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--paper-desk)] transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <span
          onClick={() => {
            const rect = containerRef.current?.getBoundingClientRect();
            zoomAroundPoint(1, rect ? rect.width / 2 : 450, rect ? rect.height / 2 : 300);
          }}
          title="Click to reset zoom to 100%"
          className="px-1.5 text-[11px] font-mono font-medium text-[var(--ink-muted)] hover:text-[var(--ink-primary)] cursor-pointer"
        >
          {Math.round(zoom * 100)}%
        </span>

        <button
          onClick={() => handleZoomChange(-0.15)}
          title="Zoom Out"
          className="p-1.5 rounded-lg text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--paper-desk)] transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-[var(--paper-border)]" />

        <button
          onClick={handleFitView}
          title="Fit All Characters to Screen"
          className="p-1.5 rounded-lg text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--paper-desk)] transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <button
          onClick={handleResetLayout}
          title="Rearrange in Circle & Center View"
          className="p-1.5 rounded-lg text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--paper-desk)] transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Instructions & Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-[var(--paper-surface)]/95 backdrop-blur-md border border-[var(--paper-border)] px-3 py-2 rounded-xl text-[11px] text-[var(--ink-muted)] shadow-xs flex items-center space-x-4">
        <span className="flex items-center space-x-1.5">
          <Move className="w-3.5 h-3.5 text-[var(--amber-accent)]" />
          <span>Scroll/drag to pan • Drag characters anywhere without limits • Right-click link to delete</span>
        </span>
        <div className="flex items-center space-x-2 border-l border-[var(--paper-border)] pl-3">
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Protagonist</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span>Antagonist</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Supporting</span>
          </span>
        </div>
      </div>

      {/* Truly Unlimited SVG Canvas Viewport */}
      <div
        ref={containerRef}
        onMouseDown={handleBackgroundMouseDown}
        className={`w-full h-full relative overflow-hidden select-none outline-hidden ${
          isPanning ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        <svg
          className="w-full h-full block select-none pointer-events-auto"
          style={{ overflow: 'visible' }}
        >
          {/* Infinite Dot Grid Pattern that seamlessly follows Pan & Zoom */}
          <defs>
            <pattern
              id="dot-grid"
              width={32}
              height={32}
              patternUnits="userSpaceOnUse"
              patternTransform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}
            >
              <circle cx={16} cy={16} r={1.2} fill="var(--paper-border)" opacity="0.6" />
            </pattern>
          </defs>

          {/* Endless Background Rect that catches pan gestures */}
          <rect
            width="100%"
            height="100%"
            fill="url(#dot-grid)"
            className="cursor-inherit pointer-events-auto"
          />

          {/* Transformed World Group containing all Nodes and Relationships */}
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* Edges / Relationship Connections */}
            <g>
              {relationships.map((rel) => {
                const nodeA = nodes.find((n) => n.id === rel.character_a_id);
                const nodeB = nodes.find((n) => n.id === rel.character_b_id);
                if (!nodeA || !nodeB) return null;

                const isHovered = hoveredRelId === rel.id;
                const midX = (nodeA.x + nodeB.x) / 2;
                const midY = (nodeA.y + nodeB.y) / 2;

                return (
                  <g
                    key={rel.id}
                    className="cursor-pointer group"
                    onMouseEnter={() => setHoveredRelId(rel.id)}
                    onMouseLeave={() => setHoveredRelId(null)}
                  >
                    {/* Connection Line */}
                    <line
                      x1={nodeA.x}
                      y1={nodeA.y}
                      x2={nodeB.x}
                      y2={nodeB.y}
                      stroke={isHovered ? 'var(--amber-accent)' : 'var(--paper-border-subtle)'}
                      strokeWidth={isHovered ? 2.5 : 1.5}
                      strokeDasharray={
                        rel.relation_type.toLowerCase().includes('rival') ? '4 3' : 'none'
                      }
                      className="transition-all"
                    />

                    {/* Midpoint Label Pill */}
                    <g
                      transform={`translate(${midX}, ${midY})`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditRelationship(rel);
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onDeleteRelationship(rel);
                      }}
                      className="cursor-pointer"
                    >
                      <title>Click to edit relationship, right-click to delete link</title>
                      <rect
                        x={-rel.relation_type.length * 3.5 - 12}
                        y={-12}
                        width={rel.relation_type.length * 7 + 24}
                        height={24}
                        rx={12}
                        fill="var(--paper-surface)"
                        stroke={isHovered ? 'var(--amber-accent)' : 'var(--paper-border)'}
                        strokeWidth={1}
                        className="transition-colors shadow-xs"
                      />
                      <text
                        x={0}
                        y={4}
                        textAnchor="middle"
                        fill={isHovered ? 'var(--amber-accent)' : 'var(--ink-secondary)'}
                        fontSize="11"
                        fontFamily="system-ui, sans-serif"
                        fontWeight="600"
                      >
                        {rel.relation_type}
                      </text>
                    </g>
                  </g>
                );
              })}
            </g>

            {/* Nodes / Character Markers */}
            <g>
              {nodes.map((node) => {
                const char = characters.find((c) => c.id === node.id);
                if (!char) return null;
                const roleStyling = getRoleColor(char.role);
                const initials = char.name
                  .split(' ')
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase();

                const isDragging = draggingNodeId === node.id;

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                    onClick={(e) => {
                      e.stopPropagation();
                      // Only trigger character dossier if not dragging
                      if (!hasMovedRef.current) {
                        onSelectCharacter(char);
                      }
                    }}
                    className="cursor-pointer select-none"
                  >
                    {/* Outer circle halo when dragging */}
                    {isDragging && (
                      <circle
                        r={36}
                        fill="none"
                        stroke="var(--amber-accent)"
                        strokeWidth={1.5}
                        strokeDasharray="3 3"
                        className="animate-spin"
                      />
                    )}

                    {/* Character Node Circle */}
                    <circle
                      r={28}
                      fill={roleStyling.nodeBg}
                      stroke={roleStyling.border}
                      strokeWidth={2.5}
                      className="shadow-md transition-transform hover:scale-105"
                    />

                    {/* Initials Text */}
                    <text
                      x={0}
                      y={5}
                      textAnchor="middle"
                      fill={roleStyling.nodeText}
                      fontSize="13"
                      fontWeight="700"
                      fontFamily="serif"
                    >
                      {initials}
                    </text>

                    {/* Character Name Label below */}
                    <g transform="translate(0, 42)">
                      <rect
                        x={-char.name.length * 3.8 - 8}
                        y={-10}
                        width={char.name.length * 7.6 + 16}
                        height={20}
                        rx={6}
                        fill="var(--paper-surface)"
                        stroke="var(--paper-border)"
                        strokeWidth={1}
                      />
                      <text
                        x={0}
                        y={4}
                        textAnchor="middle"
                        fill="var(--ink-primary)"
                        fontSize="11"
                        fontWeight="600"
                        fontFamily="system-ui, sans-serif"
                      >
                        {char.name}
                      </text>
                    </g>
                  </g>
                );
              })}
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
};
