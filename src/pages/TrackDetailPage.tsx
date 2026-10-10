import React from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { TRACKS, getTrackBySlug } from '../config/tracks';
import { OFFICIAL_PROGRAM_SCHEDULE } from '../config/program';
import { TrackImage } from '../components/TrackImage';
import { PrimaryProgramCta } from '../components/PrimaryProgramCta';

export const TrackDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { lang, t } = useLanguage();

  const track = getTrackBySlug(slug);
  if (!track) {
    return <Navigate to="/" replace />;
  }

  const BackArrow = lang === 'ar' ? ArrowRight : ArrowLeft;
  const title = lang === 'ar' ? track.nameAr : track.nameEn;
  const numberLabel = lang === 'ar' ? track.numberAr : track.numberEn;
  const description = lang === 'ar' ? track.descriptionAr : track.descriptionEn;
  const extendedDescription =
    lang === 'ar' ? track.extendedDescriptionAr : track.extendedDescriptionEn;
  const pillars = lang === 'ar' ? track.corePillarsAr : track.corePillarsEn;
  const practical =
    lang === 'ar' ? track.practicalExerciseAr : track.practicalExerciseEn;

  const otherTracks = TRACKS.filter((item) => item.slug !== track.slug);

  return (
    <div className="pb-20">
      {/* Top Track Header Split */}
      <section className="py-12 md:py-20 border-b border-[#DDD2BC]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 space-y-8">
          <div>
            <Link
              to="/#tracks"
              className="inline-flex items-center gap-2 text-base font-bold text-[#4B5D16] hover:text-[#3C4620] transition-colors"
            >
              <BackArrow className="w-4 h-4" />
              <span>{t.trackDetail.backToTracks}</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Editorial Text Column */}
            <div className="lg:col-span-7 space-y-6">
              <p className="text-sm font-bold text-[#4B5D16]">{numberLabel}</p>

              <h1 className="text-4xl sm:text-5xl font-bold text-[#3C4620] leading-tight">
                {title}
              </h1>

              <p className="text-xl text-[#3C4620] leading-relaxed font-bold">
                {description}
              </p>

              <p className="text-lg text-[#3C4620]/85 leading-relaxed">
                {extendedDescription}
              </p>

              <p className="text-base text-[#3C4620]/75 pt-2 border-t border-[#DDD2BC]">
                {t.trackDetail.mechanismNote}
              </p>

              <div className="pt-3">
                <PrimaryProgramCta
                  trackSlug={track.slug}
                  size="lg"
                  variant="olive"
                />
              </div>
            </div>

            {/* Dedicated Track Image Column */}
            <div className="lg:col-span-5">
              <div className="aspect-square w-full max-w-md mx-auto lg:max-w-none rounded-lg overflow-hidden border border-[#DDD2BC] bg-[#ECE2CE]">
                <TrackImage slug={track.slug} src={track.image} alt={title} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Areas of Practice & Practical Exercise */}
      <section className="py-16 md:py-24 border-b border-[#DDD2BC]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-7 space-y-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#3C4620]">
              {t.trackDetail.pillarsTitle}
            </h2>
            <ul className="space-y-4">
              {pillars.map((pillar, index) => (
                <li
                  key={pillar}
                  className="flex items-baseline gap-4 pb-4 border-b border-[#DDD2BC]/80 last:border-none"
                >
                  <span className="text-sm font-bold text-[#E45C10] tabular-nums shrink-0">
                    0{index + 1}
                  </span>
                  <span className="text-lg text-[#3C4620]/90 leading-relaxed">
                    {pillar}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-5 lg:border-s lg:border-[#DDD2BC] lg:ps-12 space-y-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#3C4620]">
              {t.trackDetail.practicalTitle}
            </h2>
            <p className="text-lg text-[#3C4620]/85 leading-relaxed">
              {practical}
            </p>
            <div className="pt-4">
              <PrimaryProgramCta
                trackSlug={track.slug}
                size="md"
                variant="olive"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Official Three-Day Schedule for this Track */}
      <section className="py-16 md:py-24 bg-[#FAF7F0] border-b border-[#DDD2BC]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 space-y-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#3C4620]">
            {t.trackDetail.scheduleTitle}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {OFFICIAL_PROGRAM_SCHEDULE.map((day, idx) => (
              <div
                key={day.dateEn}
                className="space-y-3 border-t-2 border-[#3C4620] pt-5"
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
                    <li key={item} className="flex items-baseline gap-2">
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
      </section>

      {/* Other Tracks Navigation */}
      <section className="pt-16">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 space-y-8">
          <h2 className="text-2xl font-bold text-[#3C4620]">
            {t.trackDetail.otherTracksTitle}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {otherTracks.map((other) => {
              const otherName = lang === 'ar' ? other.nameAr : other.nameEn;
              const otherNum = lang === 'ar' ? other.numberAr : other.numberEn;
              return (
                <Link
                  key={other.slug}
                  to={other.route}
                  className="group p-6 rounded-lg bg-[#FAF7F0] border border-[#DDD2BC] hover:border-[#4B5D16] flex items-center gap-4 track-card-transition"
                >
                  <div className="w-16 h-16 rounded-md overflow-hidden bg-[#ECE2CE] shrink-0 border border-[#DDD2BC]">
                    <TrackImage
                      slug={other.slug}
                      src={other.image}
                      alt={otherName}
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-[#4B5D16]">{otherNum}</p>
                    <h3 className="text-xl font-bold text-[#3C4620] group-hover:text-[#4B5D16] transition-colors">
                      {otherName}
                    </h3>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};
