import { Facebook, Instagram, Youtube } from '@/components/icons/social';
import { defaultSocialLinks } from '@/lib/site-data';
import { WaitlistForm } from './WaitlistForm';

/** Icône TikTok (identique à celle du Footer, non fournie par le pack lucide). */
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.46V13.2a8.16 8.16 0 005.58 2.18v-3.44a4.85 4.85 0 01-1-.1 4.83 4.83 0 01-3.58-2.72V2.44h3.45a4.83 4.83 0 003.77 4.25v3.44a8.16 8.16 0 01-2.64-.44z" />
    </svg>
  );
}

const SOCIALS = [
  { label: 'Facebook', Icon: Facebook, url: defaultSocialLinks.facebook },
  { label: 'Instagram', Icon: Instagram, url: defaultSocialLinks.instagram },
  { label: 'YouTube', Icon: Youtube, url: defaultSocialLinks.youtube },
  { label: 'TikTok', Icon: TikTokIcon, url: defaultSocialLinks.tiktok },
].filter((s) => Boolean(s.url));

/**
 * Page publique du mode pré-lancement. Parti pris : couverture éditoriale claire
 * (le vrai site NFI est clair), calée à gauche et asymétrique, typographie
 * confiante. Signature : un surlignage doré « au marqueur » qui balaie le
 * mot-clé au chargement (langage visuel des reels NFI). Les admins connectés ne
 * voient jamais cette page (bypass dans le layout).
 */
export function ComingSoon() {
  return (
    <main
      className="flex min-h-[100svh] flex-col px-6 py-10 text-[#16130d] sm:px-10 sm:py-14 lg:px-20"
      style={{ backgroundColor: '#f6f4ee' }}
    >
      {/* Masthead */}
      <header className="nfi-rise" style={{ animationDelay: '60ms' }}>
        <p className="text-[22px] font-bold tracking-[-0.03em]">NFI&nbsp;REPORT</p>
        <p className="mt-1 text-[12px] text-[#16130d]/45">Niger Financial Insights</p>
      </header>

      {/* Hero éditorial */}
      <div className="my-auto max-w-[48rem] py-14">
        <h1 className="nfi-rise text-[clamp(2.5rem,6.4vw,4.9rem)] font-bold leading-[1.02] tracking-[-0.038em]" style={{ animationDelay: '160ms' }}>
          <span className="relative inline-block">
            <span
              aria-hidden="true"
              className="nfi-sweep absolute inset-x-[-0.08em] bottom-[0.08em] top-[0.14em] bg-gold/40"
              style={{ animationDelay: '880ms' }}
            />
            <span className="relative">L&apos;intelligence économique</span>
          </span>{' '}
          du Niger arrive.
        </h1>

        <p className="nfi-rise mt-7 max-w-[35rem] text-[clamp(1rem,1.6vw,1.15rem)] leading-relaxed text-[#16130d]/65" style={{ animationDelay: '300ms' }}>
          Analyses, données de marché et décryptages, pour comprendre l&apos;économie du Niger
          et de l&apos;Afrique de l&apos;Ouest.
        </p>

        <div className="nfi-rise mt-11 max-w-[30rem]" style={{ animationDelay: '440ms' }}>
          <p className="mb-3 text-[14px] text-[#16130d]/55">Recevez le signal du lancement.</p>
          <WaitlistForm />
        </div>
      </div>

      {/* Pied éditorial */}
      <footer className="nfi-rise flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between" style={{ animationDelay: '580ms' }}>
        <div>
          <p className="text-[15px] font-medium text-gold">La connaissance, votre meilleur capital.</p>
          <div className="mt-4 flex items-center gap-1.5">
            {SOCIALS.map(({ label, Icon, url }) => (
              <a
                key={label}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="group relative -ml-2 flex h-10 w-10 items-center justify-center rounded-full text-[#16130d]/55 transition-colors duration-200 first:ml-0 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f4ee]"
              >
                <span className="pointer-events-none absolute -top-7 whitespace-nowrap rounded bg-[#16130d] px-2 py-1 text-[11px] font-medium text-[#f6f4ee] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  {label}
                </span>
                <Icon className="h-[18px] w-[18px]" />
              </a>
            ))}
          </div>
        </div>
        <p className="text-[13px] text-[#16130d]/40">Niamey&nbsp;· 2026</p>
      </footer>
    </main>
  );
}
