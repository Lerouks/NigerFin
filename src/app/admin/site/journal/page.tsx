import type { Metadata } from 'next';
import { AuditTab } from '../../AuditTab';

export const metadata: Metadata = {
  title: "Journal d'audit · NFI Cockpit",
  description:
    'Historique paginé de toutes les actions admin (création, modification, suppression).',
  robots: { index: false },
};

export default function SiteJournalPage() {
  return (
    <div className="max-w-[1280px] mx-auto px-5 pt-6 pb-6">
      <header className="mb-6">
        <p className="text-[10px] tracking-widest uppercase text-foreground/45 font-bold">
          Module Site
        </p>
        <h1 className="font-extrabold text-[26px] leading-tight tracking-tight mt-1">
          Journal d&apos;audit
        </h1>
        <p className="text-[14px] text-foreground/60 mt-2 leading-relaxed max-w-[560px]">
          Toutes les actions admin tracées en base : qui a fait quoi, sur
          quelle ressource, et quand.
        </p>
      </header>
      <AuditTab />
    </div>
  );
}
