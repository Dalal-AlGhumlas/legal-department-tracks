import React, { useState } from 'react';
import { TrackSlug } from '../types';

interface TrackImageProps {
  slug: TrackSlug;
  src: string;
  alt: string;
  className?: string;
}

/**
 * Displays the dedicated track image mapped in `src/config/tracks.ts` with `object-cover`
 * and a matching vector fallback so there is never a broken image frame.
 */
export const TrackImage: React.FC<TrackImageProps> = ({
  slug,
  src,
  alt,
  className = ''
}) => {
  const [hasError, setHasError] = useState(false);

  if (!hasError) {
    return (
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover track-image-zoom ${className}`}
      />
    );
  }

  return (
    <div
      className={`w-full h-full bg-[#ECE2CE] flex items-center justify-center p-8 track-image-zoom ${className}`}
      role="img"
      aria-label={alt}
    >
      {slug === 'litigation' && (
        <svg viewBox="0 0 200 200" className="w-3/5 h-3/5 text-[#3C4620]" fill="currentColor">
          <circle cx="100" cy="42" r="9" />
          <path d="M94 48h12l6 105H88L94 48z" />
          <rect x="65" y="150" width="70" height="7" rx="3.5" />
          <rect x="52" y="159" width="96" height="8" rx="4" />
          <path d="M42 64c20-8 38-8 58 0 20-8 38-8 58 0v7c-20-7-38-7-58 0-20-7-38-7-58 0v-7z" />
          <path d="M46 68L28 112h6L50 68h-4zm4 0l16 44h6L54 68h-4z" />
          <path d="M24 112h48c-2 14-12 22-24 22s-22-8-24-22z" />
          <path d="M146 68l-18 44h6l16-44h-4zm4 0l16 44h6l-18-44h-4z" />
          <path d="M124 112h48c-2 14-12 22-24 22s-22-8-24-22z" />
        </svg>
      )}
      {slug === 'contracts' && (
        <svg viewBox="0 0 200 200" className="w-3/5 h-3/5 text-[#3C4620]" fill="currentColor">
          <path d="M52 36h64l24 24v96a12 12 0 0 1-12 12H52a12 12 0 0 1-12-12V48a12 12 0 0 1 12-12zm58 10v18h18L110 46z" opacity="0.95" />
          <rect x="60" y="76" width="52" height="6" rx="3" fill="#ECE2CE" />
          <rect x="60" y="92" width="52" height="6" rx="3" fill="#ECE2CE" />
          <rect x="60" y="108" width="40" height="6" rx="3" fill="#ECE2CE" />
          <path d="M148 78l14 10-34 48-16 8 4-18 32-48z" />
        </svg>
      )}
      {slug === 'legislation' && (
        <svg viewBox="0 0 200 200" className="w-3/5 h-3/5 text-[#3C4620]" fill="currentColor">
          <path d="M56 38h84a14 14 0 0 1 14 14v96a14 14 0 0 1-14 14H56a14 14 0 0 1-14-14V52a14 14 0 0 1 14-14z" />
          <polygon points="100,58 68,76 132,76" fill="#ECE2CE" />
          <rect x="74" y="82" width="8" height="26" fill="#ECE2CE" />
          <rect x="96" y="82" width="8" height="26" fill="#ECE2CE" />
          <rect x="118" y="82" width="8" height="26" fill="#ECE2CE" />
          <rect x="68" y="112" width="64" height="5" fill="#ECE2CE" />
          <rect x="68" y="128" width="64" height="5" rx="2.5" fill="#ECE2CE" />
          <rect x="68" y="140" width="46" height="5" rx="2.5" fill="#ECE2CE" />
        </svg>
      )}
      {slug === 'governance-compliance' && (
        <svg viewBox="0 0 200 200" className="w-3/5 h-3/5 text-[#3C4620]" fill="currentColor">
          <rect x="44" y="34" width="84" height="114" rx="12" />
          <rect x="58" y="58" width="10" height="10" rx="2" fill="#ECE2CE" />
          <rect x="74" y="60" width="38" height="6" rx="3" fill="#ECE2CE" />
          <rect x="58" y="78" width="10" height="10" rx="2" fill="#ECE2CE" />
          <rect x="74" y="80" width="38" height="6" rx="3" fill="#ECE2CE" />
          <path d="M126 94l34 14v24c0 22-14 38-34 46-20-8-34-24-34-46v-24l34-14z" stroke="#ECE2CE" strokeWidth="5" />
          <path d="M114 132l8 8 18-18" stroke="#ECE2CE" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
};
