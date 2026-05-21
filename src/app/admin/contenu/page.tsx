import type { Metadata } from 'next';
import Link from 'next/link';
import { Newspaper, MessageSquare, Mail, Zap, BookOpen, FileText, ArrowUpRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ContenuStats } from './ContenuStats';

export const metadata: Metadata = {
  title: 'Contenu · NFI Cockpit',
  description: 'Articles, commentaires, newsletter, flash info, éducation et pages légales.',
  robots: { index: false },
};

interface SectionLink {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: 'live' | null;
}

const SECTIONS: SectionLink[] = [
  {
    href: '/admin/contenu/articles',
    icon: Newspaper,
    title: 'Articles',
    description: 'Publier, modifier et organiser les articles éditoriaux.',
  },
  {
    href: '/admin/contenu/commentaires',
    icon: MessageSquare,
    title: 'Commentaires',
    description: 'Modérer rapidement avec raccourcis clavier (J approuve, K rejette).',
    badge: 'live',
  },
  {
    href: '/admin/newsletter',
    icon: Mail,
    title: 'Newsletter',
    description: 'Éditions Premium, planification et envoi aux abonnés.',
  },
  {
    href: '/admin/contenu/flash',
    icon: Zap,
    title: 'Flash info',
    description: 'Bandeau d\'alerte breaking news en haut du site.',
  },
  {
    href: '/admin/contenu/education',
    icon: BookOpen,
    title: 'Éducation',
    description: 'Parcours, catégories et leçons financières.',
  },
  {
    href: '/admin/contenu/pages',
    icon: FileText,
    title: 'Pages légales',
    description: 'Mentions légales, CGU, confidentialité, cookies.',
  },
];

export default function ContenuPage() {
  return (
    <div className="max-w-[640px] lg:max-w-[920px] mx-auto px-5 pt-8 pb-6">
      <header className="mb-8">
        <p className="text-[10px] tracking-widest uppercase text-[#1a1a1a]/45 font-bold">
          Module
        </p>
        <h1 className="font-extrabold text-[32px] leading-tight tracking-tight mt-1">
          Contenu
        </h1>
        <p className="text-[15px] text-[#1a1a1a]/60 mt-3 leading-relaxed max-w-[560px]">
          La fabrique éditoriale de NFI Report. Articles, modération, newsletter Premium et tout ce qui s&apos;affiche sur le site public.
        </p>
      </header>

      <ContenuStats />

      <section className="grid gap-3 sm:grid-cols-2">
        {SECTIONS.map(({ href, icon: Icon, title, description, badge }) => (
          <Link
            key={href}
            href={href}
            prefetch
            className="group relative bg-white border border-black/[0.06] rounded-2xl p-5 hover:border-[#d4a843]/40 hover:shadow-sm transition"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#d4a843]/12 to-[#ff8c42]/8 flex items-center justify-center text-[#d4a843]">
                <Icon className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="flex items-center gap-2">
                {badge === 'live' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#00a004]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00c805] animate-pulse" />
                    live
                  </span>
                )}
                <ArrowUpRight
                  className="w-4 h-4 text-[#1a1a1a]/30 group-hover:text-[#d4a843] transition"
                  aria-hidden="true"
                />
              </div>
            </div>
            <p className="font-bold text-[16px] text-[#1a1a1a] leading-tight">{title}</p>
            <p className="text-[13px] text-[#1a1a1a]/55 leading-relaxed mt-1">
              {description}
            </p>
          </Link>
        ))}
      </section>
    </div>
  );
}
