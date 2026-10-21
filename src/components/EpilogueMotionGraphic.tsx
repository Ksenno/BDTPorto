import React, { useEffect, useRef, useState } from 'react';
import { clamp, stepUnderdampedSpring } from '../utils/motionMath';
import { Radio } from 'lucide-react';

interface EpilogueMotionGraphicProps {
  sectionProgress: number;
}

export const EpilogueMotionGraphic: React.FC<EpilogueMotionGraphicProps> = React.memo(
  ({ sectionProgress: _sectionProgress }) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [carrierMode, setCarrierMode] = useState<'bessel' | 'sine' | 'pulse'>('bessel');
    const [harmonicIntensity, setHarmonicIntensity] = useState<number>(1.2);

    const pointerRef = useRef<{
      x: number;
      y: number;
      smoothX: number;
      smoothY: number;
      vx: number;
      vy: number;
      active: boolean;
      burst: number;
    }>({
      x: 0.5,
      y: 0.5,
      smoothX: 0.5,
      smoothY: 0.5,
      vx: 0,
      vy: 0,
      active: false,
      burst: 0,
    });

    useEffect(() => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let rafId = 0;
      let lastTime = performance.now();
      const startTime = lastTime;

      // Trajectory particle packets
      const packets = Array.from({ length: 32 }, (_, i) => ({
        theta: (i / 32) * Math.PI * 2,
        dist: 0.2 + ((i * 17) % 70) * 0.01,
        speed: 0.12 + (i % 4) * 0.04,
        size: 1.5 + (i % 3) * 0.8,
        color: i % 3 === 0 ? '#c8ff00' : '#f2f2f0',
      }));

      const render = (now: number) => {
        const dt = Math.min(0.033, Math.max(0.005, (now - lastTime) * 0.001));
        lastTime = now;
        const elapsed = (now - startTime) * 0.001;

        const cw = Math.max(300, container.clientWidth || 700);
        const ch = Math.max(200, container.clientHeight || 260);
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
          const centerY = h * 0.5;
          const centerX = w * 0.5;

          ctx.clearRect(0, 0, w, h);

          const ptr = pointerRef.current;
          if (ptr.burst > 0) {
            ptr.burst = Math.max(0, ptr.burst - dt * 1.5);
          }

          const rawTargetX = ptr.active ? ptr.x : 0.5 + Math.cos(elapsed * 0.7) * 0.15;
          const rawTargetY = ptr.active ? ptr.y : 0.5 + Math.sin(elapsed * 0.9) * 0.15;
          const sx = stepUnderdampedSpring(ptr.smoothX, ptr.vx, rawTargetX, dt, 115, 12.5);
          const sy = stepUnderdampedSpring(ptr.smoothY, ptr.vy, rawTargetY, dt, 115, 12.5);
          ptr.smoothX = sx.value;
          ptr.smoothY = sy.value;
          ptr.vx = sx.velocity;
          ptr.vy = sy.velocity;
          const targetX = ptr.smoothX;
          const targetY = ptr.smoothY;

        // Background dark gradient
        const bgGrad = ctx.createLinearGradient(0, 0, w, 0);
        bgGrad.addColorStop(0, 'rgba(10, 10, 10, 0.95)');
        bgGrad.addColorStop(0.5, 'rgba(13, 14, 12, 0.85)');
        bgGrad.addColorStop(1, 'rgba(10, 10, 10, 0.95)');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        // Technical Oscilloscope Grid lines
        ctx.strokeStyle = 'rgba(242, 242, 240, 0.06)';
        ctx.lineWidth = 1;
        const gridCols = 16;
        const colW = w / gridCols;
        ctx.beginPath();
        for (let c = 1; c < gridCols; c++) {
          ctx.moveTo(c * colW, 0);
          ctx.lineTo(c * colW, h);
        }
        for (let row = -2; row <= 2; row++) {
          const ry = centerY + row * (h * 0.2);
          ctx.moveTo(0, ry);
          ctx.lineTo(w, ry);
        }
        ctx.stroke();

        // Central Baseline Axis
        ctx.strokeStyle = 'rgba(200, 255, 0, 0.25)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(w, centerY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Multi-Layer Carrier Waveform Simulation
        const channelCount = 3;
        for (let ch = 0; ch < channelCount; ch++) {
          const isPrimary = ch === 1;
          const ampBase = isPrimary ? 36 * harmonicIntensity : 20 * harmonicIntensity;
          const freqMult = 1.0 + ch * 0.45;
          const phaseOffset = elapsed * (2.4 + ch * 0.6) + ch * 1.2;

          ctx.strokeStyle = isPrimary
            ? '#c8ff00'
            : ch === 0
            ? 'rgba(56, 189, 248, 0.45)'
            : 'rgba(244, 63, 94, 0.35)';
          ctx.lineWidth = isPrimary ? 2.2 : 1.1;

          ctx.beginPath();
          const stepX = Math.max(3, w / 160);

          for (let x = 0; x <= w; x += stepX) {
            const nx = x / w; // 0..1
            const distFromCursor = Math.abs(nx - targetX);
            const cursorAttract = Math.exp(-distFromCursor * 6) * (32 + ptr.burst * 28);

            let waveY = 0;
            if (carrierMode === 'bessel') {
              // Bessel harmonic envelope
              const theta = (nx - 0.5) * Math.PI * 6 * freqMult - phaseOffset;
              const envelope = Math.sin(nx * Math.PI) * Math.exp(-Math.abs(nx - 0.5) * 1.5);
              waveY = Math.sin(theta) * Math.cos(theta * 0.5) * ampBase * envelope;
            } else if (carrierMode === 'sine') {
              const theta = nx * Math.PI * 8 * freqMult - phaseOffset;
              const envelope = Math.sin(nx * Math.PI);
              waveY = Math.sin(theta) * ampBase * envelope;
            } else {
              // Pulse modulation
              const rawSaw = ((nx * 7 * freqMult - elapsed * 1.8) % 1 + 1) % 1;
              const pulse = Math.exp(-Math.pow((rawSaw - 0.5) * 8, 2));
              waveY = (pulse - 0.5) * ampBase * 1.8 * Math.sin(nx * Math.PI);
            }

            const finalY = centerY + waveY - (targetY - 0.5) * 28 + (isPrimary ? cursorAttract * 0.4 : 0);

            if (x === 0) ctx.moveTo(x, finalY);
            else ctx.lineTo(x, finalY);
          }
          ctx.stroke();
        }

        // Central Transmission Signal Aperture Rings
        const apertureX = centerX;
        const apertureY = centerY;
        const pulseR = 14 + Math.sin(elapsed * 4) * 3 + ptr.burst * 14;

        ctx.strokeStyle = 'rgba(200, 255, 0, 0.55)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(apertureX, apertureY, pulseR, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#0a0a0a';
        ctx.beginPath();
        ctx.arc(apertureX, apertureY, pulseR * 0.65, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#c8ff00';
        ctx.beginPath();
        ctx.arc(apertureX, apertureY, 3, 0, Math.PI * 2);
        ctx.fill();

        // Expanding Transmission Radio Waves
        for (let r = 1; r <= 3; r++) {
          const wavePhase = (elapsed * 1.2 + r * 0.33) % 1;
          const currentR = pulseR + wavePhase * 68;
          ctx.strokeStyle = `rgba(200, 255, 0, ${(1 - wavePhase) * 0.35})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(apertureX, apertureY, currentR, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Trajectory packets converging towards central transmitter
        packets.forEach((p) => {
          p.dist = (p.dist - p.speed * dt * 0.3 + 1) % 1;
          const px = centerX + Math.cos(p.theta) * (p.dist * (w * 0.42));
          const py = centerY + Math.sin(p.theta) * (p.dist * (h * 0.42));

          const alpha = clamp(Math.sin(p.dist * Math.PI) * 0.85, 0.1, 0.9);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = alpha;
          ctx.beginPath();
          ctx.arc(px, py, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        });
        } catch (err) {
          console.warn('[EpilogueMotionGraphic] Recovered frame error:', err);
        } finally {
          ctx.restore();
        }
        rafId = window.requestAnimationFrame(render);
      };

      rafId = window.requestAnimationFrame(render);
      return () => {
        if (rafId) window.cancelAnimationFrame(rafId);
      };
    }, [carrierMode, harmonicIntensity]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      pointerRef.current.x = clamp((e.clientX - rect.left) / Math.max(1, rect.width), 0, 1);
      pointerRef.current.y = clamp((e.clientY - rect.top) / Math.max(1, rect.height), 0, 1);
      pointerRef.current.active = true;
    };

    const handleMouseLeave = () => {
      pointerRef.current.active = false;
    };

    const handleClick = () => {
      pointerRef.current.burst = 1.0;
    };

    return (
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className="relative w-full h-[180px] sm:h-[220px] md:h-[240px] bg-[#090909] border border-[#f2f2f0]/15 overflow-hidden select-none cursor-crosshair group"
      >
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

        {/* Top Readout Header */}
        <div className="absolute top-3 left-4 right-4 flex items-center justify-between font-mono-code text-[10px] tracking-[0.2em] text-[#8a8a86] pointer-events-none">
          <span className="flex items-center gap-1.5 text-[#f2f2f0]/90">
            <Radio className="w-3.5 h-3.5 text-[#c8ff00] animate-pulse" />
            HARMONIC TRANSMISSION CARRIER · SYS.FIN.07
          </span>
          <span className="text-[#c8ff00] tabular-nums">9600 BAUD · SYNCHRONIZED</span>
        </div>

        {/* Bottom Mode Toggle Buttons */}
        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {(['bessel', 'sine', 'pulse'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCarrierMode(mode);
                }}
                className={`px-2.5 py-1 font-mono-code text-[10px] uppercase tracking-wider transition-colors duration-150 cursor-pointer ${
                  carrierMode === mode
                    ? 'bg-[#c8ff00] text-[#0a0a0a] font-semibold border border-[#c8ff00]'
                    : 'bg-[#111111]/80 text-[#8a8a86] hover:text-[#f2f2f0] border border-[#f2f2f0]/15'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-2 font-mono-code text-[10px] text-[#8a8a86]">
            <span>MODULATION:</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setHarmonicIntensity((prev) => (prev >= 2 ? 0.8 : prev + 0.4));
              }}
              className="text-[#c8ff00] font-semibold hover:underline cursor-pointer tabular-nums"
            >
              {harmonicIntensity.toFixed(1)}x
            </button>
          </div>
        </div>
      </div>
    );
  }
);
