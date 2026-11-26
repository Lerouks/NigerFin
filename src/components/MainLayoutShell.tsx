'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { BreakingNews } from '@/components/BreakingNews';
import type { FlashBannerData } from '@/lib/site-data';

interface MainLayoutShellProps {
  children: React.ReactNode;
  initialFlashBanner: FlashBannerData;
}

export function MainLayoutShell({ children, initialFlashBanner }: MainLayoutShellProps) {
  const pathname = usePathname() ?? '/';
  // Le Cockpit admin et la route preview de design-review ont leur propre chrome
  // (sidebar desktop + bottom nav mobile via AdminShell). On retire le Header,
  // Footer et BreakingNews du site public pour donner une vraie experience admin.
  const isAdminSurface =
    pathname.startsWith('/admin') || pathname.startsWith('/dev-cockpit-preview');

  if (isAdminSurface) {
    return <>{children}</>;
  }

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-100 focus:bg-white focus:px-4 focus:py-2 focus:text-black focus:shadow-lg focus:rounded-sm"
      >
        Aller au contenu principal
      </a>
      <BreakingNews
        initialItems={initialFlashBanner.items}
        initialEnabled={initialFlashBanner.enabled}
      />
      <Header />
      <main id="main-content" className="flex-1 bg-background">
        {children}
      </main>
      <Footer />
    </>
  );
}
