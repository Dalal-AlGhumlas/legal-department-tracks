import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpLeft, ArrowUpRight } from 'lucide-react';
import { TrackConfig } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { useProgramStore } from '../services/programStore';
import { TrackImage } from './TrackImage';

interface TrackCardProps {
  track: TrackConfig;
}

export const TrackCard: React.FC<TrackCardProps> = ({ track }) => {
  const { lang, t } = useLanguage();
  const { registrationState } = useProgramStore();

  const title = lang === 'ar' ? track.nameAr : track.nameEn;
  const description = lang === 'ar' ? track.descriptionAr : track.descriptionEn;
  const numberLabel = lang === 'ar' ? track.numberAr : track.numberEn;
  const ArrowIcon = lang === 'ar' ? ArrowUpLeft : ArrowUpRight;

  return (
    <article className="group bg-[#FAF7F0] border border-[#DDD2BC] hover:border-[#4B5D16]/60 rounded-lg overflow-hidden flex flex-col track-card-transition">
      {/* Dedicated Track Image */}
      <Link
        to={track.route}
        className="block relative aspect-square w-full overflow-hidden bg-[#ECE2CE] border-b border-[#DDD2BC]/70 focus-visible:outline-none"
        aria-label={title}
      >
        <TrackImage slug={track.slug} src={track.image} alt={title} />
      </Link>

      {/* Card Body */}
      <div className="p-6 flex-1 flex flex-col justify-between gap-6">
        <div className="space-y-2.5">
          <p className="text-xs text-[#4B5D16] font-bold">
            {numberLabel}
          </p>
          <h3 className="text-2xl font-bold text-[#3C4620] leading-snug">
            <Link
              to={track.route}
              className="hover:text-[#4B5D16] transition-colors focus-visible:outline-none"
            >
              {title}
            </Link>
          </h3>
          <p className="text-base text-[#3C4620]/85 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Actions: Details + Registration (while open) */}
        <div className="pt-3 border-t border-[#DDD2BC]/70 flex items-center justify-between gap-3">
          <Link
            to={track.route}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[#3C4620] hover:text-[#4B5D16] py-2 transition-colors whitespace-nowrap shrink-0"
          >
            <span>{t.tracksSection.detailsBtn}</span>
            <ArrowIcon className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
          </Link>

          {registrationState === 'open' && (
            <Link
              to={`/register?track=${encodeURIComponent(track.slug)}`}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-bold rounded-md bg-[#3C4620] text-[#ECE2CE] hover:bg-[#4B5D16] btn-press whitespace-nowrap shrink-0"
            >
              {t.tracksSection.registerBtn}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
};
