import React, { useEffect, useRef, useState } from 'react';
import { SELECTED_PROJECTS, PortfolioProject } from '../data/portfolioData';
import {
  clamp,
  computeHorizontalStageMetrics,
  smootherStep,
  stepUnderdampedSpring,
} from '../utils/motionMath';
import { ProjectVisualStage } from './ProjectVisualStage';
import { ErrorBoundary } from './ErrorBoundary';
import { ArrowUpRight, X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

interface WorkSectionProps {
  sectionProgress: number; // 0 to 1 across Chapter 03 horizontal runway
  entranceProgress?: number; // 0 to 1 as Chapter 03 enters the viewport
  onSelectProjectStage?: (stageIndex: number) => void;
  onScrollToY?: (targetY: number) => void;
}

export const WorkSection: React.FC<WorkSectionProps> = React.memo(
  ({ sectionProgress, entranceProgress = 1, onSelectProjectStage, onScrollToY }) => {
    const sectionRef = useRef<HTMLElement | null>(null);
    const [activeModalProject, setActiveModalProject] = useState<PortfolioProject | null>(null);
    const [isSectionVisible, setIsSectionVisible] = useState<boolean>(true);

    const stageCount = SELECTED_PROJECTS.length;
    const metrics = computeHorizontalStageMetrics(sectionProgress, stageCount);
    const ep = clamp(entranceProgress, 0, 1);
    const easedEntrance = smootherStep(0, 1, ep);
    const blueprintDashOffset = Number(((1 - easedEntrance) * 1400).toFixed(1));

    const [displayContinuousIndex, setDisplayContinuousIndex] = useState<number>(
      metrics.continuousIndex
    );
    const displayIndexRef = useRef<number>(metrics.continuousIndex);
    const displayVelocityRef = useRef<number>(0);
    const targetIndexRef = useRef<number>(metrics.continuousIndex);
    const manualJumpRef = useRef<boolean>(false);
    const rafIdRef = useRef<number>(0);

    // Pause off-screen canvas simulations only when Chapter 03 is far outside viewport
    useEffect(() => {
      const el = sectionRef.current;
      if (!el || typeof IntersectionObserver === 'undefined') {
        setIsSectionVisible(true);
        return;
      }
      const io = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry) {
            setIsSectionVisible(entry.isIntersecting);
          }
        },
        { rootMargin: '600px 0px' }
      );
      io.observe(el);
      return () => io.disconnect();
    }, []);

    // Soft-spring velocity-governed stage interpolation loop: ensures organic elastic cushion and prevents fast-scroll skipping
    const startInterpolationLoop = () => {
      if (rafIdRef.current) return;
      let lastTime = performance.now();

      const tick = (now: number) => {
        const dt = clamp((now - lastTime) * 0.001, 0.004, 0.04);
        lastTime = now;

        const current = displayIndexRef.current;
        const velocity = displayVelocityRef.current;
        const target = targetIndexRef.current;
        const diff = target - current;

        if (Math.abs(diff) < 0.0008 && Math.abs(velocity) < 0.003) {
          displayIndexRef.current = target;
          displayVelocityRef.current = 0;
          manualJumpRef.current = false;
          setDisplayContinuousIndex(target);
          rafIdRef.current = 0;
          return;
        }

        const maxStageSpeed = manualJumpRef.current ? 4.8 : 1.55;
        const stiffness = manualJumpRef.current ? 145 : 118;
        const damping = manualJumpRef.current ? 16.5 : 15;
        const stepped = stepUnderdampedSpring(
          current,
          velocity,
          target,
          dt,
          stiffness,
          damping,
          maxStageSpeed
        );

        const clampedVal = clamp(stepped.value, 0, stageCount - 1);
        displayIndexRef.current = clampedVal;
        displayVelocityRef.current = stepped.velocity;
        setDisplayContinuousIndex(clampedVal);
        rafIdRef.current = window.requestAnimationFrame(tick);
      };
      rafIdRef.current = window.requestAnimationFrame(tick);
    };

    useEffect(() => {
      targetIndexRef.current = metrics.continuousIndex;
      if (Math.abs(targetIndexRef.current - displayIndexRef.current) >= 0.001) {
        startInterpolationLoop();
      }
    }, [metrics.continuousIndex]);

    useEffect(() => {
      return () => {
        if (rafIdRef.current) {
          window.cancelAnimationFrame(rafIdRef.current);
        }
      };
    }, []);

    const safeContinuousIndex = Number.isFinite(displayContinuousIndex)
      ? clamp(displayContinuousIndex, 0, stageCount - 1)
      : 0;
    const activeStageIndex = clamp(Math.round(safeContinuousIndex), 0, stageCount - 1);
    const currentProject = SELECTED_PROJECTS[activeStageIndex] ?? SELECTED_PROJECTS[0];

    const handleStageButton = (idx: number) => {
      const safeIdx = clamp(idx, 0, stageCount - 1);
      manualJumpRef.current = true;
      targetIndexRef.current = safeIdx;
      startInterpolationLoop();

      const el = sectionRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const absTop = window.scrollY + rect.top;
        const scrollableDistance = Math.max(1, el.offsetHeight - window.innerHeight);
        const targetProgress = safeIdx / Math.max(1, stageCount - 1);
        const targetScrollY = absTop + targetProgress * scrollableDistance;
        if (onScrollToY) {
          onScrollToY(targetScrollY);
        } else {
          window.scrollTo({ top: targetScrollY });
        }
      }
      if (onSelectProjectStage) {
        onSelectProjectStage(safeIdx);
      }
    };

    // Keyboard ArrowLeft / ArrowRight navigation across project stages
    useEffect(() => {
      if (!isSectionVisible || activeModalProject) return;
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowRight') {
          handleStageButton(Math.min(stageCount - 1, activeStageIndex + 1));
        } else if (e.key === 'ArrowLeft') {
          handleStageButton(Math.max(0, activeStageIndex - 1));
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isSectionVisible, activeModalProject, activeStageIndex]);

    // Modal Escape key dismissal
    useEffect(() => {
      if (!activeModalProject) return;
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setActiveModalProject(null);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeModalProject]);

    return (
      <section
        id="work"
        ref={sectionRef}
        aria-label="Chapter 03 Selected Work"
        className="relative min-h-[440vh] w-full bg-[#0a0a0a]/85 bg-architectural-grid border-t border-[#f2f2f0]/12"
      >
        {/* Sticky Fullscreen Spatial Viewport with Progressive Blueprint Frame */}
        <div
          className="sticky top-0 flex h-screen w-full flex-col justify-between overflow-hidden px-6 pt-20 pb-8 md:px-12 md:pt-24 md:pb-10 bg-[#0a0a0a]/90"
        >
          {/* SVG Line-Drawing Blueprint Frame inside Sticky Stage */}
          <svg
            aria-hidden="true"
            viewBox="0 0 1440 900"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 h-full w-full"
          >
            <rect
              x="24"
              y="72"
              width="1392"
              height="796"
              fill="none"
              stroke="#c8ff00"
              strokeOpacity={0.14 + (1 - easedEntrance) * 0.35}
              strokeWidth="1.2"
              strokeDasharray="1400"
              strokeDashoffset={blueprintDashOffset}
            />
            <path
              d="M 24 140 L 1416 140 M 24 812 L 1416 812"
              stroke="#f2f2f0"
              strokeOpacity="0.06"
              strokeWidth="1"
              strokeDasharray="1400"
              strokeDashoffset={blueprintDashOffset}
            />
          </svg>

          {/* Top Stage Bar */}
          <div className="relative z-20 flex flex-wrap items-center justify-between gap-4 border-b border-[#f2f2f0]/12 pb-4">
            <div className="flex items-center gap-3 md:gap-4 font-mono-code text-xs tracking-[0.2em] text-[#8a8a86]">
              <span className="text-[#c8ff00] font-semibold">03.</span>
              <span>CHAPTER THREE · SELECTED WORK</span>
              <span aria-hidden="true" className="hidden sm:inline">
                ·
              </span>
              <span className="hidden sm:inline text-[#f2f2f0] tabular-nums">
                STAGE {currentProject.number} OF 0{stageCount}
              </span>
              <span aria-hidden="true" className="hidden lg:inline">
                ·
              </span>
              <span className="hidden lg:inline text-[#c8ff00]/80 tabular-nums">
                PORTAL SYNC {Math.round(easedEntrance * 100)}%
              </span>
            </div>

            {/* Interactive Stage Switcher Controls */}
            <div
              role="tablist"
              aria-label="Select project stage"
              className="flex flex-wrap items-center gap-1.5"
            >
              {SELECTED_PROJECTS.map((proj, idx) => {
                const isCurrent = activeStageIndex === idx;
                return (
                  <button
                    key={proj.id}
                    type="button"
                    role="tab"
                    aria-selected={isCurrent}
                    onClick={() => handleStageButton(idx)}
                    data-cursor-label={proj.number}
                    className={`px-3 py-1.5 font-mono-code text-xs transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                      isCurrent
                        ? 'bg-[#c8ff00] text-[#0a0a0a] font-semibold border border-[#c8ff00]'
                        : 'text-[#8a8a86] hover:text-[#f2f2f0] hover:border-[#f2f2f0]/35 border border-[#f2f2f0]/12 bg-[#111111]/60'
                    }`}
                  >
                    {proj.number} · {proj.title}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Horizontal Spatial Gallery Track (100%-width viewport stage — zero oversized GPU textures) */}
          <div className="relative my-auto w-full overflow-hidden py-2">
            <div className="relative w-full">
              {SELECTED_PROJECTS.map((project, idx) => {
                const delta = safeContinuousIndex - idx;
                const absDelta = Math.abs(delta);
                const offsetPct = Number(((idx - safeContinuousIndex) * 103).toFixed(3));
                const scale = clamp(1 - absDelta * 0.04, 0.94, 1);
                const opacity = clamp(1 - absDelta * 0.14, 0.88, 1);
                const parallaxX = Number((delta * 24).toFixed(2));
                const isStageActive = idx === activeStageIndex;
                const isNearViewport = absDelta <= 1.25;
                // Keep active and adjacent stages animating so canvas is always live during transitions
                const shouldAnimateStage = isSectionVisible && isNearViewport;

                return (
                  <article
                    key={project.id}
                    aria-label={`Project ${project.number} ${project.title}`}
                    aria-hidden={!isStageActive}
                    className={`${
                      idx === 0 ? 'relative w-full' : 'absolute inset-0 w-full'
                    } px-1 md:px-3`}
                    style={{
                      transform: `translate3d(${offsetPct}%, 0, 0) scale(${scale.toFixed(4)})`,
                      opacity: isNearViewport ? Number(opacity.toFixed(4)) : 0,
                      visibility: isNearViewport ? 'visible' : 'hidden',
                      pointerEvents: isStageActive ? 'auto' : 'none',
                      zIndex: isStageActive ? 10 : 5,
                    }}
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-stretch h-full">
                      {/* Left Column: Monumental Number, Typography & Architecture Metadata */}
                      <div className="lg:col-span-5 flex flex-col justify-between border border-[#f2f2f0]/15 bg-[#111111] p-6 md:p-8 relative overflow-hidden">
                        {/* Top Accent Hairline */}
                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#c8ff00] via-[#c8ff00]/40 to-transparent" />

                        <div className="space-y-4">
                          {/* Metadata Line */}
                          <div className="flex flex-wrap items-center justify-between gap-2 font-mono-code text-xs text-[#8a8a86]">
                            <div className="flex items-center gap-2">
                              <span className="text-[#c8ff00] font-semibold">{project.number}</span>
                              <span aria-hidden="true">·</span>
                              <span className="text-[#f2f2f0]/90">{project.category}</span>
                            </div>
                            <span className="text-[#8a8a86] tabular-nums">
                              {project.location} · {project.year}
                            </span>
                          </div>

                          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#f2f2f0] leading-[0.95]">
                            {project.title}
                          </h2>

                          <p className="font-serif-editorial italic text-xl md:text-2xl text-[#c8ff00]">
                            {project.subtitle}
                          </p>

                          <p className="font-sans-body text-sm md:text-base text-[#8a8a86] leading-relaxed">
                            {project.description}
                          </p>
                        </div>

                        <div className="mt-6 pt-5 border-t border-[#f2f2f0]/12 space-y-5">
                          {/* Unboxed Technology Line */}
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono-code text-xs text-[#f2f2f0]/80">
                            {project.technologies.map((tech, tIdx) => (
                              <React.Fragment key={tech}>
                                <span>{tech}</span>
                                {tIdx < project.technologies.length - 1 && (
                                  <span aria-hidden="true" className="text-[#8a8a86]">
                                    /
                                  </span>
                                )}
                              </React.Fragment>
                            ))}
                          </div>

                          {/* Quantitative Metrics Strip */}
                          <div className="grid grid-cols-3 gap-4 border-y border-[#f2f2f0]/12 py-3">
                            {project.metrics.map((m) => (
                              <div key={m.label}>
                                <p className="font-mono-code text-[10px] uppercase tracking-wider text-[#8a8a86]">
                                  {m.label}
                                </p>
                                <p className="font-mono-code text-sm md:text-base font-semibold text-[#f2f2f0] tabular-nums">
                                  {m.value}
                                </p>
                              </div>
                            ))}
                          </div>

                          <div className="flex items-center justify-between gap-4">
                            <button
                              type="button"
                              onClick={() => setActiveModalProject(project)}
                              data-cursor-label="VIEW"
                              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#c8ff00] text-[#0a0a0a] font-mono-code text-xs font-semibold tracking-[0.16em] hover:bg-[#f2f2f0] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                            >
                              <span>INSPECT ARCHITECTURE</span>
                              <ArrowUpRight className="w-4 h-4" />
                            </button>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                aria-label="Previous project stage"
                                disabled={idx === 0}
                                onClick={() => handleStageButton(Math.max(0, idx - 1))}
                                className="p-2 border border-[#f2f2f0]/15 text-[#f2f2f0] disabled:opacity-30 hover:border-[#c8ff00] hover:text-[#c8ff00] transition-colors cursor-pointer"
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                aria-label="Next project stage"
                                disabled={idx === stageCount - 1}
                                onClick={() => handleStageButton(Math.min(stageCount - 1, idx + 1))}
                                className="p-2 border border-[#f2f2f0]/15 text-[#f2f2f0] disabled:opacity-30 hover:border-[#c8ff00] hover:text-[#c8ff00] transition-colors cursor-pointer"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Column: Large Interactive 60FPS Visual Stage */}
                      <div className="lg:col-span-7 flex flex-col">
                        <div className="flex items-center justify-between border border-b-0 border-[#f2f2f0]/15 bg-[#111111] px-4 py-2 font-mono-code text-[10px] tracking-[0.16em] text-[#8a8a86]">
                          <span className="inline-flex items-center gap-1.5 text-[#f2f2f0]/90">
                            <Sparkles className="w-3 h-3 text-[#c8ff00]" />
                            INTERACTIVE SIMULATION STAGE · {project.category.toUpperCase()}
                          </span>
                          <span className="text-[#c8ff00] tabular-nums">
                            STAGE {project.number} / 0{stageCount}
                          </span>
                        </div>
                        <div className="flex-1 flex flex-col">
                          <ErrorBoundary fallbackTitle={`STAGE ${project.number} SIMULATION RECOVERY`}>
                            <ProjectVisualStage
                              project={project}
                              isActive={isStageActive}
                              shouldAnimate={shouldAnimateStage}
                              parallaxX={parallaxX}
                            />
                          </ErrorBoundary>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          {/* Bottom Horizontal Scroll Progress Rail */}
          <div className="relative z-20 flex items-center justify-between gap-6 border-t border-[#f2f2f0]/12 pt-4">
            <span className="font-mono-code text-xs text-[#8a8a86] whitespace-nowrap shrink-0">
              VERTICAL SCROLL DRIVES HORIZONTAL STAGE
            </span>
            <div className="w-full max-w-md h-[2px] bg-[#f2f2f0]/12 overflow-hidden">
              <div
                className="h-full bg-[#c8ff00]"
                style={{
                  width: `${Math.round(((displayContinuousIndex + 1) / stageCount) * 100)}%`,
                }}
              />
            </div>
            <span className="font-mono-code text-xs text-[#f2f2f0] tabular-nums whitespace-nowrap shrink-0">
              0{activeStageIndex + 1} / 0{stageCount}
            </span>
          </div>
        </div>

        {/* Fullscreen Case Study Lightbox Modal */}
        {activeModalProject && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${activeModalProject.title} Architecture Case Study`}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setActiveModalProject(null);
              }
            }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0a]/95 backdrop-blur-xl p-4 md:p-10 overflow-y-auto"
          >
            <div className="relative w-full max-w-5xl border border-[#f2f2f0]/24 bg-[#111111] p-6 md:p-10 my-auto space-y-8">
              <div className="flex items-start justify-between gap-4 border-b border-[#f2f2f0]/12 pb-6">
                <div>
                  <div className="flex items-center gap-2 font-mono-code text-xs text-[#c8ff00]">
                    <span>CASE STUDY {activeModalProject.number}</span>
                    <span aria-hidden="true">·</span>
                    <span>{activeModalProject.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{activeModalProject.year}</span>
                  </div>
                  <h3 className="mt-2 font-display text-3xl md:text-5xl font-extrabold text-[#f2f2f0]">
                    {activeModalProject.title}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveModalProject(null)}
                  aria-label="Close Case Study Modal"
                  data-cursor-label="CLOSE"
                  className="inline-flex items-center gap-2 px-4 py-2 border border-[#f2f2f0]/24 font-mono-code text-xs text-[#f2f2f0] hover:border-[#c8ff00] hover:text-[#c8ff00] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>CLOSE</span>
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7 space-y-4">
                  <div className="h-64 md:h-80">
                    <ProjectVisualStage
                      project={activeModalProject}
                      isActive={true}
                      shouldAnimate={true}
                      parallaxX={0}
                    />
                  </div>
                  <p className="font-sans-body text-sm md:text-base text-[#f2f2f0]/90 leading-relaxed">
                    {activeModalProject.architectureSummary}
                  </p>
                </div>

                <div className="lg:col-span-5 flex flex-col justify-between space-y-6 border-t lg:border-t-0 lg:border-l border-[#f2f2f0]/12 pt-6 lg:pt-0 lg:pl-8">
                  <div className="space-y-4">
                    <h4 className="font-mono-code text-xs tracking-[0.2em] text-[#c8ff00] uppercase">
                      SYSTEM ARCHITECTURE HIGHLIGHTS
                    </h4>
                    <ul className="space-y-3 font-sans-body text-sm text-[#8a8a86]">
                      {activeModalProject.systemHighlights.map((highlight) => (
                        <li key={highlight} className="text-[#f2f2f0]/90 leading-relaxed">
                          — {highlight}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-3 border-t border-[#f2f2f0]/12 pt-4">
                    <h4 className="font-mono-code text-xs tracking-[0.2em] text-[#8a8a86]">
                      PERFORMANCE BENCHMARKS
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      {activeModalProject.metrics.map((metric) => (
                        <div key={metric.label} className="border border-[#f2f2f0]/12 p-3">
                          <p className="font-mono-code text-[10px] text-[#8a8a86]">{metric.label}</p>
                          <p className="font-mono-code text-sm font-bold text-[#c8ff00] tabular-nums">
                            {metric.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    );
  }
);
