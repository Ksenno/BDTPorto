import React, { useEffect, useRef, useState } from 'react';

export const CustomCursor: React.FC = React.memo(() => {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [cursorLabel, setCursorLabel] = useState<string>('');
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isPrecision, setIsPrecision] = useState<boolean>(false);
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [hasMoved, setHasMoved] = useState<boolean>(false);

  useEffect(() => {
    const isCoarse = window.matchMedia('(pointer: coarse)').matches;
    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isCoarse || isReduced) {
      setIsEnabled(false);
      return;
    }
    setIsEnabled(true);

    let targetX = -100;
    let targetY = -100;
    let currentX = targetX;
    let currentY = targetY;
    let vx = 0;
    let vy = 0;
    let lastTime = performance.now();
    let rafId = 0;
    let isLoopRunning = false;
    let hasMovedLocal = false;
    let lastTargetEl: EventTarget | null = null;

    const evaluateElementTarget = (targetEl: HTMLElement | null) => {
      if (!targetEl || typeof targetEl.closest !== 'function') {
        setCursorLabel((prev) => (prev !== '' ? '' : prev));
        setIsHovered((prev) => (prev !== false ? false : prev));
        setIsPrecision((prev) => (prev !== false ? false : prev));
        return;
      }

      const precisionAncestor = targetEl.closest('[data-cursor-precision]') as HTMLElement | null;
      const labeledAncestor = targetEl.closest('[data-cursor-label]') as HTMLElement | null;
      const interactiveAncestor = targetEl.closest('button, a, [role="button"], input, select');

      if (precisionAncestor && !interactiveAncestor) {
        setCursorLabel((prev) => (prev !== '' ? '' : prev));
        setIsHovered((prev) => (prev !== false ? false : prev));
        setIsPrecision((prev) => (prev !== true ? true : prev));
      } else if (labeledAncestor) {
        const label = labeledAncestor.getAttribute('data-cursor-label') || '';
        setCursorLabel((prev) => (prev !== label ? label : prev));
        setIsHovered((prev) => (prev !== true ? true : prev));
        setIsPrecision((prev) => (prev !== false ? false : prev));
      } else if (interactiveAncestor) {
        setCursorLabel((prev) => (prev !== '' ? '' : prev));
        setIsHovered((prev) => (prev !== true ? true : prev));
        setIsPrecision((prev) => (prev !== false ? false : prev));
      } else {
        setCursorLabel((prev) => (prev !== '' ? '' : prev));
        setIsHovered((prev) => (prev !== false ? false : prev));
        setIsPrecision((prev) => (prev !== false ? false : prev));
      }
    };

    const tick = (now: number) => {
      const dt = Math.min(0.035, Math.max(0.004, (now - lastTime) * 0.001));
      lastTime = now;

      const dx = targetX - currentX;
      const dy = targetY - currentY;
      const stiffness = 240;
      const damping = 18.5;

      vx += (dx * stiffness - vx * damping) * dt;
      vy += (dy * stiffness - vy * damping) * dt;
      currentX += vx * dt;
      currentY += vy * dt;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${currentX.toFixed(1)}px, ${currentY.toFixed(1)}px, 0) translate(-50%, -50%)`;
      }

      if (Math.hypot(dx, dy) > 0.15 || Math.hypot(vx, vy) > 1.5) {
        rafId = window.requestAnimationFrame(tick);
      } else {
        currentX = targetX;
        currentY = targetY;
        vx = 0;
        vy = 0;
        isLoopRunning = false;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!hasMovedLocal) {
        hasMovedLocal = true;
        currentX = targetX;
        currentY = targetY;
        setHasMoved(true);
      }

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) translate(-50%, -50%)`;
      }

      if (e.target !== lastTargetEl) {
        lastTargetEl = e.target;
        evaluateElementTarget(e.target as HTMLElement | null);
      }

      if (!isLoopRunning) {
        isLoopRunning = true;
        lastTime = performance.now();
        rafId = window.requestAnimationFrame(tick);
      }
    };

    const handleClick = (e: MouseEvent) => {
      window.requestAnimationFrame(() => {
        const elAfterClick = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
        lastTargetEl = elAfterClick;
        evaluateElementTarget(elAfterClick);
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('click', handleClick, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  if (!isEnabled || !hasMoved) return null;

  const hasLabel = cursorLabel.length > 0;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden hidden lg:block"
      aria-hidden="true"
    >
      {/* Central precision dot */}
      <div
        ref={dotRef}
        className={`fixed top-0 left-0 rounded-full bg-[#c8ff00] will-change-transform transition-opacity duration-150 ${
          hasLabel ? 'w-1.5 h-1.5 opacity-0' : 'w-1.5 h-1.5 opacity-100'
        }`}
      />
      {/* Spring inertia outer ring */}
      <div
        ref={ringRef}
        className={`fixed top-0 left-0 flex items-center justify-center rounded-full border will-change-transform transition-[width,height,background-color,border-color,opacity] duration-200 ease-out ${
          isPrecision
            ? 'w-5 h-5 bg-transparent border-[#c8ff00]/50 opacity-60'
            : hasLabel
            ? 'w-20 h-20 bg-[#c8ff00] border-[#c8ff00] text-[#0a0a0a]'
            : isHovered
            ? 'w-12 h-12 bg-[#f2f2f0]/10 border-[#c8ff00]/80'
            : 'w-8 h-8 bg-transparent border-[#f2f2f0]/35'
        }`}
      >
        {hasLabel && !isPrecision && (
          <span className="font-mono-code text-[10px] font-semibold tracking-[0.18em] text-[#0a0a0a] uppercase select-none">
            {cursorLabel}
          </span>
        )}
      </div>
    </div>
  );
});
