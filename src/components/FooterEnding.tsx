import React, { useEffect, useRef, useState } from 'react';
import {
  SpringVector2D,
  clamp,
  computeChapterEntranceMetrics,
  computeMagneticOffset,
  mapRange,
  stepSpringVector2D,
} from '../utils/motionMath';
import { ChapterEntrancePortal } from './ChapterEntrancePortal';
import { EpilogueMotionGraphic } from './EpilogueMotionGraphic';
import { ArrowUp, Check, Copy, ArrowUpRight, Radio } from 'lucide-react';

interface FooterEndingProps {
  sectionProgress: number; // 0 to 1 across Chapter 07
  onScrollTop: () => void;
}

const MAGNETIC_KEYS = ['email', 'github', 'linkedin', 'copy'] as const;

export const FooterEnding: React.FC<FooterEndingProps> = React.memo(
  ({ sectionProgress, onScrollTop }) => {
    const [copied, setCopied] = useState(false);
    const [magneticOffsets, setMagneticOffsets] = useState<
      Record<string, { x: number; y: number }>
    >({});

    const targetMagneticRef = useRef<Record<string, { x: number; y: number }>>({
      email: { x: 0, y: 0 },
      github: { x: 0, y: 0 },
      linkedin: { x: 0, y: 0 },
      copy: { x: 0, y: 0 },
    });
    const springMagneticRef = useRef<Record<string, SpringVector2D>>({
      email: { x: 0, y: 0, vx: 0, vy: 0 },
      github: { x: 0, y: 0, vx: 0, vy: 0 },
      linkedin: { x: 0, y: 0, vx: 0, vy: 0 },
      copy: { x: 0, y: 0, vx: 0, vy: 0 },
    });
    const magRafRef = useRef<number>(0);

    const ensureMagneticLoop = () => {
      if (magRafRef.current) return;
      let lastTime = performance.now();

      const tick = (now: number) => {
        const dt = clamp((now - lastTime) * 0.001, 0.004, 0.04);
        lastTime = now;

        let totalRem = 0;
        const nextOffsets: Record<string, { x: number; y: number }> = {};

        for (const key of MAGNETIC_KEYS) {
          const cur = springMagneticRef.current[key] ?? { x: 0, y: 0, vx: 0, vy: 0 };
          const tgt = targetMagneticRef.current[key] ?? { x: 0, y: 0 };
          const stepped = stepSpringVector2D(cur, tgt.x, tgt.y, dt, 150, 12.5);
          springMagneticRef.current[key] = stepped;
          nextOffsets[key] = { x: stepped.x, y: stepped.y };
          totalRem +=
            Math.hypot(stepped.x - tgt.x, stepped.y - tgt.y) +
            Math.hypot(stepped.vx, stepped.vy) * 0.05;
        }

        setMagneticOffsets(nextOffsets);

        if (totalRem > 0.02) {
          magRafRef.current = window.requestAnimationFrame(tick);
        } else {
          magRafRef.current = 0;
        }
      };

      magRafRef.current = window.requestAnimationFrame(tick);
    };

    useEffect(() => {
      return () => {
        if (magRafRef.current) window.cancelAnimationFrame(magRafRef.current);
      };
    }, []);

    const p = clamp(sectionProgress, 0, 1);
    const entrance = computeChapterEntranceMetrics(p, 1200, 0.42);
    const titleScale = mapRange(p, 0, 1, 0.96, 1.02);
    const headlineDashOffset = Number(((1 - entrance.entranceRatio) * 980).toFixed(1));

    const handleCopyEmail = () => {
      const email = 'sakya.ananda@studio.id';
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).catch(() => {});
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2600);
    };

    const handleMagneticMove = (id: string, e: React.MouseEvent<HTMLElement>) => {
      const r = e.currentTarget.getBoundingClientRect();
      const vec = computeMagneticOffset(
        e.clientX,
        e.clientY,
        r.left,
        r.top,
        r.width,
        r.height,
        0.34,
        150
      );
      targetMagneticRef.current[id] = { x: vec.x, y: vec.y };
      ensureMagneticLoop();
    };

    const handleMagneticLeave = (id: string) => {
      targetMagneticRef.current[id] = { x: 0, y: 0 };
      ensureMagneticLoop();
    };

    const EXTERNAL_LINKS = [
      {
        id: 'email',
        label: 'DIRECT INQUIRY',
        href: 'mailto:sakya.ananda@studio.id',
        detail: 'sakya.ananda@studio.id',
      },
      {
        id: 'github',
        label: 'GITHUB REPOSITORIES',
        href: 'https://github.com',
        detail: 'github.com/sakya-ananda',
      },
      {
        id: 'linkedin',
        label: 'PROFESSIONAL NETWORK',
        href: 'https://linkedin.com',
        detail: 'in/sakya-ananda',
      },
    ];

    return (
      <footer
        id="ending"
        aria-label="Chapter 07 Ending and Contact"
        className="relative min-h-screen w-full bg-[#070707] border-t border-[#f2f2f0]/12 flex flex-col justify-between px-6 py-20 md:px-12 md:py-24 overflow-hidden"
      >
        {/* Dynamic Architectural SVG Blueprint Convergence Arcs & Radiation Vectors */}
        <svg
          aria-hidden="true"
          viewBox="0 0 1440 960"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 h-full w-full"
        >
          {/* Orbital convergence rings centered on the contact focal point */}
          <circle
            cx="1160"
            cy="480"
            r="440"
            fill="none"
            stroke="#c8ff00"
            strokeOpacity={0.14 + entrance.entranceRatio * 0.1}
            strokeWidth="1.3"
            strokeDasharray="1400"
            strokeDashoffset={headlineDashOffset}
          />
          <circle
            cx="1160"
            cy="480"
            r="280"
            fill="none"
            stroke="#f2f2f0"
            strokeOpacity="0.06"
            strokeWidth="1"
            strokeDasharray="900"
            strokeDashoffset={headlineDashOffset}
          />
          <circle
            cx="1160"
            cy="480"
            r="120"
            fill="none"
            stroke="#c8ff00"
            strokeOpacity="0.18"
            strokeWidth="1.2"
            strokeDasharray="600"
            strokeDashoffset={headlineDashOffset}
          />

          {/* Diagonal focal projection ray */}
          <line
            x1="20"
            y1="880"
            x2="1420"
            y2="80"
            stroke="#c8ff00"
            strokeOpacity="0.12"
            strokeWidth="1.2"
            strokeDasharray="1400"
            strokeDashoffset={headlineDashOffset}
          />
          <line
            x1="20"
            y1="80"
            x2="1420"
            y2="880"
            stroke="#f2f2f0"
            strokeOpacity="0.04"
            strokeWidth="1"
            strokeDasharray="1400"
            strokeDashoffset={headlineDashOffset}
          />
        </svg>

        <div className="relative z-10 max-w-7xl w-full mx-auto">
          <ChapterEntrancePortal
            chapterNumber="07"
            chapterTitle="EPILOGUE & INITIATION"
            chapterSubtitle="CHAPTER SEVEN · END OF SEQUENCE"
            blueprintCode="SYS.FIN.07"
            sectionProgress={p}
            rightSlot={
              <button
                type="button"
                onClick={onScrollTop}
                data-cursor-label="REPLAY"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 border border-[#f2f2f0]/20 font-mono-code text-xs tracking-[0.18em] text-[#8a8a86] hover:text-[#c8ff00] hover:border-[#c8ff00] transition-colors whitespace-nowrap shrink-0 cursor-pointer bg-[#111111]/80"
              >
                <span>RETURN TO PROLOGUE</span>
                <ArrowUp className="w-3.5 h-3.5 text-[#c8ff00]" />
              </button>
            }
          />
        </div>

        {/* Center Monumental Closing Typography with Dual-Layer Kinetic SVG Line-Drawing */}
        <div className="relative z-10 max-w-7xl w-full mx-auto my-auto py-8">
          <div
            className="will-change-transform space-y-5"
            style={{
              transform: `scale(${titleScale.toFixed(3)})`,
            }}
          >
            <div className="flex items-center gap-3 font-mono-code text-xs tracking-[0.24em] text-[#c8ff00]">
              <Radio className="w-3.5 h-3.5 animate-pulse text-[#c8ff00]" />
              <span>END OF SEQUENCE · INITIATE DIRECT DIALOGUE</span>
            </div>

            {/* Kinetic Line-Drawn Title Block */}
            <div className="relative">
              <h2 className="font-display text-[clamp(2.75rem,8.2vw,7.2rem)] font-extrabold uppercase leading-[0.92] text-[#f2f2f0] max-w-6xl text-balance">
                LET&apos;S BUILD
                <br />
                SOMETHING
                <br />
                <span className="relative inline-block font-serif-editorial italic font-normal text-[#c8ff00] normal-case mt-1">
                  worth scrolling for.
                </span>
              </h2>

              {/* Decorative Blueprint Vector Line-Drawing Trajectory Ray with Pulsing Emitter Node */}
              <svg
                aria-hidden="true"
                viewBox="0 0 860 120"
                className="pointer-events-none absolute -bottom-6 left-0 w-full max-w-3xl h-14 overflow-visible"
              >
                <line
                  x1="0"
                  y1="24"
                  x2="760"
                  y2="24"
                  stroke="#c8ff00"
                  strokeWidth="1.8"
                  strokeDasharray="800"
                  strokeDashoffset={headlineDashOffset}
                  strokeOpacity="0.65"
                />
                <circle cx="760" cy="24" r="5" fill="#c8ff00" />
                <circle
                  cx="760"
                  cy="24"
                  r="12"
                  fill="none"
                  stroke="#c8ff00"
                  strokeWidth="1"
                  strokeOpacity="0.4"
                  className="animate-ping"
                />
              </svg>
            </div>
          </div>

          {/* Interactive Oscilloscope & Deep Space Harmonic Wave Motion Graphic */}
          <div className="mt-12 mb-10 max-w-5xl">
            <EpilogueMotionGraphic sectionProgress={p} />
          </div>

          {/* Magnetic Primary Links & Tactile Copy Email Action with CAD Corner Frames */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-5xl">
            {EXTERNAL_LINKS.map((item) => {
              const offset = magneticOffsets[item.id] ?? { x: 0, y: 0 };
              return (
                <a
                  key={item.id}
                  href={item.href}
                  target={item.id === 'email' ? undefined : '_blank'}
                  rel={item.id === 'email' ? undefined : 'noreferrer'}
                  onMouseMove={(e) => handleMagneticMove(item.id, e)}
                  onMouseLeave={() => handleMagneticLeave(item.id)}
                  data-cursor-label="OPEN"
                  className="group relative border border-[#f2f2f0]/18 bg-[#0e0e0d] p-5 flex flex-col justify-between min-h-[120px] hover:border-[#c8ff00] transition-colors duration-200 overflow-hidden will-change-transform"
                  style={{
                    transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
                  }}
                >
                  {/* Subtle hover accent light */}
                  <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl from-[#c8ff00]/10 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="flex items-center justify-between">
                    <span className="font-mono-code text-xs tracking-[0.2em] text-[#f2f2f0] group-hover:text-[#c8ff00] transition-colors">
                      {item.label}
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-[#8a8a86] group-hover:text-[#c8ff00] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                  <span className="font-mono-code text-xs text-[#8a8a86] group-hover:text-[#f2f2f0] truncate transition-colors">
                    {item.detail}
                  </span>
                </a>
              );
            })}

            {/* Interactive One-Click Copy Direct Email with Tactile Feedback */}
            <button
              type="button"
              onClick={handleCopyEmail}
              onMouseMove={(e) => handleMagneticMove('copy', e)}
              onMouseLeave={() => handleMagneticLeave('copy')}
              data-cursor-label="COPY"
              className="relative border border-[#c8ff00] bg-[#c8ff00] text-[#0a0a0a] p-5 flex flex-col justify-between min-h-[120px] text-left hover:bg-[#f2f2f0] hover:border-[#f2f2f0] transition-colors duration-200 cursor-pointer shadow-[0_0_24px_rgba(200,255,0,0.2)] will-change-transform"
              style={{
                transform: `translate3d(${magneticOffsets.copy?.x ?? 0}px, ${
                  magneticOffsets.copy?.y ?? 0
                }px, 0)`,
              }}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-mono-code text-xs font-bold tracking-[0.18em]">
                  {copied ? 'ADDRESS COPIED' : 'COPY DIRECT EMAIL'}
                </span>
                {copied ? (
                  <Check className="w-4 h-4 text-[#0a0a0a] animate-scaleIn" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </div>
              <span className="font-mono-code text-xs font-semibold">
                {copied ? 'READY TO PASTE · LET’S TALK' : 'sakya.ananda@studio.id'}
              </span>
            </button>
          </div>
        </div>

        {/* Bottom Quiet Copyright & Telemetry Strip */}
        <div className="relative z-10 max-w-7xl w-full mx-auto flex flex-wrap items-center justify-between gap-4 border-t border-[#f2f2f0]/12 pt-6 font-mono-code text-xs text-[#8a8a86]">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#c8ff00] animate-pulse" />
            © {new Date().getFullYear()} SAKYA ANANDA · DETERMINISTIC SYSTEMS & EXPERIENCES
          </span>
          <div className="flex items-center gap-4 text-[11px] tabular-nums">
            <span className="text-[#f2f2f0]/80">SEQUENCE COMPLETE [100%]</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#c8ff00] font-semibold">ALL 07 CHAPTERS SYNCHRONIZED</span>
          </div>
        </div>
      </footer>
    );
  }
);
