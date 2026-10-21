import React, { useCallback, useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import { PageLoader } from './components/PageLoader';
import { CustomCursor } from './components/CustomCursor';
import { Navigation } from './components/Navigation';
import { BlueprintConstellationBg } from './components/BlueprintConstellationBg';
import { IntroSection } from './components/IntroSection';
import { IdentitySection } from './components/IdentitySection';
import { WorkSection } from './components/WorkSection';
import { ExperimentSection } from './components/ExperimentSection';
import { ProcessSection } from './components/ProcessSection';
import { AboutSection } from './components/AboutSection';
import { FooterEnding } from './components/FooterEnding';
import {
  CHAPTER_BOUNDARIES,
  ChapterProgressInfo,
  clamp,
  compressWheelDelta,
  computeChapterFromScroll,
  stepUnderdampedSpring,
} from './utils/motionMath';

interface SectionProgressMap {
  intro: number;
  identity: number;
  work: number;
  workEntrance: number;
  lab: number;
  process: number;
  about: number;
  ending: number;
}

const CHAPTER_SECTION_IDS = ['intro', 'identity', 'work', 'lab', 'process', 'about', 'ending'] as const;

export default function App() {
  const [isLoaded, setIsLoaded] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('autostart') === '1';
    }
    return false;
  });

  const [globalScroll, setGlobalScroll] = useState<number>(0);
  const [activeChapterState, setActiveChapterState] = useState<ChapterProgressInfo>(() =>
    computeChapterFromScroll(0)
  );
  const [sectionProgress, setSectionProgress] = useState<SectionProgressMap>({
    intro: 0,
    identity: 0,
    work: 0,
    workEntrance: 0,
    lab: 0,
    process: 0,
    about: 0,
    ending: 0,
  });

  const lenisRef = useRef<Lenis | null>(null);
  const scrollRafRef = useRef<number>(0);
  const governorRafRef = useRef<number>(0);

  const targetGlobalRef = useRef<number>(0);
  const smoothedGlobalRef = useRef<number>(0);
  const globalVelRef = useRef<number>(0);

  const targetProgressRef = useRef<SectionProgressMap>({
    intro: 0,
    identity: 0,
    work: 0,
    workEntrance: 0,
    lab: 0,
    process: 0,
    about: 0,
    ending: 0,
  });

  const smoothedProgressRef = useRef<SectionProgressMap>({
    intro: 0,
    identity: 0,
    work: 0,
    workEntrance: 0,
    lab: 0,
    process: 0,
    about: 0,
    ending: 0,
  });

  const progressVelRef = useRef<SectionProgressMap>({
    intro: 0,
    identity: 0,
    work: 0,
    workEntrance: 0,
    lab: 0,
    process: 0,
    about: 0,
    ending: 0,
  });

  const startProgressGovernor = useCallback(() => {
    if (governorRafRef.current) return;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = clamp((now - lastTime) * 0.001, 0.004, 0.045);
      lastTime = now;

      const cur = smoothedProgressRef.current;
      const vel = progressVelRef.current;
      const tgt = targetProgressRef.current;

      // Soft underdamped spring with strict slew-rate velocity caps per chapter:
      // Normal scrolling glides with organic inertia; fast scrolling caps animation speed so nothing is skipped
      const sIntro = stepUnderdampedSpring(cur.intro, vel.intro, tgt.intro, dt, 135, 16.5, 0.78);
      const sIdentity = stepUnderdampedSpring(cur.identity, vel.identity, tgt.identity, dt, 125, 16, 0.68);
      const sWork = stepUnderdampedSpring(cur.work, vel.work, tgt.work, dt, 130, 17, 0.36);
      const sWorkEnt = stepUnderdampedSpring(cur.workEntrance, vel.workEntrance, tgt.workEntrance, dt, 135, 16.5, 0.9);
      const sLab = stepUnderdampedSpring(cur.lab, vel.lab, tgt.lab, dt, 125, 16, 0.68);
      const sProcess = stepUnderdampedSpring(cur.process, vel.process, tgt.process, dt, 125, 16.5, 0.56);
      const sAbout = stepUnderdampedSpring(cur.about, vel.about, tgt.about, dt, 125, 16, 0.68);
      const sEnding = stepUnderdampedSpring(cur.ending, vel.ending, tgt.ending, dt, 135, 16.5, 0.78);

      const next: SectionProgressMap = {
        intro: clamp(sIntro.value, 0, 1),
        identity: clamp(sIdentity.value, 0, 1),
        work: clamp(sWork.value, 0, 1),
        workEntrance: clamp(sWorkEnt.value, 0, 1),
        lab: clamp(sLab.value, 0, 1),
        process: clamp(sProcess.value, 0, 1),
        about: clamp(sAbout.value, 0, 1),
        ending: clamp(sEnding.value, 0, 1),
      };

      progressVelRef.current = {
        intro: sIntro.velocity,
        identity: sIdentity.velocity,
        work: sWork.velocity,
        workEntrance: sWorkEnt.velocity,
        lab: sLab.velocity,
        process: sProcess.velocity,
        about: sAbout.velocity,
        ending: sEnding.velocity,
      };

      const sGlobal = stepUnderdampedSpring(
        smoothedGlobalRef.current,
        globalVelRef.current,
        targetGlobalRef.current,
        dt,
        140,
        17.5,
        0.55
      );
      const nextGlobal = clamp(sGlobal.value, 0, 1);
      smoothedGlobalRef.current = nextGlobal;
      globalVelRef.current = sGlobal.velocity;
      smoothedProgressRef.current = next;

      setGlobalScroll((prev) => (Math.abs(prev - nextGlobal) >= 0.001 ? nextGlobal : prev));

      setSectionProgress((prev) => {
        if (
          Math.abs(prev.intro - next.intro) < 0.0005 &&
          Math.abs(prev.identity - next.identity) < 0.0005 &&
          Math.abs(prev.work - next.work) < 0.0005 &&
          Math.abs(prev.workEntrance - next.workEntrance) < 0.0005 &&
          Math.abs(prev.lab - next.lab) < 0.0005 &&
          Math.abs(prev.process - next.process) < 0.0005 &&
          Math.abs(prev.about - next.about) < 0.0005 &&
          Math.abs(prev.ending - next.ending) < 0.0005
        ) {
          return prev;
        }
        return next;
      });

      const remaining =
        Math.abs(nextGlobal - targetGlobalRef.current) +
        Math.abs(sGlobal.velocity) * 0.05 +
        Math.abs(next.intro - tgt.intro) +
        Math.abs(next.identity - tgt.identity) +
        Math.abs(next.work - tgt.work) +
        Math.abs(next.workEntrance - tgt.workEntrance) +
        Math.abs(next.lab - tgt.lab) +
        Math.abs(next.process - tgt.process) +
        Math.abs(next.about - tgt.about) +
        Math.abs(next.ending - tgt.ending);

      if (remaining > 0.0012) {
        governorRafRef.current = window.requestAnimationFrame(tick);
      } else {
        governorRafRef.current = 0;
      }
    };

    governorRafRef.current = window.requestAnimationFrame(tick);
  }, []);

  const measureScrollProgress = useCallback(
    (immediateSync = false) => {
      const docEl = document.documentElement;
      const vh = window.innerHeight;
      const maxScroll = Math.max(1, docEl.scrollHeight - vh);
      const currentScroll = window.scrollY;
      const ratio = Number(clamp(currentScroll / maxScroll, 0, 1).toFixed(4));

      targetGlobalRef.current = ratio;

      const calcElementProgress = (
        id: string,
        stickyRunway = false,
        leadInVhRatio = 0
      ): number => {
        const el = document.getElementById(id);
        if (!el) return 0;
        const rect = el.getBoundingClientRect();
        if (stickyRunway) {
          const leadInPx = vh * leadInVhRatio;
          const scrollableDistance = Math.max(1, rect.height - vh + leadInPx);
          return Number(clamp((leadInPx - rect.top) / scrollableDistance, 0, 1).toFixed(4));
        }
        const totalTravel = Math.max(1, rect.height + vh);
        return Number(clamp((vh - rect.top) / totalTravel, 0, 1).toFixed(4));
      };

      const calcViewportEntrance = (id: string): number => {
        const el = document.getElementById(id);
        if (!el) return 1;
        const rect = el.getBoundingClientRect();
        return Number(clamp((vh - rect.top) / Math.max(1, vh * 0.85), 0, 1).toFixed(3));
      };

      const nextTargets: SectionProgressMap = {
        intro: calcElementProgress('intro', true, 0),
        identity: calcElementProgress('identity', false),
        work: calcElementProgress('work', true, 0),
        workEntrance: calcViewportEntrance('work'),
        lab: calcElementProgress('lab', false),
        process: calcElementProgress('process', true, 0.28),
        about: calcElementProgress('about', false),
        ending: calcElementProgress('ending', false),
      };

      targetProgressRef.current = nextTargets;

      // Determine active chapter accurately from actual DOM viewport position
      const probeY = vh * 0.42;
      let detectedChapterIdx = -1;
      for (let i = 0; i < CHAPTER_SECTION_IDS.length; i++) {
        const el = document.getElementById(CHAPTER_SECTION_IDS[i]);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (r.top <= probeY && r.bottom >= probeY) {
          detectedChapterIdx = i;
          break;
        }
      }

      if (detectedChapterIdx >= 0) {
        const def = CHAPTER_BOUNDARIES[detectedChapterIdx];
        const key = def.id as keyof SectionProgressMap;
        const localProg = clamp(nextTargets[key] ?? 0, 0, 1);
        setActiveChapterState((prev) => {
          if (prev.code === def.code && Math.abs(prev.localProgress - localProg) < 0.01) {
            return prev;
          }
          return {
            index: detectedChapterIdx,
            code: def.code,
            label: def.label,
            id: def.id,
            localProgress: Number(localProg.toFixed(3)),
            isEnding: def.code === '07',
          };
        });
      } else {
        setActiveChapterState(computeChapterFromScroll(ratio));
      }

      if (immediateSync) {
        smoothedGlobalRef.current = ratio;
        smoothedProgressRef.current = nextTargets;
        setGlobalScroll(ratio);
        setSectionProgress(nextTargets);
      } else {
        startProgressGovernor();
      }
    },
    [startProgressGovernor]
  );

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let rafId = 0;

    const isNearScrollCheckpoint = (): boolean => {
      const vh = window.innerHeight;
      for (let i = 0; i < CHAPTER_SECTION_IDS.length; i++) {
        const el = document.getElementById(CHAPTER_SECTION_IDS[i]);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        // Near chapter entrance lock zone
        if (Math.abs(r.top) < vh * 0.14) {
          return true;
        }
      }
      // Also check if inside #work or #process sticky stage center
      const workEl = document.getElementById('work');
      if (workEl) {
        const wr = workEl.getBoundingClientRect();
        if (wr.top <= 0 && wr.bottom >= vh) {
          const span = Math.max(1, wr.height - vh);
          const stageFloat = (-wr.top / span) * 4;
          if (Math.abs(stageFloat - Math.round(stageFloat)) < 0.18) {
            return true;
          }
        }
      }
      const procEl = document.getElementById('process');
      if (procEl) {
        const pr = procEl.getBoundingClientRect();
        if (pr.top <= 0 && pr.bottom >= vh) {
          return true;
        }
      }
      return false;
    };

    if (!reducedMotion) {
      const lenis = new Lenis({
        lerp: 0.085,
        smoothWheel: true,
        wheelMultiplier: 0.78,
        touchMultiplier: 1.05,
        virtualScroll: (data) => {
          data.deltaY = compressWheelDelta(data.deltaY, isNearScrollCheckpoint());
          return true;
        },
      });
      lenisRef.current = lenis;

      const raf = (time: number) => {
        lenis.raf(time);
        rafId = window.requestAnimationFrame(raf);
      };
      rafId = window.requestAnimationFrame(raf);
    }

    const scheduleScrollMeasure = () => {
      if (scrollRafRef.current) return;
      scrollRafRef.current = window.requestAnimationFrame(() => {
        scrollRafRef.current = 0;
        measureScrollProgress(false);
      });
    };

    window.addEventListener('scroll', scheduleScrollMeasure, { passive: true });
    window.addEventListener('resize', scheduleScrollMeasure, { passive: true });
    measureScrollProgress(true);

    return () => {
      window.removeEventListener('scroll', scheduleScrollMeasure);
      window.removeEventListener('resize', scheduleScrollMeasure);
      if (rafId) window.cancelAnimationFrame(rafId);
      if (scrollRafRef.current) window.cancelAnimationFrame(scrollRafRef.current);
      if (governorRafRef.current) window.cancelAnimationFrame(governorRafRef.current);
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
      }
    };
  }, [measureScrollProgress]);

  const handleNavigate = useCallback((sectionId: string) => {
    const target = document.getElementById(sectionId);
    if (!target) return;
    if (lenisRef.current) {
      lenisRef.current.scrollTo(target, { duration: 1.15 });
    } else {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const handleExploreNext = useCallback(() => {
    handleNavigate('identity');
  }, [handleNavigate]);

  const handleScrollTop = useCallback(() => {
    handleNavigate('intro');
  }, [handleNavigate]);

  const handleScrollToY = useCallback(
    (targetY: number) => {
      if (lenisRef.current) {
        lenisRef.current.scrollTo(targetY, { immediate: true });
      }
      window.scrollTo({ top: targetY, behavior: 'auto' });
      measureScrollProgress(true);
    },
    [measureScrollProgress]
  );

  const activeChapter = activeChapterState;

  return (
    <div
      data-loaded={isLoaded ? 'true' : 'false'}
      data-active-chapter={activeChapter.code}
      className="relative min-h-screen w-full bg-[#0a0a0a] text-[#f2f2f0] bg-noise selection:bg-[#c8ff00] selection:text-[#0a0a0a]"
    >
      {!isLoaded && <PageLoader onComplete={() => setIsLoaded(true)} />}

      <CustomCursor />

      {/* Reactive Blueprint Vector Lines & Constellation Background Across All 7 Chapters */}
      <BlueprintConstellationBg
        scrollProgress={globalScroll}
        activeChapter={activeChapter}
      />

      <Navigation
        activeChapter={activeChapter}
        scrollProgress={globalScroll}
        onNavigate={handleNavigate}
      />

      <main className="relative z-10">
        {/* CHAPTER 01 — INTRODUCTION */}
        <IntroSection
          sectionProgress={sectionProgress.intro}
          onExploreNext={handleExploreNext}
        />

        {/* CHAPTER 02 — IDENTITY */}
        <IdentitySection sectionProgress={sectionProgress.identity} />

        {/* CHAPTER 03 — SELECTED WORK (HORIZONTAL SPATIAL STAGE) */}
        <WorkSection
          sectionProgress={sectionProgress.work}
          entranceProgress={sectionProgress.workEntrance}
          onScrollToY={handleScrollToY}
        />

        {/* CHAPTER 04 — EXPERIMENT LAB (001–009) */}
        <ExperimentSection sectionProgress={sectionProgress.lab} />

        {/* CHAPTER 05 — PROCESS (IDEA -> SHIP) */}
        <ProcessSection sectionProgress={sectionProgress.process} />

        {/* CHAPTER 06 — ABOUT */}
        <AboutSection sectionProgress={sectionProgress.about} />
      </main>

      {/* CHAPTER 07 — ENDING */}
      <FooterEnding
        sectionProgress={sectionProgress.ending}
        onScrollTop={handleScrollTop}
      />
    </div>
  );
}
