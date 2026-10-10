import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useProgramStore } from '../services/programStore';
import { MasarLogo } from './MasarLogo';
import { PrimaryProgramCta } from './PrimaryProgramCta';

export const Navbar: React.FC = () => {
  const { t, toggleLang } = useLanguage();
  const { currentUser } = useProgramStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleHashLink = (hash: string) => {
    setMobileOpen(false);
    if (location.pathname !== '/') {
      navigate(`/${hash}`);
      setTimeout(() => {
        const el = document.querySelector(hash);
        el?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.querySelector(hash);
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#F6F1E6]/95 backdrop-blur-sm border-b border-[#DDD2BC]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <Link
          to="/"
          onClick={() => setMobileOpen(false)}
          className="focus-visible:outline-none shrink-0"
          aria-label={t.hero.title}
        >
          <MasarLogo variant="secondary" size="sm" />
        </Link>

        {/* Zone 2: Concise single-line navigation links */}
        <nav
          aria-label={t.nav.home}
          className="hidden md:flex items-center gap-7 text-base font-bold text-[#3C4620]"
        >
          <Link
            to="/"
            className="hover:text-[#4B5D16] underline-offset-8 hover:underline whitespace-nowrap shrink-0"
          >
            {t.nav.home}
          </Link>
          <button
            type="button"
            onClick={() => handleHashLink('#tracks')}
            className="hover:text-[#4B5D16] underline-offset-8 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
          >
            {t.nav.tracks}
          </button>
          <Link
            to="/discover"
            className="hover:text-[#4B5D16] underline-offset-8 hover:underline whitespace-nowrap shrink-0"
          >
            {t.nav.discover}
          </Link>
          <button
            type="button"
            onClick={() => handleHashLink('#faq')}
            className="hover:text-[#4B5D16] underline-offset-8 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
          >
            {t.nav.faq}
          </button>
          {currentUser?.role === 'participant' && (
            <Link
              to="/dashboard"
              className="text-[#4B5D16] hover:text-[#3C4620] underline-offset-8 hover:underline whitespace-nowrap shrink-0"
            >
              {t.nav.dashboard}
            </Link>
          )}
          <button
            type="button"
            onClick={toggleLang}
            className="text-[#3C4620]/80 hover:text-[#3C4620] underline-offset-8 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
          >
            {t.nav.switchLanguage}
          </button>
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="hidden md:flex items-center shrink-0">
          <PrimaryProgramCta size="sm" variant="olive" />
        </div>

        {/* Mobile Menu Trigger */}
        <div className="flex md:hidden items-center gap-3">
          <button
            type="button"
            onClick={toggleLang}
            className="px-2.5 py-1.5 text-sm font-bold text-[#3C4620] hover:text-[#4B5D16] whitespace-nowrap shrink-0"
          >
            {t.nav.switchLanguage}
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="p-2 text-[#3C4620] rounded-md hover:bg-[#ECE2CE]"
            aria-expanded={mobileOpen}
            aria-label={t.nav.home}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-[#F6F1E6] border-b border-[#DDD2BC] px-5 pt-3 pb-6 space-y-3">
          <nav className="flex flex-col space-y-2.5 text-lg font-bold text-[#3C4620]">
            <Link
              to="/"
              onClick={() => setMobileOpen(false)}
              className="py-1.5 hover:text-[#4B5D16]"
            >
              {t.nav.home}
            </Link>
            <button
              type="button"
              onClick={() => handleHashLink('#tracks')}
              className="py-1.5 text-start hover:text-[#4B5D16]"
            >
              {t.nav.tracks}
            </button>
            <Link
              to="/discover"
              onClick={() => setMobileOpen(false)}
              className="py-1.5 hover:text-[#4B5D16]"
            >
              {t.nav.discover}
            </Link>
            <button
              type="button"
              onClick={() => handleHashLink('#faq')}
              className="py-1.5 text-start hover:text-[#4B5D16]"
            >
              {t.nav.faq}
            </button>
            {currentUser?.role === 'participant' && (
              <Link
                to="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="py-1.5 text-[#4B5D16]"
              >
                {t.nav.dashboard}
              </Link>
            )}
          </nav>
          <div className="pt-2">
            <PrimaryProgramCta
              size="md"
              variant="olive"
              className="w-full"
              onClick={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}
    </header>
  );
};
