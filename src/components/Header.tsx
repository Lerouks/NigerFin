'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, Search, X, ChevronRight, LogOut } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { SearchOverlay } from './SearchOverlay';
import { defaultNavigation, type NavItem } from '@/lib/site-data';

interface HeaderProps {
  navigation?: NavItem[];
}

export function Header({ navigation: navigationProp }: HeaderProps = {}) {
  const navigation = navigationProp ?? defaultNavigation;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { isSignedIn, isLoading: isAuthLoading, user, userRole, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setUserMenuOpen(false);
    router.refresh();
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/[0.06]">
        {/* Main header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 relative">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden -ml-2 inline-flex items-center justify-center min-w-[44px] min-h-[44px] hover:bg-black/5 rounded-lg transition-colors"
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link href="/" className="flex items-center lg:static absolute left-1/2 -translate-x-1/2 lg:translate-x-0 max-w-[calc(100%-160px)] lg:max-w-none" aria-label="NFI Report, accueil">
              <span className="text-[18px] sm:text-[22px] md:text-[26px] tracking-[-0.03em] font-bold truncate">
                NFI REPORT
              </span>
            </Link>

            <div className="flex items-center gap-3">
              {/* Auth section */}
              <div className="relative" ref={userMenuRef}>
                {isAuthLoading ? (
                  <span className="inline-block w-20 h-5" />
                ) : isSignedIn ? (
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="text-[14px] text-[#111] hover:text-black/60 transition-colors whitespace-nowrap"
                    aria-label="Mon compte"
                    aria-haspopup="menu"
                    aria-expanded={userMenuOpen}
                  >
                    Mon compte
                  </button>
                ) : (
                  <Link
                    href="/connexion"
                    className="hidden sm:inline-flex items-center min-h-[44px] px-2 -mx-2 text-[14px] text-[#111] hover:text-black/60 transition-colors whitespace-nowrap"
                  >
                    Se connecter
                  </Link>
                )}
                {userMenuOpen && isSignedIn && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-black/[0.06] py-1 z-50 animate-scale-in origin-top-right" role="menu">
                    <div className="px-4 py-2 border-b border-black/[0.04]">
                      <p className="text-[12px] font-medium truncate">{user?.user_metadata?.full_name || user?.email?.split('@')[0]}</p>
                      <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
                    </div>
                    <Link
                      href="/compte"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                      role="menuitem"
                    >
                      Mon compte
                    </Link>
                    {userRole === 'admin' && (
                      <Link
                        href="/admin"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                        role="menuitem"
                      >
                        Administration
                      </Link>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                      role="menuitem"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Se déconnecter
                    </button>
                  </div>
                )}
              </div>

              {/* Subscribe CTA (visible desktop + mobile) */}
              {!isAuthLoading && !isSignedIn && (
                <Link
                  href="/premium"
                  className="inline-flex items-center justify-center min-h-[44px] px-4 sm:px-5 bg-[#111] text-white text-[13px] sm:text-[14px] font-medium rounded-[4px] hover:bg-black transition-colors whitespace-nowrap border border-[#111]"
                >
                  S&apos;abonner
                </Link>
              )}

              {/* Search icon */}
              <button
                onClick={() => setSearchOpen(true)}
                className="hidden sm:inline-flex items-center justify-center min-w-[44px] min-h-[44px] -mr-2 hover:opacity-60 transition-opacity"
                aria-label="Rechercher"
              >
                <Search className="w-[18px] h-[18px] text-[#111]" strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="bg-[#111] text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="hidden lg:flex items-center h-11">
              <div className="flex items-center gap-1">
                {navigation.map((section) => {
                  const isActive = pathname === section.path || pathname.startsWith(section.path + '/');
                  return (
                    <Link
                      key={section.path}
                      href={section.path}
                      className={`text-[13px] px-3 inline-flex items-center h-11 rounded-md transition-all relative ${
                        isActive
                          ? 'text-white bg-white/10'
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                      }`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {section.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </nav>

        {/* Mobile menu */}
        <div
          className={`lg:hidden bg-white border-t border-black/5 transition-[max-height,opacity] duration-300 ease-out overscroll-contain ${
            mobileMenuOpen
              ? 'max-h-[calc(100dvh-4rem)] opacity-100 overflow-y-auto'
              : 'max-h-0 opacity-0 overflow-hidden'
          }`}
          aria-hidden={!mobileMenuOpen}
        >
          <nav className="px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] space-y-1" aria-label="Menu mobile">
            {navigation.map((section, i) => (
              <Link
                key={section.path}
                href={section.path}
                className="flex items-center justify-between min-h-[44px] py-3 px-3 text-[15px] text-gray-700 hover:bg-black/[0.03] rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
                tabIndex={mobileMenuOpen ? 0 : -1}
                style={{ animationDelay: mobileMenuOpen ? `${i * 50}ms` : '0ms' }}
              >
                {section.label}
                <ChevronRight className="w-4 h-4 text-gray-300 transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
            <div className="pt-2 mt-2 border-t border-black/5">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setSearchOpen(true);
                }}
                className="sm:hidden flex items-center justify-between w-full py-2.5 px-3 text-[15px] text-gray-700 hover:bg-black/[0.03] rounded-lg transition-colors text-left"
                tabIndex={mobileMenuOpen ? 0 : -1}
              >
                <span className="flex items-center gap-2"><Search className="w-4 h-4" /> Rechercher</span>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </button>
              {!isAuthLoading && !isSignedIn && (
                <Link
                  href="/connexion"
                  className="sm:hidden flex items-center justify-between py-2.5 px-3 text-[15px] text-gray-700 hover:bg-black/[0.03] rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                  tabIndex={mobileMenuOpen ? 0 : -1}
                >
                  Se connecter
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
              )}
              {!isAuthLoading && !isSignedIn && (
                <Link
                  href="/premium"
                  className="flex items-center justify-between py-2.5 px-3 text-[15px] font-semibold text-[#1a1a1a] bg-gold/15 hover:bg-gold/25 rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                  tabIndex={mobileMenuOpen ? 0 : -1}
                >
                  S&apos;abonner
                  <ChevronRight className="w-4 h-4 text-[#1a1a1a]/50" />
                </Link>
              )}
              {!isAuthLoading && isSignedIn && (
                <Link
                  href="/compte"
                  className="flex items-center justify-between py-2.5 px-3 text-[15px] text-gray-700 hover:bg-black/[0.03] rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                  tabIndex={mobileMenuOpen ? 0 : -1}
                >
                  Mon compte
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
              )}
            </div>
          </nav>
        </div>
      </header>

      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
