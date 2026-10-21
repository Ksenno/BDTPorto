import React, { useEffect, useState } from 'react';
import { ChapterProgressInfo } from '../utils/motionMath';
import { X, ArrowUpRight } from 'lucide-react';

interface NavigationProps {
  activeChapter: ChapterProgressInfo;
  scrollProgress: number;
  onNavigate: (sectionId: string) => void;
}

const NAV_CHAPTERS = [
  { code: '01', id: 'intro', title: 'INTRO', subtitle: 'Monumental Typography & Spatial Entry' },
  { code: '02', id: 'identity', title: 'IDENTITY', subtitle: 'Turning Ideas Into Deterministic Systems' },
  { code: '03', id: 'work', title: 'WORK', subtitle: 'Horizontal Spatial Archive (01–05)' },
  { code: '04', id: 'lab', title: 'LAB', subtitle: 'Interactive Sandbox Experiments (001–009)' },
  { code: '05', id: 'process', title: 'PROCESS', subtitle: 'Idea → Breakdown → Build → Break → Ship' },
  { code: '06', id: 'about', title: 'ABOUT', subtitle: 'Creative Developer Capabilities & Focus' },
];

export const Navigation: React.FC<NavigationProps> = ({
  activeChapter,
  scrollProgress,
  onNavigate,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelectChapter = (id: string) => {
    setIsOpen(false);
    onNavigate(id);
  };

  // In Chapter 07 Ending, navigation fades back gently unless index is open or hovered
  const isFadedForEnding = activeChapter.isEnding && !isOpen;

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 flex items-center justify-between gap-8 px-6 py-4 md:px-12 bg-[#0a0a0a]/85 backdrop-blur-md border-b border-[#f2f2f0]/10 transition-all duration-500 ${
          isFadedForEnding
            ? 'opacity-20 hover:opacity-100'
            : 'opacity-100'
        }`}
      >
        {/* Zone 1: Single-line Brand Wordmark */}
        <a
          href="#intro"
          onClick={(e) => {
            e.preventDefault();
            handleSelectChapter('intro');
          }}
          data-cursor-label="TOP"
          className="font-display text-sm md:text-base font-bold tracking-tight text-[#f2f2f0] hover:text-[#c8ff00] transition-colors whitespace-nowrap shrink-0"
        >
          SAKYA ANANDA
        </a>

        {/* Zone 2: Minimal Active Chapter & Continuous Progress Readout */}
        <nav
          aria-label="Chapter progress navigation"
          className="hidden md:flex items-center gap-6 text-xs font-mono-code text-[#8a8a86]"
        >
          {NAV_CHAPTERS.slice(0, 5).map((item) => {
            const isCurrent = activeChapter.id === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleSelectChapter(item.id);
                }}
                className={`transition-colors whitespace-nowrap shrink-0 py-1 ${
                  isCurrent
                    ? 'text-[#f2f2f0] border-b border-[#c8ff00]'
                    : 'text-[#8a8a86] hover:text-[#f2f2f0]'
                }`}
              >
                {item.code} / {item.title}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: Single Primary Action — INDEX Overlay Trigger */}
        <div className="flex items-center gap-4 shrink-0">
          <span
            className="hidden sm:inline-block font-mono-code text-xs text-[#8a8a86] tabular-nums whitespace-nowrap shrink-0"
            aria-hidden="true"
          >
            {Math.round(scrollProgress * 100)
              .toString()
              .padStart(3, '0')}
            %
          </span>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-expanded={isOpen}
            aria-controls="fullscreen-index-drawer"
            data-cursor-label="OPEN"
            className="px-4 py-2 text-xs font-mono-code font-medium tracking-[0.2em] text-[#f2f2f0] border border-[#f2f2f0]/24 bg-[#0a0a0a]/80 backdrop-blur-md hover:border-[#c8ff00] hover:text-[#c8ff00] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            INDEX
          </button>
        </div>
      </header>

      {/* Fullscreen Index Overlay */}
      {isOpen && (
        <div
          id="fullscreen-index-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Chapter Index Navigation"
          className="fixed inset-0 z-50 flex flex-col justify-between bg-[#0a0a0a]/98 backdrop-blur-xl p-6 md:p-12 animate-fadeIn"
        >
          <div className="flex items-center justify-between border-b border-[#f2f2f0]/12 pb-5">
            <span className="font-mono-code text-xs tracking-[0.2em] text-[#8a8a86]">
              DIRECTORY / CHAPTERS 01—06
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close Index Overlay"
              data-cursor-label="CLOSE"
              className="flex items-center gap-2 px-4 py-2 text-xs font-mono-code tracking-[0.2em] text-[#f2f2f0] border border-[#f2f2f0]/24 hover:border-[#c8ff00] hover:text-[#c8ff00] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>CLOSE</span>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="my-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-7xl w-full mx-auto py-8">
            <div className="lg:col-span-8 divide-y divide-[#f2f2f0]/12 border-y border-[#f2f2f0]/12">
              {NAV_CHAPTERS.map((item) => {
                const isActive = activeChapter.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectChapter(item.id)}
                    data-cursor-label="GO"
                    className="group w-full py-4 md:py-5 flex items-baseline justify-between text-left transition-colors hover:bg-[#f2f2f0]/[0.03] px-2 cursor-pointer"
                  >
                    <div className="flex items-baseline gap-4 md:gap-8">
                      <span
                        className={`font-mono-code text-xs md:text-sm tracking-[0.2em] ${
                          isActive ? 'text-[#c8ff00]' : 'text-[#8a8a86]'
                        }`}
                      >
                        {item.code} /
                      </span>
                      <span className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#f2f2f0] group-hover:text-[#c8ff00] group-hover:translate-x-3 transition-[color,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]">
                        {item.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="hidden sm:inline-block font-sans-body text-xs md:text-sm text-[#8a8a86] group-hover:text-[#f2f2f0] transition-colors">
                        {item.subtitle}
                      </span>
                      <ArrowUpRight className="w-4 h-4 text-[#8a8a86] group-hover:text-[#c8ff00] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-[color,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]" />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="lg:col-span-4 flex flex-col justify-between gap-6 border border-[#f2f2f0]/12 p-6 md:p-8 bg-[#111111]">
              <div className="space-y-2">
                <p className="font-mono-code text-xs tracking-[0.2em] text-[#c8ff00]">
                  CURRENT POSITION
                </p>
                <p className="font-display text-2xl font-bold text-[#f2f2f0]">
                  {activeChapter.code} / {activeChapter.label}
                </p>
                <p className="text-sm text-[#8a8a86] leading-relaxed">
                  Scroll position acts as a continuous camera rig across 7 interconnected chapters.
                </p>
              </div>

              <div className="space-y-3 pt-4 border-t border-[#f2f2f0]/12">
                <p className="font-mono-code text-xs tracking-[0.18em] text-[#8a8a86]">
                  DIRECTJUMP
                </p>
                <button
                  type="button"
                  onClick={() => handleSelectChapter('ending')}
                  className="w-full py-3 px-4 text-xs font-mono-code tracking-[0.2em] bg-[#c8ff00] text-[#0a0a0a] font-semibold hover:bg-[#f2f2f0] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  07 / INITIATE CONTACT
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#f2f2f0]/12 pt-5 font-mono-code text-xs text-[#8a8a86]">
            <span>SAKYA ANANDA · CREATIVE DEVELOPER</span>
            <span>PRESS ESC TO RETURN TO STORY</span>
          </div>
        </div>
      )}
    </>
  );
};
