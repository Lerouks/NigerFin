'use client';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { BreakingNews } from '@/components/BreakingNews';

export function MainLayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:bg-white focus:px-4 focus:py-2 focus:text-black focus:shadow-lg focus:rounded">
        Aller au contenu principal
      </a>
      <BreakingNews />
      <Header />
      <main id="main-content" className="flex-1 bg-[#fafaf9]">{children}</main>
      <Footer />
    </>
  );
}
