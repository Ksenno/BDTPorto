import React, { useEffect, useRef, useState } from 'react';
import { PROCESS_STAGES } from '../data/portfolioData';
import {
  clamp,
  computeChapterEntranceMetrics,
  computeProcessStageState,
  stepUnderdampedSpring,
} from '../utils/motionMath';
import { ChapterEntrancePortal } from './ChapterEntrancePortal';
import { ArrowRight } from 'lucide-react';

interface ProcessSectionProps {
  sectionProgress: number; // 0 to 1 across Chapter 05
}

export const ProcessSection: React.FC<ProcessSectionProps> = React.memo(({ sectionProgress }) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  // Map first 18% of progress to the entrance portal reveal, and 12%..96% to the 6-stage pipeline while pinned
  const rawStageProgress = clamp((sectionProgress - 0.12) / 0.82, 0, 1);
  const targetStageProgress =
    selectedIdx !== null
      ? selectedIdx / Math.max(1, PROCESS_STAGES.length - 1)
      : rawStageProgress;

  const [smoothProgress, setSmoothProgress] = useState<number>(targetStageProgress);
  const smoothProgRef = useRef<number>(targetStageProgress);
  const smoothVelRef = useRef<number>(0);
  const targetProgRef = useRef<number>(targetStageProgress);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    targetProgRef.current = targetStageProgress;
    if (rafRef.current) return;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = clamp((now - lastTime) * 0.001, 0.004, 0.04);
      lastTime = now;
      const stepped = stepUnderdampedSpring(
        smoothProgRef.current,
        smoothVelRef.current,
        targetProgRef.current,
        dt,
        125,
        14.5,
        1.2
      );
      const nextVal = clamp(stepped.value, 0, 1);
      smoothProgRef.current = nextVal;
      smoothVelRef.current = stepped.velocity;
      setSmoothProgress(nextVal);

      if (
        Math.abs(nextVal - targetProgRef.current) > 0.0008 ||
        Math.abs(stepped.velocity) > 0.003
      ) {
        rafRef.current = window.requestAnimationFrame(tick);
      } else {
        rafRef.current = 0;
      }
    };

    rafRef.current = window.requestAnimationFrame(tick);
  }, [targetStageProgress]);

  useEffect(() => {
    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const metrics = computeProcessStageState(smoothProgress, PROCESS_STAGES.length);
  const entrance = computeChapterEntranceMetrics(sectionProgress, 1000, 0.24);
  const activeIndex = selectedIdx !== null ? selectedIdx : metrics.activeStageIndex;
  const activeStage = PROCESS_STAGES[activeIndex] ?? PROCESS_STAGES[0];

  return (
    <section
      id="process"
      aria-label="Chapter 05 Process"
      onWheel={() => {
        if (selectedIdx !== null) {
          setSelectedIdx(null);
        }
      }}
      className="relative min-h-[260vh] w-full bg-transparent border-t border-[#f2f2f0]/12"
    >
      <div className="sticky top-0 flex min-h-screen w-full flex-col justify-center py-20 md:py-24 px-6 md:px-12 overflow-hidden">
        {/* Background SVG Line-Drawing Blueprint Schematic for Chapter 05 */}
        <svg
          aria-hidden="true"
          viewBox="0 0 1440 900"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 h-full w-full"
        >
          <path
            d="M 80 180 L 1360 180 L 1360 760 L 80 760 Z"
            fill="none"
            stroke="#c8ff00"
            strokeOpacity="0.11"
            strokeWidth="1.2"
            strokeDasharray="1000"
            strokeDashoffset={entrance.strokeDashoffset}
          />
        </svg>

        <div className="relative z-10 max-w-7xl w-full mx-auto">
          {/* Universal Scrollytelling SVG Line-Drawing Entrance Portal */}
          <ChapterEntrancePortal
            chapterNumber="05"
            chapterTitle="EXECUTION METHODOLOGY"
            chapterSubtitle="CHAPTER FIVE · SYSTEMATIC PIPELINE"
            blueprintCode="SYS.PIPE.05"
            sectionProgress={sectionProgress}
            entranceWindow={0.24}
          />

          {/* Continuous Chain Visualization: IDEA -> BREAKDOWN -> BUILD -> BREAK -> REBUILD -> SHIP */}
          <div
            className="mb-10 md:mb-12 will-change-transform"
            style={{
              transform: `translate3d(0, ${(entrance.translateY * 0.4).toFixed(1)}px, 0)`,
            }}
          >
            <div
            role="tablist"
            aria-label="Execution process stages"
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
          >
            {PROCESS_STAGES.map((stage, idx) => {
              const isCurrent = idx === activeIndex;
              const weight = metrics.stageWeights[idx] ?? 0.5;
              const liftY = isCurrent ? -3 : (weight - 0.5) * -2;
              return (
                <button
                  key={stage.id}
                  type="button"
                  role="tab"
                  aria-selected={isCurrent}
                  onClick={() => setSelectedIdx(idx)}
                  data-cursor-label={stage.index}
                  className={`group text-left p-4 md:p-5 border transition-[border-color,background-color] duration-200 cursor-pointer will-change-transform ${
                    isCurrent
                      ? 'border-[#c8ff00] bg-[#14160e]'
                      : 'border-[#f2f2f0]/12 bg-[#111111] hover:border-[#f2f2f0]/35'
                  }`}
                  style={{
                    transform: `translate3d(0, ${liftY.toFixed(2)}px, 0) scale(${(
                      isCurrent ? 1.02 : 0.96 + weight * 0.04
                    ).toFixed(3)})`,
                  }}
                >
                  <div className="flex items-center justify-between font-mono-code text-xs mb-3">
                    <span className={isCurrent ? 'text-[#c8ff00]' : 'text-[#8a8a86]'}>
                      {stage.index}
                    </span>
                    {idx < PROCESS_STAGES.length - 1 && (
                      <ArrowRight
                        className={`w-3.5 h-3.5 ${
                          isCurrent ? 'text-[#c8ff00]' : 'text-[#8a8a86]/50'
                        }`}
                      />
                    )}
                  </div>
                  <p
                    className={`font-display text-xl md:text-2xl font-extrabold tracking-tight ${
                      isCurrent ? 'text-[#c8ff00]' : 'text-[#f2f2f0]'
                    }`}
                  >
                    {stage.title}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Monumental Transforming Stage Display */}
        <div className="relative border border-[#f2f2f0]/15 bg-[#111111] p-8 md:p-14 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center overflow-hidden">
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-3 font-mono-code text-xs tracking-[0.2em] text-[#c8ff00]">
              <span>STAGE {activeStage.index} / 06</span>
              <span aria-hidden="true">·</span>
              <span>{activeStage.verb}</span>
            </div>

            <h2 className="font-display text-6xl sm:text-7xl md:text-8xl font-extrabold tracking-tighter text-[#f2f2f0] leading-none">
              {activeStage.title}
              <span className="text-[#c8ff00]">.</span>
            </h2>

            <p className="max-w-xl font-sans-body text-lg md:text-xl text-[#f2f2f0]/90 leading-relaxed">
              {activeStage.synopsis}
            </p>
          </div>

          <div className="lg:col-span-5 flex flex-col justify-between gap-6 border-t lg:border-t-0 lg:border-l border-[#f2f2f0]/12 pt-6 lg:pt-0 lg:pl-10">
            <div>
              <p className="font-mono-code text-xs tracking-[0.18em] text-[#8a8a86] mb-2">
                DELIVERABLE ARTIFACTS
              </p>
              <p className="font-mono-code text-sm text-[#f2f2f0]">{activeStage.artifact}</p>
            </div>

            <div>
              <p className="font-mono-code text-xs tracking-[0.18em] text-[#8a8a86] mb-2">
                SYSTEM INVARIANT
              </p>
              <p className="font-display text-3xl font-bold text-[#c8ff00] tabular-nums">
                {activeStage.metric}
              </p>
            </div>

            <div className="pt-4 border-t border-[#f2f2f0]/12 flex items-center justify-between">
              <span className="font-mono-code text-xs text-[#8a8a86]">
                SCROLL OR CLICK ANY STAGE TO MORPH
              </span>
              <button
                type="button"
                onClick={() => setSelectedIdx((activeIndex + 1) % PROCESS_STAGES.length)}
                className="font-mono-code text-xs text-[#c8ff00] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
              >
                NEXT STAGE →
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>
    </section>
  );
});
