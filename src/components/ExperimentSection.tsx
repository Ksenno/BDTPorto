import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw, Sparkles, Volume2, VolumeX, Zap } from 'lucide-react';
import {
  SpringNode2D,
  SpringVector2D,
  clamp,
  stepAngleSpring,
  stepSpringNode2D,
  stepSpringVector2D,
  stepUnderdampedSpring,
} from '../utils/motionMath';
import { ChapterEntrancePortal } from './ChapterEntrancePortal';

interface ExperimentSectionProps {
  sectionProgress?: number;
}

interface NeedleState {
  id: number;
  x: number;
  y: number;
  angle: number;
  velocity: number;
  proximity: number;
}

interface EchoTrailParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  vAngle: number;
  size: number;
  life: number;
  maxLife: number;
  hueType: 'lime' | 'cyan' | 'white';
}

const NEEDLE_COLS = 7;
const NEEDLE_ROWS = 5;
const STAGE_W = 320;
const STAGE_H = 150;

function createInitialNeedles(): NeedleState[] {
  const list: NeedleState[] = [];
  const padX = 28;
  const padY = 24;
  const usableW = STAGE_W - padX * 2;
  const usableH = STAGE_H - padY * 2;

  for (let r = 0; r < NEEDLE_ROWS; r++) {
    for (let c = 0; c < NEEDLE_COLS; c++) {
      const x = padX + (c / (NEEDLE_COLS - 1)) * usableW;
      const y = padY + (r / (NEEDLE_ROWS - 1)) * usableH;
      list.push({
        id: r * NEEDLE_COLS + c,
        x,
        y,
        angle: 0,
        velocity: 0,
        proximity: 0,
      });
    }
  }
  return list;
}

function createInitialSpringNodes(): SpringNode2D[] {
  const cols = 4;
  const rows = 2;
  const padX = 46;
  const padY = 42;
  const usableW = STAGE_W - padX * 2;
  const usableH = STAGE_H - padY * 2;
  const nodes: SpringNode2D[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ox = padX + (c / (cols - 1)) * usableW;
      const oy = padY + (r / (rows - 1)) * usableH;
      nodes.push({
        x: ox,
        y: oy,
        originX: ox,
        originY: oy,
        vx: 0,
        vy: 0,
      });
    }
  }
  return nodes;
}

export const ExperimentSection: React.FC<ExperimentSectionProps> = React.memo(
  ({ sectionProgress = 0.5 }) => {
    const sectionRef = useRef<HTMLElement | null>(null);

  // 001: Magnetic Vector Matrix state & refs
  const [polarity, setPolarity] = useState<'attract' | 'repel' | 'vortex'>('attract');
  const polarityRef = useRef<'attract' | 'repel' | 'vortex'>('attract');
  polarityRef.current = polarity;

  const magneticPointerRef = useRef<{ x: number; y: number; active: boolean; pulse: number }>({
    x: STAGE_W / 2,
    y: STAGE_H / 2,
    active: false,
    pulse: 0,
  });
  const needlesStateRef = useRef<NeedleState[]>(createInitialNeedles());
  const needleLineRefs = useRef<(SVGLineElement | null)[]>([]);
  const needleHeadRefs = useRef<(SVGCircleElement | null)[]>([]);
  const magneticCursorRingRef = useRef<SVGCircleElement | null>(null);

  // 002: Typography Distortion state (with soft-spring wave inertia)
  const [typeHoverX, setTypeHoverX] = useState(0.5);
  const typeTargetXRef = useRef(0.5);
  const typeSpringRef = useRef({ val: 0.5, vel: 0 });
  const [distortionAmp, setDistortionAmp] = useState(1.2);

  // 003: Accurate 2D Hooke's Law Hover Physics refs & state
  const [springMode, setSpringMode] = useState<'repel' | 'attract'>('repel');
  const springModeRef = useRef<'repel' | 'attract'>('repel');
  springModeRef.current = springMode;

  const springNodesRef = useRef<SpringNode2D[]>(createInitialSpringNodes());
  const springPointerRef = useRef<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    lastX: number;
    lastY: number;
    lastT: number;
    active: boolean;
  }>({
    x: STAGE_W / 2,
    y: STAGE_H / 2,
    vx: 0,
    vy: 0,
    lastX: STAGE_W / 2,
    lastY: STAGE_H / 2,
    lastT: 0,
    active: false,
  });
  const springTensionSpanRef = useRef<HTMLSpanElement | null>(null);
  const springGroupRefs = useRef<(SVGGElement | null)[]>([]);
  const springTetherRefs = useRef<(SVGLineElement | null)[]>([]);
  const springForceVecRefs = useRef<(SVGLineElement | null)[]>([]);
  const springHaloRefs = useRef<(SVGCircleElement | null)[]>([]);
  const springMeshPathRef = useRef<SVGPathElement | null>(null);
  const springCursorCircleRef = useRef<SVGCircleElement | null>(null);

  // 004: 3D Depth Illusion state (with 2D soft-spring inertia)
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const tiltTargetRef = useRef({ x: 0, y: 0 });
  const tiltSpringRef = useRef<SpringVector2D>({ x: 0, y: 0, vx: 0, vy: 0 });

  // 005: Liquid Turbulence & Chromatic Optics state
  const [liquidMode, setLiquidMode] = useState<'prism' | 'wave' | 'caustic'>('prism');
  const liquidModeRef = useRef<'prism' | 'wave' | 'caustic'>('prism');
  liquidModeRef.current = liquidMode;

  const [liquidPointer, setLiquidPointer] = useState<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    active: boolean;
  }>({
    x: 0.5,
    y: 0.5,
    vx: 0,
    vy: 0,
    active: false,
  });
  const liquidLastRef = useRef<{ x: number; y: number; t: number }>({ x: 0.5, y: 0.5, t: 0 });
  const [rippleBoost, setRippleBoost] = useState<number>(0);
  const liquidTurbRef = useRef<SVGFETurbulenceElement | null>(null);

  // 006: Architectural Chronophotograph & Voxel Wake Cursor Trails (New Theme!)
  const [trailTheme, setTrailTheme] = useState<'echo' | 'voxel' | 'shards'>('echo');
  const trailThemeRef = useRef<'echo' | 'voxel' | 'shards'>('echo');
  trailThemeRef.current = trailTheme;

  const trailCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const trailPointerRef = useRef<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    active: boolean;
    lastX: number;
    lastY: number;
    lastT: number;
  }>({
    x: STAGE_W / 2,
    y: STAGE_H / 2,
    vx: 0,
    vy: 0,
    active: false,
    lastX: STAGE_W / 2,
    lastY: STAGE_H / 2,
    lastT: 0,
  });
  const echoParticlesRef = useRef<EchoTrailParticle[]>([]);
  const voxelHeatGridRef = useRef<Float32Array>(new Float32Array(16 * 8));
  const [velocityReadout, setVelocityReadout] = useState(0);

  // 007: Harmonic Number Counter state
  const [counterVal, setCounterVal] = useState(4096);

  // 008: Creative Multi-Pole Chromatic Topography & Shader Mesh
  const [gradientPalette, setGradientPalette] = useState<'acid' | 'infrared' | 'aurora'>('acid');
  const gradientPaletteRef = useRef<'acid' | 'infrared' | 'aurora'>('acid');
  gradientPaletteRef.current = gradientPalette;

  const gradientCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const gradientPointerRef = useRef<{
    x: number;
    y: number;
    smoothX: number;
    smoothY: number;
    active: boolean;
    pulse: number;
  }>({
    x: STAGE_W * 0.5,
    y: STAGE_H * 0.5,
    smoothX: STAGE_W * 0.5,
    smoothY: STAGE_H * 0.5,
    active: false,
    pulse: 0,
  });
  const [gradReadout, setGradReadout] = useState({ x: 50, y: 50, nm: 545 });

  // 009: Acoustic Synth Pulse state (Muted by default)
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [activeFreq, setActiveFreq] = useState<number>(220);
  const [pulseRingKey, setPulseRingKey] = useState(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const spawnEchoParticle = (
    x: number,
    y: number,
    vx: number,
    vy: number,
    forceBurst = false
  ) => {
    const list = echoParticlesRef.current;
    const speed = Math.hypot(vx, vy);
    const angle = Math.atan2(vy, vx);
    const hues: ('lime' | 'cyan' | 'white')[] = ['lime', 'cyan', 'white'];
    const count = forceBurst ? 8 : 1;

    for (let i = 0; i < count; i++) {
      const burstAngle = forceBurst ? (i / count) * Math.PI * 2 : angle;
      const burstSpeed = forceBurst ? 2.4 + (i % 3) * 0.8 : Math.min(3.5, speed * 0.08);
      list.push({
        x,
        y,
        vx: Math.cos(burstAngle) * burstSpeed,
        vy: Math.sin(burstAngle) * burstSpeed,
        angle: burstAngle,
        vAngle: (i % 2 === 0 ? 1 : -1) * 0.04,
        size: forceBurst ? 18 : clamp(12 + speed * 0.35, 12, 34),
        life: 1.0,
        maxLife: 1.0,
        hueType: hues[(list.length + i) % hues.length],
      });
    }

    if (list.length > 36) {
      list.splice(0, list.length - 36);
    }
  };

  const liquidActiveRef = useRef<boolean>(false);
  liquidActiveRef.current = liquidPointer.active || rippleBoost > 0;

  // Unified 60FPS Simulation Loop for 001, 003, 005, 006, and 008 (Gated by IntersectionObserver!)
  useEffect(() => {
    let rafId = 0;
    let isSectionInView = false;
    const startTime = performance.now();
    let frameCount = 0;

    const stepSimulations = (now: number) => {
      if (!isSectionInView) {
        rafId = 0;
        return;
      }
      const elapsed = (now - startTime) * 0.001;
      const dt = 1 / 60;
      frameCount++;

      // --- 1. Step 001: Magnetic Vector Matrix ---
      const mp = magneticPointerRef.current;
      const targetX = mp.active
        ? mp.x
        : STAGE_W * 0.5 + Math.cos(elapsed * 1.35) * 90;
      const targetY = mp.active
        ? mp.y
        : STAGE_H * 0.5 + Math.sin(elapsed * 1.85) * 44;

      if (mp.pulse > 0) {
        mp.pulse = Math.max(0, mp.pulse - dt * 2.4);
      }

      if (magneticCursorRingRef.current) {
        magneticCursorRingRef.current.setAttribute('cx', targetX.toFixed(1));
        magneticCursorRingRef.current.setAttribute('cy', targetY.toFixed(1));
        magneticCursorRingRef.current.setAttribute(
          'r',
          (mp.active ? 18 + mp.pulse * 45 : 10).toFixed(1)
        );
      }

      const needles = needlesStateRef.current;
      const mode = polarityRef.current;

      for (let i = 0; i < needles.length; i++) {
        const n = needles[i];
        const dx = targetX - n.x;
        const dy = targetY - n.y;
        const dist = Math.hypot(dx, dy);
        const proximity = clamp(1 - dist / 140, 0, 1);

        let desiredDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
        if (mode === 'repel') desiredDeg += 180;
        if (mode === 'vortex') desiredDeg += 90 + proximity * 30;
        if (mp.pulse > 0) {
          desiredDeg += Math.sin(dist * 0.08 - elapsed * 14) * mp.pulse * 85;
        }

        const stepped = stepAngleSpring(n.angle, n.velocity, desiredDeg, 200, 17, dt);
        n.angle = stepped.angle;
        n.velocity = stepped.velocity;
        n.proximity = proximity;

        const lineEl = needleLineRefs.current[i];
        const headEl = needleHeadRefs.current[i];
        if (lineEl && headEl) {
          const rad = (n.angle * Math.PI) / 180;
          const halfLen = 8.5 + proximity * 6;
          const x1 = n.x - Math.cos(rad) * halfLen;
          const y1 = n.y - Math.sin(rad) * halfLen;
          const x2 = n.x + Math.cos(rad) * halfLen;
          const y2 = n.y + Math.sin(rad) * halfLen;

          lineEl.setAttribute('x1', x1.toFixed(2));
          lineEl.setAttribute('y1', y1.toFixed(2));
          lineEl.setAttribute('x2', x2.toFixed(2));
          lineEl.setAttribute('y2', y2.toFixed(2));
          lineEl.setAttribute(
            'stroke',
            proximity > 0.25 ? '#c8ff00' : 'rgba(242, 242, 240, 0.55)'
          );
          lineEl.setAttribute('stroke-width', (1.35 + proximity * 1.35).toFixed(2));

          headEl.setAttribute('cx', x2.toFixed(2));
          headEl.setAttribute('cy', y2.toFixed(2));
          headEl.setAttribute(
            'fill',
            proximity > 0.25 ? '#c8ff00' : 'rgba(242, 242, 240, 0.75)'
          );
        }
      }

      // --- 1b. Step 002 & 004 Soft Springs (Kinetic Type & 3D Depth Planes) ---
      const ts = typeSpringRef.current;
      if (Math.abs(ts.val - typeTargetXRef.current) > 0.001 || Math.abs(ts.vel) > 0.003) {
        const nextType = stepUnderdampedSpring(ts.val, ts.vel, typeTargetXRef.current, dt, 130, 13.5);
        typeSpringRef.current = { val: nextType.value, vel: nextType.velocity };
        setTypeHoverX(clamp(nextType.value, 0, 1));
      }

      const tls = tiltSpringRef.current;
      const tlt = tiltTargetRef.current;
      if (
        Math.hypot(tls.x - tlt.x, tls.y - tlt.y) > 0.0015 ||
        Math.hypot(tls.vx, tls.vy) > 0.005
      ) {
        const nextTilt = stepSpringVector2D(tls, tlt.x, tlt.y, dt, 125, 13);
        tiltSpringRef.current = nextTilt;
        setTilt({ x: nextTilt.x, y: nextTilt.y });
      }

      // --- 2. Step 003: 2D Hooke's Law Hover Physics ---
      const sp = springPointerRef.current;
      const sNodes = springNodesRef.current;
      const isAttract = springModeRef.current === 'attract';
      let totalDisp = 0;

      if (springCursorCircleRef.current) {
        springCursorCircleRef.current.setAttribute('cx', sp.x.toFixed(1));
        springCursorCircleRef.current.setAttribute('cy', sp.y.toFixed(1));
        springCursorCircleRef.current.setAttribute('opacity', sp.active ? '0.45' : '0');
      }

      for (let i = 0; i < sNodes.length; i++) {
        let updated = stepSpringNode2D(
          sNodes[i],
          sp.x,
          sp.y,
          sp.vx,
          sp.vy,
          sp.active,
          120,
          155,
          11,
          dt
        );

        if (isAttract && sp.active) {
          const dx = sp.x - sNodes[i].x;
          const dy = sp.y - sNodes[i].y;
          const dist = Math.hypot(dx, dy);
          if (dist < 125) {
            const pull = (1 - dist / 125) * 0.28;
            updated = {
              ...updated,
              x: clamp(sNodes[i].x + dx * pull, sNodes[i].originX - 46, sNodes[i].originX + 46),
              y: clamp(sNodes[i].y + dy * pull, sNodes[i].originY - 46, sNodes[i].originY + 46),
            };
          }
        }

        sNodes[i] = updated;
        const disp = Math.hypot(updated.x - updated.originX, updated.y - updated.originY);
        totalDisp += disp;

        const grp = springGroupRefs.current[i];
        const tether = springTetherRefs.current[i];
        const forceVec = springForceVecRefs.current[i];
        const halo = springHaloRefs.current[i];

        if (grp) {
          grp.setAttribute(
            'transform',
            `translate(${updated.x.toFixed(2)}, ${updated.y.toFixed(2)})`
          );
        }
        if (tether) {
          tether.setAttribute('x2', updated.x.toFixed(2));
          tether.setAttribute('y2', updated.y.toFixed(2));
          tether.setAttribute(
            'stroke',
            disp > 3 ? '#c8ff00' : 'rgba(242, 242, 240, 0.28)'
          );
        }
        if (forceVec) {
          const distToPtr = Math.hypot(updated.x - sp.x, updated.y - sp.y);
          if (sp.active && distToPtr < 120) {
            forceVec.setAttribute('x1', sp.x.toFixed(1));
            forceVec.setAttribute('y1', sp.y.toFixed(1));
            forceVec.setAttribute('x2', updated.x.toFixed(1));
            forceVec.setAttribute('y2', updated.y.toFixed(1));
            forceVec.setAttribute('opacity', ((1 - distToPtr / 120) * 0.55).toFixed(2));
          } else {
            forceVec.setAttribute('opacity', '0');
          }
        }
        if (halo) {
          halo.setAttribute('r', (14 + Math.min(10, disp * 0.4)).toFixed(1));
          halo.setAttribute(
            'stroke',
            disp > 3 ? '#c8ff00' : 'rgba(242, 242, 240, 0.35)'
          );
        }
      }

      sp.vx *= 0.85;
      sp.vy *= 0.85;

      if (springMeshPathRef.current && sNodes.length === 8) {
        const d = [
          `M ${sNodes[0].x.toFixed(1)} ${sNodes[0].y.toFixed(1)} L ${sNodes[1].x.toFixed(1)} ${sNodes[1].y.toFixed(1)} L ${sNodes[2].x.toFixed(1)} ${sNodes[2].y.toFixed(1)} L ${sNodes[3].x.toFixed(1)} ${sNodes[3].y.toFixed(1)}`,
          `M ${sNodes[4].x.toFixed(1)} ${sNodes[4].y.toFixed(1)} L ${sNodes[5].x.toFixed(1)} ${sNodes[5].y.toFixed(1)} L ${sNodes[6].x.toFixed(1)} ${sNodes[6].y.toFixed(1)} L ${sNodes[7].x.toFixed(1)} ${sNodes[7].y.toFixed(1)}`,
          `M ${sNodes[0].x.toFixed(1)} ${sNodes[0].y.toFixed(1)} L ${sNodes[4].x.toFixed(1)} ${sNodes[4].y.toFixed(1)}`,
          `M ${sNodes[1].x.toFixed(1)} ${sNodes[1].y.toFixed(1)} L ${sNodes[5].x.toFixed(1)} ${sNodes[5].y.toFixed(1)}`,
          `M ${sNodes[2].x.toFixed(1)} ${sNodes[2].y.toFixed(1)} L ${sNodes[6].x.toFixed(1)} ${sNodes[6].y.toFixed(1)}`,
          `M ${sNodes[3].x.toFixed(1)} ${sNodes[3].y.toFixed(1)} L ${sNodes[7].x.toFixed(1)} ${sNodes[7].y.toFixed(1)}`,
        ].join(' ');
        springMeshPathRef.current.setAttribute('d', d);
      }

      if (frameCount % 6 === 0 && springTensionSpanRef.current) {
        springTensionSpanRef.current.textContent = `ΔE: ${Math.round(totalDisp)}`;
      }

      // --- 3. Step 005: Liquid Turbulence (Only mutate SVG filter when actively hovered!) ---
      if (liquidTurbRef.current && liquidActiveRef.current && frameCount % 3 === 0) {
        const lMode = liquidModeRef.current;
        const bx =
          (lMode === 'wave' ? 0.016 : 0.022) + Math.sin(elapsed * 1.6) * 0.004;
        const by =
          (lMode === 'wave' ? 0.045 : 0.028) + Math.cos(elapsed * 1.3) * 0.005;
        liquidTurbRef.current.setAttribute(
          'baseFrequency',
          `${bx.toFixed(4)} ${by.toFixed(4)}`
        );
      }

      // --- 4. Step 006: Architectural Echo / Voxel / Vector Shards Canvas ---
      const tCanvas = trailCanvasRef.current;
      if (tCanvas) {
        const ctx = tCanvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, STAGE_W, STAGE_H);
          const tp = trailPointerRef.current;
          const tTheme = trailThemeRef.current;

          // Autonomous Lissajous sweep when pointer is outside so preview looks rich & editorial
          const activeX = tp.active
            ? tp.x
            : STAGE_W * 0.5 + Math.cos(elapsed * 1.7) * 95;
          const activeY = tp.active
            ? tp.y
            : STAGE_H * 0.5 + Math.sin(elapsed * 3.4) * 38;

          if (!tp.active && frameCount % 3 === 0) {
            const ivx = -Math.sin(elapsed * 1.7) * 14;
            const ivy = Math.cos(elapsed * 3.4) * 14;
            spawnEchoParticle(activeX, activeY, ivx, ivy, false);
          }

          // Update & draw background Voxel Grid (16x8 cells)
          const vCols = 16;
          const vRows = 8;
          const cellW = STAGE_W / vCols;
          const cellH = STAGE_H / vRows;
          const heat = voxelHeatGridRef.current;

          const activeCol = clamp(Math.floor(activeX / cellW), 0, vCols - 1);
          const activeRow = clamp(Math.floor(activeY / cellH), 0, vRows - 1);
          heat[activeRow * vCols + activeCol] = 1.0;

          for (let r = 0; r < vRows; r++) {
            for (let c = 0; c < vCols; c++) {
              const idx = r * vCols + c;
              const hVal = heat[idx];
              if (tTheme === 'voxel') {
                // Draw crisp voxel cell
                ctx.strokeStyle = 'rgba(242, 242, 240, 0.05)';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(c * cellW, r * cellH, cellW, cellH);

                if (hVal > 0.02) {
                  ctx.fillStyle =
                    hVal > 0.55
                      ? `rgba(200, 255, 0, ${(hVal * 0.75).toFixed(2)})`
                      : `rgba(56, 189, 248, ${(hVal * 0.5).toFixed(2)})`;
                  const inset = (1 - hVal) * 5;
                  ctx.fillRect(
                    c * cellW + inset,
                    r * cellH + inset,
                    Math.max(2, cellW - inset * 2),
                    Math.max(2, cellH - inset * 2)
                  );
                }
              } else if (hVal > 0.08) {
                // Subtle architectural grid crosshairs in Echo / Shards mode
                ctx.fillStyle = `rgba(200, 255, 0, ${(hVal * 0.22).toFixed(2)})`;
                ctx.fillRect(c * cellW + cellW * 0.5 - 1, r * cellH + cellH * 0.5 - 1, 2, 2);
              }
              heat[idx] = Math.max(0, hVal - dt * (tTheme === 'voxel' ? 1.35 : 2.2));
            }
          }

          // Update & draw Echo Frames or Vector Shards
          const particles = echoParticlesRef.current;
          for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.94;
            p.vy *= 0.94;
            p.angle += p.vAngle;
            p.life -= dt * 1.45;

            if (p.life <= 0) {
              particles.splice(i, 1);
              continue;
            }

            const alpha = clamp(p.life, 0, 1);
            const strokeColor =
              p.hueType === 'lime'
                ? `rgba(200, 255, 0, ${alpha.toFixed(2)})`
                : p.hueType === 'cyan'
                ? `rgba(56, 189, 248, ${(alpha * 0.85).toFixed(2)})`
                : `rgba(242, 242, 240, ${(alpha * 0.65).toFixed(2)})`;

            ctx.save();
            ctx.translate(p.x, p.y);

            if (tTheme === 'echo') {
              // Chronophotograph geometric frame afterimage
              ctx.rotate(p.angle * 0.35);
              const w = p.size * (1.3 - alpha * 0.35);
              const h = w * 0.68;
              ctx.strokeStyle = strokeColor;
              ctx.lineWidth = alpha > 0.6 ? 1.5 : 1;
              ctx.strokeRect(-w * 0.5, -h * 0.5, w, h);

              // Corner ticks
              const tick = 3;
              ctx.fillStyle = strokeColor;
              ctx.fillRect(-w * 0.5 - 1, -h * 0.5 - 1, tick, 1.5);
              ctx.fillRect(w * 0.5 - tick + 1, h * 0.5 - 0.5, tick, 1.5);
            } else if (tTheme === 'shards') {
              // High-velocity tangential vector shards
              ctx.rotate(p.angle);
              const len = p.size * 1.15;
              ctx.strokeStyle = strokeColor;
              ctx.lineWidth = 1.6;
              ctx.beginPath();
              ctx.moveTo(-len * 0.6, 0);
              ctx.lineTo(len * 0.6, 0);
              ctx.moveTo(len * 0.6 - 4, -3);
              ctx.lineTo(len * 0.6, 0);
              ctx.lineTo(len * 0.6 - 4, 3);
              ctx.stroke();
            } else {
              // Voxel mode center reticle spark
              ctx.strokeStyle = strokeColor;
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(-4, 0);
              ctx.lineTo(4, 0);
              ctx.moveTo(0, -4);
              ctx.lineTo(0, 4);
              ctx.stroke();
            }

            ctx.restore();
          }

          // Draw active precision cursor reticle on canvas
          ctx.save();
          ctx.translate(activeX, activeY);
          ctx.strokeStyle = '#c8ff00';
          ctx.lineWidth = 1.2;
          ctx.strokeRect(-7, -7, 14, 14);
          ctx.fillStyle = '#c8ff00';
          ctx.beginPath();
          ctx.arc(0, 0, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // --- 5. Step 008: Creative Chromatic Topography & Interference Shader Canvas ---
      const gCanvas = gradientCanvasRef.current;
      if (gCanvas) {
        const ctx = gCanvas.getContext('2d');
        if (ctx) {
          const gp = gradientPointerRef.current;
          const targetGx = gp.active
            ? gp.x
            : STAGE_W * 0.5 + Math.cos(elapsed * 1.1) * 75;
          const targetGy = gp.active
            ? gp.y
            : STAGE_H * 0.5 + Math.sin(elapsed * 1.5) * 35;

          gp.smoothX += (targetGx - gp.smoothX) * 0.14;
          gp.smoothY += (targetGy - gp.smoothY) * 0.14;
          if (gp.pulse > 0) {
            gp.pulse = Math.max(0, gp.pulse - dt * 2.0);
          }

          const pal = gradientPaletteRef.current;
          const colors =
            pal === 'acid'
              ? {
                  c1: 'rgba(200, 255, 0, 0.42)',
                  c2: 'rgba(56, 189, 248, 0.34)',
                  c3: 'rgba(16, 185, 129, 0.28)',
                  stroke: '#c8ff00',
                  secondaryStroke: '#38bdf8',
                }
              : pal === 'infrared'
              ? {
                  c1: 'rgba(244, 63, 94, 0.45)',
                  c2: 'rgba(245, 158, 11, 0.38)',
                  c3: 'rgba(168, 85, 247, 0.3)',
                  stroke: '#f43f5e',
                  secondaryStroke: '#f59e0b',
                }
              : {
                  c1: 'rgba(167, 139, 250, 0.44)',
                  c2: 'rgba(56, 189, 248, 0.38)',
                  c3: 'rgba(200, 255, 0, 0.3)',
                  stroke: '#a78bfa',
                  secondaryStroke: '#c8ff00',
                };

          ctx.fillStyle = '#080808';
          ctx.fillRect(0, 0, STAGE_W, STAGE_H);

          // Orbiting secondary pole
          const pole2X = STAGE_W * 0.5 + Math.cos(-elapsed * 0.9) * 88;
          const pole2Y = STAGE_H * 0.5 + Math.sin(-elapsed * 1.3) * 40;

          // Multi-pole blended radial shader gradients
          ctx.globalCompositeOperation = 'screen';

          const g1 = ctx.createRadialGradient(
            gp.smoothX,
            gp.smoothY,
            4,
            gp.smoothX,
            gp.smoothY,
            135 + gp.pulse * 40
          );
          g1.addColorStop(0, colors.c1);
          g1.addColorStop(0.55, colors.c2);
          g1.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = g1;
          ctx.fillRect(0, 0, STAGE_W, STAGE_H);

          const g2 = ctx.createRadialGradient(pole2X, pole2Y, 4, pole2X, pole2Y, 120);
          g2.addColorStop(0, colors.c3);
          g2.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = g2;
          ctx.fillRect(0, 0, STAGE_W, STAGE_H);

          ctx.globalCompositeOperation = 'source-over';

          // Draw Topographic Iso-Contour Rings Warping Between Pole 1 (Cursor) and Pole 2
          for (let ring = 1; ring <= 6; ring++) {
            const t = ring / 6;
            const mixX = gp.smoothX * (1 - t * 0.45) + pole2X * (t * 0.45);
            const mixY = gp.smoothY * (1 - t * 0.45) + pole2Y * (t * 0.45);
            const rx = 20 + ring * 22 + Math.sin(elapsed * 2 + ring) * 4 + gp.pulse * 14;
            const ry = 12 + ring * 12 + Math.cos(elapsed * 2 + ring) * 3 + gp.pulse * 8;
            const rot = Math.atan2(pole2Y - gp.smoothY, pole2X - gp.smoothX) * 0.35;

            ctx.save();
            ctx.translate(mixX, mixY);
            ctx.rotate(rot);
            ctx.strokeStyle = ring % 2 === 0 ? colors.stroke : colors.secondaryStroke;
            ctx.globalAlpha = 0.55 - ring * 0.07;
            ctx.lineWidth = ring === 1 ? 1.5 : 1;
            ctx.beginPath();
            ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }

          // Draw dipole connection vector & focal coordinates
          ctx.strokeStyle = 'rgba(242, 242, 240, 0.22)';
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(gp.smoothX, gp.smoothY);
          ctx.lineTo(pole2X, pole2Y);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = colors.stroke;
          ctx.beginPath();
          ctx.arc(gp.smoothX, gp.smoothY, 3, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = colors.secondaryStroke;
          ctx.beginPath();
          ctx.arc(pole2X, pole2Y, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (isSectionInView) {
        rafId = window.requestAnimationFrame(stepSimulations);
      } else {
        rafId = 0;
      }
    };

    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      isSectionInView = true;
      rafId = window.requestAnimationFrame(stepSimulations);
      return () => {
        if (rafId) window.cancelAnimationFrame(rafId);
      };
    }

    // Render 1 initial static frame so canvases are populated before scrolling into view
    isSectionInView = true;
    stepSimulations(performance.now());
    isSectionInView = false;

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        isSectionInView = entry.isIntersecting;
        if (isSectionInView && !rafId) {
          rafId = window.requestAnimationFrame(stepSimulations);
        } else if (!isSectionInView && rafId) {
          window.cancelAnimationFrame(rafId);
          rafId = 0;
        }
      },
      { rootMargin: '200px 0px' }
    );
    io.observe(el);

    return () => {
      io.disconnect();
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  const triggerSpringImpulse = (centerX = STAGE_W / 2, centerY = STAGE_H / 2) => {
    springNodesRef.current = springNodesRef.current.map((node) => {
      const dx = node.x - centerX;
      const dy = node.y - centerY;
      const dist = Math.max(12, Math.hypot(dx, dy));
      const force = 560 / (dist * 0.042);
      return {
        ...node,
        vx: node.vx + (dx / dist) * force,
        vy: node.vy + (dy / dist) * force,
      };
    });
  };

  const triggerSynthNote = (freq: number) => {
    setActiveFreq(freq);
    setPulseRingKey((k) => k + 1);

    if (soundEnabled) {
      try {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioContextClass();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') {
          ctx.resume();
        }
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      } catch {
        // Ignore audio restrictions in headless environments
      }
    }
  };

  const resetAllExperiments = () => {
    setPolarity('attract');
    setDistortionAmp(1.2);
    setSpringMode('repel');
    setTilt({ x: 0, y: 0 });
    setLiquidMode('prism');
    setRippleBoost(0);
    setTrailTheme('echo');
    echoParticlesRef.current = [];
    voxelHeatGridRef.current.fill(0);
    setGradientPalette('acid');
    setCounterVal(4096);
    springNodesRef.current = createInitialSpringNodes();
  };

  const DISTORTION_CHARS = 'SYSTEMS'.split('');

  const speedMag = Math.min(1.8, Math.hypot(liquidPointer.vx, liquidPointer.vy));
  const baseScale =
    liquidMode === 'prism' ? 16 : liquidMode === 'wave' ? 28 : 22;
  const activeDisplacementScale = Math.round(
    baseScale + speedMag * 24 + rippleBoost + (liquidPointer.active ? 10 : 0)
  );
  const chromaOffsetX = ((liquidPointer.x - 0.5) * 16 + liquidPointer.vx * 7).toFixed(1);
  const chromaOffsetY = ((liquidPointer.y - 0.5) * 12 + liquidPointer.vy * 7).toFixed(1);

  return (
    <section
      id="lab"
      ref={sectionRef}
      aria-label="Chapter 04 Experiment Lab"
      className="relative w-full bg-transparent border-t border-[#f2f2f0]/12 pt-14 md:pt-20 pb-24 md:pb-36 px-6 md:px-12 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">
        {/* Universal Scrollytelling SVG Line-Drawing Entrance Portal */}
        <ChapterEntrancePortal
          chapterNumber="04"
          chapterTitle="DIGITAL LABORATORY"
          chapterSubtitle="EXPERIMENTS / 001–009 · INTERACTIVE PHYSICS & OPTICS"
          blueprintCode="SYS.LAB.04"
          sectionProgress={sectionProgress}
          rightSlot={
            <button
              type="button"
              onClick={resetAllExperiments}
              data-cursor-label="RESET"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 border border-[#f2f2f0]/15 font-mono-code text-xs text-[#8a8a86] hover:text-[#f2f2f0] hover:border-[#c8ff00] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RESET LAB PARAMETERS</span>
            </button>
          }
        />

        {/* Intro Copy */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-14">
          <div className="lg:col-span-7">
            <h2 className="font-display text-4xl sm:text-6xl font-extrabold tracking-tight text-[#f2f2f0] leading-[0.98] text-balance">
              DIGITAL LABORATORY{' '}
              <span className="font-serif-editorial italic font-normal text-[#c8ff00]">
                001—009
              </span>
            </h2>
          </div>
          <div className="lg:col-span-5">
            <p className="font-sans-body text-sm md:text-base text-[#8a8a86] leading-relaxed">
              Instead of a static list of skills, interact directly with nine micro-studies testing
              vector fields, variable typography, spring physics, and optical depth.
            </p>
          </div>
        </div>

        {/* 9 Interactive Laboratory Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[#f2f2f0]/12 border border-[#f2f2f0]/12">
          {/* EXP 001: Magnetic Vector Matrix */}
          <div className="bg-[#0e0e0d] p-6 flex flex-col justify-between min-h-[300px]">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono-code text-xs text-[#c8ff00]">001 · MAGNETIC MATRIX</span>
              <button
                type="button"
                onClick={() =>
                  setPolarity((p) =>
                    p === 'attract' ? 'repel' : p === 'repel' ? 'vortex' : 'attract'
                  )
                }
                className="font-mono-code text-[11px] text-[#f2f2f0] border border-[#f2f2f0]/20 px-2.5 py-1 hover:border-[#c8ff00] uppercase whitespace-nowrap shrink-0 cursor-pointer"
              >
                MODE: {polarity}
              </button>
            </div>

            <div
              data-cursor-precision="true"
              onMouseMove={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                magneticPointerRef.current.x =
                  ((e.clientX - r.left) / Math.max(1, r.width)) * STAGE_W;
                magneticPointerRef.current.y =
                  ((e.clientY - r.top) / Math.max(1, r.height)) * STAGE_H;
                magneticPointerRef.current.active = true;
              }}
              onMouseLeave={() => {
                magneticPointerRef.current.active = false;
              }}
              onClick={() => {
                magneticPointerRef.current.pulse = 1;
              }}
              className="my-4 relative w-full h-36 bg-[#0a0a0a] border border-[#f2f2f0]/10 overflow-hidden cursor-crosshair"
            >
              <svg
                viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}
                className="w-full h-full block"
                aria-label="Interactive magnetic vector needle field"
              >
                <circle
                  ref={magneticCursorRingRef}
                  cx={STAGE_W / 2}
                  cy={STAGE_H / 2}
                  r="14"
                  fill="none"
                  stroke="rgba(200, 255, 0, 0.25)"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                {needlesStateRef.current.map((n, idx) => (
                  <g key={n.id}>
                    <line
                      ref={(el) => {
                        needleLineRefs.current[idx] = el;
                      }}
                      x1={n.x - 9}
                      y1={n.y}
                      x2={n.x + 9}
                      y2={n.y}
                      stroke="rgba(242, 242, 240, 0.55)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <circle
                      ref={(el) => {
                        needleHeadRefs.current[idx] = el;
                      }}
                      cx={n.x + 9}
                      cy={n.y}
                      r="1.9"
                      fill="rgba(242, 242, 240, 0.7)"
                    />
                  </g>
                ))}
              </svg>
            </div>

            <p className="font-mono-code text-[11px] text-[#8a8a86]">
              35 SPRING NEEDLES · SHORTEST-ANGLE SOLVER · CLICK TO PULSE
            </p>
          </div>

          {/* EXP 002: Kinetic Typography Distortion */}
          <div
            data-cursor-precision="true"
            onMouseMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              typeTargetXRef.current = clamp((e.clientX - r.left) / Math.max(1, r.width), 0, 1);
            }}
            onMouseLeave={() => {
              typeTargetXRef.current = 0.5;
            }}
            className="bg-[#0e0e0d] p-6 flex flex-col justify-between min-h-[300px]"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono-code text-xs text-[#c8ff00]">002 · KINETIC TYPE</span>
              <button
                type="button"
                onClick={() =>
                  setDistortionAmp((a) => (a >= 2.2 ? 0.8 : Number((a + 0.5).toFixed(1))))
                }
                className="font-mono-code text-[11px] text-[#f2f2f0] border border-[#f2f2f0]/20 px-2.5 py-1 hover:border-[#c8ff00] whitespace-nowrap shrink-0 cursor-pointer"
              >
                GAIN: {distortionAmp}x
              </button>
            </div>

            <div className="my-auto flex items-center justify-between py-6 select-none">
              {DISTORTION_CHARS.map((ch, idx) => {
                const normIdx = idx / (DISTORTION_CHARS.length - 1);
                const dist = Math.abs(typeHoverX - normIdx);
                const wave = Math.max(0, 1 - dist * 2.2) * distortionAmp;
                const scaleY = 1 + wave * 0.65;
                const skewX = (typeHoverX - normIdx) * 24 * distortionAmp;
                return (
                  <span
                    key={idx}
                    className="font-display text-3xl sm:text-4xl font-extrabold will-change-transform"
                    style={{
                      transform: `scaleY(${scaleY.toFixed(2)}) skewX(${skewX.toFixed(
                        1
                      )}deg) translateY(${(-wave * 10).toFixed(1)}px)`,
                      color: wave > 0.45 ? '#c8ff00' : '#f2f2f0',
                    }}
                  >
                    {ch}
                  </span>
                );
              })}
            </div>

            <p className="font-mono-code text-[11px] text-[#8a8a86]">
              WAVE INTERPOLATION · FOCUS X: {Math.round(typeHoverX * 100)}%
            </p>
          </div>

          {/* EXP 003: Accurate 2D Hooke's Law Hover Physics Lattice */}
          <div className="bg-[#0e0e0d] p-6 flex flex-col justify-between min-h-[300px]">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono-code text-xs text-[#c8ff00]">003 · HOVER PHYSICS</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSpringMode((m) => (m === 'repel' ? 'attract' : 'repel'))}
                  className="font-mono-code text-[11px] text-[#f2f2f0] border border-[#f2f2f0]/20 px-2 py-1 hover:border-[#c8ff00] uppercase whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {springMode}
                </button>
                <button
                  type="button"
                  onClick={() => triggerSpringImpulse(STAGE_W / 2, STAGE_H / 2)}
                  className="inline-flex items-center gap-1 font-mono-code text-[11px] text-[#0a0a0a] bg-[#c8ff00] px-2.5 py-1 font-semibold hover:bg-[#f2f2f0] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Zap className="w-3 h-3" />
                  <span>IMPULSE</span>
                </button>
              </div>
            </div>

            <div
              data-cursor-precision="true"
              onMouseMove={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - r.left) / Math.max(1, r.width)) * STAGE_W;
                const y = ((e.clientY - r.top) / Math.max(1, r.height)) * STAGE_H;
                const now = performance.now();
                const sp = springPointerRef.current;
                const dt = Math.max(4, now - sp.lastT);
                sp.vx = clamp(((x - sp.lastX) / dt) * 18, -50, 50);
                sp.vy = clamp(((y - sp.lastY) / dt) * 18, -50, 50);
                sp.x = x;
                sp.y = y;
                sp.lastX = x;
                sp.lastY = y;
                sp.lastT = now;
                sp.active = true;
              }}
              onMouseLeave={() => {
                springPointerRef.current.active = false;
              }}
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - r.left) / Math.max(1, r.width)) * STAGE_W;
                const y = ((e.clientY - r.top) / Math.max(1, r.height)) * STAGE_H;
                triggerSpringImpulse(x, y);
              }}
              className="my-4 relative w-full h-36 bg-[#0a0a0a] border border-[#f2f2f0]/10 overflow-hidden cursor-crosshair"
            >
              <svg
                viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}
                className="w-full h-full block"
                aria-label="Interactive Hooke's law 2D spring physics lattice"
              >
                <circle
                  ref={springCursorCircleRef}
                  cx={STAGE_W / 2}
                  cy={STAGE_H / 2}
                  r="42"
                  fill="none"
                  stroke="#c8ff00"
                  strokeWidth="1"
                  strokeDasharray="2 4"
                  opacity="0"
                />

                <path
                  ref={springMeshPathRef}
                  d=""
                  fill="none"
                  stroke="rgba(200, 255, 0, 0.2)"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />

                {springNodesRef.current.map((node, idx) => (
                  <g key={idx}>
                    <line
                      ref={(el) => {
                        springForceVecRefs.current[idx] = el;
                      }}
                      x1={node.originX}
                      y1={node.originY}
                      x2={node.x}
                      y2={node.y}
                      stroke="#38bdf8"
                      strokeWidth="1"
                      opacity="0"
                    />
                    <circle
                      cx={node.originX}
                      cy={node.originY}
                      r="2.2"
                      fill="rgba(242, 242, 240, 0.3)"
                    />
                    <line
                      ref={(el) => {
                        springTetherRefs.current[idx] = el;
                      }}
                      x1={node.originX}
                      y1={node.originY}
                      x2={node.x}
                      y2={node.y}
                      stroke="rgba(242, 242, 240, 0.28)"
                      strokeWidth="1.5"
                    />
                    <g
                      ref={(el) => {
                        springGroupRefs.current[idx] = el;
                      }}
                      transform={`translate(${node.x}, ${node.y})`}
                    >
                      <circle
                        ref={(el) => {
                          springHaloRefs.current[idx] = el;
                        }}
                        r="14"
                        fill="#141413"
                        stroke="rgba(242, 242, 240, 0.35)"
                        strokeWidth="1.2"
                      />
                      <circle r="3.4" fill="#c8ff00" />
                      <text
                        y="-18"
                        textAnchor="middle"
                        fill="#8a8a86"
                        fontSize="8.5"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        N.0{idx + 1}
                      </text>
                    </g>
                  </g>
                ))}
              </svg>
            </div>

            <div className="flex items-center justify-between font-mono-code text-[11px] text-[#8a8a86]">
              <span>2D HOOKE SOLVER (K=170, C=13)</span>
              <span ref={springTensionSpanRef} className="text-[#c8ff00] tabular-nums">
                ΔE: 0
              </span>
            </div>
          </div>

          {/* EXP 004: 3D Spatial Depth Illusion */}
          <div
            data-cursor-precision="true"
            onMouseMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              const nx = ((e.clientX - r.left) / Math.max(1, r.width) - 0.5) * 2;
              const ny = ((e.clientY - r.top) / Math.max(1, r.height) - 0.5) * 2;
              tiltTargetRef.current = { x: nx, y: ny };
            }}
            onMouseLeave={() => {
              tiltTargetRef.current = { x: 0, y: 0 };
            }}
            className="bg-[#0e0e0d] p-6 flex flex-col justify-between min-h-[300px]"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono-code text-xs text-[#c8ff00]">004 · 3D DEPTH PLANES</span>
              <span className="font-mono-code text-[11px] text-[#8a8a86] tabular-nums">
                Z-STACK · 4 LAYERS
              </span>
            </div>

            <div className="relative my-auto h-36 flex items-center justify-center">
              {[1, 2, 3, 4].map((layer) => {
                const tx = tilt.x * layer * 9;
                const ty = tilt.y * layer * 7;
                const size = 140 - layer * 20;
                return (
                  <div
                    key={layer}
                    className="absolute border will-change-transform"
                    style={{
                      width: `${size * 1.4}px`,
                      height: `${size * 0.78}px`,
                      borderColor:
                        layer === 4 ? '#c8ff00' : `rgba(242, 242, 240, ${0.12 + layer * 0.08})`,
                      transform: `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0)`,
                    }}
                  />
                );
              })}
              <span className="relative z-10 font-mono-code text-xs text-[#c8ff00]">
                PARALLAX CORE
              </span>
            </div>

            <p className="font-mono-code text-[11px] text-[#8a8a86] tabular-nums">
              OFFSET X:{(tilt.x * 100).toFixed(0)} Y:{(tilt.y * 100).toFixed(0)}
            </p>
          </div>

          {/* EXP 005: Liquid Turbulence & Chromatic Dispersion Optics */}
          <div className="bg-[#0e0e0d] p-6 flex flex-col justify-between min-h-[300px]">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono-code text-xs text-[#c8ff00]">005 · LIQUID OPTICS</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setLiquidMode((m) =>
                      m === 'prism' ? 'wave' : m === 'wave' ? 'caustic' : 'prism'
                    )
                  }
                  className="font-mono-code text-[11px] text-[#f2f2f0] border border-[#f2f2f0]/20 px-2.5 py-1 hover:border-[#c8ff00] uppercase whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {liquidMode}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRippleBoost(26);
                    window.setTimeout(() => setRippleBoost(0), 420);
                  }}
                  className="font-mono-code text-[11px] text-[#0a0a0a] bg-[#c8ff00] px-2.5 py-1 font-semibold hover:bg-[#f2f2f0] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  SURGE
                </button>
              </div>
            </div>

            <div
              data-cursor-precision="true"
              onMouseMove={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                const nx = clamp((e.clientX - r.left) / Math.max(1, r.width), 0, 1);
                const ny = clamp((e.clientY - r.top) / Math.max(1, r.height), 0, 1);
                const now = performance.now();
                const dt = Math.max(8, now - liquidLastRef.current.t);
                const vx = ((nx - liquidLastRef.current.x) / dt) * 35;
                const vy = ((ny - liquidLastRef.current.y) / dt) * 35;
                liquidLastRef.current = { x: nx, y: ny, t: now };
                setLiquidPointer({ x: nx, y: ny, vx, vy, active: true });
              }}
              onMouseLeave={() =>
                setLiquidPointer((prev) => ({
                  ...prev,
                  vx: 0,
                  vy: 0,
                  active: false,
                }))
              }
              onClick={() => {
                setRippleBoost(28);
                window.setTimeout(() => setRippleBoost(0), 420);
              }}
              className="my-4 relative w-full h-36 bg-[#0a0a0a] border border-[#f2f2f0]/10 overflow-hidden cursor-crosshair"
            >
              <svg
                viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}
                className="w-full h-full block"
                aria-label="Interactive liquid optics and chromatic refraction filter"
              >
                <defs>
                  <filter id="liquidLabFilter" x="-20%" y="-20%" width="140%" height="140%">
                    <feTurbulence
                      ref={liquidTurbRef}
                      type={liquidMode === 'caustic' ? 'turbulence' : 'fractalNoise'}
                      baseFrequency="0.022 0.032"
                      numOctaves="1"
                      seed={liquidMode === 'prism' ? '4' : liquidMode === 'wave' ? '9' : '14'}
                      result="noise"
                    />
                    <feDisplacementMap
                      in="SourceGraphic"
                      in2="noise"
                      scale={activeDisplacementScale}
                      xChannelSelector="R"
                      yChannelSelector="G"
                    />
                  </filter>
                  <radialGradient
                    id="causticGlow"
                    cx={`${(liquidPointer.x * 100).toFixed(1)}%`}
                    cy={`${(liquidPointer.y * 100).toFixed(1)}%`}
                    r="50%"
                  >
                    <stop offset="0%" stopColor="#c8ff00" stopOpacity="0.28" />
                    <stop offset="55%" stopColor="#38bdf8" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#0a0a0a" stopOpacity="0" />
                  </radialGradient>
                </defs>

                <rect width={STAGE_W} height={STAGE_H} fill="url(#causticGlow)" />

                <g filter="url(#liquidLabFilter)">
                  <ellipse
                    cx={liquidPointer.x * STAGE_W}
                    cy={liquidPointer.y * STAGE_H}
                    rx="76"
                    ry="38"
                    fill="none"
                    stroke="rgba(56, 189, 248, 0.5)"
                    strokeWidth="1.2"
                  />
                  <ellipse
                    cx={STAGE_W * 0.5}
                    cy={STAGE_H * 0.5}
                    rx="132"
                    ry="54"
                    fill="none"
                    stroke="rgba(200, 255, 0, 0.6)"
                    strokeWidth="1.5"
                  />

                  <text
                    x={160 - Number(chromaOffsetX)}
                    y={86 - Number(chromaOffsetY)}
                    textAnchor="middle"
                    fill="#38bdf8"
                    fillOpacity="0.7"
                    fontSize="32"
                    fontWeight="800"
                    fontFamily="Bricolage Grotesque, sans-serif"
                  >
                    REFRACTION
                  </text>

                  <text
                    x={160 + Number(chromaOffsetX)}
                    y={86 + Number(chromaOffsetY)}
                    textAnchor="middle"
                    fill="#c8ff00"
                    fillOpacity="0.75"
                    fontSize="32"
                    fontWeight="800"
                    fontFamily="Bricolage Grotesque, sans-serif"
                  >
                    REFRACTION
                  </text>

                  <text
                    x="160"
                    y="86"
                    textAnchor="middle"
                    fill="#f2f2f0"
                    fontSize="32"
                    fontWeight="800"
                    fontFamily="Bricolage Grotesque, sans-serif"
                  >
                    REFRACTION
                  </text>
                </g>

                <circle
                  cx={liquidPointer.x * STAGE_W}
                  cy={liquidPointer.y * STAGE_H}
                  r="22"
                  fill="none"
                  stroke="#c8ff00"
                  strokeOpacity={liquidPointer.active ? '0.85' : '0.25'}
                  strokeWidth="1"
                  strokeDasharray="4 3"
                />
              </svg>
            </div>

            <div className="flex items-center justify-between font-mono-code text-[11px] text-[#8a8a86] tabular-nums">
              <span>CHROMATIC CAUSTICS · {liquidMode.toUpperCase()}</span>
              <span className="text-[#c8ff00]">DISP: {activeDisplacementScale}PX</span>
            </div>
          </div>

          {/* EXP 006: Chronophotograph Geometric Echo & Voxel Wake Trails (New Theme!) */}
          <div className="bg-[#0e0e0d] p-6 flex flex-col justify-between min-h-[300px]">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono-code text-xs text-[#c8ff00]">006 · KINETIC ECHOES</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setTrailTheme((t) =>
                      t === 'echo' ? 'voxel' : t === 'voxel' ? 'shards' : 'echo'
                    )
                  }
                  className="font-mono-code text-[11px] text-[#f2f2f0] border border-[#f2f2f0]/20 px-2.5 py-1 hover:border-[#c8ff00] uppercase whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {trailTheme}
                </button>
                <span className="font-mono-code text-[11px] text-[#c8ff00] tabular-nums min-w-[54px] text-right">
                  {velocityReadout} PX/S
                </span>
              </div>
            </div>

            <div
              data-cursor-precision="true"
              onMouseMove={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - r.left) / Math.max(1, r.width)) * STAGE_W;
                const y = ((e.clientY - r.top) / Math.max(1, r.height)) * STAGE_H;
                const now = performance.now();
                const tp = trailPointerRef.current;
                const dt = Math.max(4, now - tp.lastT);
                const dx = x - tp.lastX;
                const dy = y - tp.lastY;
                const dist = Math.hypot(dx, dy);
                setVelocityReadout(Math.min(5400, Math.round((dist / dt) * 1000)));

                tp.vx = dx;
                tp.vy = dy;
                tp.x = x;
                tp.y = y;
                tp.lastX = x;
                tp.lastY = y;
                tp.lastT = now;
                tp.active = true;

                if (dist > 2.5) {
                  spawnEchoParticle(x, y, dx, dy, false);
                }
              }}
              onMouseLeave={() => {
                trailPointerRef.current.active = false;
                setVelocityReadout(0);
              }}
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - r.left) / Math.max(1, r.width)) * STAGE_W;
                const y = ((e.clientY - r.top) / Math.max(1, r.height)) * STAGE_H;
                spawnEchoParticle(x, y, 0, 0, true);
              }}
              className="my-4 relative w-full h-36 bg-[#0a0a0a] border border-[#f2f2f0]/10 overflow-hidden cursor-crosshair"
            >
              <canvas
                ref={trailCanvasRef}
                width={STAGE_W}
                height={STAGE_H}
                className="w-full h-full block"
                aria-label="Interactive chronophotograph frame echoes and voxel wake canvas"
              />
            </div>

            <div className="flex items-center justify-between font-mono-code text-[11px] text-[#8a8a86]">
              <span>CHRONOPHOTOGRAPH WAKE · {trailTheme.toUpperCase()}</span>
              <span className="text-[#f2f2f0]/70">CLICK TO BURST</span>
            </div>
          </div>

          {/* EXP 007: Scrolling / Interactive Number Counter */}
          <div
            onWheel={(e) => {
              setCounterVal((v) => Math.max(0, v + (e.deltaY > 0 ? 64 : -64)));
            }}
            className="bg-[#0e0e0d] p-6 flex flex-col justify-between min-h-[300px]"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono-code text-xs text-[#c8ff00]">007 · KINETIC COUNTER</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCounterVal((v) => v + 256)}
                  className="font-mono-code text-[11px] text-[#f2f2f0] border border-[#f2f2f0]/20 px-2.5 py-1 hover:border-[#c8ff00] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  +256
                </button>
                <button
                  type="button"
                  onClick={() => setCounterVal((v) => (v * 3 + 1024) % 99999)}
                  className="font-mono-code text-[11px] text-[#0a0a0a] bg-[#c8ff00] px-2.5 py-1 font-semibold hover:bg-[#f2f2f0] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  STEP
                </button>
              </div>
            </div>

            <div className="my-auto py-4">
              <p className="font-display text-5xl sm:text-6xl font-extrabold tracking-tight text-[#f2f2f0] tabular-nums">
                {counterVal.toString().padStart(5, '0')}
              </p>
              <p className="mt-2 font-mono-code text-xs text-[#c8ff00]">
                HEX · 0x{counterVal.toString(16).toUpperCase().padStart(4, '0')}
              </p>
            </div>

            <p className="font-mono-code text-[11px] text-[#8a8a86]">
              TABULAR REGISTER · SCROLL OR CLICK TO STEP
            </p>
          </div>

          {/* EXP 008: Multi-Pole Chromatic Topography & Interference Shader (Upgraded!) */}
          <div className="bg-[#0e0e0d] p-6 flex flex-col justify-between min-h-[300px]">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono-code text-xs text-[#c8ff00]">008 · CHROMATIC FIELD</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setGradientPalette((p) =>
                      p === 'acid' ? 'infrared' : p === 'infrared' ? 'aurora' : 'acid'
                    )
                  }
                  className="inline-flex items-center gap-1 font-mono-code text-[11px] text-[#f2f2f0] border border-[#f2f2f0]/20 px-2.5 py-1 hover:border-[#c8ff00] uppercase whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-[#c8ff00]" />
                  <span>{gradientPalette}</span>
                </button>
              </div>
            </div>

            <div
              data-cursor-precision="true"
              onMouseMove={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                const nx = clamp((e.clientX - r.left) / Math.max(1, r.width), 0, 1);
                const ny = clamp((e.clientY - r.top) / Math.max(1, r.height), 0, 1);
                gradientPointerRef.current.x = nx * STAGE_W;
                gradientPointerRef.current.y = ny * STAGE_H;
                gradientPointerRef.current.active = true;
                setGradReadout({
                  x: Math.round(nx * 100),
                  y: Math.round(ny * 100),
                  nm: Math.round(440 + nx * 180 + ny * 40),
                });
              }}
              onMouseLeave={() => {
                gradientPointerRef.current.active = false;
              }}
              onClick={() => {
                gradientPointerRef.current.pulse = 1.0;
              }}
              className="my-4 relative w-full h-36 bg-[#0a0a0a] border border-[#f2f2f0]/15 overflow-hidden cursor-crosshair"
            >
              <canvas
                ref={gradientCanvasRef}
                width={STAGE_W}
                height={STAGE_H}
                className="w-full h-full block"
                aria-label="Interactive multi-pole chromatic topography shader canvas"
              />
            </div>

            <div className="flex items-center justify-between font-mono-code text-[11px] text-[#8a8a86] tabular-nums">
              <span>DIPOLE ISO-CONTOURS · {gradReadout.nm}NM</span>
              <span className="text-[#c8ff00]">
                {gradReadout.x}% · {gradReadout.y}%
              </span>
            </div>
          </div>

          {/* EXP 009: Procedural Acoustic Synth Matrix (Muted by Default) */}
          <div className="bg-[#0e0e0d] p-6 flex flex-col justify-between min-h-[300px]">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono-code text-xs text-[#c8ff00]">009 · HARMONIC PULSE</span>
              <button
                type="button"
                onClick={() => setSoundEnabled((s) => !s)}
                aria-pressed={soundEnabled}
                className={`inline-flex items-center gap-1.5 font-mono-code text-[11px] px-2.5 py-1 border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  soundEnabled
                    ? 'bg-[#c8ff00] text-[#0a0a0a] border-[#c8ff00] font-semibold'
                    : 'text-[#8a8a86] border-[#f2f2f0]/20 hover:text-[#f2f2f0]'
                }`}
              >
                {soundEnabled ? (
                  <Volume2 className="w-3.5 h-3.5" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5" />
                )}
                <span>{soundEnabled ? 'AUDIO ON' : 'MUTED'}</span>
              </button>
            </div>

            <div className="my-auto space-y-3 py-4">
              <div className="grid grid-cols-4 gap-2">
                {[110, 220, 330, 440].map((freq) => {
                  const isCurrent = activeFreq === freq;
                  return (
                    <button
                      key={freq}
                      type="button"
                      onClick={() => triggerSynthNote(freq)}
                      className={`py-3 font-mono-code text-xs border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        isCurrent
                          ? 'border-[#c8ff00] bg-[#c8ff00]/15 text-[#c8ff00]'
                          : 'border-[#f2f2f0]/15 text-[#f2f2f0] hover:border-[#f2f2f0]/50'
                      }`}
                    >
                      {freq}Hz
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center justify-between font-mono-code text-xs text-[#8a8a86] pt-2">
                <span>RESONANCE WAVE #{pulseRingKey}</span>
                <span className="text-[#c8ff00] tabular-nums">{activeFreq} HZ SINE</span>
              </div>
            </div>

            <p className="font-mono-code text-[11px] text-[#8a8a86]">
              OPTIONAL WEBAUDIO OSCILLATOR (MUTED DEFAULT)
            </p>
          </div>
        </div>
      </div>
    </section>
  );
});
