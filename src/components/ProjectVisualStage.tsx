import React, { useEffect, useRef } from 'react';
import { PortfolioProject } from '../data/portfolioData';
import { clamp, stepUnderdampedSpring } from '../utils/motionMath';

interface ProjectVisualStageProps {
  project: PortfolioProject;
  isActive: boolean;
  shouldAnimate?: boolean;
  parallaxX: number;
}

interface IsoProjectile {
  u: number; // Isometric coordinate [-1, 1]
  v: number; // Isometric coordinate [-1, 1]
  vu: number;
  vv: number;
  trail: { u: number; v: number }[];
  color: string;
}

interface ArenaBurst {
  x: number;
  y: number;
  r: number;
  maxR: number;
  alpha: number;
  color: string;
}

interface ArenaSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
}

interface NusadanaNodeDef {
  id: string;
  nx: number; // safe normalized [0.14 .. 0.86]
  ny: number; // safe normalized [0.22 .. 0.78]
  name: string;
  val: string;
  tier: string;
  anchor: 'top' | 'bottom' | 'left' | 'right';
}

const NUSADANA_NODES: NusadanaNodeDef[] = [
  {
    id: 'sumatra',
    nx: 0.16,
    ny: 0.36,
    name: 'SUMATRA CO-OP',
    val: 'IDR 1.4B',
    tier: 'AGRI',
    anchor: 'top',
  },
  {
    id: 'jakarta',
    nx: 0.31,
    ny: 0.62,
    name: 'JAKARTA CORE HUB',
    val: 'IDR 4.8B',
    tier: 'LIQUIDITY',
    anchor: 'left',
  },
  {
    id: 'bandung',
    nx: 0.43,
    ny: 0.76,
    name: 'WEST JAVA TEXTILE',
    val: 'IDR 2.3B',
    tier: 'MFG',
    anchor: 'bottom',
  },
  {
    id: 'kalimantan',
    nx: 0.48,
    ny: 0.28,
    name: 'KALIMANTAN TIMBER',
    val: 'IDR 2.1B',
    tier: 'SUPPLY',
    anchor: 'top',
  },
  {
    id: 'surabaya',
    nx: 0.62,
    ny: 0.64,
    name: 'SURABAYA · BALI',
    val: 'IDR 3.6B',
    tier: 'TRADE',
    anchor: 'bottom',
  },
  {
    id: 'sulawesi',
    nx: 0.71,
    ny: 0.34,
    name: 'SULAWESI MARITIME',
    val: 'IDR 1.9B',
    tier: 'PORT',
    anchor: 'top',
  },
  {
    id: 'maluku',
    nx: 0.85,
    ny: 0.52,
    name: 'MALUKU SPICE NET',
    val: 'IDR 0.9B',
    tier: 'EXPORT',
    anchor: 'left',
  },
];

const NUSADANA_EDGES: [number, number][] = [
  [0, 1],
  [0, 3],
  [1, 2],
  [1, 3],
  [1, 4],
  [2, 4],
  [3, 4],
  [3, 5],
  [4, 5],
  [4, 6],
  [5, 6],
];

const ARCHIPELAGO_BLOBS = [
  { nx: 0.16, ny: 0.37, rx: 0.08, ry: 0.04, rot: 0.55 },
  { nx: 0.42, ny: 0.68, rx: 0.16, ry: 0.032, rot: 0.08 },
  { nx: 0.48, ny: 0.31, rx: 0.085, ry: 0.065, rot: -0.15 },
  { nx: 0.71, ny: 0.36, rx: 0.065, ry: 0.055, rot: 0.3 },
  { nx: 0.85, ny: 0.52, rx: 0.05, ry: 0.035, rot: -0.2 },
];

export const ProjectVisualStage: React.FC<ProjectVisualStageProps> = React.memo(
  ({ project, isActive, shouldAnimate }) => {
    const animateEnabled = shouldAnimate ?? isActive;
    const animateRef = useRef<boolean>(animateEnabled);
    animateRef.current = animateEnabled;

    const containerRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const hudCoordSpanRef = useRef<HTMLSpanElement | null>(null);
    const renderOnceRef = useRef<(() => void) | null>(null);
    const startLoopRef = useRef<(() => void) | null>(null);

    const sizeRef = useRef<{ w: number; h: number; dpr: number; dirty: boolean }>({
      w: 760,
      h: 440,
      dpr: 1,
      dirty: true,
    });

    const pointerRef = useRef<{
      normX: number;
      normY: number;
      smoothX: number;
      smoothY: number;
      vx: number;
      vy: number;
      active: boolean;
      pulse: number;
    }>({
      normX: 0.5,
      normY: 0.5,
      smoothX: 0.5,
      smoothY: 0.5,
      vx: 0,
      vy: 0,
      active: false,
      pulse: 0,
    });

    // Cache container dimensions on mount, window resize, and ResizeObserver (with immediate synchronous repaint)
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const measureContainer = () => {
        const cw = Math.max(300, container.clientWidth || 760);
        const ch = Math.max(260, container.clientHeight || 440);
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        sizeRef.current = { w: cw, h: ch, dpr, dirty: true };
        if (renderOnceRef.current) {
          renderOnceRef.current();
        }
      };

      measureContainer();
      window.addEventListener('resize', measureContainer, { passive: true });

      let ro: ResizeObserver | null = null;
      if (typeof ResizeObserver !== 'undefined') {
        ro = new ResizeObserver(() => {
          measureContainer();
        });
        ro.observe(container);
      }

      return () => {
        window.removeEventListener('resize', measureContainer);
        if (ro) ro.disconnect();
      };
    }, []);

    useEffect(() => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) return;

      let rafId = 0;
      const startTime = performance.now();
      let lastTime = startTime;

      const isoPillars = [
        { u: -0.26, v: -0.18, r: 0.16, height: 24 },
        { u: 0.28, v: 0.22, r: 0.16, height: 24 },
        { u: -0.18, v: 0.36, r: 0.13, height: 18 },
      ];

      const projectiles: IsoProjectile[] = [
        {
          u: -0.55,
          v: 0.05,
          vu: 0.88,
          vv: -0.64,
          trail: [],
          color: '#c8ff00',
        },
        {
          u: 0.52,
          v: -0.25,
          vu: -0.78,
          vv: 0.72,
          trail: [],
          color: '#38bdf8',
        },
        {
          u: 0.05,
          v: -0.62,
          vu: 0.62,
          vv: 0.84,
          trail: [],
          color: '#f59e0b',
        },
      ];
      const bursts: ArenaBurst[] = [];
      const sparks: ArenaSpark[] = [];

      const motes = Array.from({ length: 22 }, (_, idx) => ({
        x: ((idx * 37) % 100) / 100,
        y: ((idx * 61) % 100) / 100,
        speed: 0.04 + (idx % 5) * 0.015,
        size: 1 + (idx % 3) * 0.7,
      }));

      const renderFrame = (now: number) => {
        const dt = Math.min(0.033, Math.max(0.004, (now - lastTime) * 0.001));
        lastTime = now;
        const elapsed = (now - startTime) * 0.001;

        if (sizeRef.current.dirty) {
          const cw = Math.max(300, container.clientWidth || sizeRef.current.w || 760);
          const ch = Math.max(260, container.clientHeight || sizeRef.current.h || 440);
          const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
          const targetBufW = Math.round(cw * dpr);
          const targetBufH = Math.round(ch * dpr);
          if (canvas.width !== targetBufW || canvas.height !== targetBufH) {
            canvas.width = Math.max(300, targetBufW);
            canvas.height = Math.max(260, targetBufH);
          }
          sizeRef.current = { w: cw, h: ch, dpr, dirty: false };
        }

        const { w: rawW, h: rawH, dpr } = sizeRef.current;
        const w = Math.max(300, rawW);
        const h = Math.max(260, rawH);

        ctx.save();
        ctx.scale(dpr, dpr);

        const ptr = pointerRef.current;
        const targetNormX = ptr.active
          ? ptr.normX
          : 0.5 + Math.cos(elapsed * 0.9) * 0.18;
        const targetNormY = ptr.active
          ? ptr.normY
          : 0.5 + Math.sin(elapsed * 1.1) * 0.14;
        const sx = stepUnderdampedSpring(ptr.smoothX, ptr.vx, targetNormX, dt, 120, 13.5);
        const sy = stepUnderdampedSpring(ptr.smoothY, ptr.vy, targetNormY, dt, 120, 13.5);
        ptr.smoothX = clamp(sx.value, 0.02, 0.98);
        ptr.smoothY = clamp(sy.value, 0.02, 0.98);
        ptr.vx = sx.velocity;
        ptr.vy = sy.velocity;

        try {

        if (ptr.pulse > 0) {
          ptr.pulse = Math.max(0, ptr.pulse - dt * 1.8);
        }

        // ========================================================================
        // MODE 1: SILENT ROAD — Volumetric Night Highway & Binaural Ray-Tracing
        // ========================================================================
        if (project.visualMode === 'horror-fog') {
          ctx.fillStyle = '#070706';
          ctx.fillRect(0, 0, w, h);

          const horizonY = h * 0.41 + (ptr.smoothY - 0.5) * 24;
          const vanishX = w * 0.5 + (ptr.smoothX - 0.5) * (w * 0.18);

          const skyGrad = ctx.createRadialGradient(
            vanishX,
            horizonY,
            6,
            vanishX,
            horizonY,
            w * 0.52
          );
          skyGrad.addColorStop(0, `rgba(245, 158, 11, ${0.34 + ptr.pulse * 0.22})`);
          skyGrad.addColorStop(0.38, 'rgba(180, 83, 9, 0.12)');
          skyGrad.addColorStop(0.75, 'rgba(20, 16, 12, 0.04)');
          skyGrad.addColorStop(1, 'rgba(7, 7, 6, 0)');
          ctx.fillStyle = skyGrad;
          ctx.fillRect(0, 0, w, h);

          ctx.fillStyle = '#0b0a09';
          ctx.beginPath();
          ctx.moveTo(0, horizonY + 6);
          for (let x = 0; x <= w; x += 28) {
            const ridge =
              Math.sin(x * 0.008 + 1.1) * 24 +
              Math.cos(x * 0.021 - 0.4) * 11 +
              Math.sin(x * 0.06) * 4;
            ctx.lineTo(x, horizonY - 12 - ridge);
          }
          ctx.lineTo(w, h);
          ctx.lineTo(0, h);
          ctx.closePath();
          ctx.fill();

          const roadLeftBottom = w * 0.06;
          const roadRightBottom = w * 0.94;
          const roadTopHalfWidth = 14;

          const roadGrad = ctx.createLinearGradient(0, horizonY, 0, h);
          roadGrad.addColorStop(0, '#0b0a09');
          roadGrad.addColorStop(0.4, '#121110');
          roadGrad.addColorStop(1, '#181614');
          ctx.fillStyle = roadGrad;
          ctx.beginPath();
          ctx.moveTo(vanishX - roadTopHalfWidth, horizonY);
          ctx.lineTo(vanishX + roadTopHalfWidth, horizonY);
          ctx.lineTo(roadRightBottom, h);
          ctx.lineTo(roadLeftBottom, h);
          ctx.closePath();
          ctx.fill();

          const shoulderGradL = ctx.createLinearGradient(
            vanishX - roadTopHalfWidth,
            horizonY,
            roadLeftBottom,
            h
          );
          shoulderGradL.addColorStop(0, 'rgba(245, 158, 11, 0)');
          shoulderGradL.addColorStop(0.25, 'rgba(245, 158, 11, 0.25)');
          shoulderGradL.addColorStop(1, 'rgba(245, 158, 11, 0.5)');
          ctx.strokeStyle = shoulderGradL;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(vanishX - roadTopHalfWidth, horizonY);
          ctx.lineTo(roadLeftBottom, h);
          ctx.moveTo(vanishX + roadTopHalfWidth, horizonY);
          ctx.lineTo(roadRightBottom, h);
          ctx.stroke();

          const speed = 0.42;
          const segmentCount = 8;
          for (let i = 0; i < segmentCount; i++) {
            const rawT = ((i / segmentCount) + elapsed * speed) % 1;
            const z = rawT * rawT;
            const nextRawT = Math.min(1, rawT + 0.055);
            const nextZ = nextRawT * nextRawT;

            const horizonFade = clamp(rawT / 0.22, 0, 1) * clamp((1 - rawT) / 0.08, 0, 1);

            const y1 = horizonY + z * (h - horizonY);
            const y2 = horizonY + nextZ * (h - horizonY);
            const x1 = vanishX + (w * 0.5 - vanishX) * z;
            const x2 = vanishX + (w * 0.5 - vanishX) * nextZ;

            ctx.strokeStyle = `rgba(245, 158, 11, ${(horizonFade * (0.2 + z * 0.75)).toFixed(2)})`;
            ctx.lineWidth = 1 + z * 4.2;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();

            const leftEdgeX =
              vanishX - roadTopHalfWidth + (roadLeftBottom - (vanishX - roadTopHalfWidth)) * z;
            const rightEdgeX =
              vanishX + roadTopHalfWidth + (roadRightBottom - (vanishX + roadTopHalfWidth)) * z;

            const poleX = leftEdgeX - 16 * z;
            const poleH = 148 * z;
            const lampX = poleX + 26 * z;
            const lampY = y1 - poleH + 5 * z;

            if (z > 0.03) {
              const poleAlpha = horizonFade * Math.min(1, z * 1.4);

              ctx.strokeStyle = `rgba(140, 132, 124, ${(poleAlpha * 0.65).toFixed(2)})`;
              ctx.lineWidth = Math.max(1, z * 2.8);
              ctx.beginPath();
              ctx.moveTo(poleX, y1);
              ctx.lineTo(poleX, y1 - poleH);
              ctx.lineTo(lampX, lampY);
              ctx.stroke();

              // Fast soft sodium halo circle
              ctx.fillStyle = `rgba(245, 158, 11, ${(poleAlpha * 0.16).toFixed(2)})`;
              ctx.beginPath();
              ctx.arc(lampX, lampY + 12 * z, 28 * z, 0, Math.PI * 2);
              ctx.fill();

              ctx.fillStyle = `rgba(254, 243, 199, ${(poleAlpha * 0.95).toFixed(2)})`;
              ctx.beginPath();
              ctx.arc(lampX, lampY, Math.max(1.2, 3.6 * z), 0, Math.PI * 2);
              ctx.fill();

              ctx.fillStyle = `rgba(245, 158, 11, ${(poleAlpha * 0.18).toFixed(2)})`;
              ctx.fillRect(lampX - 2 * z, y1 - 2 * z, 4 * z, 18 * z);

              const postX = rightEdgeX + 12 * z;
              const postH = 26 * z;
              ctx.strokeStyle = `rgba(120, 113, 108, ${(poleAlpha * 0.55).toFixed(2)})`;
              ctx.lineWidth = Math.max(1, z * 2.2);
              ctx.beginPath();
              ctx.moveTo(postX, y1);
              ctx.lineTo(postX, y1 - postH);
              ctx.stroke();

              ctx.fillStyle = `rgba(200, 255, 0, ${(poleAlpha * 0.85).toFixed(2)})`;
              ctx.beginPath();
              ctx.arc(postX, y1 - postH * 0.82, Math.max(1, 2.4 * z), 0, Math.PI * 2);
              ctx.fill();
            }
          }

          // Interactive Volumetric Headlight Cone & Illuminated Dust Motes
          const beamX = ptr.smoothX * w;
          const beamY = ptr.smoothY * h;
          const beamGrad = ctx.createRadialGradient(beamX, beamY, 8, beamX, beamY, w * 0.34);
          beamGrad.addColorStop(0, `rgba(200, 255, 0, ${0.18 + ptr.pulse * 0.15})`);
          beamGrad.addColorStop(0.45, 'rgba(245, 158, 11, 0.08)');
          beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = beamGrad;
          ctx.fillRect(0, 0, w, h);

          motes.forEach((m, idx) => {
            const mx = ((m.x + elapsed * m.speed * 0.25 + Math.sin(elapsed + idx) * 0.02) % 1) * w;
            const my = ((m.y + elapsed * m.speed * 0.15) % 1) * h;
            const distToBeam = Math.hypot(mx - beamX, my - beamY);
            const lum = clamp(1 - distToBeam / (w * 0.32), 0.08, 0.9);
            ctx.fillStyle =
              idx % 3 === 0
                ? `rgba(200, 255, 0, ${(lum * 0.7).toFixed(2)})`
                : `rgba(253, 230, 138, ${(lum * 0.55).toFixed(2)})`;
            ctx.beginPath();
            ctx.arc(mx, my, m.size, 0, Math.PI * 2);
            ctx.fill();
          });

          const hudX = 20;
          const hudY = 18;
          const hudW = 204;
          const hudH = 54;
          ctx.fillStyle = 'rgba(10, 10, 10, 0.84)';
          ctx.strokeStyle = 'rgba(242, 242, 240, 0.16)';
          ctx.lineWidth = 1;
          ctx.fillRect(hudX, hudY, hudW, hudH);
          ctx.strokeRect(hudX, hudY, hudW, hudH);

          ctx.fillStyle = '#c8ff00';
          ctx.font = '600 9.5px "JetBrains Mono", monospace';
          ctx.fillText('HRTF BINAURAL SPECTRUM', hudX + 10, hudY + 15);

          for (let b = 0; b < 24; b++) {
            const wave = Math.abs(
              Math.sin(elapsed * 5.8 + b * 0.42 + ptr.smoothX * 3) *
                Math.cos(elapsed * 3.1 - b * 0.22)
            );
            const barH = 3 + wave * (18 + ptr.pulse * 10);
            ctx.fillStyle = b % 3 === 0 ? '#c8ff00' : '#f59e0b';
            ctx.fillRect(hudX + 10 + b * 7.6, hudY + 46 - barH, 4.5, barH);
          }
        }

        // ========================================================================
        // MODE 2: SNOWBALL — True Isometric Diamond Ricochet & Bumper Physics
        // ========================================================================
        else if (project.visualMode === 'snowball-arena') {
          ctx.fillStyle = '#070b10';
          ctx.fillRect(0, 0, w, h);

          const centerX = w * 0.5;
          const centerY = h * 0.49;
          const isoRx = w * 0.41;
          const isoRy = h * 0.39;

          const isoToScreen = (u: number, v: number) => ({
            x: centerX + (u + v) * 0.5 * isoRx,
            y: centerY + (u - v) * 0.5 * isoRy,
          });

          const screenToIso = (sx: number, sy: number) => {
            const dx = (sx - centerX) / Math.max(1, isoRx);
            const dy = (sy - centerY) / Math.max(1, isoRy);
            return {
              u: dx + dy,
              v: dx - dy,
            };
          };

          const cTop = isoToScreen(-1, 1);
          const cRight = isoToScreen(1, 1);
          const cBottom = isoToScreen(1, -1);
          const cLeft = isoToScreen(-1, -1);

          ctx.fillStyle = '#0c1520';
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.32)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(cTop.x, cTop.y);
          ctx.lineTo(cRight.x, cRight.y);
          ctx.lineTo(cBottom.x, cBottom.y);
          ctx.lineTo(cLeft.x, cLeft.y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          for (let g = -0.6; g <= 0.61; g += 0.4) {
            const a1 = isoToScreen(g, -1);
            const a2 = isoToScreen(g, 1);
            const b1 = isoToScreen(-1, g);
            const b2 = isoToScreen(1, g);
            ctx.moveTo(a1.x, a1.y);
            ctx.lineTo(a2.x, a2.y);
            ctx.moveTo(b1.x, b1.y);
            ctx.lineTo(b2.x, b2.y);
          }
          ctx.stroke();

          const strikerIso = { u: -0.68, v: -0.58 };
          const strikerScreen = isoToScreen(strikerIso.u, strikerIso.v);
          const ptrScreenX = ptr.smoothX * w;
          const ptrScreenY = ptr.smoothY * h;
          const ptrIsoRaw = screenToIso(ptrScreenX, ptrScreenY);
          const targetIso = {
            u: clamp(ptrIsoRaw.u, -0.9, 0.9),
            v: clamp(ptrIsoRaw.v, -0.9, 0.9),
          };
          const targetScreen = isoToScreen(targetIso.u, targetIso.v);

          ctx.strokeStyle = 'rgba(200, 255, 0, 0.38)';
          ctx.setLineDash([5, 5]);
          ctx.lineWidth = 1.25;
          ctx.beginPath();
          ctx.moveTo(strikerScreen.x, strikerScreen.y);
          ctx.lineTo(targetScreen.x, targetScreen.y);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = '#f2f2f0';
          ctx.beginPath();
          ctx.arc(strikerScreen.x, strikerScreen.y, 5.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#c8ff00';
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.arc(targetScreen.x, targetScreen.y, 9 + ptr.pulse * 5, 0, Math.PI * 2);
          ctx.stroke();

          if (ptr.pulse > 0.92) {
            const du = targetIso.u - strikerIso.u;
            const dv = targetIso.v - strikerIso.v;
            const len = Math.max(0.01, Math.hypot(du, dv));
            projectiles.push({
              u: strikerIso.u,
              v: strikerIso.v,
              vu: (du / len) * 1.15,
              vv: (dv / len) * 1.15,
              trail: [],
              color: projectiles.length % 2 === 0 ? '#c8ff00' : '#38bdf8',
            });
            if (projectiles.length > 5) projectiles.shift();
            ptr.pulse = 0.85;
          }

          isoPillars.forEach((pil) => {
            const pos = isoToScreen(pil.u, pil.v);
            const rx = Math.max(2, pil.r * isoRx * 0.52);
            const ry = Math.max(2, pil.r * isoRy * 0.52);
            const hOff = Math.max(4, pil.height);

            ctx.fillStyle = 'rgba(2, 6, 12, 0.55)';
            ctx.beginPath();
            ctx.ellipse(pos.x, pos.y + 3, rx * 1.12, ry * 1.12, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#0284c7';
            ctx.beginPath();
            ctx.ellipse(pos.x, pos.y, rx, ry, 0, 0, Math.PI);
            ctx.lineTo(pos.x - rx, pos.y - hOff);
            ctx.ellipse(pos.x, pos.y - hOff, rx, ry, 0, Math.PI, 0, true);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#e0f2fe';
            ctx.strokeStyle = '#7dd3fc';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.ellipse(pos.x, pos.y - hOff, rx, ry, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          });

          const wallBound = 0.92;
          const ballIsoR = 0.035;

          const spawnImpact = (u: number, v: number, color: string) => {
            const sc = isoToScreen(u, v);
            if (bursts.length < 8) {
              bursts.push({ x: sc.x, y: sc.y, r: 4, maxR: 24, alpha: 0.95, color });
            }
            if (sparks.length < 24) {
              for (let s = 0; s < 3; s++) {
                const ang = (Math.PI * 2 * s) / 3 + elapsed;
                sparks.push({
                  x: sc.x,
                  y: sc.y,
                  vx: Math.cos(ang) * 55,
                  vy: Math.sin(ang) * 55,
                  alpha: 1,
                  color,
                });
              }
            }
          };

          projectiles.forEach((p) => {
            p.trail.push({ u: p.u, v: p.v });
            if (p.trail.length > 16) p.trail.shift();

            p.u += p.vu * dt;
            p.v += p.vv * dt;

            if (p.u <= -wallBound) {
              p.u = -wallBound;
              p.vu = Math.abs(p.vu);
              spawnImpact(p.u, p.v, p.color);
            } else if (p.u >= wallBound) {
              p.u = wallBound;
              p.vu = -Math.abs(p.vu);
              spawnImpact(p.u, p.v, p.color);
            }

            if (p.v <= -wallBound) {
              p.v = -wallBound;
              p.vv = Math.abs(p.vv);
              spawnImpact(p.u, p.v, p.color);
            } else if (p.v >= wallBound) {
              p.v = wallBound;
              p.vv = -Math.abs(p.vv);
              spawnImpact(p.u, p.v, p.color);
            }

            isoPillars.forEach((pil) => {
              const du = p.u - pil.u;
              const dv = p.v - pil.v;
              const dist = Math.hypot(du, dv);
              const minSep = pil.r + ballIsoR;
              if (dist < minSep) {
                const nx = dist > 1e-4 ? du / dist : 1;
                const ny = dist > 1e-4 ? dv / dist : 0;
                p.u = pil.u + nx * (minSep + 0.005);
                p.v = pil.v + ny * (minSep + 0.005);
                const dot = p.vu * nx + p.vv * ny;
                if (dot < 0) {
                  p.vu -= 2 * dot * nx;
                  p.vv -= 2 * dot * ny;
                }
                spawnImpact(p.u, p.v, p.color);
              }
            });

            if (p.trail.length > 2) {
              ctx.strokeStyle = p.color;
              ctx.lineWidth = 2.0;
              ctx.beginPath();
              const startPt = isoToScreen(p.trail[0].u, p.trail[0].v);
              ctx.moveTo(startPt.x, startPt.y);
              for (let t = 1; t < p.trail.length; t++) {
                const pt = isoToScreen(p.trail[t].u, p.trail[t].v);
                ctx.lineTo(pt.x, pt.y);
              }
              ctx.stroke();
            }

            const headPos = isoToScreen(p.u, p.v);
            ctx.fillStyle = '#f2f2f0';
            ctx.beginPath();
            ctx.arc(headPos.x, headPos.y, 4.5, 0, Math.PI * 2);
            ctx.fill();
          });

          for (let i = bursts.length - 1; i >= 0; i--) {
            const b = bursts[i];
            b.r += 48 * dt;
            b.alpha -= 2.2 * dt;
            if (b.alpha <= 0) {
              bursts.splice(i, 1);
              continue;
            }
            ctx.strokeStyle = b.color;
            ctx.globalAlpha = b.alpha;
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }

          for (let i = sparks.length - 1; i >= 0; i--) {
            const sp = sparks[i];
            sp.x += sp.vx * dt;
            sp.y += sp.vy * dt;
            sp.alpha -= 2.6 * dt;
            if (sp.alpha <= 0) {
              sparks.splice(i, 1);
              continue;
            }
            ctx.fillStyle = sp.color;
            ctx.globalAlpha = sp.alpha;
            ctx.fillRect(sp.x - 1.5, sp.y - 1.5, 3, 3);
            ctx.globalAlpha = 1;
          }
        }

        // ========================================================================
        // MODE 3: NUSADANA — Archipelago UMKM Liquidity Topology (Zero Overlap!)
        // ========================================================================
        else if (project.visualMode === 'nusadana-graph') {
          ctx.fillStyle = '#070908';
          ctx.fillRect(0, 0, w, h);

          ctx.strokeStyle = 'rgba(200, 255, 0, 0.045)';
          ctx.lineWidth = 1;
          const gridStepX = w / 8;
          const gridStepY = h / 6;
          ctx.beginPath();
          for (let x = gridStepX; x < w; x += gridStepX) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
          }
          for (let y = gridStepY; y < h; y += gridStepY) {
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
          }
          ctx.stroke();

          ARCHIPELAGO_BLOBS.forEach((isl) => {
            ctx.save();
            ctx.translate(isl.nx * w, isl.ny * h);
            ctx.rotate(isl.rot);
            ctx.fillStyle = 'rgba(16, 185, 129, 0.04)';
            ctx.strokeStyle = 'rgba(200, 255, 0, 0.08)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.ellipse(0, 0, isl.rx * w, isl.ry * h, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          });

          const ptrX = ptr.smoothX * w;
          const ptrY = ptr.smoothY * h;

          const liveNodes = NUSADANA_NODES.map((n, idx) => {
            const baseX = n.nx * w;
            const baseY = n.ny * h;
            const waveX = Math.cos(elapsed * 1.2 + idx * 1.1) * 3.5;
            const waveY = Math.sin(elapsed * 1.5 + idx * 0.9) * 3.0;
            const dx = ptrX - baseX;
            const dy = ptrY - baseY;
            const dist = Math.hypot(dx, dy);
            const pull = ptr.active && dist < 140 ? (1 - dist / 140) * 8 : 0;
            const x = baseX + waveX + (dist > 1 ? (dx / dist) * pull : 0);
            const y = baseY + waveY + (dist > 1 ? (dy / dist) * pull : 0);
            const isHovered = ptr.active && dist < 72;
            return { ...n, x, y, isHovered };
          });

          NUSADANA_EDGES.forEach(([aIdx, bIdx], edgeIndex) => {
            const a = liveNodes[aIdx];
            const b = liveNodes[bIdx];
            const isHighlighted = a.isHovered || b.isHovered || ptr.pulse > 0.15;

            const midX = (a.x + b.x) * 0.5;
            const midY = (a.y + b.y) * 0.5 - 16;

            ctx.strokeStyle = isHighlighted
              ? 'rgba(200, 255, 0, 0.65)'
              : 'rgba(242, 242, 240, 0.16)';
            ctx.lineWidth = isHighlighted ? 1.7 : 1.1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.quadraticCurveTo(midX, midY, b.x, b.y);
            ctx.stroke();

            for (let dir = 0; dir < 2; dir++) {
              const rawT =
                (elapsed * (0.36 + (edgeIndex % 3) * 0.12) + edgeIndex * 0.21 + dir * 0.5) % 1;
              const t = dir === 0 ? rawT : 1 - rawT;
              const invT = 1 - t;
              const px = invT * invT * a.x + 2 * invT * t * midX + t * t * b.x;
              const py = invT * invT * a.y + 2 * invT * t * midY + t * t * b.y;

              ctx.fillStyle = dir === 0 ? '#c8ff00' : '#10b981';
              ctx.beginPath();
              ctx.arc(px, py, isHighlighted ? 3.0 : 2.1, 0, Math.PI * 2);
              ctx.fill();
            }
          });

          liveNodes.forEach((node) => {
            const haloR = node.isHovered ? 14 : 9.5 + ptr.pulse * 4;
            ctx.strokeStyle = node.isHovered ? '#c8ff00' : 'rgba(200, 255, 0, 0.4)';
            ctx.fillStyle = node.isHovered
              ? 'rgba(200, 255, 0, 0.18)'
              : 'rgba(12, 16, 14, 0.92)';
            ctx.lineWidth = node.isHovered ? 1.8 : 1.1;
            ctx.beginPath();
            ctx.arc(node.x, node.y, haloR, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#c8ff00';
            ctx.beginPath();
            ctx.arc(node.x, node.y, 3.2, 0, Math.PI * 2);
            ctx.fill();

            ctx.font = '600 9.5px "JetBrains Mono", monospace';
            const line2 = `${node.val} · ${node.tier}`;
            const boxW = Math.max(node.name.length, line2.length) * 6.1 + 12;
            const boxH = 28;

            let boxX = node.x + 14;
            let boxY = node.y - boxH * 0.5;

            if (node.anchor === 'top') {
              boxX = node.x - boxW * 0.5;
              boxY = node.y - haloR - boxH - 6;
            } else if (node.anchor === 'bottom') {
              boxX = node.x - boxW * 0.5;
              boxY = node.y + haloR + 6;
            } else if (node.anchor === 'left') {
              boxX = node.x - haloR - boxW - 8;
              boxY = node.y - boxH * 0.5;
            } else {
              boxX = node.x + haloR + 8;
              boxY = node.y - boxH * 0.5;
            }

            boxX = clamp(boxX, 10, w - boxW - 10);
            boxY = clamp(boxY, 12, h - boxH - 42);

            ctx.fillStyle = 'rgba(10, 12, 11, 0.86)';
            ctx.strokeStyle = node.isHovered
              ? 'rgba(200, 255, 0, 0.55)'
              : 'rgba(242, 242, 240, 0.14)';
            ctx.lineWidth = 1;
            ctx.fillRect(boxX, boxY, boxW, boxH);
            ctx.strokeRect(boxX, boxY, boxW, boxH);

            ctx.fillStyle = '#f2f2f0';
            ctx.fillText(node.name, boxX + 6, boxY + 11);

            ctx.fillStyle = '#c8ff00';
            ctx.font = '500 9px "JetBrains Mono", monospace';
            ctx.fillText(line2, boxX + 6, boxY + 23);
          });
        }

        // ========================================================================
        // MODE 4: SCHOOL AI — Socratic Calculus Proof & Fourier Phase Sandbox
        // ========================================================================
        else if (project.visualMode === 'school-ai-nodes') {
          ctx.fillStyle = '#08080d';
          ctx.fillRect(0, 0, w, h);

          const padX = Math.max(44, w * 0.08);
          const waveLeft = padX;
          const waveRight = w - padX;
          const waveW = Math.max(100, waveRight - waveLeft);
          const centerY = h * 0.62;
          const amp = Math.min(72, h * 0.17);
          const phase = elapsed * 0.95;

          const evalF = (nx: number) => {
            const theta = nx * Math.PI * 2.2 + phase;
            return Math.sin(theta) * Math.cos(nx * Math.PI - phase * 0.35);
          };

          const activeNormX = clamp(ptr.smoothX, 0.08, 0.92);
          const eps = 0.002;
          const fVal = evalF(activeNormX);
          const dfDx = (evalF(activeNormX + eps) - evalF(activeNormX - eps)) / (2 * eps);

          const barCount = 34;
          let integralSum = 0;
          const dxNorm = 1 / barCount;

          for (let i = 0; i <= barCount; i++) {
            const nx = i / barCount;
            const x = waveLeft + nx * waveW;
            const val = evalF(nx);
            const y = centerY - val * amp;
            const isBeforeCursor = nx <= activeNormX;
            if (isBeforeCursor) {
              integralSum += val * dxNorm;
            }

            ctx.fillStyle = isBeforeCursor
              ? 'rgba(200, 255, 0, 0.18)'
              : 'rgba(167, 139, 250, 0.06)';
            const barW = Math.max(4, (waveW / barCount) * 0.58);
            ctx.fillRect(
              x - barW * 0.5,
              Math.min(centerY, y),
              barW,
              Math.abs(centerY - y)
            );
          }

          ctx.strokeStyle = 'rgba(242, 242, 240, 0.14)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(waveLeft, centerY);
          ctx.lineTo(waveRight, centerY);
          ctx.stroke();

          ctx.strokeStyle = 'rgba(56, 189, 248, 0.38)';
          ctx.setLineDash([3, 4]);
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          for (let px = waveLeft; px <= waveRight; px += 6) {
            const nx = (px - waveLeft) / waveW;
            const dVal = (evalF(nx + eps) - evalF(nx - eps)) / (2 * eps);
            const py = centerY - clamp(dVal * 0.22, -1.1, 1.1) * amp;
            if (px === waveLeft) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.strokeStyle = '#a78bfa';
          ctx.lineWidth = 2.6;
          ctx.beginPath();
          for (let px = waveLeft; px <= waveRight; px += 4) {
            const nx = (px - waveLeft) / waveW;
            const py = centerY - evalF(nx) * amp;
            if (px === waveLeft) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();

          const curveX = waveLeft + activeNormX * waveW;
          const curveY = centerY - fVal * amp;
          const screenSlope = (-dfDx * amp) / waveW;
          const tanAngle = Math.atan2(screenSlope, 1);
          const tanSpan = Math.min(95, waveW * 0.16);

          ctx.strokeStyle = '#c8ff00';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(
            curveX - Math.cos(tanAngle) * tanSpan,
            curveY - Math.sin(tanAngle) * tanSpan
          );
          ctx.lineTo(
            curveX + Math.cos(tanAngle) * tanSpan,
            curveY + Math.sin(tanAngle) * tanSpan
          );
          ctx.stroke();

          ctx.strokeStyle = 'rgba(200, 255, 0, 0.5)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(curveX, curveY, 11 + ptr.pulse * 6, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = '#c8ff00';
          ctx.beginPath();
          ctx.arc(curveX, curveY, 5, 0, Math.PI * 2);
          ctx.fill();

          const boxW = Math.min(176, (w - 56) / 3.2);
          const boxH = 48;
          const topY = 46;
          const dagNodes = [
            {
              x: w * 0.2,
              y: topY,
              code: '01 · AXIOM',
              title: `x = ${activeNormX.toFixed(2)} rad`,
            },
            {
              x: w * 0.5,
              y: topY,
              code: '02 · TANGENT dy/dx',
              title: `f'(x) = ${dfDx.toFixed(2)}`,
            },
            {
              x: w * 0.8,
              y: topY,
              code: '03 · RIEMANN AREA',
              title: `∫f(x)dx = ${(integralSum * 10).toFixed(2)}`,
            },
          ];

          const tetherStartX = dagNodes[1].x;
          const tetherStartY = dagNodes[1].y + boxH * 0.5;
          ctx.strokeStyle = 'rgba(200, 255, 0, 0.38)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(tetherStartX, tetherStartY);
          ctx.bezierCurveTo(
            tetherStartX,
            (tetherStartY + curveY) * 0.5,
            curveX,
            (tetherStartY + curveY) * 0.5,
            curveX,
            curveY
          );
          ctx.stroke();

          ctx.strokeStyle = 'rgba(167, 139, 250, 0.32)';
          ctx.beginPath();
          ctx.moveTo(dagNodes[0].x + boxW * 0.5, topY);
          ctx.lineTo(dagNodes[1].x - boxW * 0.5, topY);
          ctx.moveTo(dagNodes[1].x + boxW * 0.5, topY);
          ctx.lineTo(dagNodes[2].x - boxW * 0.5, topY);
          ctx.stroke();

          dagNodes.forEach((dn, i) => {
            const bx = dn.x - boxW * 0.5;
            const by = dn.y - boxH * 0.5;
            ctx.fillStyle = 'rgba(14, 13, 22, 0.92)';
            ctx.strokeStyle = i === 1 ? '#c8ff00' : 'rgba(242, 242, 240, 0.2)';
            ctx.lineWidth = i === 1 ? 1.5 : 1;
            ctx.fillRect(bx, by, boxW, boxH);
            ctx.strokeRect(bx, by, boxW, boxH);

            ctx.fillStyle = i === 1 ? '#c8ff00' : '#a78bfa';
            ctx.font = '600 9px "JetBrains Mono", monospace';
            ctx.fillText(dn.code, bx + 10, by + 17);

            ctx.fillStyle = '#f2f2f0';
            ctx.font = '600 11px "JetBrains Mono", monospace';
            ctx.fillText(dn.title, bx + 10, by + 35);
          });
        }

        // ========================================================================
        // MODE 5: EXPERIMENTS — Hidden-Line Painter's 3D Topological Surface
        // ========================================================================
        else {
          ctx.fillStyle = '#080809';
          ctx.fillRect(0, 0, w, h);

          const cols = 18;
          const rows = 12;
          const focalX = (ptr.smoothX - 0.5) * 520;
          const focalY = (ptr.smoothY - 0.5) * 240;

          const projected: { x: number; y: number; z: number }[][] = [];

          for (let r = 0; r < rows; r++) {
            const rowArr: { x: number; y: number; z: number }[] = [];
            const normR = r / (rows - 1);
            const worldZ = 1.35 + (1 - normR) * 2.05;

            for (let c = 0; c < cols; c++) {
              const normC = (c / (cols - 1) - 0.5) * 2;
              const worldX = normC * (w * 0.44);
              const worldY = (normR - 0.5) * (h * 0.52);

              const distToFocus = Math.hypot(worldX - focalX, worldY - focalY);
              const waveZ =
                Math.sin(distToFocus * 0.028 - elapsed * 3.6) *
                (28 + ptr.pulse * 26) *
                Math.exp(-distToFocus * 0.0032);

              const scale = 2.05 / worldZ;
              const sx = w * 0.5 + worldX * scale;
              const sy = h * 0.53 + (worldY * 0.72 - waveZ) * scale;

              rowArr.push({ x: sx, y: sy, z: waveZ });
            }
            projected.push(rowArr);
          }

          ctx.fillStyle = 'rgba(10, 12, 14, 0.92)';
          for (let r = 0; r < rows - 1; r++) {
            for (let c = 0; c < cols - 1; c++) {
              const p00 = projected[r][c];
              const p10 = projected[r][c + 1];
              const p11 = projected[r + 1][c + 1];
              const p01 = projected[r + 1][c];

              const avgZ = (p00.z + p10.z + p11.z + p01.z) * 0.25;
              const elevNorm = clamp((avgZ + 28) / 56, 0, 1);

              ctx.beginPath();
              ctx.moveTo(p00.x, p00.y);
              ctx.lineTo(p10.x, p10.y);
              ctx.lineTo(p11.x, p11.y);
              ctx.lineTo(p01.x, p01.y);
              ctx.closePath();
              ctx.fill();

              ctx.strokeStyle =
                elevNorm > 0.62
                  ? `rgba(200, 255, 0, ${(0.28 + elevNorm * 0.55).toFixed(2)})`
                  : `rgba(56, 189, 248, ${(0.14 + elevNorm * 0.28).toFixed(2)})`;
              ctx.lineWidth = elevNorm > 0.65 ? 1.2 : 0.85;
              ctx.stroke();
            }
          }

          ctx.fillStyle = '#c8ff00';
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const pt = projected[r][c];
              if (pt.z > 10) {
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, 2.0, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          }
        }
      } catch (renderErr) {
        console.warn(`[ProjectVisualStage] Render recovered for ${project.title}:`, renderErr);
        ctx.fillStyle = '#0e0e0d';
        ctx.fillRect(0, 0, w, h);
        // Draw graceful fallback schematic grid
        ctx.strokeStyle = 'rgba(200, 255, 0, 0.14)';
        ctx.lineWidth = 1;
        for (let gx = 40; gx < w; gx += 40) {
          ctx.beginPath();
          ctx.moveTo(gx, 0);
          ctx.lineTo(gx, h);
          ctx.stroke();
        }
        for (let gy = 40; gy < h; gy += 40) {
          ctx.beginPath();
          ctx.moveTo(0, gy);
          ctx.lineTo(w, gy);
          ctx.stroke();
        }
        ctx.fillStyle = '#c8ff00';
        ctx.font = '600 11px "JetBrains Mono", monospace';
        ctx.fillText(`SIMULATION ONLINE · ${project.title}`, 20, 32);
        ctx.fillStyle = '#8a8a86';
        ctx.font = '400 10px "JetBrains Mono", monospace';
        ctx.fillText('STANDBY TELEMETRY · 60FPS FALLBACK READY', 20, 48);
      } finally {
        ctx.restore();
      }
      };

      const tick = (now: number) => {
        rafId = 0;
        renderFrame(now);
        if (animateRef.current) {
          rafId = window.requestAnimationFrame(tick);
        }
      };

      renderOnceRef.current = () => {
        renderFrame(performance.now());
      };

      startLoopRef.current = () => {
        if (!rafId && animateRef.current) {
          lastTime = performance.now();
          rafId = window.requestAnimationFrame(tick);
        }
      };

      // Synchronously draw initial frame immediately so canvas is never blank on mount or fast scroll
      renderFrame(performance.now());
      if (animateRef.current) {
        rafId = window.requestAnimationFrame(tick);
      }

      return () => {
        renderOnceRef.current = null;
        startLoopRef.current = null;
        if (rafId) window.cancelAnimationFrame(rafId);
      };
    }, [project.visualMode, project.title]);

    useEffect(() => {
      animateRef.current = animateEnabled;
      if (animateEnabled && startLoopRef.current) {
        startLoopRef.current();
      }
    }, [animateEnabled]);

    const handlePointerMove = (e: React.MouseEvent<HTMLDivElement>) => {
      const w = sizeRef.current.w;
      const h = sizeRef.current.h;
      const rect = e.currentTarget.getBoundingClientRect();
      const nx = clamp((e.clientX - rect.left) / Math.max(1, rect.width || w), 0, 1);
      const ny = clamp((e.clientY - rect.top) / Math.max(1, rect.height || h), 0, 1);
      pointerRef.current.normX = nx;
      pointerRef.current.normY = ny;
      pointerRef.current.active = true;

      if (hudCoordSpanRef.current) {
        hudCoordSpanRef.current.textContent = `X:${Math.round(nx * 100)} Y:${Math.round(
          ny * 100
        )} ${isActive ? '· LIVE 60FPS' : ''}`;
      }
    };

    const handlePointerLeave = () => {
      pointerRef.current.active = false;
    };

    const handleTrigger = () => {
      pointerRef.current.pulse = 1.0;
    };

    return (
      <div
        ref={containerRef}
        data-cursor-precision="true"
        onMouseMove={handlePointerMove}
        onMouseLeave={handlePointerLeave}
        onClick={handleTrigger}
        className="relative w-full h-full min-h-[300px] md:min-h-[430px] bg-[#080808] overflow-hidden select-none border border-[#f2f2f0]/15 cursor-crosshair"
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full block"
          aria-label={`${project.title} interactive simulation stage`}
        />

        {/* Stage Live Readout Footer Bar */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex items-center justify-between gap-4 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/90 to-transparent px-4 py-3 font-mono-code text-[11px] text-[#8a8a86]">
          <span className="truncate text-[#f2f2f0]/85">{project.liveDemoNote}</span>
          <span ref={hudCoordSpanRef} className="shrink-0 text-[#c8ff00] tabular-nums">
            X:50 Y:50 {isActive ? '· LIVE 60FPS' : ''}
          </span>
        </div>
      </div>
    );
  }
);
