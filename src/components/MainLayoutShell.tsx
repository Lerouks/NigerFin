'use client';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { BreakingNews } from '@/components/BreakingNews';

export function MainLayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BreakingNews />
      <Header />
      <main className="flex-1 bg-[#fafaf9]">{children}</main>
      <Footer />
    </>
  );
}
