import { Facebook, Instagram, Youtube } from '@/components/icons/social';
import { defaultSocialLinks } from '@/lib/site-data';
import { WaitlistForm } from './WaitlistForm';
import { CarteNiger } from './CarteNiger';

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
 * Page d'attente du pré-lancement (maquette « la carte », choisie par la
 * direction le 23/11/2026). Fond noir ; le Niger en points argentés occupe le
 * haut à droite, le titre se pose dans le vide du nord-ouest de la carte. Sur
 * téléphone, la carte passe sous le formulaire pour que l'inscription reste
 * en haut de l'écran.
 */
export function ComingSoon() {
  return (
    <main className="relative flex min-h-svh w-full flex-col overflow-hidden bg-[#09090a] px-[22px] pb-6 pt-6 text-[#f4f4f5] antialiased sm:px-10 xl:px-14 xl:pb-8 xl:pt-9">
      <CarteNiger className="pointer-events-none relative order-2 -ml-[9vw] mt-6 block aspect-[1000/794] w-[118vw] max-w-none sm:mx-auto sm:w-[min(100%,760px)] xl:absolute xl:right-[3vw] xl:top-[9vh] xl:order-none xl:m-0 xl:w-[min(63vw,104vh)]" />

      <header className="relative z-10 order-0 flex items-start justify-between">
        <div>
          <p className="font-[family-name:var(--font-playfair)] text-[22px] font-bold tracking-[0.01em]">NFI&nbsp;REPORT</p>
          <p className="mt-1 text-[12px] text-[#7d8189]">Niger Financial Insights</p>
        </div>
        <p className="hidden items-center gap-2.5 text-[13px] text-[#a9adb4] xl:flex">
          <span className="nfi-veille h-1.5 w-1.5 rounded-full bg-[#f4f4f5]" aria-hidden="true" />
          Ouverture prochaine
        </p>
      </header>

      <section className="relative z-10 order-1 flex max-w-[560px] flex-col pt-[10vh] xl:flex-1 xl:justify-end xl:pb-[4vh] xl:pt-[4vh]">
        <h1 className="text-[46px] font-bold leading-[0.96] tracking-[-0.045em] sm:text-[64px] xl:text-[clamp(52px,min(6.2vw,10vh),96px)]">
          L’économie du&nbsp;Niger, <span className="text-[#7d8189]">en&nbsp;clair.</span>
        </h1>
        <p className="mt-5 max-w-[470px] text-[16px] leading-[1.55] text-[#a9adb4] sm:text-[18px] xl:mt-[3.2vh]">
          Un média d’information économique et financière consacré au&nbsp;Niger&nbsp;: l’énergie, les banques, la bourse, les entreprises.
        </p>
        <div className="mt-8 max-w-[470px] xl:mt-[5vh]">
          <WaitlistForm />
          {/* La page collecte une adresse : qui la donne doit pouvoir lire qui la
              collecte, et sortir. Ces pages restent ouvertes en pré-lancement. */}
          <p className="mt-1 text-[12px] leading-relaxed text-[#7d8189]">
            Votre adresse ne sert qu’à vous prévenir de l’ouverture.{' '}
            <a
              href="/confidentialite"
              className="whitespace-nowrap underline underline-offset-[3px] transition-colors hover:text-[#f4f4f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4f4f5]"
            >
              Politique de confidentialité
            </a>
          </p>
        </div>
      </section>

      <footer className="relative z-10 order-3 mt-4 flex items-center justify-between gap-6 text-[13px] text-[#7d8189] xl:mt-0">
        <nav className="-ml-2.5 flex items-center gap-1" aria-label="NFI Report sur les réseaux sociaux">
          {SOCIALS.map(({ label, Icon, url }) => (
            <a
              key={label}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="flex h-11 w-11 items-center justify-center rounded-full text-[#a9adb4] transition-colors duration-200 hover:text-[#f4f4f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4f4f5]"
            >
              <Icon className="h-[18px] w-[18px]" />
            </a>
          ))}
        </nav>
        <p className="xl:hidden">Ouverture prochaine</p>
      </footer>
    </main>
  );
}
