'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, Search, X, ChevronRight, ChevronDown, LogOut } from 'lucide-react';
import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { SearchOverlay } from './SearchOverlay';
import {
  NAV_GROUPS,
  SIMULATEURS_MENU,
  MENU_APPRENDRE_VIDE,
  type MenuApprendre,
  type NavigationEntry,
} from '@/lib/navigation';

/**
 * Le Header exposait une prop `navigation` qu'AUCUN appelant ne passait : un
 * grep sur tout src ne trouvait aucun `navigation=`, et le seul point de montage
 * (MainLayoutShell) rendait `<Header />` sans argument. Cette prop morte laissait
 * croire a une navigation configurable qui n'existait pas. Le Header lit
 * desormais directement la source unique de verite.
 *
 * Listes déroulantes (24/11/2026, demandées par Raouf) : seules Apprendre et
 * Simulateurs en ont, parce que ce sont les deux rubriques qui ont des
 * sous-pages. Sur ordinateur, la liste s'ouvre au survol de la souris, ou au
 * clic sur la flèche (clavier, écran tactile), et se ferme avec Échap ou en
 * cliquant ailleurs ; le libellé, lui, mène toujours à la page. Sur téléphone
 * et tablette en portrait, la même liste s'ouvre dans le menu.
 */
type CleSousMenu = 'education' | 'outils';

const LARGEUR_PANNEAU: Record<CleSousMenu, number> = { outils: 560, education: 760 };

function estSousMenu(cle: string): cle is CleSousMenu {
  return cle === 'education' || cle === 'outils';
}

interface HeaderProps {
  /** Parcours et thèmes d'Apprendre, lus en base par le layout racine. */
  menuApprendre?: MenuApprendre;
}

export function Header({ menuApprendre = MENU_APPRENDRE_VIDE }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [ouvert, setOuvert] = useState<CleSousMenu | null>(null);
  const [gauchePanneau, setGauchePanneau] = useState(0);
  const [sousMenuMobile, setSousMenuMobile] = useState<CleSousMenu | null>(null);
  const { isSignedIn, isLoading: isAuthLoading, user, userRole, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const rangeeRef = useRef<HTMLDivElement>(null);
  const declencheurs = useRef<Partial<Record<CleSousMenu, HTMLDivElement | null>>>({});
  const fleches = useRef<Partial<Record<CleSousMenu, HTMLButtonElement | null>>>({});
  const minuterie = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (rangeeRef.current && !rangeeRef.current.contains(e.target as Node)) {
        setOuvert(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Une nouvelle page referme les listes ouvertes.
  useEffect(() => {
    setOuvert(null);
    setSousMenuMobile(null);
  }, [pathname]);

  // Échap referme la liste et rend la main à sa flèche.
  useEffect(() => {
    if (!ouvert) return;
    const surTouche = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const cle = ouvert;
      setOuvert(null);
      fleches.current[cle]?.focus();
    };
    document.addEventListener('keydown', surTouche);
    return () => document.removeEventListener('keydown', surTouche);
  }, [ouvert]);

  // La liste se cale sous sa rubrique sans jamais sortir de la barre.
  useLayoutEffect(() => {
    if (!ouvert || !rangeeRef.current) return;
    const declencheur = declencheurs.current[ouvert];
    if (!declencheur) return;
    const rangee = rangeeRef.current.getBoundingClientRect();
    const debut = declencheur.getBoundingClientRect().left - rangee.left;
    setGauchePanneau(Math.max(0, Math.min(debut, rangee.width - LARGEUR_PANNEAU[ouvert])));
  }, [ouvert]);

  useEffect(() => () => {
    if (minuterie.current) clearTimeout(minuterie.current);
  }, []);

  const programmer = useCallback((action: () => void, delai: number) => {
    if (minuterie.current) clearTimeout(minuterie.current);
    minuterie.current = setTimeout(action, delai);
  }, []);
  const ouvrirAuSurvol = (cle: CleSousMenu) => programmer(() => setOuvert(cle), 120);
  const fermerAuDepart = () => programmer(() => setOuvert(null), 180);
  const garderOuvert = () => {
    if (minuterie.current) clearTimeout(minuterie.current);
  };

  const handleSignOut = async () => {
    await signOut();
    setUserMenuOpen(false);
    router.refresh();
  };

  const lienRubrique = (entry: NavigationEntry, isActive: boolean, avecFleche: boolean) => (
    <Link
      href={entry.path}
      className={`group flex flex-col justify-center border-b-2 transition-colors ${
        avecFleche ? 'pl-3.5 pr-1' : 'px-3.5'
      } ${
        isActive
          ? 'border-foreground text-foreground'
          : 'border-transparent text-foreground/75 hover:text-foreground hover:border-black/20'
      }`}
      aria-current={isActive ? 'page' : undefined}
    >
      <span className="text-[14px] font-semibold leading-tight">{entry.label}</span>
      {entry.subtitle && (
        <span className="text-[11px] text-gray-500 leading-tight mt-0.5">{entry.subtitle}</span>
      )}
    </Link>
  );

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/6">
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
              <span className="font-[family-name:var(--font-playfair)] text-[20px] sm:text-[22px] md:text-[26px] tracking-[0.01em] font-bold truncate">
                NFI&nbsp;REPORT
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
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-black/6 py-1 z-50 animate-scale-in origin-top-right" role="menu">
                    <div className="px-4 py-2 border-b border-black/4">
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

        {/*
          Barre de rubriques sur fond CLAIR.

          Elle etait sur fond noir plein, qui est le marqueur numero un du theme
          de presse generique. Le noir est desormais reserve aux donnees : la
          seule surface noire permanente du site est le rail de donnees. Ici, un
          simple filet de 1 px suffit a poser la barre.

          Deux registres separes par un filet vertical : « comprendre » (le
          contexte) puis « agir » (les ressources). Les sous-titres permanents
          disent ce qu'on trouve dans chaque rubrique.
        */}
        <nav
          className="hidden lg:block bg-white border-t border-black/6"
          aria-label="Rubriques"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative flex items-stretch h-14" ref={rangeeRef}>
              {NAV_GROUPS.map((groupe, indexGroupe) => (
                <div key={groupe.register} className="flex items-stretch">
                  {indexGroupe > 0 && (
                    <div className="self-center h-8 w-px bg-black/12 mx-4" aria-hidden="true" />
                  )}
                  {groupe.entries.map((entry) => {
                    const isActive =
                      pathname === entry.path || pathname.startsWith(entry.path + '/');
                    if (!estSousMenu(entry.key)) {
                      return <div key={entry.path} className="flex items-stretch">{lienRubrique(entry, isActive, false)}</div>;
                    }
                    const cle = entry.key;
                    const estOuvert = ouvert === cle;
                    return (
                      <div
                        key={entry.path}
                        ref={(el) => {
                          declencheurs.current[cle] = el;
                        }}
                        className={`flex items-stretch transition-colors ${estOuvert ? 'bg-black/[0.03]' : ''}`}
                        onPointerEnter={(e) => {
                          if (e.pointerType === 'mouse') ouvrirAuSurvol(cle);
                        }}
                        onPointerLeave={(e) => {
                          if (e.pointerType === 'mouse') fermerAuDepart();
                        }}
                      >
                        {lienRubrique(entry, isActive, true)}
                        <button
                          type="button"
                          ref={(el) => {
                            fleches.current[cle] = el;
                          }}
                          onClick={() => setOuvert(estOuvert ? null : cle)}
                          aria-expanded={estOuvert}
                          aria-controls={`sous-menu-${cle}`}
                          aria-label={`${estOuvert ? 'Fermer' : 'Ouvrir'} la liste ${cle === 'outils' ? 'des simulateurs' : 'd’Apprendre'}`}
                          className="flex items-center justify-center w-8 mr-1 text-gray-500 hover:text-foreground transition-colors"
                        >
                          <ChevronDown
                            className={`w-3.5 h-3.5 motion-safe:transition-transform motion-safe:duration-200 ${estOuvert ? 'rotate-180' : ''}`}
                            aria-hidden="true"
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}

              {ouvert && (
                <div
                  id={`sous-menu-${ouvert}`}
                  className="absolute top-full z-40 bg-white border border-black/6 border-t-0 rounded-b-xl shadow-[0_18px_40px_rgba(0,0,0,0.08)] px-6 pt-5 pb-4 motion-safe:animate-[fadeIn_120ms_ease-out]"
                  style={{ left: gauchePanneau, width: LARGEUR_PANNEAU[ouvert] }}
                  onPointerEnter={(e) => {
                    if (e.pointerType === 'mouse') garderOuvert();
                  }}
                  onPointerLeave={(e) => {
                    if (e.pointerType === 'mouse') fermerAuDepart();
                  }}
                >
                  {ouvert === 'outils' ? (
                    <>
                      <ul className="grid grid-cols-2 gap-x-7">
                        {SIMULATEURS_MENU.map((s) => (
                          <li key={s.href}>
                            <Link
                              href={s.href}
                              className="block rounded-md px-2.5 py-2 -mx-2.5 hover:bg-black/[0.035] focus-visible:bg-black/[0.035] transition-colors"
                            >
                              <span className="text-[14px] font-semibold text-foreground">{s.label}</span>
                              {s.premium && (
                                <span className="ml-1.5 text-[11px] font-semibold text-gold">Premium</span>
                              )}
                              {s.detail && (
                                <span className="block text-[13px] text-gray-500 mt-0.5">{s.detail}</span>
                              )}
                            </Link>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-3.5 pt-3 border-t border-black/6 flex items-center justify-between gap-4 text-[13px]">
                        <span className="text-gray-500">Adaptés aux règles du Niger et de l&rsquo;UEMOA</span>
                        <Link href="/outils" className="font-semibold text-foreground hover:text-foreground/70 whitespace-nowrap">
                          Tous les simulateurs&nbsp;›
                        </Link>
                      </div>
                    </>
                  ) : (
                    <>
                      {(menuApprendre.parcours.length > 0 || menuApprendre.themes.length > 0) && (
                        <div className="grid grid-cols-[1fr_1.45fr] gap-x-9">
                          <div>
                            <p className="text-[12px] font-semibold text-gray-500 mb-2.5">Les parcours</p>
                            <ul>
                              {menuApprendre.parcours.map((p) => (
                                <li key={p.href}>
                                  <Link
                                    href={p.href}
                                    className="block rounded-md px-2.5 py-2 -mx-2.5 hover:bg-black/[0.035] focus-visible:bg-black/[0.035] transition-colors"
                                  >
                                    <span className="text-[14px] font-semibold text-foreground">{p.label}</span>
                                    {p.detail && (
                                      <span className="block text-[13px] text-gray-500 mt-0.5">{p.detail}</span>
                                    )}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-[12px] font-semibold text-gray-500 mb-2.5">Les thèmes</p>
                            <ul className="grid grid-cols-2 gap-x-5">
                              {menuApprendre.themes.map((t) => (
                                <li key={t.href}>
                                  <Link
                                    href={t.href}
                                    className="block rounded-md px-2.5 py-1.5 -mx-2.5 text-[14px] text-foreground hover:bg-black/[0.035] focus-visible:bg-black/[0.035] transition-colors"
                                  >
                                    {t.label}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                      <div className="mt-3.5 pt-3 border-t border-black/6 flex items-center justify-between gap-4 text-[13px]">
                        <span className="text-gray-500">
                          {menuApprendre.lecons > 0
                            ? `${menuApprendre.lecons} leçons, du premier pas à la BRVM`
                            : 'Des cours pour comprendre l’argent'}
                        </span>
                        <Link href="/education" className="font-semibold text-foreground hover:text-foreground/70 whitespace-nowrap">
                          Tout Apprendre&nbsp;›
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              )}
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
            {NAV_GROUPS.map((groupe, indexGroupe) => (
              <div
                key={groupe.register}
                className={indexGroupe > 0 ? 'pt-2 mt-2 border-t border-black/6' : ''}
              >
                {groupe.entries.map((entry, i) => {
                  const intitule = (
                    <span className="flex flex-col">
                      <span className="text-[15px] text-gray-800 font-medium leading-tight">
                        {entry.label}
                      </span>
                      {entry.subtitle && (
                        <span className="text-[12px] text-gray-500 leading-tight mt-0.5">
                          {entry.subtitle}
                        </span>
                      )}
                    </span>
                  );
                  if (!estSousMenu(entry.key)) {
                    return (
                      <Link
                        key={entry.path}
                        href={entry.path}
                        className="flex items-center justify-between min-h-[44px] py-3 px-3 hover:bg-black/3 rounded-lg transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                        tabIndex={mobileMenuOpen ? 0 : -1}
                        style={{ animationDelay: mobileMenuOpen ? `${i * 50}ms` : '0ms' }}
                      >
                        {intitule}
                        <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                      </Link>
                    );
                  }
                  const cle = entry.key;
                  const deplie = sousMenuMobile === cle;
                  const liens = cle === 'outils' ? SIMULATEURS_MENU : menuApprendre.parcours;
                  return (
                    <div key={entry.path}>
                      <button
                        type="button"
                        onClick={() => setSousMenuMobile(deplie ? null : cle)}
                        aria-expanded={deplie}
                        aria-controls={`sous-menu-mobile-${cle}`}
                        className="flex w-full items-center justify-between min-h-[44px] py-3 px-3 hover:bg-black/3 rounded-lg transition-colors text-left"
                        tabIndex={mobileMenuOpen ? 0 : -1}
                      >
                        {intitule}
                        <ChevronDown
                          className={`w-4 h-4 text-gray-400 shrink-0 motion-safe:transition-transform motion-safe:duration-200 ${deplie ? 'rotate-180' : ''}`}
                          aria-hidden="true"
                        />
                      </button>
                      {deplie && (
                        <ul id={`sous-menu-mobile-${cle}`} className="pl-3 pb-1">
                          {liens.map((lien) => (
                            <li key={lien.href}>
                              <Link
                                href={lien.href}
                                onClick={() => setMobileMenuOpen(false)}
                                tabIndex={mobileMenuOpen ? 0 : -1}
                                className="flex items-center justify-between gap-3 min-h-[44px] px-3 text-[15px] text-gray-700 hover:bg-black/3 rounded-lg transition-colors"
                              >
                                <span>{lien.label}</span>
                                {lien.premium && (
                                  <span className="text-[11px] font-semibold text-gold shrink-0">Premium</span>
                                )}
                              </Link>
                            </li>
                          ))}
                          <li>
                            <Link
                              href={entry.path}
                              onClick={() => setMobileMenuOpen(false)}
                              tabIndex={mobileMenuOpen ? 0 : -1}
                              className="flex items-center min-h-[44px] px-3 text-[15px] font-semibold text-foreground hover:bg-black/3 rounded-lg transition-colors"
                            >
                              {cle === 'outils' ? 'Tous les simulateurs ›' : 'Tout Apprendre ›'}
                            </Link>
                          </li>
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
            <div className="pt-2 mt-2 border-t border-black/5">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setSearchOpen(true);
                }}
                className="sm:hidden flex items-center justify-between w-full py-2.5 px-3 text-[15px] text-gray-700 hover:bg-black/3 rounded-lg transition-colors text-left"
                tabIndex={mobileMenuOpen ? 0 : -1}
              >
                <span className="flex items-center gap-2"><Search className="w-4 h-4" /> Rechercher</span>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </button>
              {!isAuthLoading && !isSignedIn && (
                <Link
                  href="/connexion"
                  className="sm:hidden flex items-center justify-between py-2.5 px-3 text-[15px] text-gray-700 hover:bg-black/3 rounded-lg transition-colors"
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
                  className="flex items-center justify-between py-2.5 px-3 text-[15px] font-semibold text-foreground bg-gold/15 hover:bg-gold/25 rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                  tabIndex={mobileMenuOpen ? 0 : -1}
                >
                  S&apos;abonner
                  <ChevronRight className="w-4 h-4 text-foreground/50" />
                </Link>
              )}
              {!isAuthLoading && isSignedIn && (
                <Link
                  href="/compte"
                  className="flex items-center justify-between py-2.5 px-3 text-[15px] text-gray-700 hover:bg-black/3 rounded-lg transition-colors"
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
