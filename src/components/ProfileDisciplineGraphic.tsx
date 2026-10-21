import React, { useEffect, useRef, useState } from 'react';
import { clamp, stepUnderdampedSpring } from '../utils/motionMath';
import { Activity, Cpu, Sparkles, Terminal } from 'lucide-react';

interface ProfileDisciplineGraphicProps {
  sectionProgress: number;
  activeDisciplineIndex?: number | null;
  onSelectDiscipline?: (index: number) => void;
}

interface TelemetryPoint {
  label: string;
  angle: number; // in radians
  distance: number; // 0..1
  metric: string;
  sub: string;
  icon: typeof Activity;
}

const TELEMETRY_NODES: TelemetryPoint[] = [
  {
    label: 'GAME DEV & SHADERS',
    angle: -Math.PI * 0.75,
    distance: 0.78,
    metric: '60–120 FPS',
    sub: 'WebGL2 · Verlet Physics',
    icon: Sparkles,
  },
  {
    label: 'SOFTWARE SYSTEMS',
    angle: -Math.PI * 0.25,
    distance: 0.82,
    metric: '16.6ms Budget',
    sub: 'Deterministic Netcode',
    icon: Cpu,
  },
  {
    label: 'SPATIAL INTERACTION',
    angle: Math.PI * 0.25,
    distance: 0.76,
    metric: 'Sub-Pixel Math',
    sub: 'Spring Dampers · Lenis',
    icon: Activity,
  },
  {
    label: 'PRODUCT & COGNITIVE',
    angle: Math.PI * 0.75,
    distance: 0.8,
    metric: '42+ Artifacts',
    sub: 'Direct Manipulation',
    icon: Terminal,
  },
];

export const ProfileDisciplineGraphic: React.FC<ProfileDisciplineGraphicProps> = React.memo(
  ({ sectionProgress, activeDisciplineIndex = null, onSelectDiscipline }) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [hoveredNode, setHoveredNode] = useState<number | null>(null);

    const pointerRef = useRef<{ x: number; y: number; active: boolean; pulse: number }>({
      x: 0.5,
      y: 0.5,
      active: false,
      pulse: 0,
    });
    const nodeSpringBoostRef = useRef<{ val: number; vel: number }[]>([
      { val: 0, vel: 0 },
      { val: 0, vel: 0 },
      { val: 0, vel: 0 },
      { val: 0, vel: 0 },
    ]);

    useEffect(() => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let rafId = 0;
      let lastTime = performance.now();
      const startTime = lastTime;

      const render = (now: number) => {
        const dt = Math.min(0.033, Math.max(0.005, (now - lastTime) * 0.001));
        lastTime = now;
        const elapsed = (now - startTime) * 0.001;

        const cw = Math.max(280, container.clientWidth || 400);
        const ch = Math.max(260, container.clientHeight || 360);
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

        const targetW = Math.round(cw * dpr);
        const targetH = Math.round(ch * dpr);
        if (canvas.width !== targetW || canvas.height !== targetH) {
          canvas.width = targetW;
          canvas.height = targetH;
        }

        ctx.save();
        ctx.scale(dpr, dpr);

        try {
          const w = cw;
          const h = ch;
          const centerX = w * 0.5;
          const centerY = h * 0.5;
          const maxRadius = Math.min(w, h) * 0.42;

          ctx.clearRect(0, 0, w, h);

          // Background dark vignette
          const bgGrad = ctx.createRadialGradient(
            centerX,
            centerY,
            10,
            centerX,
            centerY,
            maxRadius * 1.3
          );
          bgGrad.addColorStop(0, 'rgba(200, 255, 0, 0.04)');
          bgGrad.addColorStop(0.65, 'rgba(10, 10, 10, 0.8)');
          bgGrad.addColorStop(1, 'rgba(10, 10, 10, 0.98)');
          ctx.fillStyle = bgGrad;
          ctx.fillRect(0, 0, w, h);

          // Concentric Range Rings with CAD calibration ticks
          const rings = [0.28, 0.52, 0.78, 1.0];
          rings.forEach((ringFrac, rIdx) => {
            const r = ringFrac * maxRadius;
            ctx.strokeStyle =
              rIdx === rings.length - 1
                ? 'rgba(200, 255, 0, 0.28)'
                : 'rgba(242, 242, 240, 0.09)';
            ctx.lineWidth = rIdx === rings.length - 1 ? 1.4 : 1.0;
            ctx.beginPath();
            ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
            ctx.stroke();

            // Outer ring tick marks
            if (rIdx === rings.length - 1) {
              const tickCount = 48;
              for (let t = 0; t < tickCount; t++) {
                const ang = (t / tickCount) * Math.PI * 2;
                const isMajor = t % 6 === 0;
                const tickLen = isMajor ? 7 : 3.5;
                const x1 = centerX + Math.cos(ang) * (r - tickLen);
                const y1 = centerY + Math.sin(ang) * (r - tickLen);
                const x2 = centerX + Math.cos(ang) * r;
                const y2 = centerY + Math.sin(ang) * r;
                ctx.strokeStyle = isMajor
                  ? 'rgba(200, 255, 0, 0.55)'
                  : 'rgba(242, 242, 240, 0.18)';
                ctx.lineWidth = isMajor ? 1.2 : 0.8;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
              }
            }
          });

          // Orthogonal Crosshair Axes
          ctx.strokeStyle = 'rgba(242, 242, 240, 0.12)';
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 5]);
          ctx.beginPath();
          ctx.moveTo(centerX - maxRadius * 1.08, centerY);
          ctx.lineTo(centerX + maxRadius * 1.08, centerY);
          ctx.moveTo(centerX, centerY - maxRadius * 1.08);
          ctx.lineTo(centerX, centerY + maxRadius * 1.08);
          ctx.stroke();
          ctx.setLineDash([]);

          // Continuous Radar Scan Sweep Beam
          const scanAngle = (elapsed * 1.4) % (Math.PI * 2);
          const sweepSpan = Math.PI * 0.35;
          const sweepGrad = ctx.createRadialGradient(
            centerX,
            centerY,
            0,
            centerX,
            centerY,
            maxRadius
          );
          sweepGrad.addColorStop(0, 'rgba(200, 255, 0, 0.22)');
          sweepGrad.addColorStop(1, 'rgba(200, 255, 0, 0)');

          ctx.save();
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.arc(centerX, centerY, maxRadius, scanAngle - sweepSpan, scanAngle);
          ctx.closePath();
          ctx.fillStyle = sweepGrad;
          ctx.fill();

          // Leading Scan Edge Line
          ctx.strokeStyle = '#c8ff00';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(
            centerX + Math.cos(scanAngle) * maxRadius,
            centerY + Math.sin(scanAngle) * maxRadius
          );
          ctx.stroke();
          ctx.restore();

          // Dynamic Vector Polygon connecting the 4 discipline nodes with soft spring radial bounce
          const activeNodeIdx = hoveredNode !== null ? hoveredNode : activeDisciplineIndex;
          const polyPoints = TELEMETRY_NODES.map((node, i) => {
            const isSelected = activeNodeIdx === i;
            const springState = nodeSpringBoostRef.current[i];
            const stepped = stepUnderdampedSpring(
              springState.val,
              springState.vel,
              isSelected ? 12 : 0,
              dt,
              150,
              12.5
            );
            nodeSpringBoostRef.current[i] = { val: stepped.value, vel: stepped.velocity };
            const wobble = Math.sin(elapsed * 2.2 + i * 1.4) * 4;
            const currentDist = node.distance * maxRadius + wobble + stepped.value;
            const px = centerX + Math.cos(node.angle) * currentDist;
            const py = centerY + Math.sin(node.angle) * currentDist;
            return { px, py, isSelected };
          });

        // Fill radar envelope polygon
        ctx.fillStyle = 'rgba(200, 255, 0, 0.08)';
        ctx.strokeStyle = 'rgba(200, 255, 0, 0.55)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        polyPoints.forEach((pt, i) => {
          if (i === 0) ctx.moveTo(pt.px, pt.py);
          else ctx.lineTo(pt.px, pt.py);
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Radial lines to nodes
        polyPoints.forEach((pt, i) => {
          ctx.strokeStyle = pt.isSelected
            ? '#c8ff00'
            : 'rgba(242, 242, 240, 0.16)';
          ctx.lineWidth = pt.isSelected ? 1.6 : 1;
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(pt.px, pt.py);
          ctx.stroke();

          // Radar node ping beacon
          const pulseR = 6 + (pt.isSelected ? 4 : 0);
          ctx.fillStyle = pt.isSelected ? '#c8ff00' : '#f2f2f0';
          ctx.beginPath();
          ctx.arc(pt.px, pt.py, 3.2, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = pt.isSelected ? '#c8ff00' : 'rgba(200, 255, 0, 0.45)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(pt.px, pt.py, pulseR, 0, Math.PI * 2);
          ctx.stroke();

          // Expanding Sonar Wave on active node
          if (pt.isSelected) {
            const sonarWave = (elapsed * 2.5) % 1;
            ctx.strokeStyle = `rgba(200, 255, 0, ${(1 - sonarWave).toFixed(2)})`;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(pt.px, pt.py, pulseR + sonarWave * 22, 0, Math.PI * 2);
            ctx.stroke();
          }

          // Node Label & Telemetry Value
          const nodeDef = TELEMETRY_NODES[i];
          const isRight = Math.cos(nodeDef.angle) >= 0;
          const isTop = Math.sin(nodeDef.angle) < 0;

          ctx.font = '600 9.5px "JetBrains Mono", monospace';
          ctx.fillStyle = pt.isSelected ? '#c8ff00' : '#8a8a86';
          ctx.textAlign = isRight ? 'left' : 'right';
          const textOffset = isRight ? 12 : -12;
          ctx.fillText(nodeDef.label, pt.px + textOffset, pt.py + (isTop ? -6 : 10));

          ctx.font = '500 8.5px "JetBrains Mono", monospace';
          ctx.fillStyle = pt.isSelected ? '#f2f2f0' : '#666664';
          ctx.fillText(nodeDef.metric, pt.px + textOffset, pt.py + (isTop ? 6 : 22));
        });

        // Center Origin Aperture
        ctx.fillStyle = '#0a0a0a';
        ctx.strokeStyle = '#c8ff00';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#c8ff00';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 2.5, 0, Math.PI * 2);
        ctx.fill();
        } catch (err) {
          console.warn('[ProfileDisciplineGraphic] Recovered frame error:', err);
        } finally {
          ctx.restore();
        }
        rafId = window.requestAnimationFrame(render);
      };

      rafId = window.requestAnimationFrame(render);
      return () => {
        if (rafId) window.cancelAnimationFrame(rafId);
      };
    }, [activeDisciplineIndex, hoveredNode]);

    const handlePointerMove = (e: React.MouseEvent<HTMLDivElement>) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const nx = clamp((e.clientX - rect.left) / Math.max(1, rect.width), 0, 1);
      const ny = clamp((e.clientY - rect.top) / Math.max(1, rect.height), 0, 1);
      pointerRef.current.x = nx;
      pointerRef.current.y = ny;
      pointerRef.current.active = true;

      // Check proximity to the 4 discipline quadrant centers
      const cx = 0.5;
      const cy = 0.5;
      const dx = nx - cx;
      const dy = ny - cy;
      const angle = Math.atan2(dy, dx);

      // Find closest node by angle
      let closestIdx = 0;
      let minDiff = 999;
      TELEMETRY_NODES.forEach((n, i) => {
        let diff = Math.abs(angle - n.angle);
        if (diff > Math.PI) diff = Math.PI * 2 - diff;
        if (diff < minDiff) {
          minDiff = diff;
          closestIdx = i;
        }
      });

      if (minDiff < 0.65) {
        setHoveredNode(closestIdx);
        if (onSelectDiscipline) onSelectDiscipline(closestIdx);
      }
    };

    const handlePointerLeave = () => {
      pointerRef.current.active = false;
      setHoveredNode(null);
    };

    return (
      <div
        ref={containerRef}
        onMouseMove={handlePointerMove}
        onMouseLeave={handlePointerLeave}
        className="relative w-full h-[320px] sm:h-[380px] md:h-[420px] bg-[#0c0c0b] border border-[#f2f2f0]/15 overflow-hidden select-none cursor-crosshair group"
      >
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

        {/* Top Header Badge */}
        <div className="absolute top-3 left-4 right-4 flex items-center justify-between font-mono-code text-[10px] tracking-[0.2em] text-[#8a8a86] pointer-events-none">
          <span className="flex items-center gap-1.5 text-[#f2f2f0]/90">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c8ff00] animate-pulse" />
            TELEMETRY MATRIX · 4 DISCIPLINES
          </span>
          <span className="text-[#c8ff00] tabular-nums">RADAR 360° · LIVE</span>
        </div>

        {/* Bottom Interactive Quick-Switch Quadrant Chips */}
        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-center gap-1.5">
          {TELEMETRY_NODES.map((node, i) => {
            const isCurrent =
              hoveredNode === i || (hoveredNode === null && activeDisciplineIndex === i);
            return (
              <button
                key={node.label}
                type="button"
                onClick={() => {
                  setHoveredNode(i);
                  if (onSelectDiscipline) onSelectDiscipline(i);
                }}
                className={`px-2.5 py-1 font-mono-code text-[10px] tracking-wider transition-colors duration-150 cursor-pointer ${
                  isCurrent
                    ? 'bg-[#c8ff00] text-[#0a0a0a] font-semibold border border-[#c8ff00]'
                    : 'bg-[#111111]/80 text-[#8a8a86] hover:text-[#f2f2f0] border border-[#f2f2f0]/15'
                }`}
              >
                0{i + 1} · {node.label.split(' ')[0]}
              </button>
            );
          })}
        </div>
      </div>
    );
  }
);
