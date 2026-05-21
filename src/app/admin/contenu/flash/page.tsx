import type { Metadata } from 'next';
import { FlashBannerManager } from '../../FlashBannerManager';

export const metadata: Metadata = {
  title: 'Flash info · NFI Cockpit',
  description: 'Configurer le bandeau breaking news.',
  robots: { index: false },
};

export default function ContenuFlashPage() {
  return (
    <div className="max-w-[1280px] mx-auto px-5 pt-6 pb-6">
      <h1 className="sr-only">Flash info</h1>
      <FlashBannerManager />
    </div>
  );
}
