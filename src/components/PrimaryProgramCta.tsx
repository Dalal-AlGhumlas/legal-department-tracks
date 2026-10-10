import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useProgramStore } from '../services/programStore';
import { TrackSlug } from '../types';

interface PrimaryProgramCtaProps {
  trackSlug?: TrackSlug;
  variant?: 'olive' | 'cream' | 'subtle';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

/**
 * Dynamic primary CTA button governed by centralized registration window dates:
 * - During registration ('open'): "التسجيل" -> /register (or /register?track=SLUG)
 * - After registration ('closed'): REPLACED with "دخول المشاركين" -> /login
 * - Before registration ('before'): "التسجيل سيفتح قريبًا" (disabled state)
 */
export const PrimaryProgramCta: React.FC<PrimaryProgramCtaProps> = ({
  trackSlug,
  variant = 'olive',
  size = 'md',
  className = '',
  onClick
}) => {
  const { t } = useLanguage();
  const { registrationState, currentUser } = useProgramStore();

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-2.5 text-base',
    lg: 'px-8 py-3.5 text-lg'
  }[size];

  const variantClasses = {
    olive:
      'bg-[#3C4620] text-[#ECE2CE] hover:bg-[#4B5D16] border border-transparent',
    cream:
      'bg-[#ECE2CE] text-[#3C4620] hover:bg-[#FAF7F0] border border-transparent',
    subtle:
      'bg-transparent text-[#3C4620] border border-[#3C4620]/30 hover:border-[#3C4620] hover:bg-[#3C4620]/5'
  }[variant];

  if (registrationState === 'before') {
    return (
      <span
        aria-disabled="true"
        className={`inline-flex items-center justify-center font-bold rounded-md opacity-70 cursor-not-allowed whitespace-nowrap shrink-0 ${sizeClasses} ${variantClasses} ${className}`}
      >
        {t.nav.ctaBefore}
      </span>
    );
  }

  if (registrationState === 'closed') {
    const targetRoute =
      currentUser?.role === 'participant' ? '/dashboard' : '/login';
    return (
      <Link
        to={targetRoute}
        onClick={onClick}
        className={`inline-flex items-center justify-center font-bold rounded-md btn-press whitespace-nowrap shrink-0 ${sizeClasses} ${variantClasses} ${className}`}
      >
        {t.nav.ctaClosed}
      </Link>
    );
  }

  const registerHref = trackSlug
    ? `/register?track=${encodeURIComponent(trackSlug)}`
    : '/register';

  return (
    <Link
      to={registerHref}
      onClick={onClick}
      className={`inline-flex items-center justify-center font-bold rounded-md btn-press whitespace-nowrap shrink-0 ${sizeClasses} ${variantClasses} ${className}`}
    >
      {t.nav.ctaOpen}
    </Link>
  );
};
