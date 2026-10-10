import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname, hash]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F1E6] text-[#3C4620]">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
};
