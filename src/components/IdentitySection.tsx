import React, { useEffect, useRef, useState } from 'react';
import { IDENTITY_STATEMENTS, IdentityStatement } from '../data/portfolioData';
import {
  SpringVector2D,
  clamp,
  computeChapterEntranceMetrics,
  computeScrollTransform,
  mapRange,
  stepSpringVector2D,
} from '../utils/motionMath';
import { ChapterEntrancePortal } from './ChapterEntrancePortal';
import { Sparkles, Cpu, Activity, Crosshair, Terminal } from 'lucide-react';

interface IdentitySectionProps {
  sectionProgress: number; // 0 to 1 across Chapter 02
}

interface RowHoverState {
  id: string | null;
  normX: number; // 0..1 across row width
  normY: number; // 0..1 across row height
  pulseCount: number;
}

const PLANE_META: Record<
  string,
  {
    gimmickTitle: string;
    gimmickTag: string;
    accent: string;
    formula: string;
  }
> = {
  ideas: {
    gimmickTitle: 'NEURAL SPARK & VECTOR CONSTELLATION',
    gimmickTag: 'GIMMICK 01 · HYPOTHESIS GRAPH',
    accent: '#c8ff00',
    formula: 'G(V, E) = ∑ w_ij · cos(θ)',
  },
  systems: {
    gimmickTitle: 'DETERMINISTIC STATE MACHINE CIRCUIT',
    gimmickTag: 'GIMMICK 02 · LOGIC PIPELINE',
    accent: '#38bdf8',
    formula: 'S_{t+1} = δ(S_t, Σ_input)',
  },
  experiments: {
    gimmickTitle: 'HARMONIC WAVE INTERFEROMETER',
    gimmickTag: 'GIMMICK 03 · SPRING OPTICS',
    accent: '#f43f5e',
    formula: 'y(x,t) = A·e^{-ζωt}·sin(kx - ωt)',
  },
  games: {
    gimmickTitle: '2D RAYCAST FOV & TACTICAL RETICLE HUD',
    gimmickTag: 'GIMMICK 04 · SPATIAL RADAR',
    accent: '#f59e0b',
    formula: 'R(θ) = min_t ||O + t·D(θ)||',
  },
  software: {
    gimmickTitle: 'ZERO-LATENCY AST & MEMORY BUS MATRIX',
    gimmickTag: 'GIMMICK 05 · EXECUTION KERNEL',
    accent: '#10b981',
    formula: 'Δt_frame ≤ 16.6ms · O(1) alloc',
  },
};

/**
 * Renders a bespoke, interactive SVG visual gimmick preview for each of the 5 Identity planes.
 * Responds in real time to cursor coordinates (normX, normY) and click pulses!
 */
const IdentityGimmickVisualizer: React.FC<{
  planeId: string;
  normX: number;
  normY: number;
  pulseCount: number;
  isHovered: boolean;
}> = React.memo(({ planeId, normX, normY, pulseCount, isHovered }) => {
  const cx = 30 + normX * 260;
  const cy = 20 + normY * 90;
  const meta = PLANE_META[planeId] ?? PLANE_META.ideas;

  if (planeId === 'ideas') {
    // Gimmick 01: Neural Spark & Sacred Geometry Constellation
    const nodes = [
      { x: 48, y: 34 },
      { x: 112, y: 24 },
      { x: 86, y: 92 },
      { x: 168, y: 42 },
      { x: 214, y: 88 },
      { x: 268, y: 36 },
      { x: 246, y: 102 },
    ];
    return (
      <svg viewBox="0 0 320 130" className="w-full h-full block select-none">
        {/* Sacred geometry cursor rings */}
        <circle
          cx={cx}
          cy={cy}
          r={18 + (pulseCount % 3) * 8}
          fill="none"
          stroke={meta.accent}
          strokeOpacity="0.45"
          strokeWidth="1"
          strokeDasharray="4 3"
        />
        <circle
          cx={cx}
          cy={cy}
          r={36}
          fill="none"
          stroke="#f2f2f0"
          strokeOpacity="0.16"
          strokeWidth="0.8"
        />
        {nodes.map((n, i) => {
          const dist = Math.hypot(cx - n.x, cy - n.y);
          const pull = Math.max(0, 1 - dist / 140);
          const nx = n.x + (cx - n.x) * pull * 0.28;
          const ny = n.y + (cy - n.y) * pull * 0.28;
          return (
            <g key={i}>
              <line
                x1={cx}
                y1={cy}
                x2={nx}
                y2={ny}
                stroke={pull > 0.2 ? meta.accent : '#f2f2f0'}
                strokeOpacity={0.14 + pull * 0.65}
                strokeWidth={0.8 + pull * 1.1}
              />
              {i < nodes.length - 1 && (
                <line
                  x1={nx}
                  y1={ny}
                  x2={nodes[i + 1].x}
                  y2={nodes[i + 1].y}
                  stroke="#f2f2f0"
                  strokeOpacity="0.14"
                  strokeWidth="0.7"
                  strokeDasharray="2 2"
                />
              )}
              <circle
                cx={nx}
                cy={ny}
                r={2.8 + pull * 3.2}
                fill={pull > 0.25 ? meta.accent : '#f2f2f0'}
              />
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r="4.5" fill={meta.accent} />
      </svg>
    );
  }

  if (planeId === 'systems') {
    // Gimmick 02: Deterministic State Machine Circuit & Logic Gates
    const activeGate = Math.min(3, Math.floor(normX * 4));
    const stages = ['INPUT', 'PARSER', 'SOLVER', 'RENDER'];
    return (
      <svg viewBox="0 0 320 130" className="w-full h-full block select-none">
        {/* Logic bus tracks */}
        <path
          d={`M 24 65 C ${80 + normX * 40} ${20 + normY * 30}, ${200 - normX * 40} ${
            110 - normY * 30
          }, 296 65`}
          fill="none"
          stroke={meta.accent}
          strokeWidth="1.5"
          strokeOpacity="0.65"
          strokeDasharray="6 4"
        />
        <line
          x1="24"
          y1="65"
          x2="296"
          y2="65"
          stroke="#f2f2f0"
          strokeOpacity="0.16"
          strokeWidth="1"
        />
        {stages.map((label, idx) => {
          const sx = 38 + idx * 80;
          const sy = idx % 2 === 0 ? 44 + (normY - 0.5) * 18 : 84 - (normY - 0.5) * 18;
          const isCurrent = idx === activeGate || isHovered;
          const isSelectedGate = idx === activeGate;
          return (
            <g key={label}>
              <line
                x1={sx}
                y1={sy}
                x2={cx}
                y2={cy}
                stroke={isSelectedGate ? '#c8ff00' : meta.accent}
                strokeOpacity={isSelectedGate ? 0.65 : 0.18}
                strokeWidth="1"
              />
              <rect
                x={sx - 26}
                y={sy - 14}
                width="52"
                height="28"
                fill={isSelectedGate ? '#13222b' : '#0d0d0c'}
                stroke={isSelectedGate ? '#c8ff00' : isCurrent ? meta.accent : '#f2f2f0'}
                strokeOpacity={isSelectedGate ? 1 : 0.4}
                strokeWidth="1.2"
              />
              <text
                x={sx}
                y={sy + 3}
                textAnchor="middle"
                className="font-mono-code"
                fontSize="8.5"
                fill={isSelectedGate ? '#c8ff00' : '#f2f2f0'}
              >
                {label}
              </text>
            </g>
          );
        })}
        {/* Cursor Logic Probe */}
        <circle cx={cx} cy={cy} r="5" fill="#c8ff00" />
      </svg>
    );
  }

  if (planeId === 'experiments') {
    // Gimmick 03: Harmonic Wave Interferometer & Chromatic Spring Curve
    const points1: string[] = [];
    const points2: string[] = [];
    const freq = 2.2 + normX * 3.5;
    const amp = 16 + (1 - Math.abs(normY - 0.5)) * 28;
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      const x = 12 + t * 296;
      const distToCursor = Math.abs(t - normX);
      const envelope = Math.max(0.25, 1 - distToCursor * 1.15);
      const y1 =
        65 +
        Math.sin(t * Math.PI * freq + normX * 6 + pulseCount) * amp * envelope;
      const y2 =
        65 +
        Math.cos(t * Math.PI * (freq * 1.25) - normY * 6) * (amp * 0.78) * envelope;
      points1.push(`${x.toFixed(1)},${y1.toFixed(1)}`);
      points2.push(`${x.toFixed(1)},${y2.toFixed(1)}`);
    }
    return (
      <svg viewBox="0 0 320 130" className="w-full h-full block select-none">
        <line
          x1="12"
          y1="65"
          x2="308"
          y2="65"
          stroke="#f2f2f0"
          strokeOpacity="0.12"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
        <polyline
          fill="none"
          stroke="#c8ff00"
          strokeWidth="1.6"
          points={points1.join(' ')}
        />
        <polyline
          fill="none"
          stroke={meta.accent}
          strokeWidth="1.3"
          strokeOpacity="0.8"
          points={points2.join(' ')}
        />
        <line
          x1={cx}
          y1="10"
          x2={cx}
          y2="120"
          stroke="#c8ff00"
          strokeOpacity="0.4"
          strokeWidth="1"
          strokeDasharray="2 2"
        />
        <circle cx={cx} cy={cy} r="5.5" fill="none" stroke="#c8ff00" strokeWidth="1.5" />
      </svg>
    );
  }

  if (planeId === 'games') {
    // Gimmick 04: 2D Raycast Visibility Cone & Tactical Target Lock HUD
    const originX = 36;
    const originY = 65;
    const angle = Math.atan2(cy - originY, Math.max(20, cx - originX));
    const spread = 0.36;
    const len = 240;
    const xA = originX + Math.cos(angle - spread) * len;
    const yA = originY + Math.sin(angle - spread) * len;
    const xB = originX + Math.cos(angle + spread) * len;
    const yB = originY + Math.sin(angle + spread) * len;

    return (
      <svg viewBox="0 0 320 130" className="w-full h-full block select-none">
        {/* Raycast visibility cone */}
        <polygon
          points={`${originX},${originY} ${xA.toFixed(1)},${yA.toFixed(1)} ${xB.toFixed(
            1
          )},${yB.toFixed(1)}`}
          fill={meta.accent}
          fillOpacity="0.14"
          stroke={meta.accent}
          strokeOpacity="0.55"
          strokeWidth="1"
        />
        {/* Ray subdivisions */}
        {[-0.24, -0.12, 0, 0.12, 0.24].map((offset, i) => (
          <line
            key={i}
            x1={originX}
            y1={originY}
            x2={(originX + Math.cos(angle + offset) * len * 0.88).toFixed(1)}
            y2={(originY + Math.sin(angle + offset) * len * 0.88).toFixed(1)}
            stroke="#c8ff00"
            strokeOpacity="0.22"
            strokeWidth="0.8"
          />
        ))}
        {/* Emitter Origin */}
        <circle cx={originX} cy={originY} r="5" fill="#c8ff00" />
        {/* Tactical Target Lock Reticle at Cursor */}
        <g transform={`translate(${cx.toFixed(1)}, ${cy.toFixed(1)})`}>
          <circle
            r="14"
            fill="none"
            stroke="#c8ff00"
            strokeWidth="1.2"
            strokeDasharray="6 4"
          />
          <line x1="-19" y1="0" x2="-8" y2="0" stroke={meta.accent} strokeWidth="1.4" />
          <line x1="8" y1="0" x2="19" y2="0" stroke={meta.accent} strokeWidth="1.4" />
          <line x1="0" y1="-19" x2="0" y2="-8" stroke={meta.accent} strokeWidth="1.4" />
          <line x1="0" y1="8" x2="0" y2="19" stroke={meta.accent} strokeWidth="1.4" />
        </g>
      </svg>
    );
  }

  // Gimmick 05: Software — Zero-Latency AST & Modular Memory Bus Matrix
  const cols = 8;
  const rows = 3;
  return (
    <svg viewBox="0 0 320 130" className="w-full h-full block select-none">
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((__, c) => {
          const bx = 22 + c * 36;
          const by = 22 + r * 34;
          const dist = Math.hypot(cx - (bx + 14), cy - (by + 11));
          const active = dist < 68;
          const scale = active ? 1 - (dist / 68) * 0.18 : 1;
          return (
            <g
              key={`${r}-${c}`}
              transform={`translate(${bx}, ${by}) scale(${scale.toFixed(2)})`}
            >
              <rect
                width="28"
                height="22"
                fill={active ? '#c8ff00' : '#141413'}
                fillOpacity={active ? 0.22 : 0.85}
                stroke={active ? '#c8ff00' : '#f2f2f0'}
                strokeOpacity={active ? 0.9 : 0.16}
                strokeWidth="1"
              />
              <line
                x1="4"
                y1="7"
                x2={active ? '24' : '16'}
                y2="7"
                stroke={active ? '#c8ff00' : '#8a8a86'}
                strokeWidth="1.2"
              />
              <line
                x1="4"
                y1="14"
                x2="12"
                y2="14"
                stroke="#f2f2f0"
                strokeOpacity="0.35"
                strokeWidth="1"
              />
            </g>
          );
        })
      )}
      {/* Cursor Scanline */}
      <line
        x1={cx}
        y1="8"
        x2={cx}
        y2="122"
        stroke="#c8ff00"
        strokeWidth="1.2"
        strokeOpacity="0.65"
      />
    </svg>
  );
});

export const IdentitySection: React.FC<IdentitySectionProps> = React.memo(({ sectionProgress }) => {
  const [selectedStatement, setSelectedStatement] = useState<IdentityStatement>(
    IDENTITY_STATEMENTS[0]
  );
  const [hoverState, setHoverState] = useState<RowHoverState>({
    id: null,
    normX: 0.5,
    normY: 0.5,
    pulseCount: 0,
  });

  const targetHoverCoordRef = useRef<{ x: number; y: number }>({ x: 0.5, y: 0.5 });
  const springHoverCoordRef = useRef<SpringVector2D>({ x: 0.5, y: 0.5, vx: 0, vy: 0 });
  const hoverRafRef = useRef<number>(0);

  const ensureHoverSpring = () => {
    if (hoverRafRef.current) return;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = clamp((now - lastTime) * 0.001, 0.004, 0.04);
      lastTime = now;

      const stepped = stepSpringVector2D(
        springHoverCoordRef.current,
        targetHoverCoordRef.current.x,
        targetHoverCoordRef.current.y,
        dt,
        130,
        13.5
      );
      springHoverCoordRef.current = stepped;

      setHoverState((prev) => ({
        ...prev,
        normX: clamp(stepped.x, 0, 1),
        normY: clamp(stepped.y, 0, 1),
      }));

      const rem =
        Math.hypot(
          stepped.x - targetHoverCoordRef.current.x,
          stepped.y - targetHoverCoordRef.current.y
        ) + Math.hypot(stepped.vx, stepped.vy) * 0.04;

      if (rem > 0.0012) {
        hoverRafRef.current = window.requestAnimationFrame(tick);
      } else {
        hoverRafRef.current = 0;
      }
    };

    hoverRafRef.current = window.requestAnimationFrame(tick);
  };

  useEffect(() => {
    return () => {
      if (hoverRafRef.current) window.cancelAnimationFrame(hoverRafRef.current);
    };
  }, []);

  const p = clamp(sectionProgress, 0, 1);
  const entrance = computeChapterEntranceMetrics(p, 1000, 0.35);
  const headlineState = computeScrollTransform(mapRange(p, 0, 1, 0.18, 0.82));

  const handleRowPointerMove = (
    item: IdentityStatement,
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const normX = clamp((e.clientX - rect.left) / Math.max(1, rect.width), 0, 1);
    const normY = clamp((e.clientY - rect.top) / Math.max(1, rect.height), 0, 1);
    setSelectedStatement(item);
    targetHoverCoordRef.current = { x: normX, y: normY };
    setHoverState((prev) => ({
      ...prev,
      id: item.id,
    }));
    ensureHoverSpring();
  };

  const handleRowClick = (item: IdentityStatement) => {
    setSelectedStatement(item);
    setHoverState((prev) => ({
      ...prev,
      id: item.id,
      pulseCount: prev.pulseCount + 1,
    }));
  };

  const handleRowLeave = () => {
    targetHoverCoordRef.current = { x: 0.5, y: 0.5 };
    setHoverState((prev) => ({ ...prev, id: null }));
    ensureHoverSpring();
  };

  const activeMeta = PLANE_META[selectedStatement.id] ?? PLANE_META.ideas;

  return (
    <section
      id="identity"
      aria-label="Chapter 02 Identity"
      className="relative min-h-[175vh] w-full bg-transparent border-t border-[#f2f2f0]/12 py-24 md:py-36 px-6 md:px-12 overflow-hidden"
    >
      {/* Background SVG Line-Drawing Architectural Curves for Chapter 02 */}
      <svg
        aria-hidden="true"
        viewBox="0 0 1440 1200"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 h-full w-full"
      >
        <path
          d="M 120 0 L 120 1200 M 1320 0 L 1320 1200"
          stroke="#f2f2f0"
          strokeOpacity="0.04"
          strokeWidth="1"
        />
        <path
          d="M 120 180 C 520 180, 920 620, 1320 620"
          fill="none"
          stroke="#c8ff00"
          strokeOpacity="0.14"
          strokeWidth="1.3"
          strokeDasharray="1000"
          strokeDashoffset={entrance.strokeDashoffset}
        />
        <circle
          cx="1140"
          cy="340"
          r="180"
          fill="none"
          stroke="#c8ff00"
          strokeOpacity="0.1"
          strokeWidth="1"
          strokeDasharray="1000"
          strokeDashoffset={entrance.strokeDashoffset}
        />
      </svg>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Universal Scrollytelling SVG Line-Drawing Entrance Portal */}
        <ChapterEntrancePortal
          chapterNumber="02"
          chapterTitle="IDENTITY & THESIS"
          chapterSubtitle="CHAPTER TWO · ARCHITECTURAL PHILOSOPHY"
          blueprintCode="SYS.THESIS.02"
          sectionProgress={p}
        />

        {/* Core Editorial Statement with SVG Line-Drawing Underline & Spatial Reveal */}
        <div
          className="mb-20 md:mb-28 max-w-5xl will-change-transform"
          style={{
            transform: `translate3d(0, ${(headlineState.translateY * 0.35).toFixed(
              1
            )}px, 0) scale(${headlineState.scale.toFixed(3)})`,
          }}
        >
          <p className="font-mono-code text-xs tracking-[0.22em] text-[#c8ff00] mb-4">
            ARCHITECTURAL PHILOSOPHY · HOVER ANY PLANE TO TRIGGER LIVE GIMMICK
          </p>
          <h2 className="font-display text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-[#f2f2f0] leading-[1.04] text-balance">
            I don&apos;t just write code.{' '}
            <span className="relative inline-block font-serif-editorial italic font-normal text-[#c8ff00]">
              I turn ideas into systems.
              <svg
                aria-hidden="true"
                viewBox="0 0 420 18"
                className="w-full h-3.5 mt-1 overflow-visible"
              >
                <path
                  d="M 2 12 Q 210 2 418 10"
                  fill="none"
                  stroke="#c8ff00"
                  strokeWidth="2.2"
                  strokeDasharray="440"
                  strokeDashoffset={((1 - entrance.entranceRatio) * 440).toFixed(1)}
                />
              </svg>
            </span>
          </h2>
          <p className="mt-6 max-w-2xl font-sans-body text-base md:text-lg text-[#8a8a86] leading-relaxed">
            Code is the raw material; the product is how a system thinks, responds, and moves under
            human touch. Scrub your cursor across each of the five interlocking planes below to
            experience its kinetic signature:
          </p>
        </div>

        {/* Multi-Depth Spatial Statements + Per-Character Kinetic Hover + Inline Live Gimmick Stage */}
        <div className="relative space-y-6 md:space-y-8 my-12">
          {IDENTITY_STATEMENTS.map((item, idx) => {
            const itemPhase = clamp((p - idx * 0.08) * item.depthFactor, 0, 1);
            const horizontalOffset = (p - 0.5) * 140 * item.horizontalBias;
            const scaleVal = mapRange(itemPhase, 0, 0.5, 0.94, 1.02);
            const rotateVal = (p - 0.5) * item.rotationBias * 1.6;
            const focusDistance = Math.abs(p - (0.18 + idx * 0.15));
            const depthOpacity = clamp(1.18 - focusDistance * 0.95, 0.45, 1);

            const isSelected = selectedStatement.id === item.id;
            const isHovered = hoverState.id === item.id;
            const rowNormX = isHovered ? hoverState.normX : 0.5;
            const rowNormY = isHovered ? hoverState.normY : 0.5;
            const planeMeta = PLANE_META[item.id] ?? PLANE_META.ideas;
            const chars = item.word.split('');

            return (
              <div
                key={item.id}
                className="will-change-transform"
                style={{
                  transform: `translate3d(${horizontalOffset.toFixed(1)}px, 0, 0) scale(${scaleVal.toFixed(
                    3
                  )}) rotate(${rotateVal.toFixed(2)}deg)`,
                  opacity: Number(depthOpacity.toFixed(2)),
                }}
              >
                <button
                  type="button"
                  onClick={() => handleRowClick(item)}
                  onMouseEnter={(e) => handleRowPointerMove(item, e)}
                  onMouseMove={(e) => handleRowPointerMove(item, e)}
                  onMouseLeave={handleRowLeave}
                  data-cursor-label={item.word}
                  className={`group relative w-full text-left border px-5 py-6 md:px-7 md:py-6 grid grid-cols-1 lg:grid-cols-12 items-center gap-6 transition-colors duration-200 cursor-pointer overflow-hidden ${
                    isSelected
                      ? 'border-[#c8ff00] bg-[#11120e]/90'
                      : 'border-[#f2f2f0]/12 bg-[#0c0c0b]/70 hover:border-[#c8ff00]/65'
                  }`}
                >
                  {/* Dynamic cursor spotlight inside hovered row */}
                  {isHovered && (
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0"
                      style={{
                        background: `radial-gradient(360px circle at ${(rowNormX * 100).toFixed(
                          1
                        )}% ${(rowNormY * 100).toFixed(
                          1
                        )}%, rgba(200, 255, 0, 0.13), transparent 70%)`,
                      }}
                    />
                  )}

                  {/* Left (5 cols): Code + Per-Character Kinetic Display Word */}
                  <div className="relative z-10 lg:col-span-5 flex flex-col gap-2 min-w-0">
                    <div className="flex items-center gap-2 font-mono-code text-xs tracking-[0.2em] text-[#8a8a86] group-hover:text-[#c8ff00] transition-colors">
                      <span>{item.code}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-[10px] text-[#c8ff00]">
                        {planeMeta.gimmickTag.split('·')[1]?.trim()}
                      </span>
                    </div>

                    {/* Kinetic Per-Character Word */}
                    <span
                      aria-label={item.word}
                      className="inline-flex items-baseline font-display text-3xl sm:text-5xl xl:text-[3.35rem] font-extrabold tracking-tighter leading-none select-none"
                    >
                      {chars.map((ch, cIdx) => {
                        const charCenter = (cIdx + 0.5) / chars.length;
                        const wordLocalX = clamp(rowNormX * 2.1, 0, 1);
                        const dist = Math.abs(wordLocalX - charCenter);
                        const wave = isHovered ? Math.max(0, 1 - dist * 2.8) : 0;
                        const liftY = -wave * 12;
                        const rotDeg = isHovered ? (wordLocalX - charCenter) * wave * 16 : 0;
                        const scaleChar = 1 + wave * 0.14;

                        return (
                          <span
                            key={`${item.id}-ch-${cIdx}`}
                            className="inline-block will-change-transform"
                            style={{
                              transform: `translate3d(0, ${liftY.toFixed(
                                1
                              )}px, 0) scale(${scaleChar.toFixed(2)}) rotate(${rotDeg.toFixed(
                                1
                              )}deg)`,
                              color:
                                wave > 0.35
                                  ? '#c8ff00'
                                  : isSelected
                                  ? '#c8ff00'
                                  : '#f2f2f0',
                              textShadow:
                                wave > 0.4
                                  ? '0 0 22px rgba(200,255,0,0.45)'
                                  : 'none',
                            }}
                          >
                            {ch}
                          </span>
                        );
                      })}
                    </span>
                  </div>

                  {/* Center (4 cols): Annotation & Mathematical Formula */}
                  <div className="relative z-10 lg:col-span-4 space-y-2 min-w-0">
                    <p className="font-sans-body text-sm md:text-base text-[#f2f2f0]/90 leading-relaxed">
                      {item.annotation}
                    </p>
                    <p className="font-mono-code text-[11px] tracking-[0.12em] text-[#8a8a86] group-hover:text-[#c8ff00] transition-colors tabular-nums truncate">
                      {planeMeta.formula} · X:{(rowNormX * 100).toFixed(0)}% Y:
                      {(rowNormY * 100).toFixed(0)}%
                    </p>
                  </div>

                  {/* Right (3 cols): Bespoke Interactive Hover Gimmick Mini-Stage for this Word */}
                  <div className="relative z-10 lg:col-span-3 w-full h-28 border border-[#f2f2f0]/15 bg-[#080808] overflow-hidden shrink-0 group-hover:border-[#c8ff00]/80 transition-colors">
                    <div className="absolute top-1.5 left-2.5 right-2.5 flex items-center justify-between font-mono-code text-[9px] tracking-[0.16em] text-[#8a8a86] pointer-events-none z-10">
                      <span className="text-[#c8ff00] truncate">{planeMeta.gimmickTag}</span>
                      <span>{isHovered ? 'LIVE INPUT' : 'STANDBY'}</span>
                    </div>
                    <IdentityGimmickVisualizer
                      planeId={item.id}
                      normX={rowNormX}
                      normY={rowNormY}
                      pulseCount={hoverState.pulseCount}
                      isHovered={isHovered}
                    />
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {/* Live Interactive System Inspector & Expanded Gimmick Sandbox */}
        <div
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const normX = clamp((e.clientX - rect.left) / Math.max(1, rect.width), 0, 1);
            const normY = clamp((e.clientY - rect.top) / Math.max(1, rect.height), 0, 1);
            targetHoverCoordRef.current = { x: normX, y: normY };
            setHoverState((prev) => ({
              ...prev,
              id: selectedStatement.id,
            }));
            ensureHoverSpring();
          }}
          onMouseLeave={handleRowLeave}
          onClick={() =>
            setHoverState((prev) => ({
              ...prev,
              pulseCount: prev.pulseCount + 1,
            }))
          }
          className="mt-16 border border-[#f2f2f0]/15 bg-[#111111] p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center cursor-crosshair"
        >
          <div className="lg:col-span-7 space-y-3">
            <div className="flex flex-wrap items-center gap-3 font-mono-code text-xs text-[#c8ff00] tracking-[0.18em]">
              {selectedStatement.id === 'ideas' && <Sparkles className="w-3.5 h-3.5" />}
              {selectedStatement.id === 'systems' && <Cpu className="w-3.5 h-3.5" />}
              {selectedStatement.id === 'experiments' && <Activity className="w-3.5 h-3.5" />}
              {selectedStatement.id === 'games' && <Crosshair className="w-3.5 h-3.5" />}
              {selectedStatement.id === 'software' && <Terminal className="w-3.5 h-3.5" />}
              <span>ACTIVE PLANE · {selectedStatement.code}</span>
              <span aria-hidden="true">·</span>
              <span>{activeMeta.gimmickTitle}</span>
            </div>

            <h3 className="font-display text-2xl md:text-3xl font-bold text-[#f2f2f0]">
              {selectedStatement.word} — {selectedStatement.annotation}
            </h3>

            <p className="font-mono-code text-xs text-[#8a8a86] tabular-nums">
              MOVE CURSOR OR CLICK INSIDE THIS SANDBOX TO MODULATE · VELOCITY MULTIPLIER{' '}
              {selectedStatement.depthFactor.toFixed(2)}x · PULSES: {hoverState.pulseCount}
            </p>
          </div>

          <div className="lg:col-span-5 h-36 border border-[#f2f2f0]/15 bg-[#080808] relative overflow-hidden">
            <IdentityGimmickVisualizer
              planeId={selectedStatement.id}
              normX={hoverState.normX}
              normY={hoverState.normY}
              pulseCount={hoverState.pulseCount}
              isHovered={true}
            />
          </div>
        </div>
      </div>
    </section>
  );
});
