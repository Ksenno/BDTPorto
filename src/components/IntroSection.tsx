import React, { useEffect, useRef, useState } from 'react';
import {
  SpringVector2D,
  clamp,
  computeIntroExitPortalMetrics,
  mapRange,
  stepSpringVector2D,
} from '../utils/motionMath';
import { ArrowDown } from 'lucide-react';

interface IntroSectionProps {
  sectionProgress: number; // 0 to 1 within Chapter 01
  onExploreNext: () => void;
}

export const IntroSection: React.FC<IntroSectionProps> = React.memo(
  ({ sectionProgress, onExploreNext }) => {
    const containerRef = useRef<HTMLElement>(null);
    const [pointer, setPointer] = useState({ x: 0, y: 0 });
    const targetPointerRef = useRef({ x: 0, y: 0 });
    const springPointerRef = useRef<SpringVector2D>({ x: 0, y: 0, vx: 0, vy: 0 });
    const isVisible = sectionProgress < 0.99;

    useEffect(() => {
      if (!isVisible) return;
      let rafId = 0;
      let lastTime = performance.now();

      const tick = (now: number) => {
        const dt = clamp((now - lastTime) * 0.001, 0.004, 0.04);
        lastTime = now;
        const stepped = stepSpringVector2D(
          springPointerRef.current,
          targetPointerRef.current.x,
          targetPointerRef.current.y,
          dt,
          110,
          12.5
        );
        springPointerRef.current = stepped;
        setPointer({ x: stepped.x, y: stepped.y });

        const rem =
          Math.hypot(
            stepped.x - targetPointerRef.current.x,
            stepped.y - targetPointerRef.current.y
          ) + Math.hypot(stepped.vx, stepped.vy) * 0.04;

        if (rem > 0.0015) {
          rafId = window.requestAnimationFrame(tick);
        } else {
          rafId = 0;
        }
      };

      const ensureSpringLoop = () => {
        if (!rafId) {
          lastTime = performance.now();
          rafId = window.requestAnimationFrame(tick);
        }
      };

      const handleMouseMove = (e: MouseEvent) => {
        targetPointerRef.current = {
          x: (e.clientX / Math.max(1, window.innerWidth) - 0.5) * 2,
          y: (e.clientY / Math.max(1, window.innerHeight) - 0.5) * 2,
        };
        ensureSpringLoop();
      };

      const handleMouseLeave = () => {
        targetPointerRef.current = { x: 0, y: 0 };
        ensureSpringLoop();
      };

      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      window.addEventListener('mouseleave', handleMouseLeave, { passive: true });
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseleave', handleMouseLeave);
        if (rafId) window.cancelAnimationFrame(rafId);
      };
    }, [isVisible]);

    const p = clamp(sectionProgress, 0, 1);
    const exitPortal = computeIntroExitPortalMetrics(p, 700);

    // Word separation and scale interpolation driven continuously by scroll
    const word1X = mapRange(p, 0, 1, 0, -165) + pointer.x * 16;
    const word2X = mapRange(p, 0, 1, 0, 75) - pointer.x * 20;
    const word3X = mapRange(p, 0, 1, 0, 185) + pointer.x * 24;

    const word1Scale = mapRange(p, 0, 1, 1, 0.84);
    const word2Scale = mapRange(p, 0, 1, 1, 1.14);
    const word3Scale = mapRange(p, 0, 1, 1, 0.9);

    const containerOpacity = mapRange(p, 0.84, 1, 1, 0.25);
    const secondaryTextOpacity = mapRange(p, 0.06, 0.42, 0.55, 1);
    const secondaryTextY = mapRange(p, 0, 0.55, 22, 0);

    // SVG Line-drawing stroke progress for Intro Blueprint Vectors
    const introStrokeDash = Number(((1 - clamp(p * 1.45, 0, 1)) * 1200).toFixed(1));
    const exitStrokeDash = exitPortal.conduitDashoffset;

    return (
      <section
        id="intro"
        ref={containerRef}
        aria-label="Chapter 01 Introduction"
        className="relative min-h-[165vh] w-full bg-transparent bg-architectural-grid"
      >
        <div
          className="sticky top-0 flex h-screen w-full flex-col justify-between px-6 py-24 md:px-12 overflow-hidden will-change-transform"
          style={{
            clipPath: `inset(${exitPortal.frameInsetPercent}% ${
              exitPortal.frameInsetPercent * 0.65
            }% ${exitPortal.frameInsetPercent * 0.4}% ${exitPortal.frameInsetPercent * 0.65}%)`,
            transform: `scale(${exitPortal.portalScale})`,
          }}
        >
          {/* Subtle radial spotlight following pointer + scroll */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(680px circle at ${(50 + pointer.x * 22).toFixed(1)}% ${(
                50 +
                pointer.y * 22 -
                p * 18
              ).toFixed(1)}%, rgba(200, 255, 0, 0.085), transparent 72%)`,
            }}
          />

          {/* SVG Scrollytelling Blueprint Line-Drawing Architecture & Exit Portal Vectors */}
          <svg
            aria-hidden="true"
            viewBox="0 0 1440 900"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 h-full w-full"
          >
            {/* Outer blueprint schematic frame */}
            <rect
              x="36"
              y="76"
              width="1368"
              height="748"
              fill="none"
              stroke="#f2f2f0"
              strokeOpacity="0.08"
              strokeWidth="1"
            />
            <rect
              x="36"
              y="76"
              width="1368"
              height="748"
              fill="none"
              stroke="#c8ff00"
              strokeOpacity={0.18 + exitPortal.exitRatio * 0.35}
              strokeWidth="1.4"
              strokeDasharray="1200"
              strokeDashoffset={introStrokeDash}
            />

            {/* Diagonal Perspective Convergence Vectors (Intensify during scroll exit to Chapter 02) */}
            <line
              x1="36"
              y1="76"
              x2="720"
              y2="824"
              stroke="#c8ff00"
              strokeOpacity={0.08 + exitPortal.exitRatio * 0.32}
              strokeWidth="1.1"
              strokeDasharray="700"
              strokeDashoffset={exitStrokeDash}
            />
            <line
              x1="1404"
              y1="76"
              x2="720"
              y2="824"
              stroke="#c8ff00"
              strokeOpacity={0.08 + exitPortal.exitRatio * 0.32}
              strokeWidth="1.1"
              strokeDasharray="700"
              strokeDashoffset={exitStrokeDash}
            />

            {/* Dynamic Pointer-Coupled Blueprint Crosshair & Orbit */}
            <circle
              cx={720 + pointer.x * 95}
              cy={450 + pointer.y * 65 - p * 40}
              r={190 + exitPortal.exitRatio * 90}
              fill="none"
              stroke="#c8ff00"
              strokeOpacity={0.14 + exitPortal.exitRatio * 0.22}
              strokeWidth="1"
              strokeDasharray="8 6"
            />
            <circle
              cx={720 - pointer.x * 55}
              cy={450 - pointer.y * 45}
              r={280 - exitPortal.exitRatio * 110}
              fill="none"
              stroke="#f2f2f0"
              strokeOpacity="0.08"
              strokeWidth="1"
              strokeDasharray="700"
              strokeDashoffset={exitStrokeDash}
            />

            {/* SVG Line-Drawing Blueprint Portal Aperture Rings */}
            <polygon
              points="720,210 960,450 720,690 480,450"
              fill="none"
              stroke="#c8ff00"
              strokeWidth="1.2"
              strokeOpacity={0.14 + exitPortal.exitRatio * 0.32}
              strokeDasharray="1400"
              strokeDashoffset={((1 - exitPortal.exitRatio) * 1400).toFixed(1)}
            />

            {/* Vertical Exit Conduit Line Drawing Down into Chapter 02 */}
            <line
              x1="720"
              y1="560"
              x2="720"
              y2="900"
              stroke="#c8ff00"
              strokeWidth="2"
              strokeOpacity={0.25 + exitPortal.exitRatio * 0.75}
              strokeDasharray="340"
              strokeDashoffset={((1 - exitPortal.exitRatio) * 340).toFixed(1)}
            />
          </svg>

          {/* Top Chapter Kicker */}
          <div className="relative z-10 flex items-center justify-between border-b border-[#f2f2f0]/12 pb-4 pt-2">
            <div className="flex items-center gap-3 font-mono-code text-xs tracking-[0.2em] text-[#8a8a86]">
              <span className="text-[#c8ff00]">01.</span>
              <span>CHAPTER ONE · PROLOGUE</span>
              <span aria-hidden="true" className="hidden md:inline">
                ·
              </span>
              <span className="hidden md:inline text-[#c8ff00]/80 tabular-nums">
                PORTAL APERTURE {Math.round((1 - exitPortal.exitRatio * 0.12) * 100)}%
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-4 font-mono-code text-xs text-[#8a8a86]">
              <span>JAKARTA, INDONESIA</span>
              <span aria-hidden="true">·</span>
              <span>CREATIVE DEVELOPER</span>
            </div>
          </div>

          {/* Center Monumental Typography Stage */}
          <div
            className="relative z-10 my-auto flex flex-col justify-center will-change-transform"
            style={{
              opacity: containerOpacity,
              transform: `translate3d(0, ${exitPortal.headlineSplitY}px, 0)`,
            }}
          >
            <h1
              aria-label="Building Digital Things."
              className="font-display font-extrabold uppercase leading-[0.88] tracking-[-0.04em] text-[#f2f2f0] select-none"
            >
              {/* Word 1: BUILDING */}
              <span
                className="relative block text-[clamp(3.4rem,10.5vw,9.5rem)] will-change-transform"
                style={{
                  transform: `translate3d(${word1X.toFixed(1)}px, ${(pointer.y * 8).toFixed(
                    1
                  )}px, 0) scale(${word1Scale.toFixed(3)})`,
                  letterSpacing: `${mapRange(p, 0, 1, -0.04, 0.04).toFixed(3)}em`,
                }}
              >
                <span>BUILDING</span>
                <span className="ml-4 hidden lg:inline-block align-middle font-mono-code text-[10px] tracking-[0.22em] text-[#c8ff00]/75 font-normal">
                  [X:{word1X.toFixed(0)} · S:{word1Scale.toFixed(2)}]
                </span>
              </span>

              {/* Word 2: DIGITAL + Inline Editorial Counterpoint */}
              <span
                className="flex flex-wrap items-baseline gap-4 md:gap-8 text-[clamp(3.4rem,10.5vw,9.5rem)] will-change-transform"
                style={{
                  transform: `translate3d(${word2X.toFixed(1)}px, ${(-pointer.y * 10).toFixed(
                    1
                  )}px, 0) scale(${word2Scale.toFixed(3)})`,
                }}
              >
                <span className="font-serif-editorial italic font-normal text-[#c8ff00] pr-2">
                  DIGITAL
                </span>
                <span className="hidden lg:inline-block max-w-xs font-sans-body text-xs md:text-sm font-normal normal-case tracking-normal text-[#8a8a86] leading-relaxed">
                  Interactive architectures, custom game engines, and tactile web systems.
                </span>
              </span>

              {/* Word 3: THINGS. */}
              <span
                className="block text-[clamp(3.4rem,10.5vw,9.5rem)] will-change-transform"
                style={{
                  transform: `translate3d(${word3X.toFixed(1)}px, ${(pointer.y * 12).toFixed(
                    1
                  )}px, 0) scale(${word3Scale.toFixed(3)})`,
                  letterSpacing: `${mapRange(p, 0, 1, -0.04, 0.06).toFixed(3)}em`,
                }}
              >
                THINGS<span className="text-[#c8ff00]">.</span>
              </span>
            </h1>

            {/* Secondary Narrative Text + Live SVG Line-Draw Progress Bar */}
            <div
              className="mt-8 md:mt-12 grid grid-cols-1 md:grid-cols-12 gap-6 items-end will-change-transform"
              style={{
                opacity: secondaryTextOpacity,
                transform: `translate3d(0, ${secondaryTextY.toFixed(1)}px, 0)`,
              }}
            >
              <div className="md:col-span-6 lg:col-span-5">
                <p className="font-sans-body text-base md:text-lg text-[#f2f2f0]/90 leading-relaxed text-balance">
                  This portfolio is a continuous spatial narrative. Scroll position controls depth,
                  velocity, and blueprint line-drawing—transforming each chapter into a living stage.
                </p>
              </div>
              <div className="md:col-span-6 lg:col-span-7 flex flex-wrap items-center md:justify-end gap-6 font-mono-code text-xs text-[#8a8a86]">
                <span>MOTION GRAPHICS</span>
                <span aria-hidden="true">/</span>
                <span>SPATIAL UI</span>
                <span aria-hidden="true">/</span>
                <span>GAME SYSTEMS</span>
                <span aria-hidden="true">/</span>
                <span>EXPERIMENTS</span>
              </div>
            </div>
          </div>

          {/* Bottom Scroll Indicator + Scrollytelling Handoff Portal Readout */}
          <div className="relative z-10 flex items-center justify-between border-t border-[#f2f2f0]/12 pt-5">
            <button
              type="button"
              onClick={onExploreNext}
              data-cursor-label="EXPLORE"
              className="group inline-flex items-center gap-3 font-mono-code text-xs tracking-[0.24em] text-[#f2f2f0] hover:text-[#c8ff00] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>
                {exitPortal.exitRatio > 0.35
                  ? 'ENTERING CH.02 · IDENTITY PORTAL'
                  : 'SCROLL TO EXPLORE'}
              </span>
              <ArrowDown className="w-3.5 h-3.5 text-[#c8ff00] group-hover:translate-y-1 transition-transform" />
            </button>

            <div className="hidden sm:flex items-center gap-4 font-mono-code text-xs text-[#8a8a86] tabular-nums whitespace-nowrap shrink-0">
              <span>
                {exitPortal.exitRatio > 0.25 ? 'PORTAL CONVERGENCE' : 'CH.01 VELOCITY'}
              </span>
              <div className="w-28 h-[2px] bg-[#f2f2f0]/15 overflow-hidden">
                <div
                  className="h-full bg-[#c8ff00]"
                  style={{ width: `${Math.round(p * 100)}%` }}
                />
              </div>
              <span className="text-[#c8ff00]">{Math.round(p * 100)}%</span>
            </div>
            <span className="sm:hidden font-mono-code text-xs text-[#8a8a86] tabular-nums whitespace-nowrap shrink-0">
              01 / 07
            </span>
          </div>
        </div>
      </section>
    );
  }
);
