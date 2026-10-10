import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';

interface MasarLogoProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Renders the official Masar ("مــســـــــــــار") identity mark from the attached brand PDF:
 * Four ascending architectural path ribbons curving forward into four tracks,
 * paired with the elongated Arabic wordmark (in Arabic mode) or clean English title (in English mode).
 */
export const MasarLogo: React.FC<MasarLogoProps> = ({
  variant = 'secondary',
  size = 'md',
  className = ''
}) => {
  const { lang } = useLanguage();

  const isLightOnDark = variant === 'primary';

  const dimensions = {
    sm: { svgW: 48, svgH: 34, textClass: 'text-lg' },
    md: { svgW: 60, svgH: 42, textClass: 'text-xl' },
    lg: { svgW: 88, svgH: 62, textClass: 'text-2xl' }
  }[size];

  // Ribbon colors per the official Masar brand PDF
  const c1 = isLightOnDark ? '#ECE2CE' : '#DFB86B';
  const c2 = isLightOnDark ? '#ECE2CE' : '#F2B635';
  const c3 = isLightOnDark ? '#ECE2CE' : '#E45C10';
  const c4 = isLightOnDark ? '#ECE2CE' : '#3C4620';
  const textColor = isLightOnDark ? 'text-[#ECE2CE]' : 'text-[#3C4620]';

  return (
    <div className={`inline-flex items-center gap-3 select-none shrink-0 whitespace-nowrap ${className}`}>
      <svg
        width={dimensions.svgW}
        height={dimensions.svgH}
        viewBox="0 0 120 84"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        {/* Path 1 (Leftmost ascending track ribbon) */}
        <path
          d="M44 18 L56 25 L56 54 L26 76 L6 76 L44 50 Z"
          fill={c1}
        />
        {/* Path 2 */}
        <path
          d="M60 15 L72 22 L72 54 L50 76 L32 76 L60 51 Z"
          fill={c2}
        />
        {/* Path 3 */}
        <path
          d="M76 12 L88 19 L88 54 L76 76 L56 76 L76 52 Z"
          fill={c3}
        />
        {/* Path 4 (Rightmost ascending track ribbon) */}
        <path
          d="M92 9 L104 16 L104 54 L114 76 L82 76 L92 53 Z"
          fill={c4}
        />
      </svg>

      {lang === 'ar' ? (
        <span
          className={`font-bold tracking-normal ${dimensions.textClass} ${textColor} whitespace-nowrap`}
        >
          مــســــــــار
        </span>
      ) : (
        <span
          className={`font-semibold tracking-tight ${dimensions.textClass} ${textColor} whitespace-nowrap`}
        >
          Masar
        </span>
      )}
    </div>
  );
};
