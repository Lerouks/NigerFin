'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { BreakingNews } from '@/components/BreakingNews';

export function MainLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Sanity Studio needs full page control — no Header/Footer/BreakingNews
  if (pathname.startsWith('/studio')) {
    return <>{children}</>;
  }

  return (
    <>
      <BreakingNews />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
