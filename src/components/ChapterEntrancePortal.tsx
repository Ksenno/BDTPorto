import React from 'react';
import { computeChapterEntranceMetrics } from '../utils/motionMath';

interface ChapterEntrancePortalProps {
  chapterNumber: string;
  chapterTitle: string;
  chapterSubtitle: string;
  blueprintCode: string;
  sectionProgress: number;
  entranceWindow?: number;
  rightSlot?: React.ReactNode;
}

/**
 * Universal Scrollytelling Entrance Header & SVG Line-Drawing Blueprint Portal.
 * Renders a scroll-driven vertical blueprint conduit, corner CAD registration ticks,
 * SVG line-drawn chapter numeral & vector stroke typography, and spatial clip-path reveal.
 */
export const ChapterEntrancePortal: React.FC<ChapterEntrancePortalProps> = React.memo(
  ({
    chapterNumber,
    chapterTitle,
    chapterSubtitle,
    blueprintCode,
    sectionProgress,
    entranceWindow = 0.34,
    rightSlot,
  }) => {
    const metrics = computeChapterEntranceMetrics(sectionProgress, 900, entranceWindow);
    const frameDash = Number(((1 - metrics.entranceRatio) * 1200).toFixed(1));
    const conduitHeightPct = Math.round(metrics.entranceRatio * 100);

    return (
      <div className="relative mb-14 md:mb-20 select-none">
        {/* Vertical Blueprint Scrollytelling Conduit from previous chapter */}
        <div
          aria-hidden="true"
          className="pointer-events-none flex flex-col items-center mb-6"
        >
          <div className="relative h-14 md:h-20 w-[1px] bg-[#f2f2f0]/12 overflow-hidden">
            <div
              className="w-full bg-[#c8ff00]"
              style={{ height: `${conduitHeightPct}%` }}
            />
          </div>
          <div
            className="w-2.5 h-2.5 rotate-45 border border-[#c8ff00] transition-transform duration-150"
            style={{
              backgroundColor:
                metrics.entranceRatio > 0.65 ? '#c8ff00' : '#0a0a0a',
              transform: `rotate(45deg) scale(${0.7 + metrics.entranceRatio * 0.35})`,
            }}
          />
        </div>

        {/* SVG Line-Drawing Blueprint Banner & Clip-Path Spatial Reveal */}
        <div
          className="relative border border-[#f2f2f0]/12 bg-[#0d0d0c]/85 px-5 py-5 md:px-8 md:py-6 overflow-hidden will-change-transform"
          style={{
            clipPath: `inset(0% ${metrics.clipInsetSidePercent}% 0% ${metrics.clipInsetSidePercent}%)`,
            transform: `translate3d(0, ${(metrics.translateY * 0.45).toFixed(1)}px, 0) scale(${metrics.scale})`,
          }}
        >
          {/* SVG Blueprint Vector Schematic Overlay (Draws on Scroll) */}
          <svg
            aria-hidden="true"
            viewBox="0 0 1200 180"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 h-full w-full"
          >
            {/* Outer progressive blueprint stroke border */}
            <rect
              x="2"
              y="2"
              width="1196"
              height="176"
              fill="none"
              stroke="#c8ff00"
              strokeWidth="1.4"
              strokeOpacity={0.45 * (1 - metrics.fillOpacity * 0.5)}
              strokeDasharray="1200"
              strokeDashoffset={frameDash}
            />

            {/* Diagonal blueprint trajectory lines & geometric arc */}
            <path
              d="M 0 165 L 240 15 L 960 15 L 1200 165"
              fill="none"
              stroke="#f2f2f0"
              strokeOpacity="0.07"
              strokeWidth="1"
              strokeDasharray="900"
              strokeDashoffset={metrics.strokeDashoffset}
            />
            <path
              d="M 820 0 Q 980 90 1160 180"
              fill="none"
              stroke="#c8ff00"
              strokeOpacity="0.22"
              strokeWidth="1.2"
              strokeDasharray="900"
              strokeDashoffset={metrics.strokeDashoffset}
            />
            <circle
              cx="1060"
              cy="90"
              r="64"
              fill="none"
              stroke="#c8ff00"
              strokeOpacity="0.18"
              strokeWidth="1"
              strokeDasharray="420"
              strokeDashoffset={((1 - metrics.entranceRatio) * 420).toFixed(1)}
            />
            <line
              x1="1010"
              y1="90"
              x2="1110"
              y2="90"
              stroke="#f2f2f0"
              strokeOpacity="0.12"
              strokeWidth="1"
            />
            <line
              x1="1060"
              y1="40"
              x2="1060"
              y2="140"
              stroke="#f2f2f0"
              strokeOpacity="0.12"
              strokeWidth="1"
            />
          </svg>

          {/* Top Kicker Row */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-[#f2f2f0]/12 pb-3.5 mb-4">
            <div className="flex items-center gap-3 font-mono-code text-xs tracking-[0.2em] text-[#8a8a86]">
              <span className="text-[#c8ff00] font-semibold">{chapterNumber}.</span>
              <span>{chapterSubtitle}</span>
              <span aria-hidden="true" className="hidden sm:inline">
                ·
              </span>
              <span className="hidden sm:inline text-[#f2f2f0]/60 tabular-nums">
                {blueprintCode} [{Math.round(metrics.entranceRatio * 100)}%]
              </span>
            </div>

            {rightSlot ? (
              <div className="relative z-10">{rightSlot}</div>
            ) : (
              <span className="font-mono-code text-xs text-[#8a8a86] tabular-nums">
                VECTOR SYNC · {Math.round(sectionProgress * 100)}%
              </span>
            )}
          </div>

          {/* SVG Line-Drawing Blueprint Display Title */}
          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <svg
              viewBox="0 0 920 76"
              className="w-full max-w-3xl h-12 sm:h-14 md:h-16 overflow-visible"
              aria-label={`Chapter ${chapterNumber} ${chapterTitle}`}
            >
              {/* Layer 1: Blueprint Line-Drawing Stroke (draws on scroll, settles cleanly as solid fill completes) */}
              <text
                x="0"
                y="58"
                className="font-display font-extrabold uppercase tracking-tight"
                fontSize="54"
                fill="none"
                stroke="#c8ff00"
                strokeWidth="1.5"
                strokeDasharray="900"
                strokeDashoffset={metrics.strokeDashoffset}
                strokeOpacity={Number(
                  (metrics.strokeOpacity * (1 - metrics.fillOpacity * 0.78)).toFixed(3)
                )}
              >
                {chapterNumber} / {chapterTitle}
              </text>

              {/* Layer 2: Crisp Solid Fill that fades in as the blueprint finishes drawing */}
              <text
                x="0"
                y="58"
                className="font-display font-extrabold uppercase tracking-tight"
                fontSize="54"
                fill="#f2f2f0"
                fillOpacity={metrics.fillOpacity}
              >
                <tspan fill="#c8ff00">{chapterNumber}</tspan> / {chapterTitle}
              </text>
            </svg>

            <div className="hidden lg:flex items-center gap-4 font-mono-code text-[11px] text-[#8a8a86] shrink-0 tabular-nums">
              <span>APERTURE {(100 - metrics.clipInsetSidePercent * 2).toFixed(0)}%</span>
              <span aria-hidden="true">·</span>
              <span className="text-[#c8ff00]">
                {metrics.entranceRatio >= 0.95 ? 'LOCKED' : 'DRAWING'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
