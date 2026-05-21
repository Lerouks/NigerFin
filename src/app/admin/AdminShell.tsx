'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Newspaper, Users, Wallet, Server } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-[#fafaf9] text-[#1a1a1a]">
      <AdminSidebar pathname={pathname} />
      <div className="lg:pl-64">
        <main className="pb-24 lg:pb-12">{children}</main>
      </div>
      <AdminBottomNav pathname={pathname} />
    </div>
  );
}

function AdminSidebar({ pathname }: { pathname: string }) {
  return (
    <aside
      aria-label="Navigation administration"
      className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col bg-white border-r border-black/[0.06] z-30"
    >
      <div className="px-6 pt-8 pb-6">
        <p className="font-serif italic text-[20px] leading-none text-[#1a1a1a]">NFI Cockpit</p>
        <p className="text-[11px] tracking-widest uppercase text-[#1a1a1a]/45 mt-2 font-medium">
          Administration
        </p>
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
                  ? 'bg-gradient-to-br from-[#d4a843]/12 to-[#ff8c42]/8 text-[#1a1a1a] border border-[#d4a843]/30'
                  : 'text-[#1a1a1a]/60 hover:bg-black/[0.03] hover:text-[#1a1a1a]',
              ].join(' ')}
            >
              <Icon className={`w-[18px] h-[18px] ${isActive ? 'text-[#d4a843]' : ''}`} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-6 pb-8 pt-4 border-t border-black/[0.06]">
        <Link
          href="/"
          className="text-[12px] text-[#1a1a1a]/45 hover:text-[#1a1a1a]/80 transition"
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
      className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-black/[0.06] pb-[env(safe-area-inset-bottom)]"
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
                isActive ? 'text-[#d4a843]' : 'text-[#1a1a1a]/45',
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
