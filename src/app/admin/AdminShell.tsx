'use client';

import { useEffect, useState } from 'react';
import * as Sentry from '@sentry/nextjs';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Newspaper, Users, Wallet, Server, Search } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Perf H-3 : cmdk (~80 KB) n'est utile qu'au Cmd+K. Lazy-load => bundle initial
// admin plus leger. ssr: false car le composant ne s'affiche qu'au shortcut user.
const CommandPalette = dynamic(
  () => import('./CommandPalette').then((m) => m.CommandPalette),
  { ssr: false },
);

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
}

const NAV: NavItem[] = [
  { href: '/admin',          label: 'Cockpit',  icon: LayoutDashboard, match: (p) => p === '/admin' },
  { href: '/admin/contenu',  label: 'Contenu',  icon: Newspaper,       match: (p) => p.startsWith('/admin/contenu') },
  { href: '/admin/audience', label: 'Audience', icon: Users,           match: (p) => p.startsWith('/admin/audience') },
  { href: '/admin/argent',   label: 'Argent',   icon: Wallet,          match: (p) => p.startsWith('/admin/argent') },
  { href: '/admin/site',     label: 'Site',     icon: Server,          match: (p) => p.startsWith('/admin/site') },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '/admin';
  const [paletteOpen, setPaletteOpen] = useState(false);
  useServiceWorkerRegistration();
  useCommandPaletteShortcut(setPaletteOpen);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminSidebar pathname={pathname} onOpenPalette={() => setPaletteOpen(true)} />
      <div className="lg:pl-64">
        <main className="pb-24 lg:pb-12">{children}</main>
      </div>
      <AdminBottomNav pathname={pathname} />
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}

function useCommandPaletteShortcut(setOpen: (next: boolean | ((prev: boolean) => boolean)) => void) {
  // Cmd+K (macOS) / Ctrl+K (Win/Linux) toggle le palette de commandes. Pas de
  // raccourci sur mobile (les clients touch n'ont pas de clavier). Le handler
  // est volontairement permissif : il n'interfere pas avec les inputs natifs
  // car cmdk ne capture les fleches qu'a l'interieur de sa boite.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onKey = (e: KeyboardEvent) => {
      const isK = e.key === 'k' || e.key === 'K';
      if (!isK) return;
      if (!(e.metaKey || e.ctrlKey)) return;
      e.preventDefault();
      setOpen((prev) => !prev);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setOpen]);
}

function useServiceWorkerRegistration() {
  // Enregistre le service worker du Cockpit pour activer la PWA installable +
  // les push notifications. Scope limite a /admin (declare dans manifest.webmanifest).
  // Le SW lui-meme (public/sw.js) gere le caching NetworkFirst pour /admin/*
  // + l affichage des notifications push recues.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    const onLoad = () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/admin' })
        .catch((err) => {
          Sentry.captureException(err, { tags: { context: 'cockpit-sw-register' } });
        });
    };
    if (document.readyState === 'complete') onLoad();
    else window.addEventListener('load', onLoad, { once: true });
    return () => window.removeEventListener('load', onLoad);
  }, []);
}

function AdminSidebar({
  pathname,
  onOpenPalette,
}: {
  pathname: string;
  onOpenPalette: () => void;
}) {
  return (
    <aside
      aria-label="Navigation administration"
      className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col bg-white border-r border-black/6 z-30"
    >
      <div className="px-6 pt-8 pb-6">
        <p className="font-serif italic text-[20px] leading-none text-foreground">NFI Cockpit</p>
        <p className="text-[11px] tracking-widest uppercase text-foreground/45 mt-2 font-medium">
          Administration
        </p>
      </div>

      <div className="px-3 pb-3">
        <button
          type="button"
          onClick={onOpenPalette}
          aria-label="Ouvrir la recherche du Cockpit (Cmd + K)"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-foreground/55 bg-black/3 hover:bg-black/5 hover:text-foreground transition"
        >
          <Search className="w-[16px] h-[16px]" aria-hidden="true" />
          <span className="flex-1 text-left font-medium">Rechercher</span>
          <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-white text-foreground/55 border border-black/6">
            <span aria-hidden="true">{getCommandKeyLabel()}</span>
            <span className="sr-only">{getCommandKeyAriaLabel()}</span>
            K
          </kbd>
        </button>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1" role="navigation">
        {NAV.map(({ href, label, icon: Icon, match }) => {
          const isActive = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              prefetch
              aria-current={isActive ? 'page' : undefined}
              className={[
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition',
                isActive
                  ? 'bg-linear-to-br from-[#d4a843]/12 to-[#ff8c42]/8 text-foreground border border-[#d4a843]/30'
                  : 'text-foreground/60 hover:bg-black/3 hover:text-foreground',
              ].join(' ')}
            >
              <Icon className={`w-[18px] h-[18px] ${isActive ? 'text-[#d4a843]' : ''}`} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-6 pb-8 pt-4 border-t border-black/6">
        <Link
          href="/"
          className="text-[12px] text-foreground/45 hover:text-foreground/80 transition"
        >
          ← Retour au site
        </Link>
      </div>
    </aside>
  );
}

function AdminBottomNav({ pathname }: { pathname: string }) {
  return (
    <nav
      aria-label="Navigation administration mobile"
      className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-black/6 pb-[env(safe-area-inset-bottom)]"
    >
      <div className="grid grid-cols-5 max-w-[640px] mx-auto">
        {NAV.map(({ href, label, icon: Icon, match }) => {
          const isActive = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              prefetch
              aria-current={isActive ? 'page' : undefined}
              className={[
                'flex flex-col items-center gap-0.5 py-2.5 transition',
                isActive ? 'text-[#d4a843]' : 'text-foreground/45',
              ].join(' ')}
            >
              <Icon className="w-[22px] h-[22px]" aria-hidden="true" />
              <span className={['text-[10px] tracking-tight', isActive ? 'font-semibold' : 'font-medium'].join(' ')}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function getCommandKeyLabel(): string {
  if (typeof navigator === 'undefined') return 'Ctrl';
  const platform =
    (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ??
    navigator.platform ??
    '';
  return /mac|iphone|ipad/i.test(platform) ? '⌘' : 'Ctrl';
}

function getCommandKeyAriaLabel(): string {
  if (typeof navigator === 'undefined') return 'Ctrl + ';
  const platform =
    (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ??
    navigator.platform ??
    '';
  return /mac|iphone|ipad/i.test(platform) ? 'Commande plus ' : 'Controle plus ';
}
