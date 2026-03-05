import { Link, useNavigate } from 'react-router';
import { Menu, Search, User, X, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { NavigationSection } from '../../types';

interface HeaderProps {
  sections: NavigationSection[];
  isAuthenticated: boolean;
  onLogin: () => void;
  onLogout?: () => void;
  onSearchOpen?: () => void;
}

export function Header({ sections, isAuthenticated, onLogin, onLogout, onSearchOpen }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleNewsletterClick = () => {
    navigate('/');
    setTimeout(() => {
      const el = document.getElementById('newsletter');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/[0.06]">
      {/* Top bar */}
      <div className="border-b border-black/[0.04]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-9">
            <div className="text-[11px] text-gray-400 tracking-wide">
              {new Date().toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <button
                  onClick={onLogout}
                  className="text-[11px] text-gray-400 hover:text-black transition-colors tracking-wide"
                >
                  Déconnexion
                </button>
              ) : (
                <button
                  onClick={onLogin}
                  className="text-[11px] text-gray-400 hover:text-black transition-colors tracking-wide"
                >
                  Se connecter
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 -ml-1.5 hover:bg-black/5 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link to="/" className="flex items-center">
            <h1 className="text-[22px] md:text-[26px] tracking-[-0.03em]">
              NFI Report
            </h1>
          </Link>

          <button
            onClick={onSearchOpen}
            className="p-2 hover:bg-black/5 rounded-full transition-colors"
          >
            <Search className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-[#111] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="hidden lg:flex items-center justify-between h-11">
            <div className="flex items-center gap-1">
              {sections.map((section) => (
                <Link
                  key={section.id}
                  to={section.path}
                  className="text-[13px] px-3 py-1 rounded-md hover:bg-white/10 text-white/80 hover:text-white transition-all"
                >
                  {section.label}
                </Link>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleNewsletterClick}
                className="text-[13px] text-white/60 hover:text-white transition-colors"
              >
                Newsletter
              </button>
              {isAuthenticated && (
                <button className="flex items-center gap-1.5 text-[13px] text-white/60 hover:text-white transition-colors">
                  <User className="w-3.5 h-3.5" />
                  <span>Compte</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden overflow-hidden bg-white border-t border-black/5"
          >
            <div className="px-4 py-3 space-y-1">
              {sections.map((section) => (
                <Link
                  key={section.id}
                  to={section.path}
                  className="flex items-center justify-between py-2.5 px-3 text-[15px] text-gray-700 hover:bg-black/[0.03] rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {section.label}
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
              ))}
              <div className="pt-2 mt-2 border-t border-black/5">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleNewsletterClick();
                  }}
                  className="flex items-center justify-between w-full py-2.5 px-3 text-[15px] text-gray-700 hover:bg-black/[0.03] rounded-lg transition-colors text-left"
                >
                  Newsletter
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}