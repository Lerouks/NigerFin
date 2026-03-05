'use client';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { BreakingNews } from '@/components/BreakingNews';

export function MainLayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BreakingNews />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
