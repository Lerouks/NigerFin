import Link from 'next/link';
import { ArrowRight, Clock } from 'lucide-react';

interface ModulePlaceholderProps {
  title: string;
  description: string;
  phaseLabel: string;
  legacyTab?: string;
}

export function ModulePlaceholder({
  title,
  description,
  phaseLabel,
  legacyTab,
}: ModulePlaceholderProps) {
  const legacyHref = legacyTab ? `/admin/legacy?tab=${legacyTab}` : '/admin/legacy';
  return (
    <div className="max-w-[640px] lg:max-w-[820px] mx-auto px-5 pt-8">
      <header className="mb-8">
        <div className="inline-flex items-center gap-1.5 text-[10px] tracking-widest uppercase text-[#d4a843] font-bold mb-3">
          <Clock className="w-3 h-3" aria-hidden="true" />
          {phaseLabel}
        </div>
        <h1 className="font-extrabold text-[28px] leading-tight tracking-tight text-foreground">
          {title}
        </h1>
        <p className="text-[15px] text-foreground/60 mt-3 leading-relaxed">{description}</p>
      </header>

      <div className="bg-white border border-black/6 rounded-2xl p-5">
        <p className="text-[13px] text-foreground/65 leading-relaxed mb-4">
          En attendant la migration de ce module dans le nouveau Cockpit, tu peux
          accéder à toutes les fonctionnalités via l&apos;ancien tableau de bord.
        </p>
        <Link
          href={legacyHref}
          prefetch
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-foreground text-white text-[13px] font-semibold hover:bg-black transition"
        >
          Ouvrir dans l&apos;ancien tableau de bord
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
