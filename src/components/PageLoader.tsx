import React, { useEffect, useState } from 'react';

interface PageLoaderProps {
  onComplete: () => void;
}

const SEQUENCE_STEPS = ['01', '02', '03', '04', '100%'];

export const PageLoader: React.FC<PageLoaderProps> = ({ onComplete }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (params.get('autostart') === '1' || reducedMotion) {
      onComplete();
      return;
    }

    const stepInterval = window.setInterval(() => {
      setStepIndex((prev) => {
        if (prev >= SEQUENCE_STEPS.length - 1) {
          window.clearInterval(stepInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 130);

    const exitTimer = window.setTimeout(() => {
      setIsExiting(true);
    }, 680);

    const doneTimer = window.setTimeout(() => {
      onComplete();
    }, 1000);

    return () => {
      window.clearInterval(stepInterval);
      window.clearTimeout(exitTimer);
      window.clearTimeout(doneTimer);
    };
  }, [onComplete]);

  const currentStep = SEQUENCE_STEPS[stepIndex] ?? '100%';
  const progressPercent = Math.round(((stepIndex + 1) / SEQUENCE_STEPS.length) * 100);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading portfolio experience"
      className={`fixed inset-0 z-50 flex flex-col justify-between bg-[#0a0a0a] p-6 md:p-12 transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] ${
        isExiting ? '-translate-y-full pointer-events-none' : 'translate-y-0'
      }`}
    >
      <div className="flex items-center justify-between border-b border-[#f2f2f0]/12 pb-5">
        <span className="font-mono-code text-xs tracking-[0.22em] text-[#8a8a86]">
          SAKYA ANANDA · PORTFOLIO
        </span>
        <button
          type="button"
          onClick={onComplete}
          className="font-mono-code text-xs tracking-[0.18em] text-[#8a8a86] hover:text-[#f2f2f0] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          SKIP INTRO
        </button>
      </div>

      <div className="my-auto flex flex-col items-start gap-6 max-w-4xl">
        <p className="font-mono-code text-xs md:text-sm tracking-[0.28em] text-[#c8ff00]">
          INITIALIZING EXPERIENCE
        </p>
        <div className="flex items-baseline gap-6 md:gap-12">
          <span className="font-display text-7xl sm:text-8xl md:text-9xl font-extrabold tracking-tighter text-[#f2f2f0] tabular-nums leading-none">
            {currentStep}
          </span>
          <span className="font-mono-code text-xs md:text-sm text-[#8a8a86] tracking-widest">
            FRAME BUFFER · {progressPercent}%
          </span>
        </div>
      </div>

      <div className="w-full space-y-3">
        <div className="h-[1px] w-full bg-[#f2f2f0]/12 overflow-hidden">
          <div
            className="h-full bg-[#c8ff00] transition-all duration-150 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between font-mono-code text-[11px] tracking-[0.2em] text-[#8a8a86]">
          <span>JAKARTA, ID · 06°12&apos;S 106°50&apos;E</span>
          <span>MOTION · SPATIAL UI · SYSTEMS</span>
        </div>
      </div>
    </div>
  );
};
