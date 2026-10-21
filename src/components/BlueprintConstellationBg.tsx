import React, { useEffect, useRef } from 'react';
import { ChapterProgressInfo, clamp } from '../utils/motionMath';

interface BlueprintConstellationBgProps {
  scrollProgress: number;
  activeChapter: ChapterProgressInfo;
}

interface ConstellationNode {
  id: number;
  baseX: number; // percentage 0..100
  baseY: number; // percentage 0..100
  x: number;
  y: number;
  vx: number;
  vy: number;
  depth: number;
  orbitRadius: number;
  orbitSpeed: number;
  phase: number;
}

const INITIAL_NODES: ConstellationNode[] = [
  { id: 0, baseX: 12, baseY: 18, x: 12, y: 18, vx: 0, vy: 0, depth: 0.8, orbitRadius: 2.2, orbitSpeed: 0.7, phase: 0.2 },
  { id: 1, baseX: 28, baseY: 32, x: 28, y: 32, vx: 0, vy: 0, depth: 1.2, orbitRadius: 3.1, orbitSpeed: 0.5, phase: 1.1 },
  { id: 2, baseX: 18, baseY: 68, x: 18, y: 68, vx: 0, vy: 0, depth: 1.0, orbitRadius: 2.6, orbitSpeed: 0.65, phase: 2.0 },
  { id: 3, baseX: 38, baseY: 78, x: 38, y: 78, vx: 0, vy: 0, depth: 0.9, orbitRadius: 2.8, orbitSpeed: 0.55, phase: 2.8 },
  { id: 4, baseX: 52, baseY: 22, x: 52, y: 22, vx: 0, vy: 0, depth: 1.35, orbitRadius: 3.4, orbitSpeed: 0.6, phase: 3.5 },
  { id: 5, baseX: 64, baseY: 48, x: 64, y: 48, vx: 0, vy: 0, depth: 1.1, orbitRadius: 2.5, orbitSpeed: 0.75, phase: 4.1 },
  { id: 6, baseX: 48, baseY: 62, x: 48, y: 62, vx: 0, vy: 0, depth: 0.75, orbitRadius: 2.0, orbitSpeed: 0.8, phase: 4.9 },
  { id: 7, baseX: 82, baseY: 24, x: 82, y: 24, vx: 0, vy: 0, depth: 1.25, orbitRadius: 3.0, orbitSpeed: 0.52, phase: 5.4 },
  { id: 8, baseX: 88, baseY: 58, x: 88, y: 58, vx: 0, vy: 0, depth: 0.95, orbitRadius: 2.7, orbitSpeed: 0.68, phase: 0.8 },
  { id: 9, baseX: 74, baseY: 82, x: 74, y: 82, vx: 0, vy: 0, depth: 1.15, orbitRadius: 2.9, orbitSpeed: 0.62, phase: 1.7 },
  { id: 10, baseX: 34, baseY: 46, x: 34, y: 46, vx: 0, vy: 0, depth: 1.3, orbitRadius: 3.2, orbitSpeed: 0.58, phase: 2.5 },
  { id: 11, baseX: 68, baseY: 16, x: 68, y: 16, vx: 0, vy: 0, depth: 0.85, orbitRadius: 2.3, orbitSpeed: 0.72, phase: 3.9 },
];

const CONSTELLATION_EDGES: [number, number][] = [
  [0, 1],
  [1, 10],
  [10, 2],
  [2, 3],
  [10, 6],
  [1, 4],
  [4, 11],
  [11, 7],
  [4, 5],
  [5, 6],
  [5, 7],
  [7, 8],
  [5, 8],
  [8, 9],
  [6, 9],
  [3, 6],
];

export const BlueprintConstellationBg: React.FC<BlueprintConstellationBgProps> = React.memo(
  ({ scrollProgress, activeChapter }) => {
    const nodesRef = useRef<ConstellationNode[]>(
      INITIAL_NODES.map((n) => ({ ...n }))
    );
    const circleRefs = useRef<(SVGCircleElement | null)[]>([]);
    const ringRefs = useRef<(SVGCircleElement | null)[]>([]);
    const edgeRefs = useRef<(SVGLineElement | null)[]>([]);
    const cursorLineRefs = useRef<(SVGLineElement | null)[]>([]);
    const pointerRef = useRef<{ x: number; y: number; active: boolean }>({
      x: 50,
      y: 50,
      active: false,
    });
    const scrollRef = useRef<number>(scrollProgress);
    const chapterIndexRef = useRef<number>(activeChapter.index);

    scrollRef.current = scrollProgress;
    chapterIndexRef.current = activeChapter.index;

    useEffect(() => {
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reducedMotion) return;

      let rafId = 0;

      const handleMouseMove = (e: MouseEvent) => {
        pointerRef.current.x = (e.clientX / Math.max(1, window.innerWidth)) * 100;
        pointerRef.current.y = (e.clientY / Math.max(1, window.innerHeight)) * 100;
        pointerRef.current.active = true;
      };

      window.addEventListener('mousemove', handleMouseMove, { passive: true });

      const tick = (now: number) => {
        const t = now * 0.001;
        const s = scrollRef.current;
        const chIdx = chapterIndexRef.current;
        const ptr = pointerRef.current;
        const nodes = nodesRef.current;

        // Update node positions with chapter formation shift + scroll parallax + cursor magnetic pull
        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i];
          const chapterShiftX = Math.sin(chIdx * 1.1 + n.id * 0.9) * 5.5;
          const chapterShiftY = Math.cos(chIdx * 0.85 + n.id * 0.7) * 4.5;
          const scrollParallaxY = ((s * 36 * n.depth) % 24) - 12;

          let targetX =
            n.baseX +
            chapterShiftX +
            Math.cos(t * n.orbitSpeed + n.phase) * n.orbitRadius;
          let targetY =
            n.baseY +
            chapterShiftY -
            scrollParallaxY +
            Math.sin(t * n.orbitSpeed + n.phase) * n.orbitRadius;

          let cursorProximity = 0;
          if (ptr.active) {
            const dx = ptr.x - targetX;
            const dy = ptr.y - targetY;
            const dist = Math.hypot(dx, dy);
            if (dist < 28) {
              cursorProximity = 1 - dist / 28;
              targetX += dx * cursorProximity * 0.28;
              targetY += dy * cursorProximity * 0.28;
            }
          }

          const clampedX = clamp(targetX, 4, 96);
          const clampedY = clamp(targetY, 4, 96);
          n.vx = (n.vx + (clampedX - n.x) * 0.025) * 0.84;
          n.vy = (n.vy + (clampedY - n.y) * 0.025) * 0.84;
          n.x += n.vx;
          n.y += n.vy;

          const circleEl = circleRefs.current[i];
          if (circleEl) {
            circleEl.setAttribute('cx', n.x.toFixed(2));
            circleEl.setAttribute('cy', n.y.toFixed(2));
            circleEl.setAttribute(
              'fill',
              cursorProximity > 0.2 ? '#c8ff00' : 'rgba(242,242,240,0.42)'
            );
            circleEl.setAttribute(
              'r',
              (cursorProximity > 0.2 ? 0.36 + cursorProximity * 0.25 : 0.26).toFixed(2)
            );
          }

          const ringEl = ringRefs.current[i];
          if (ringEl) {
            ringEl.setAttribute('cx', n.x.toFixed(2));
            ringEl.setAttribute('cy', n.y.toFixed(2));
            ringEl.setAttribute(
              'stroke-opacity',
              (0.12 + cursorProximity * 0.55).toFixed(2)
            );
          }

          const cursorLineEl = cursorLineRefs.current[i];
          if (cursorLineEl) {
            if (ptr.active && cursorProximity > 0.18) {
              cursorLineEl.setAttribute('x1', n.x.toFixed(2));
              cursorLineEl.setAttribute('y1', n.y.toFixed(2));
              cursorLineEl.setAttribute('x2', ptr.x.toFixed(2));
              cursorLineEl.setAttribute('y2', ptr.y.toFixed(2));
              cursorLineEl.setAttribute(
                'stroke-opacity',
                (cursorProximity * 0.38).toFixed(2)
              );
            } else {
              cursorLineEl.setAttribute('stroke-opacity', '0');
            }
          }
        }

        // Update constellation edges
        for (let eIdx = 0; eIdx < CONSTELLATION_EDGES.length; eIdx++) {
          const [aIdx, bIdx] = CONSTELLATION_EDGES[eIdx];
          const nodeA = nodes[aIdx];
          const nodeB = nodes[bIdx];
          const lineEl = edgeRefs.current[eIdx];
          if (lineEl && nodeA && nodeB) {
            lineEl.setAttribute('x1', nodeA.x.toFixed(2));
            lineEl.setAttribute('y1', nodeA.y.toFixed(2));
            lineEl.setAttribute('x2', nodeB.x.toFixed(2));
            lineEl.setAttribute('y2', nodeB.y.toFixed(2));

            const midX = (nodeA.x + nodeB.x) * 0.5;
            const midY = (nodeA.y + nodeB.y) * 0.5;
            const ptrDist = ptr.active
              ? Math.hypot(ptr.x - midX, ptr.y - midY)
              : 100;
            const boost = ptrDist < 24 ? (1 - ptrDist / 24) * 0.32 : 0;
            lineEl.setAttribute(
              'stroke',
              boost > 0.08 ? '#c8ff00' : '#f2f2f0'
            );
            lineEl.setAttribute(
              'stroke-opacity',
              (0.07 + boost).toFixed(3)
            );
          }
        }

        rafId = window.requestAnimationFrame(tick);
      };

      rafId = window.requestAnimationFrame(tick);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        if (rafId) window.cancelAnimationFrame(rafId);
      };
    }, []);

    // Scroll-driven blueprint SVG arc dashoffset
    const blueprintDashOffset = (1 - scrollProgress) * 280;
    const secondaryDashOffset = scrollProgress * 220;

    return (
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
      >
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="h-full w-full"
        >
          <defs>
            <linearGradient id="bp-line-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c8ff00" stopOpacity="0.22" />
              <stop offset="50%" stopColor="#f2f2f0" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#c8ff00" stopOpacity="0.18" />
            </linearGradient>
          </defs>

          {/* Architectural Blueprint Structural Guides */}
          <line
            x1="8"
            y1="0"
            x2="8"
            y2="100"
            stroke="#f2f2f0"
            strokeOpacity="0.04"
            strokeWidth="0.08"
          />
          <line
            x1="50"
            y1="0"
            x2="50"
            y2="100"
            stroke="#f2f2f0"
            strokeOpacity="0.035"
            strokeWidth="0.08"
            strokeDasharray="1.2 1.2"
          />
          <line
            x1="92"
            y1="0"
            x2="92"
            y2="100"
            stroke="#f2f2f0"
            strokeOpacity="0.04"
            strokeWidth="0.08"
          />

          {/* Scroll-Driven Blueprint Vector Curves */}
          <path
            d="M 8 12 C 36 12, 64 88, 92 88"
            fill="none"
            stroke="url(#bp-line-grad)"
            strokeWidth="0.12"
            strokeDasharray="140 140"
            strokeDashoffset={blueprintDashOffset.toFixed(1)}
          />
          <path
            d="M 92 14 C 62 24, 38 76, 8 86"
            fill="none"
            stroke="#f2f2f0"
            strokeOpacity="0.06"
            strokeWidth="0.1"
            strokeDasharray="110 110"
            strokeDashoffset={secondaryDashOffset.toFixed(1)}
          />

          {/* Orbital Blueprint Schematic Rings */}
          <ellipse
            cx="50"
            cy="50"
            rx="38"
            ry="28"
            fill="none"
            stroke="#c8ff00"
            strokeOpacity="0.06"
            strokeWidth="0.09"
            strokeDasharray="4 2"
            transform={`rotate(${(scrollProgress * 75 - 18).toFixed(1)} 50 50)`}
          />
          <ellipse
            cx="50"
            cy="50"
            rx="22"
            ry="34"
            fill="none"
            stroke="#f2f2f0"
            strokeOpacity="0.05"
            strokeWidth="0.08"
            strokeDasharray="1.5 2.5"
            transform={`rotate(${(-scrollProgress * 60 + 12).toFixed(1)} 50 50)`}
          />

          {/* Constellation Edges */}
          {CONSTELLATION_EDGES.map((edge, idx) => {
            const a = INITIAL_NODES[edge[0]];
            const b = INITIAL_NODES[edge[1]];
            return (
              <line
                key={`edge-${idx}`}
                ref={(el) => {
                  edgeRefs.current[idx] = el;
                }}
                x1={a.baseX}
                y1={a.baseY}
                x2={b.baseX}
                y2={b.baseY}
                stroke="#f2f2f0"
                strokeOpacity="0.07"
                strokeWidth="0.1"
              />
            );
          })}

          {/* Dynamic Cursor-to-Node Tether Vectors */}
          {INITIAL_NODES.map((node, idx) => (
            <line
              key={`cursor-link-${node.id}`}
              ref={(el) => {
                cursorLineRefs.current[idx] = el;
              }}
              x1={node.baseX}
              y1={node.baseY}
              x2={node.baseX}
              y2={node.baseY}
              stroke="#c8ff00"
              strokeOpacity="0"
              strokeWidth="0.11"
              strokeDasharray="0.8 0.8"
            />
          ))}

          {/* Constellation Nodes & Registration Rings */}
          {INITIAL_NODES.map((node, idx) => (
            <g key={`node-${node.id}`}>
              <circle
                ref={(el) => {
                  ringRefs.current[idx] = el;
                }}
                cx={node.baseX}
                cy={node.baseY}
                r="0.85"
                fill="none"
                stroke="#c8ff00"
                strokeOpacity="0.14"
                strokeWidth="0.07"
              />
              <circle
                ref={(el) => {
                  circleRefs.current[idx] = el;
                }}
                cx={node.baseX}
                cy={node.baseY}
                r="0.26"
                fill="rgba(242,242,240,0.42)"
              />
            </g>
          ))}
        </svg>

        {/* Subtle Blueprint Coordinate Ticks along Viewport Margin */}
        <div className="hidden lg:flex fixed left-3 top-1/2 -translate-y-1/2 flex-col items-start gap-6 font-mono-code text-[9px] tracking-[0.22em] text-[#8a8a86]/45">
          <span>BP.{activeChapter.code}</span>
          <div className="h-16 w-[1px] bg-[#f2f2f0]/10 relative overflow-hidden">
            <div
              className="w-full bg-[#c8ff00]/70"
              style={{ height: `${Math.round(scrollProgress * 100)}%` }}
            />
          </div>
          <span className="tabular-nums">Y:{Math.round(scrollProgress * 1000)}</span>
        </div>
      </div>
    );
  }
);
