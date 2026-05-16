import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { BreakingNews } from '@/components/BreakingNews';
import type { FlashBannerData } from '@/lib/site-data';

interface MainLayoutShellProps {
  children: React.ReactNode;
  initialFlashBanner: FlashBannerData;
}

export function MainLayoutShell({ children, initialFlashBanner }: MainLayoutShellProps) {
  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:bg-white focus:px-4 focus:py-2 focus:text-black focus:shadow-lg focus:rounded">
        Aller au contenu principal
      </a>
      <BreakingNews
        initialItems={initialFlashBanner.items}
        initialEnabled={initialFlashBanner.enabled}
      />
      <Header />
      <main id="main-content" className="flex-1 bg-[#fafaf9]">{children}</main>
      <Footer />
    </>
  );
}
