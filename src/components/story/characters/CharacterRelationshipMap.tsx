import React, { useState, useEffect, useRef } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Plus,
  HeartHandshake,
  Users,
} from 'lucide-react';
import {
  Character,
  CharacterRelationshipWithNames,
} from '../../../types/character';
import {
  calculateCircularLayout,
  getRoleColor,
  GraphNode,
} from '../../../utils/relationshipGraph';

interface CharacterRelationshipMapProps {
  characters: Character[];
  relationships: CharacterRelationshipWithNames[];
  onSelectCharacter: (char: Character) => void;
  onEditRelationship: (rel: CharacterRelationshipWithNames) => void;
  onDeleteRelationship: (rel: CharacterRelationshipWithNames) => void;
  onOpenNewRelationshipModal: () => void;
  onOpenNewCharacterModal: () => void;
}

export const CharacterRelationshipMap: React.FC<CharacterRelationshipMapProps> = ({
  characters,
  relationships,
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

  // Initialize nodes layout
  useEffect(() => {
    const width = containerRef.current?.clientWidth || 900;
    const height = containerRef.current?.clientHeight || 600;
    const initialNodes = calculateCircularLayout(characters, width, height, 100);
    setNodes(initialNodes);
  }, [characters]);

  // Handle Dragging Nodes
  const handleNodeMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDraggingNodeId(id);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingNodeId) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      // Convert screen coordinates to canvas space considering zoom and pan
      const currentX = (e.clientX - rect.left - pan.x) / zoom;
      const currentY = (e.clientY - rect.top - pan.y) / zoom;

      setNodes((prev) =>
        prev.map((n) => (n.id === draggingNodeId ? { ...n, x: currentX, y: currentY } : n)),
      );
    } else if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setDraggingNodeId(null);
    setIsPanning(false);
  };

  const handleBackgroundMouseDown = (e: React.MouseEvent) => {
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleResetLayout = () => {
    const width = containerRef.current?.clientWidth || 900;
    const height = containerRef.current?.clientHeight || 600;
    setNodes(calculateCircularLayout(characters, width, height, 100));
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  if (characters.length < 2) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-[var(--paper-bg)]">
        <div className="max-w-md mx-auto text-center space-y-4 p-8 bg-[var(--paper-surface)] rounded-2xl border border-[var(--paper-border)] shadow-xs">
          <Users className="w-12 h-12 mx-auto text-[var(--amber-accent)] opacity-80" />
          <div className="space-y-1">
            <h3 className="font-serif-novel text-base font-semibold text-[var(--ink-primary)]">
              Build Your Character Web
            </h3>
            <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
              Add at least two characters to your story database to visualize alliances, rivalries, family trees, and conflicts.
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
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--paper-bg)] relative select-none">
      {/* Map Control Toolbar */}
      <div className="absolute top-4 left-4 z-10 flex items-center space-x-2 bg-[var(--paper-surface)]/90 backdrop-blur-xs border border-[var(--paper-border)] p-1.5 rounded-xl shadow-md">
        <button
          onClick={onOpenNewRelationshipModal}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[var(--amber-accent)] text-stone-900 text-xs font-semibold hover:brightness-105 transition-all shadow-xs"
        >
          <HeartHandshake className="w-3.5 h-3.5" />
          <span>+ Link Characters</span>
        </button>

        <div className="h-4 w-px bg-[var(--paper-border)]" />

        <button
          onClick={() => setZoom((z) => Math.min(z + 0.15, 2.5))}
          title="Zoom In"
          className="p-1.5 rounded-lg text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--paper-desk)] transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          onClick={() => setZoom((z) => Math.max(z - 0.15, 0.4))}
          title="Zoom Out"
          className="p-1.5 rounded-lg text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--paper-desk)] transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <button
          onClick={handleResetLayout}
          title="Reset Layout & View"
          className="p-1.5 rounded-lg text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--paper-desk)] transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Instructions & Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-[var(--paper-surface)]/90 backdrop-blur-xs border border-[var(--paper-border)] px-3 py-2 rounded-xl text-[11px] text-[var(--ink-muted)] shadow-xs flex items-center space-x-4">
        <span>Click node to view profile • Drag to arrange • Click link label to edit</span>
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

      {/* Interactive SVG Canvas */}
      <div
        ref={containerRef}
        onMouseDown={handleBackgroundMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="w-full h-full cursor-grab active:cursor-grabbing overflow-hidden"
      >
        <svg
          className="w-full h-full"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
        >
          {/* Subtle Grid Pattern */}
          <defs>
            <pattern id="dot-grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <circle cx="15" cy="15" r="1" fill="var(--paper-border)" opacity="0.6" />
            </pattern>
          </defs>
          <rect width="10000" height="10000" x="-5000" y="-5000" fill="url(#dot-grid)" />

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
                    strokeDasharray={rel.relation_type.toLowerCase().includes('rival') ? '4 3' : 'none'}
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
                    onSelectCharacter(char);
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
        </svg>
      </div>
    </div>
  );
};
