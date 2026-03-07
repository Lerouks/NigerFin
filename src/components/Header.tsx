'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, Search, User, X, ChevronRight, LogOut } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { SearchOverlay } from './SearchOverlay';

interface NavItem {
  label: string;
  path: string;
  order: number;
}

const defaultNavigation: NavItem[] = [
  { label: 'Économie', path: '/economie', order: 1 },
  { label: 'Finance', path: '/finance', order: 2 },
  { label: 'Marchés', path: '/marches', order: 3 },
  { label: 'Entreprises', path: '/entreprises', order: 4 },
  { label: 'Éducation', path: '/education', order: 5 },
  { label: 'Outils', path: '/outils', order: 6 },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [navigation, setNavigation] = useState<NavItem[]>(defaultNavigation);
  const { isSignedIn, user, userRole, signOut } = useAuth();
  const router = useRouter();
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/site-settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.navigation?.length) {
          setNavigation(data.navigation.sort((a: NavItem, b: NavItem) => a.order - b.order));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNewsletterClick = () => {
    if (window.location.pathname === '/') {
      const el = document.getElementById('newsletter');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    router.push('/#newsletter');
  };

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
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 -ml-1.5 hover:bg-black/5 rounded-lg transition-colors"
              aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link href="/" className="flex items-center">
              <h1 className="text-[22px] md:text-[26px] tracking-[-0.03em] font-bold">
                NFI Report
              </h1>
            </Link>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 hover:bg-black/5 rounded-full transition-colors"
                aria-label="Rechercher"
              >
                <Search className="w-[18px] h-[18px]" />
              </button>
              <div className="relative" ref={userMenuRef}>
                {isSignedIn ? (
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="p-2 hover:bg-black/5 rounded-full transition-colors"
                    aria-label="Mon compte"
                  >
                    <User className="w-[18px] h-[18px]" />
                  </button>
                ) : (
                  <Link
                    href="/connexion"
                    className="p-2 hover:bg-black/5 rounded-full transition-colors"
                    aria-label="Se connecter"
                  >
                    <User className="w-[18px] h-[18px]" />
                  </Link>
                )}
                {userMenuOpen && isSignedIn && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-black/[0.06] py-1 z-50">
                    <div className="px-4 py-2 border-b border-black/[0.04]">
                      <p className="text-[12px] font-medium truncate">{user?.user_metadata?.full_name || user?.email?.split('@')[0]}</p>
                      <p className="text-[11px] text-gray-400 truncate">{user?.email}</p>
                    </div>
                    <Link
                      href="/compte"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Mon compte
                    </Link>
                    {userRole === 'admin' && (
                      <Link
                        href="/admin"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Administration
                      </Link>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Se déconnecter
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="bg-[#111] text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="hidden lg:flex items-center justify-between h-11">
              <div className="flex items-center gap-1">
                {navigation.map((section) => (
                  <Link
                    key={section.path}
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
              </div>
            </div>
          </div>
        </nav>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-black/5">
            <div className="px-4 py-3 space-y-1">
              {navigation.map((section) => (
                <Link
                  key={section.path}
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
                {isSignedIn && (
                  <Link
                    href="/compte"
                    className="flex items-center justify-between py-2.5 px-3 text-[15px] text-gray-700 hover:bg-black/[0.03] rounded-lg transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Mon compte
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
