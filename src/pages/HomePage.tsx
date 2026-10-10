import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useProgramStore } from '../services/programStore';
import { TRACKS } from '../config/tracks';
import { OFFICIAL_PROGRAM_SCHEDULE, OFFICIAL_PARTNERS } from '../config/program';
import { MasarLogo } from '../components/MasarLogo';
import { PrimaryProgramCta } from '../components/PrimaryProgramCta';
import { TrackCard } from '../components/TrackCard';

export const HomePage: React.FC = () => {
  const { lang, t } = useLanguage();
  const { registrationState } = useProgramStore();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const DirectionalArrow = lang === 'ar' ? ArrowLeft : ArrowRight;

  return (
    <div>
      {/* 1. EDITORIAL HERO SECTION */}
      <section className="relative overflow-hidden pt-14 pb-20 md:pt-20 md:pb-28 border-b border-[#DDD2BC]">
        {/* Subtle Masar 4-Path Architectural Motif in Background */}
        <div
          aria-hidden="true"
          className="pointer-events-none select-none absolute inset-x-0 bottom-0 flex justify-end opacity-25"
        >
          <svg
            width="640"
            height="360"
            viewBox="0 0 640 360"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-[340px] sm:w-[480px] md:w-[600px] h-auto rtl:mr-auto ltr:ml-auto"
          >
            <path
              d="M280 40 L320 62 L320 220 L120 360 L30 360 L280 195 Z"
              fill="#DFB86B"
              fillOpacity="0.35"
            />
            <path
              d="M350 28 L390 50 L390 220 L230 360 L140 360 L350 200 Z"
              fill="#F2B635"
              fillOpacity="0.3"
            />
            <path
              d="M420 16 L460 38 L460 220 L340 360 L250 360 L420 205 Z"
              fill="#E45C10"
              fillOpacity="0.22"
            />
            <path
              d="M490 4 L530 26 L530 220 L460 360 L360 360 L490 210 Z"
              fill="#4B5D16"
              fillOpacity="0.25"
            />
          </svg>
        </div>

        <div className="relative max-w-5xl mx-auto px-5 sm:px-8">
          {/* Official Masar Identity & Institutional Context (Unboxed text with middot separator) */}
          <div className="space-y-6">
            <MasarLogo variant="secondary" size="lg" />

            <div className="flex flex-wrap items-center gap-2 text-sm sm:text-base text-[#4B5D16] font-bold">
              <span>{t.hero.clubName}</span>
              <span aria-hidden="true">·</span>
              <span className="text-[#3C4620]/75 font-normal">{t.hero.projectYear}</span>
            </div>

            {/* Primary Program Title */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-[#3C4620] leading-tight balance-text max-w-3xl">
              {t.hero.title}
            </h1>

            {/* Concise Official Program Description */}
            <p className="text-lg sm:text-xl text-[#3C4620]/90 leading-relaxed max-w-3xl">
              {t.hero.description}
            </p>

            {/* Confirmed Date / Metadata Line (Unboxed editorial typography) */}
            <div className="pt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-base text-[#3C4620]/80 border-t border-[#DDD2BC] max-w-2xl">
              <span className="font-bold text-[#3C4620]">{t.hero.dateLabel}</span>
              <span aria-hidden="true" className="text-[#3C4620]/40">·</span>
              <span>{t.hero.durationLabel}</span>
              <span aria-hidden="true" className="text-[#3C4620]/40">·</span>
              <span>{t.hero.audienceLabel}</span>
            </div>

            {/* Single Primary Dynamic CTA + Quiet Secondary Link */}
            <div className="pt-4 flex flex-wrap items-center gap-6">
              <PrimaryProgramCta size="lg" variant="olive" />
              <Link
                to="/discover"
                className="inline-flex items-center gap-2 text-base font-bold text-[#3C4620] hover:text-[#4B5D16] underline-offset-8 hover:underline py-2 whitespace-nowrap shrink-0"
              >
                <span>{t.hero.discoverAction}</span>
                <DirectionalArrow className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE FOUR TRACKS (IMAGE CARDS) */}
      <section id="tracks" className="py-20 md:py-28 border-b border-[#DDD2BC]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 space-y-12">
          <div className="max-w-3xl space-y-3">
            <p className="text-sm font-bold text-[#4B5D16]">
              {t.tracksSection.kicker}
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#3C4620] balance-text">
              {t.tracksSection.title}
            </h2>
            <p className="text-lg text-[#3C4620]/85 leading-relaxed">
              {t.tracksSection.subtitle}
            </p>
          </div>

          {/* 4 Columns on large desktop, 2x2 on medium screens, 1 column on mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-7">
            {TRACKS.map((track) => (
              <TrackCard key={track.id} track={track} />
            ))}
          </div>
        </div>
      </section>

      {/* 3. DISCOVER YOUR TRACK INVITATION (Editorial surface variation, not a card grid) */}
      <section className="py-16 md:py-24 bg-[#ECE2CE] border-b border-[#DDD2BC]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="max-w-2xl space-y-3">
              <p className="text-sm font-bold text-[#E45C10]">
                {t.discoverTeaser.kicker}
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#3C4620] balance-text">
                {t.discoverTeaser.title}
              </h2>
              <p className="text-lg text-[#3C4620]/85 leading-relaxed">
                {t.discoverTeaser.description}
              </p>
            </div>

            <div className="shrink-0">
              <Link
                to="/discover"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 text-base font-bold rounded-md bg-[#3C4620] text-[#ECE2CE] hover:bg-[#4B5D16] btn-press whitespace-nowrap shrink-0"
              >
                <span>{t.discoverTeaser.button}</span>
                <DirectionalArrow className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ESSENTIAL OFFICIAL PROGRAM INFORMATION (Execution Mechanism, Target Audience & 3-Day Schedule) */}
      <section className="py-20 md:py-28 border-b border-[#DDD2BC]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 space-y-20">
          {/* Two-column editorial split for Execution Mechanism & Target Audience */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-2">
            <div className="lg:col-span-6 space-y-3">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#3C4620]">
                {t.programInfo.mechanismTitle}
              </h2>
              <p className="text-lg text-[#3C4620]/85 leading-relaxed">
                {t.programInfo.mechanismBody}
              </p>
            </div>

            <div className="lg:col-span-6 space-y-3 lg:border-s lg:border-[#DDD2BC] lg:ps-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#3C4620]">
                {t.programInfo.audienceTitle}
              </h2>
              <p className="text-lg text-[#3C4620]/85 leading-relaxed">
                {t.programInfo.audienceBody}
              </p>
            </div>
          </div>

          {/* Official 3-Day Schedule (October 12 – 14) rendered with typography & hairline dividers */}
          <div className="space-y-8 pt-6 border-t border-[#DDD2BC]">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#3C4620]">
                {t.programInfo.scheduleTitle}
              </h2>
              <p className="text-base font-bold text-[#4B5D16]">
                {t.programInfo.scheduleDates}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pt-2">
              {OFFICIAL_PROGRAM_SCHEDULE.map((day, idx) => (
                <div
                  key={day.dateEn}
                  className="space-y-4 border-t-2 border-[#3C4620] pt-5"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-lg font-bold text-[#3C4620]">
                      {lang === 'ar' ? day.dayAr : day.dayEn} ·{' '}
                      {lang === 'ar' ? day.dateAr : day.dateEn}
                    </span>
                    <span className="text-sm font-bold text-[#4B5D16] tabular-nums">
                      0{idx + 1}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-[#3C4620]">
                    {lang === 'ar' ? day.titleAr : day.titleEn}
                  </h3>

                  <ul className="space-y-2 text-base text-[#3C4620]/85 leading-relaxed">
                    {(lang === 'ar' ? day.itemsAr : day.itemsEn).map((item) => (
                      <li key={item} className="flex items-baseline gap-2.5">
                        <span aria-hidden="true" className="text-[#E45C10] font-bold">
                          —
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. PARTNERS / SUPPORTING ENTITIES (Refined Typographic Display — No Box Grid) */}
      <section className="py-20 md:py-24 bg-[#FAF7F0] border-b border-[#DDD2BC]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 space-y-10">
          <div className="max-w-3xl space-y-3">
            <p className="text-sm font-bold text-[#4B5D16]">
              {t.partnersSection.kicker}
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#3C4620]">
              {t.partnersSection.title}
            </h2>
            <p className="text-lg text-[#3C4620]/80 leading-relaxed">
              {t.partnersSection.subtitle}
            </p>
          </div>

          <div className="pt-4 border-t border-[#DDD2BC] flex flex-wrap items-center gap-x-8 gap-y-5">
            {OFFICIAL_PARTNERS.map((partner, index) => (
              <React.Fragment key={partner.nameEn}>
                <span className="text-lg sm:text-xl font-bold text-[#3C4620]/85 hover:text-[#3C4620] transition-colors">
                  {lang === 'ar' ? partner.nameAr : partner.nameEn}
                </span>
                {index < OFFICIAL_PARTNERS.length - 1 && (
                  <span aria-hidden="true" className="text-[#F2B635] font-bold select-none">
                    ·
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* 6. FAQ ACCORDION */}
      <section id="faq" className="py-20 md:py-28 border-b border-[#DDD2BC]">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 space-y-10">
          <div className="space-y-2">
            <p className="text-sm font-bold text-[#4B5D16]">
              {t.faqSection.kicker}
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#3C4620]">
              {t.faqSection.title}
            </h2>
          </div>

          <div className="divide-y divide-[#DDD2BC] border-y border-[#DDD2BC]">
            {t.faqSection.items.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={item.q} className="py-5">
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between gap-4 text-start py-1 focus-visible:outline-none cursor-pointer group"
                  >
                    <span className="text-xl font-bold text-[#3C4620] group-hover:text-[#4B5D16] transition-colors">
                      {item.q}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-[#4B5D16] shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="pt-3 pb-1 text-lg text-[#3C4620]/85 leading-relaxed max-w-3xl">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. FINAL EDITORIAL CTA */}
      <section className="py-20 md:py-24 bg-[#ECE2CE]">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#3C4620] balance-text">
            {t.finalCta.title}
          </h2>
          <p className="text-lg text-[#3C4620]/85 leading-relaxed max-w-2xl mx-auto">
            {registrationState === 'closed'
              ? t.finalCta.closedSubtitle
              : t.finalCta.subtitle}
          </p>
          <div className="pt-2">
            <PrimaryProgramCta size="lg" variant="olive" />
          </div>
        </div>
      </section>
    </div>
  );
};
