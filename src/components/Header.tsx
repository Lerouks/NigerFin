'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, Search, User, X, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useUser, SignInButton, UserButton } from '@clerk/nextjs';
import { navigationSections } from '@/data/mock-data';
import { SearchOverlay } from './SearchOverlay';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { isSignedIn } = useUser();
  const router = useRouter();

  const handleNewsletterClick = () => {
    router.push('/#newsletter');
  };

  return (
    <>
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
                {isSignedIn ? (
                  <UserButton afterSignOutUrl="/" />
                ) : (
                  <SignInButton mode="modal">
                    <button className="text-[11px] text-gray-400 hover:text-black transition-colors tracking-wide">
                      Se connecter
                    </button>
                  </SignInButton>
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

            <Link href="/" className="flex items-center">
              <h1 className="text-[22px] md:text-[26px] tracking-[-0.03em] font-bold">
                NFI Report
              </h1>
            </Link>

            <button
              onClick={() => setSearchOpen(true)}
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
                {navigationSections.map((section) => (
                  <Link
                    key={section.id}
                    href={section.path}
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
                {isSignedIn && (
                  <Link
                    href="/pricing"
                    className="flex items-center gap-1.5 text-[13px] text-white/60 hover:text-white transition-colors"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Compte</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-black/5">
            <div className="px-4 py-3 space-y-1">
              {navigationSections.map((section) => (
                <Link
                  key={section.id}
                  href={section.path}
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
          </div>
        )}
      </header>

      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
