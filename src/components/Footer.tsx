import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { OFFICIAL_CONTACTS } from '../config/program';
import { MasarLogo } from './MasarLogo';

export const Footer: React.FC = () => {
  const { lang, t, toggleLang } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const handleHashLink = (hash: string) => {
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
    <footer className="bg-[#3C4620] text-[#ECE2CE] pt-16 pb-12 border-t border-[#4B5D16]/40">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-12 border-b border-[#ECE2CE]/15">
          {/* Column 1: Masar Identity & Law Club Context */}
          <div className="md:col-span-5 space-y-4">
            <MasarLogo variant="primary" size="md" />
            <div className="pt-2 space-y-1">
              <p className="text-lg font-bold text-[#ECE2CE]">{t.footer.clubTitle}</p>
              <p className="text-sm text-[#ECE2CE]/75">{t.footer.deanship}</p>
            </div>
            <p className="text-base text-[#ECE2CE]/85 leading-relaxed max-w-md">
              {t.footer.aboutClub}
            </p>
            <p className="text-sm font-bold text-[#F2B635] pt-1">{t.footer.slogan}</p>
          </div>

          {/* Column 2: Essential Navigation */}
          <div className="md:col-span-3 space-y-4">
            <h3 className="text-lg font-bold text-[#ECE2CE]">
              {t.footer.navigationTitle}
            </h3>
            <ul className="space-y-2.5 text-base text-[#ECE2CE]/85">
              <li>
                <Link to="/" className="hover:text-[#F2B635] transition-colors">
                  {t.nav.home}
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleHashLink('#tracks')}
                  className="hover:text-[#F2B635] transition-colors cursor-pointer"
                >
                  {t.nav.tracks}
                </button>
              </li>
              <li>
                <Link to="/discover" className="hover:text-[#F2B635] transition-colors">
                  {t.nav.discover}
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleHashLink('#faq')}
                  className="hover:text-[#F2B635] transition-colors cursor-pointer"
                >
                  {t.nav.faq}
                </button>
              </li>
              <li>
                <Link to="/login" className="hover:text-[#F2B635] transition-colors">
                  {t.nav.ctaClosed}
                </Link>
              </li>
            </ul>
          </div>

 {/* Column 3: Official Contact Details */}
<div className="md:col-span-4 space-y-4">
  <h3 className="text-lg font-bold text-[#ECE2CE]">
    {t.footer.contactTitle}
  </h3>

  <div className="space-y-1">
    <p className="text-sm text-[#ECE2CE]/70">
      {t.footer.partnershipsEmailLabel}
    </p>

    <a
      href={`mailto:${OFFICIAL_CONTACTS.partnershipsEmail}`}
      dir="ltr"
      className="inline-block text-base font-bold text-[#ECE2CE] hover:text-[#F2B635] transition-colors"
    >
      {OFFICIAL_CONTACTS.partnershipsEmail}
    </a>
  </div>

  <p className="text-xs text-[#ECE2CE]/70" dir="ltr">
    Designed &amp; Developed by{' '}
    <a
      href="https://www.linkedin.com/in/dalal-alghumlas/"
      target="_blank"
      rel="noopener noreferrer"
      className="font-bold text-[#ECE2CE] hover:text-[#F2B635] transition-colors"
    >
      Dalal AlGhumlas
    </a>
  </p>
</div>
</div>

{/* Bottom bar */}
<div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#ECE2CE]/70">
  <p>{t.footer.copyright}</p>

  <div className="flex items-center gap-6">
    <span dir="ltr">{OFFICIAL_CONTACTS.clubEmail}</span>

    <span aria-hidden="true">·</span>

    <button
      type="button"
      onClick={toggleLang}
      className="font-bold text-[#ECE2CE] hover:text-[#F2B635] transition-colors cursor-pointer"
    >
      {t.nav.switchLanguage}
    </button>
  </div>
</div>
      </div>
    </footer>
  );
};
