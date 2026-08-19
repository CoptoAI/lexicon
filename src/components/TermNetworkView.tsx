import React, { useEffect, useRef, useState } from 'react';
import { NetworkData, NetworkNode, NetworkLink } from '../types/dictionary';
import { fetchTermNetwork } from '../services/api';
import { useSwipeGesture } from '../utils/useSwipeGesture';
import { X, ZoomIn, ZoomOut, RotateCcw, Share2, ArrowRight, BookOpen } from 'lucide-react';

interface TermNetworkViewProps {
  word: string;
  onClose: () => void;
  onSelectWord: (word: string) => void;
}

export const TermNetworkView: React.FC<TermNetworkViewProps> = ({
  word,
  onClose,
  onSelectWord
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [data, setData] = useState<NetworkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredNode, setHoveredNode] = useState<NetworkNode | null>(null);
  const [selectedMobileNode, setSelectedMobileNode] = useState<NetworkNode | null>(null);

  const { dragOffset, isDragging: isSheetDragging, touchHandlers: sheetTouchHandlers } = useSwipeGesture({
    onSwipeDown: onClose,
    threshold: 90,
    enableVerticalDrag: true
  });

  const touchPinchDist = useRef<number | null>(null);

  const simulationRef = useRef<{
    nodes: Array<NetworkNode & { vx: number; vy: number; radius: number }>;
    links: any[];
    transform: { x: number; y: number; k: number };
    draggingNode: (NetworkNode & { vx: number; vy: number; radius: number }) | null;
    isPanning: boolean;
    panStart: { x: number; y: number };
    animationId: number | null;
  }>({
    nodes: [],
    links: [],
    transform: { x: 0, y: 0, k: 1 },
    draggingNode: null,
    isPanning: false,
    panStart: { x: 0, y: 0 },
    animationId: null
  });

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchTermNetwork(word).then((res) => {
      if (isMounted) {
        setData(res);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [word]);

  useEffect(() => {
    if (!data || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;

    // Initialize node positions in a radial cluster
    const nodes = data.nodes.map((n: NetworkNode, i: number) => {
      const isRoot = n.isRoot || n.id === word;
      const angle = (i / Math.max(1, data.nodes.length - 1)) * 2 * Math.PI;
      const dist = isRoot ? 0 : 110 + Math.random() * 50;
      return {
        ...n,
        x: width / 2 + (isRoot ? 0 : Math.cos(angle) * dist),
        y: height / 2 + (isRoot ? 0 : Math.sin(angle) * dist),
        vx: 0,
        vy: 0,
        radius: isRoot ? 24 : Math.min(22, Math.max(12, Math.sqrt(n.freq || 10) * 3))
      };
    });

    const links = data.links.map((l: NetworkLink) => {
      const sourceNode = nodes.find((n: NetworkNode) => n.id === l.source || n.id === (l.source as any).id);
      const targetNode = nodes.find((n: NetworkNode) => n.id === l.target || n.id === (l.target as any).id);
      return {
        ...l,
        source: sourceNode || nodes[0],
        target: targetNode || nodes[0]
      };
    });

    simulationRef.current.nodes = nodes;
    simulationRef.current.links = links;
    simulationRef.current.transform = { x: 0, y: 0, k: 1 };

    // Simple spring simulation loop
    const tick = () => {
      const state = simulationRef.current;
      const dt = 0.04;
      const kCenter = 0.02;
      const kLink = 0.04;
      const kRepulsion = 1200;

      // Center force
      for (const node of state.nodes) {
        if (node === state.draggingNode) continue;
        const dx = width / 2 - node.x!;
        const dy = height / 2 - node.y!;
        node.vx += dx * kCenter;
        node.vy += dy * kCenter;
      }

      // Repulsion between nodes
      for (let i = 0; i < state.nodes.length; i++) {
        for (let j = i + 1; j < state.nodes.length; j++) {
          const n1 = state.nodes[i];
          const n2 = state.nodes[j];
          const dx = n2.x! - n1.x!;
          const dy = n2.y! - n1.y!;
          const distSq = dx * dx + dy * dy + 1;
          const force = kRepulsion / distSq;
          const angle = Math.atan2(dy, dx);
          if (n1 !== state.draggingNode) {
            n1.vx -= Math.cos(angle) * force;
            n1.vy -= Math.sin(angle) * force;
          }
          if (n2 !== state.draggingNode) {
            n2.vx += Math.cos(angle) * force;
            n2.vy += Math.sin(angle) * force;
          }
        }
      }

      // Spring links
      for (const link of state.links) {
        const s = link.source;
        const t = link.target;
        const dx = t.x! - s.x!;
        const dy = t.y! - s.y!;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const targetDist = 120;
        const force = (dist - targetDist) * kLink;
        if (s !== state.draggingNode) {
          s.vx += (dx / dist) * force;
          s.vy += (dy / dist) * force;
        }
        if (t !== state.draggingNode) {
          t.vx -= (dx / dist) * force;
          t.vy -= (dy / dist) * force;
        }
      }

      // Update positions with damping
      for (const node of state.nodes) {
        if (node === state.draggingNode) continue;
        node.x! += node.vx * dt;
        node.y! += node.vy * dt;
        node.vx *= 0.88;
        node.vy *= 0.88;
      }

      // Render
      ctx.save();
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      ctx.clearRect(0, 0, width, height);

      const { x: tx, y: ty, k } = state.transform;
      ctx.translate(tx, ty);
      ctx.scale(k, k);

      // Draw Links
      for (const link of state.links) {
        ctx.beginPath();
        ctx.moveTo(link.source.x!, link.source.y!);
        ctx.lineTo(link.target.x!, link.target.y!);
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
        ctx.lineWidth = Math.max(1, Math.min(4, Math.log10(link.freq || 2) * 1.5));
        ctx.stroke();
      }

      // Draw Nodes
      for (const node of state.nodes) {
        const isRoot = node.isRoot || node.id === word;
        ctx.beginPath();
        ctx.arc(node.x!, node.y!, node.radius, 0, 2 * Math.PI);

        if (isRoot) {
          ctx.fillStyle = '#d4af37';
          ctx.shadowColor = 'rgba(212, 175, 55, 0.8)';
          ctx.shadowBlur = 15;
        } else {
          ctx.fillStyle = '#1e2433';
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
        }
        ctx.fill();

        ctx.strokeStyle = isRoot ? '#fef08a' : 'rgba(212, 175, 55, 0.5)';
        ctx.lineWidth = isRoot ? 3 : 1.5;
        ctx.stroke();

        // Label
        ctx.font = `${isRoot ? 'bold 16px' : '13px'} "Antinoou", sans-serif`;
        ctx.fillStyle = isRoot ? '#0c0f17' : '#f1f5f9';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.label, node.x!, node.y!);
      }

      ctx.restore();
      state.animationId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      if (simulationRef.current.animationId) {
        cancelAnimationFrame(simulationRef.current.animationId);
      }
    };
  }, [data, word]);

  const getNodeAtPos = (clientX: number, clientY: number): NetworkNode | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const mouseX = (clientX - rect.left - simulationRef.current.transform.x) / simulationRef.current.transform.k;
    const mouseY = (clientY - rect.top - simulationRef.current.transform.y) / simulationRef.current.transform.k;

    for (const node of simulationRef.current.nodes) {
      const dx = mouseX - node.x!;
      const dy = mouseY - node.y!;
      if (Math.sqrt(dx * dx + dy * dy) < node.radius + 6) {
        return node;
      }
    }
    return null;
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const node = getNodeAtPos(e.clientX, e.clientY);
    if (node) {
      simulationRef.current.draggingNode = node as any;
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - simulationRef.current.transform.x) / simulationRef.current.transform.k;
    const mouseY = (e.clientY - rect.top - simulationRef.current.transform.y) / simulationRef.current.transform.k;

    if (simulationRef.current.draggingNode) {
      simulationRef.current.draggingNode.x = mouseX;
      simulationRef.current.draggingNode.y = mouseY;
    } else {
      const node = getNodeAtPos(e.clientX, e.clientY);
      setHoveredNode(node);
      canvas.style.cursor = node ? 'pointer' : 'default';
    }
  };

  const handleCanvasMouseUp = () => {
    simulationRef.current.draggingNode = null;
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (hoveredNode && hoveredNode.id !== word) {
      onSelectWord(hoveredNode.id);
    }
  };

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const node = getNodeAtPos(touch.clientX, touch.clientY);
      if (node) {
        simulationRef.current.draggingNode = node as any;
        setSelectedMobileNode(node);
      } else {
        simulationRef.current.isPanning = true;
        simulationRef.current.panStart = {
          x: touch.clientX - simulationRef.current.transform.x,
          y: touch.clientY - simulationRef.current.transform.y
        };
      }
    } else if (e.touches.length === 2) {
      // 2-Finger Pinch to zoom
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchPinchDist.current = Math.sqrt(dx * dx + dy * dy);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      if (simulationRef.current.draggingNode) {
        const mouseX = (touch.clientX - rect.left - simulationRef.current.transform.x) / simulationRef.current.transform.k;
        const mouseY = (touch.clientY - rect.top - simulationRef.current.transform.y) / simulationRef.current.transform.k;
        simulationRef.current.draggingNode.x = mouseX;
        simulationRef.current.draggingNode.y = mouseY;
      } else if (simulationRef.current.isPanning) {
        simulationRef.current.transform.x = touch.clientX - simulationRef.current.panStart.x;
        simulationRef.current.transform.y = touch.clientY - simulationRef.current.panStart.y;
      }
    } else if (e.touches.length === 2 && touchPinchDist.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const newDist = Math.sqrt(dx * dx + dy * dy);
      const ratio = newDist / touchPinchDist.current;
      simulationRef.current.transform.k = Math.max(0.4, Math.min(3, simulationRef.current.transform.k * ratio));
      touchPinchDist.current = newDist;
    }
  };

  const handleTouchEnd = () => {
    simulationRef.current.draggingNode = null;
    simulationRef.current.isPanning = false;
    touchPinchDist.current = null;
  };

  const handleZoom = (factor: number) => {
    simulationRef.current.transform.k = Math.max(0.4, Math.min(3, simulationRef.current.transform.k * factor));
  };

  const handleResetZoom = () => {
    simulationRef.current.transform = { x: 0, y: 0, k: 1 };
  };

  return (
    <div className="modal-backdrop modal-backdrop-sheet" onClick={onClose}>
      <div
        className="modal-content modal-content-sheet"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '960px',
          transform: isSheetDragging && dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined,
          transition: isSheetDragging ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          opacity: isSheetDragging && dragOffset > 40 ? Math.max(0.6, 1 - dragOffset / 400) : 1
        }}
      >
        {/* Mobile Swipe / Drag Handle */}
        <div className="sheet-drag-handle-touch-zone" {...sheetTouchHandlers}>
          <div className="sheet-drag-handle" />
        </div>

        <button className="modal-close-btn" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <Share2 size={24} color="var(--accent-gold)" />
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', margin: 0 }}>
              Collocation Network: <span style={{ fontFamily: 'var(--font-coptic)', color: 'var(--text-coptic)' }}>{word}</span>
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              Syntactic co-occurrences from Coptic Universal Dependency Treebank
            </p>
          </div>
        </div>

        <div className="network-container">
          <canvas
            ref={canvasRef}
            style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onClick={handleCanvasClick}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />

          <div className="network-floating-controls">
            <button className="btn-icon" onClick={() => handleZoom(1.2)} title="Zoom In" aria-label="Zoom In">
              <ZoomIn size={16} />
            </button>
            <button className="btn-icon" onClick={() => handleZoom(0.8)} title="Zoom Out" aria-label="Zoom Out">
              <ZoomOut size={16} />
            </button>
            <button className="btn-icon" onClick={handleResetZoom} title="Reset View" aria-label="Reset View">
              <RotateCcw size={16} />
            </button>
          </div>

          {/* Desktop Hover Info */}
          {hoveredNode && (
            <div className="network-hover-badge">
              <span style={{ fontFamily: 'var(--font-coptic)', fontSize: '16px', fontWeight: 'bold', color: 'var(--accent-gold)' }}>
                {hoveredNode.label}
              </span>
              {hoveredNode.freq && <span style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>({hoveredNode.freq} attestations)</span>}
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Click node to explore entry</div>
            </div>
          )}

          {/* Mobile Node Inspector Bottom Sheet Card */}
          {selectedMobileNode && (
            <div className="network-mobile-node-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span className="coptic-font" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-coptic)' }}>
                    {selectedMobileNode.label}
                  </span>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {selectedMobileNode.freq || 1} corpus occurrences
                  </div>
                </div>
                <button
                  className="btn-nav"
                  onClick={() => {
                    onClose();
                    onSelectWord(selectedMobileNode.id);
                  }}
                  style={{ borderColor: 'var(--border-gold)', color: 'var(--accent-gold)' }}
                >
                  <span>Explore Word</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5', marginTop: '6px' }}>
          <strong>Pinch or touch-drag</strong> nodes to explore graph relationships. Tap any connected node to look up its dictionary entry.
        </div>
      </div>
    </div>
  );
};
