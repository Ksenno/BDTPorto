import React, { useEffect, useState } from 'react';
import { CAPABILITY_DOMAINS } from '../data/portfolioData';
import { computeChapterEntranceMetrics } from '../utils/motionMath';
import { ChapterEntrancePortal } from './ChapterEntrancePortal';
import { ProfileDisciplineGraphic } from './ProfileDisciplineGraphic';
import { Clock, ShieldCheck, Zap, Globe, Sparkles, Activity, CheckCircle2 } from 'lucide-react';

interface AboutSectionProps {
  sectionProgress?: number;
}

export const AboutSection: React.FC<AboutSectionProps> = React.memo(
  ({ sectionProgress = 0.5 }) => {
    const [activeDiscipline, setActiveDiscipline] = useState<number | null>(0);
    const [currentTimeWib, setCurrentTimeWib] = useState<string>('');
    const entrance = computeChapterEntranceMetrics(sectionProgress, 1200, 0.38);

    useEffect(() => {
      const updateClock = () => {
        try {
          const now = new Date();
          const options: Intl.DateTimeFormatOptions = {
            timeZone: 'Asia/Jakarta',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
          };
          setCurrentTimeWib(new Intl.DateTimeFormat('en-GB', options).format(now));
        } catch {
          setCurrentTimeWib('14:00:00');
        }
      };
      updateClock();
      const interval = window.setInterval(updateClock, 1000);
      return () => window.clearInterval(interval);
    }, []);

    const frameDash = Number(((1 - entrance.entranceRatio) * 1400).toFixed(1));
    const waveDash = Number(((1 - entrance.entranceRatio) * 520).toFixed(1));

    return (
      <section
        id="about"
        aria-label="Chapter 06 About"
        className="relative w-full bg-transparent border-t border-[#f2f2f0]/12 py-24 md:py-36 px-6 md:px-12 overflow-hidden"
      >
        {/* Dynamic Architectural SVG Line-Drawing Blueprint Contour Behind Chapter 06 */}
        <svg
          aria-hidden="true"
          viewBox="0 0 1440 960"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 h-full w-full"
        >
          {/* Sweeping drafting trajectory curves */}
          <path
            d="M 40 860 C 380 860, 680 140, 1400 140"
            fill="none"
            stroke="#c8ff00"
            strokeOpacity={0.16 + entrance.entranceRatio * 0.12}
            strokeWidth="1.4"
            strokeDasharray="1400"
            strokeDashoffset={frameDash}
          />
          <path
            d="M 40 140 L 1400 860"
            fill="none"
            stroke="#f2f2f0"
            strokeOpacity="0.06"
            strokeWidth="1"
            strokeDasharray="1400"
            strokeDashoffset={frameDash}
          />
          <path
            d="M 280 40 L 280 920 M 1160 40 L 1160 920"
            fill="none"
            stroke="#f2f2f0"
            strokeOpacity="0.04"
            strokeWidth="1"
            strokeDasharray="900"
            strokeDashoffset={frameDash}
          />

          {/* Drafting measurement circles with CAD crosshairs */}
          <circle
            cx="280"
            cy="460"
            r="180"
            fill="none"
            stroke="#c8ff00"
            strokeOpacity="0.12"
            strokeWidth="1.2"
            strokeDasharray="1200"
            strokeDashoffset={frameDash}
          />
          <circle
            cx="280"
            cy="460"
            r="80"
            fill="none"
            stroke="#f2f2f0"
            strokeOpacity="0.07"
            strokeWidth="1"
            strokeDasharray="600"
            strokeDashoffset={frameDash}
          />
          <circle
            cx="1160"
            cy="360"
            r="140"
            fill="none"
            stroke="#c8ff00"
            strokeOpacity="0.1"
            strokeWidth="1"
            strokeDasharray="900"
            strokeDashoffset={frameDash}
          />

          {/* Fiducial corner registration marks */}
          <path
            d="M 40 60 L 70 60 M 40 60 L 40 90"
            stroke="#c8ff00"
            strokeWidth="1.5"
            strokeOpacity="0.35"
          />
          <path
            d="M 1400 60 L 1370 60 M 1400 60 L 1400 90"
            stroke="#c8ff00"
            strokeWidth="1.5"
            strokeOpacity="0.35"
          />
        </svg>

        <div className="relative z-10 max-w-7xl mx-auto">
          {/* Universal Scrollytelling SVG Line-Drawing Entrance Portal */}
          <ChapterEntrancePortal
            chapterNumber="06"
            chapterTitle="PROFILE & DISCIPLINES"
            chapterSubtitle="CHAPTER SIX · JAKARTA, INDONESIA · UTC+7"
            blueprintCode="SYS.ARCH.06"
            sectionProgress={sectionProgress}
            rightSlot={
              <div className="flex items-center gap-2 font-mono-code text-xs text-[#8a8a86] bg-[#111111]/80 px-3 py-1.5 border border-[#f2f2f0]/15">
                <Clock className="w-3.5 h-3.5 text-[#c8ff00] animate-spin-slow" />
                <span className="text-[#f2f2f0] tabular-nums font-semibold">
                  {currentTimeWib || '14:00:00'} WIB
                </span>
                <span className="text-[#8a8a86] hidden sm:inline">(UTC+7)</span>
              </div>
            }
          />

          {/* Top Row: Core Statement & Interactive 360° Discipline Radar */}
          <div
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch mb-14 will-change-transform"
            style={{
              transform: `translate3d(0, ${(entrance.translateY * 0.45).toFixed(1)}px, 0)`,
            }}
          >
            {/* Left Column: Monumental Identity Statement with CAD corner markers */}
            <div className="lg:col-span-6 flex flex-col justify-between border border-[#f2f2f0]/15 bg-[#111111]/90 p-6 md:p-10 relative overflow-hidden group">
              {/* Top Accent Hairline with dynamic gradient */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#c8ff00] via-[#c8ff00]/50 to-transparent" />

              {/* CAD Corner Ticks */}
              <div aria-hidden="true" className="pointer-events-none absolute top-2 right-2 text-[#c8ff00]/40 font-mono-code text-[9px]">
                ┌ ARCH.06 ┐
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between font-mono-code text-xs text-[#8a8a86]">
                  <span className="text-[#c8ff00] font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#c8ff00] animate-ping" />
                    CREATIVE DEVELOPER & ARCHITECT
                  </span>
                  <span className="tabular-nums font-mono-code text-[11px] text-[#f2f2f0]/70">
                    06°12&apos;S 106°50&apos;E
                  </span>
                </div>

                <div className="space-y-3">
                  <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#f2f2f0] leading-[1.02] text-balance">
                    I build games, software, interfaces, and{' '}
                    <span className="relative inline-block font-serif-editorial italic font-normal text-[#c8ff00]">
                      experiments.
                      {/* Dynamic kinetic SVG wave underline that draws on entrance */}
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 320 20"
                        className="w-full h-4 mt-1 overflow-visible block"
                      >
                        <path
                          d="M 0 10 Q 40 2 80 10 T 160 10 T 240 10 T 320 10"
                          fill="none"
                          stroke="#c8ff00"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeDasharray="400"
                          strokeDashoffset={waveDash}
                        />
                      </svg>
                    </span>
                  </h2>
                </div>

                <p className="font-sans-body text-base md:text-lg text-[#8a8a86] leading-relaxed">
                  Independent builder based in Indonesia working across the boundary where
                  deterministic software engineering meets real-time graphics and interaction design.
                  Every project is treated as an end-to-end system—from shader math and state
                  synchronization down to the final micro-interaction.
                </p>
              </div>

              {/* Quantitative Triad Metrics with hover state pings */}
              <div className="grid grid-cols-3 gap-4 pt-8 mt-8 border-t border-[#f2f2f0]/12">
                <div className="group/metric">
                  <p className="font-mono-code text-[11px] text-[#8a8a86] flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#c8ff00]" />
                    BASE
                  </p>
                  <p className="mt-1.5 font-display text-lg md:text-xl font-bold text-[#f2f2f0]">
                    Jakarta, ID
                  </p>
                  <p className="font-mono-code text-[10px] text-[#8a8a86] mt-0.5">Archipelago Hub</p>
                </div>
                <div className="group/metric">
                  <p className="font-mono-code text-[11px] text-[#8a8a86] flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#c8ff00]" />
                    SHIPPED
                  </p>
                  <p className="mt-1.5 font-display text-lg md:text-xl font-bold text-[#f2f2f0] tabular-nums">
                    42+ Artifacts
                  </p>
                  <p className="font-mono-code text-[10px] text-[#8a8a86] mt-0.5">2024–2026 Archive</p>
                </div>
                <div className="group/metric">
                  <p className="font-mono-code text-[11px] text-[#8a8a86] flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-[#c8ff00]" />
                    STATUS
                  </p>
                  <p className="mt-1.5 font-display text-lg md:text-xl font-bold text-[#c8ff00] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#c8ff00] inline-block" />
                    Available
                  </p>
                  <p className="font-mono-code text-[10px] text-[#8a8a86] mt-0.5">Select Contracts</p>
                </div>
              </div>
            </div>

            {/* Right Column: 360° Radar Telemetry Motion Graphic */}
            <div className="lg:col-span-6 flex flex-col justify-between">
              <ProfileDisciplineGraphic
                sectionProgress={sectionProgress}
                activeDisciplineIndex={activeDiscipline}
                onSelectDiscipline={(idx) => setActiveDiscipline(idx)}
              />
            </div>
          </div>

          {/* Bottom Row: Detailed Discipline Matrix with Animated Mini Waveforms */}
          <div className="border border-[#f2f2f0]/15 bg-[#111111]/70 p-6 md:p-8 relative overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#f2f2f0]/12 pb-4 mb-6">
              <div className="flex items-center gap-2 font-mono-code text-xs text-[#f2f2f0]">
                <Sparkles className="w-3.5 h-3.5 text-[#c8ff00]" />
                <span className="font-semibold tracking-[0.2em]">CORE CAPABILITY DOMAINS</span>
              </div>
              <div className="flex items-center gap-3 font-mono-code text-xs text-[#8a8a86]">
                <Activity className="w-3.5 h-3.5 text-[#c8ff00] animate-pulse" />
                <span>HOVER TO SYNC TELEMETRY RADAR</span>
              </div>
            </div>

            <div className="divide-y divide-[#f2f2f0]/12">
              {CAPABILITY_DOMAINS.map((cap, idx) => {
                const isSelected = activeDiscipline === idx;
                return (
                  <div
                    key={cap.code}
                    onMouseEnter={() => setActiveDiscipline(idx)}
                    className={`py-4 md:py-5 flex flex-col md:flex-row md:items-baseline justify-between gap-4 px-4 transition-all duration-200 cursor-pointer relative ${
                      isSelected
                        ? 'bg-[#c8ff00]/[0.08] border-l-4 border-[#c8ff00] pl-5'
                        : 'hover:bg-[#f2f2f0]/[0.02] border-l-4 border-transparent'
                    }`}
                  >
                    <div className="flex items-baseline gap-4 md:gap-6">
                      <span
                        className={`font-mono-code text-xs font-semibold tabular-nums ${
                          isSelected ? 'text-[#c8ff00]' : 'text-[#8a8a86]'
                        }`}
                      >
                        {cap.code}.
                      </span>
                      <div className="flex items-center gap-3">
                        <h3
                          className={`font-display text-xl md:text-2xl font-bold transition-colors ${
                            isSelected ? 'text-[#c8ff00]' : 'text-[#f2f2f0]'
                          }`}
                        >
                          {cap.title}
                        </h3>
                        {isSelected && (
                          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 font-mono-code text-[10px] text-[#0a0a0a] bg-[#c8ff00] font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            TELEMETRY LOCKED
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-6 md:max-w-md">
                      <p className="font-sans-body text-sm text-[#8a8a86] leading-relaxed">
                        {cap.detail}
                      </p>

                      {/* Mini Live Frequency Waveform on Active Domain */}
                      {isSelected && (
                        <div className="hidden lg:flex items-end gap-1 h-6 shrink-0 w-16">
                          {[0.4, 0.85, 0.6, 1.0, 0.7, 0.45, 0.9].map((height, hIdx) => (
                            <div
                              key={hIdx}
                              className="w-1.5 bg-[#c8ff00] animate-pulse"
                              style={{
                                height: `${Math.round(height * 24)}px`,
                                animationDelay: `${hIdx * 120}ms`,
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    );
  }
);
