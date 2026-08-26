import { Facebook, Instagram, Youtube } from '@/components/icons/social';
import { defaultSocialLinks } from '@/lib/site-data';
import { WaitlistForm } from './WaitlistForm';
import { IndexChart } from './IndexChart';
import { Ticker } from './Ticker';

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
 * Page publique du mode pré-lancement. Couverture éditoriale plein écran d'un
 * média financier : titre à gauche en révélation cinétique + surlignage marqueur
 * (signature NFI), graphe d'indice ascendant animé à droite, fil d'actualité
 * défilant en bas. Les admins connectés ne voient jamais cette page (bypass layout).
 */
export function ComingSoon() {
  return (
    <main
      className="relative flex min-h-svh w-full flex-col overflow-hidden text-[#16130d]"
      style={{ backgroundColor: '#f6f4ee' }}
    >
      {/* Masthead */}
      <header className="nfi-rise px-6 pt-8 sm:px-10 lg:px-16 lg:pt-10" style={{ animationDelay: '40ms' }}>
        <p className="font-[family-name:var(--font-playfair)] text-[22px] font-bold tracking-[0.01em]">NFI&nbsp;REPORT</p>
        <p className="mt-1 text-[12px] text-[#16130d]/45">Niger Financial Insights</p>
      </header>

      {/* Hero : remplit la hauteur */}
      <section className="flex flex-1 items-center px-6 py-10 sm:px-10 lg:px-16">
        <div className="grid w-full items-center gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10">
          {/* Texte */}
          <div className="max-w-[42rem]">
            <h1 className="text-[clamp(2.6rem,6.5vw,5.15rem)] font-bold leading-[1.04] tracking-[-0.04em]">
              <span className="nfi-reveal">
                <span style={{ animationDelay: '180ms' }}>
                  <span className="nfi-marker" style={{ animationDelay: '1050ms' }}>
                    L&apos;intelligence économique
                  </span>{' '}
                  du Niger arrive.
                </span>
              </span>
            </h1>

            <p
              className="nfi-rise mt-7 max-w-[34rem] text-[clamp(1rem,1.5vw,1.15rem)] leading-relaxed text-[#16130d]/72"
              style={{ animationDelay: '520ms' }}
            >
              Analyses, données de marché et décryptages, pour comprendre l&apos;économie du Niger
              et de l&apos;Afrique de l&apos;Ouest.
            </p>

            <div className="nfi-rise mt-10 max-w-[30rem]" style={{ animationDelay: '640ms' }}>
              <p className="mb-3 text-[14px] text-[#16130d]/60">Recevez le signal du lancement.</p>
              <WaitlistForm />
              {/* La page collecte une adresse : qui la donne doit pouvoir lire qui la
                  collecte, et sortir. Les deux pages restent ouvertes en pré-lancement. */}
              <p className="mt-3 text-[12px] leading-relaxed text-[#16130d]/45">
                Votre adresse ne sert qu&apos;au signal du lancement.{' '}
                <a
                  href="/confidentialite"
                  className="whitespace-nowrap underline underline-offset-2 transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                >
                  Politique de confidentialité
                </a>
              </p>
            </div>
          </div>

          {/* Graphe */}
          <div className="flex w-full items-end self-stretch lg:pl-6">
            <IndexChart />
          </div>
        </div>
      </section>

      {/* Pied éditorial */}
      <footer
        className="nfi-rise flex flex-col gap-5 px-6 pb-7 sm:flex-row sm:items-end sm:justify-between sm:px-10 lg:px-16"
        style={{ animationDelay: '760ms' }}
      >
        <div>
          <p className="font-[family-name:var(--font-playfair)] text-[15px] font-medium text-gold">La connaissance, votre meilleur capital.</p>
          <div className="mt-4 flex items-center gap-1.5">
            {SOCIALS.map(({ label, Icon, url }) => (
              <a
                key={label}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="group relative -ml-2 flex h-11 w-11 items-center justify-center rounded-full text-[#16130d]/55 transition-colors duration-200 first:ml-0 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f4ee]"
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

      {/* Fil d'actualité */}
      <Ticker />
    </main>
  );
}
