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

/**
 * Réseaux, avec leurs couleurs officielles au survol et au clavier (styles
 * .nfi-reseau dans globals.css). `fond` est une forme blanche glissée sous le
 * logo : elle n'apparaît qu'au survol, dans les découpes du logo, pour donner
 * le « f » blanc de Facebook et le triangle blanc de YouTube.
 */
const SOCIALS = [
  { label: 'Facebook', cle: 'facebook', Icon: Facebook, url: defaultSocialLinks.facebook, fond: <circle cx="12" cy="12" r="9.6" /> },
  { label: 'Instagram', cle: 'instagram', Icon: Instagram, url: defaultSocialLinks.instagram, fond: null },
  { label: 'YouTube', cle: 'youtube', Icon: Youtube, url: defaultSocialLinks.youtube, fond: <rect x="9.1" y="8" width="7.4" height="8" /> },
  { label: 'TikTok', cle: 'tiktok', Icon: TikTokIcon, url: defaultSocialLinks.tiktok, fond: null },
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
    <main className="relative flex min-h-svh w-full flex-col overflow-hidden bg-[#09090a] px-[22px] pb-6 pt-6 text-[#f4f4f5] antialiased sm:px-10 lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:grid-rows-[auto_1fr_auto] lg:gap-x-10 xl:flex xl:px-14 xl:pb-8 xl:pt-9">
      <CarteNiger className="pointer-events-none relative order-2 -ml-[9vw] mt-6 block w-[118vw] max-w-none sm:mx-auto sm:w-[min(100%,760px)] lg:col-start-2 lg:row-start-2 lg:mx-0 lg:mt-0 lg:w-full lg:self-center xl:absolute xl:right-[3vw] xl:top-[9vh] xl:order-none xl:m-0 xl:w-[min(63vw,104vh)]" />

      <header className="relative z-10 order-0 lg:col-span-2 lg:row-start-1">
        <div>
          <p className="font-[family-name:var(--font-playfair)] text-[22px] font-bold tracking-[0.01em] min-[1800px]:text-[26px]">NFI&nbsp;REPORT</p>
          <p className="mt-1 text-[12px] text-[#7d8189]">Niger Financial Insights</p>
        </div>
      </header>

      <section className="relative z-10 order-1 flex max-w-[560px] flex-col pt-[10vh] lg:col-start-1 lg:row-start-2 lg:self-center lg:pt-0 xl:max-w-[600px] xl:self-auto xl:flex-1 xl:justify-end xl:pb-[4vh] xl:pt-[4vh] min-[1800px]:max-w-[760px]">
        <h1 className="text-[46px] font-bold leading-[0.96] tracking-[-0.045em] sm:text-[64px] xl:text-[clamp(52px,min(6.2vw,10vh),136px)]">
          L’économie du&nbsp;Niger, <span className="text-[#7d8189]">en&nbsp;clair.</span>
        </h1>
        <p className="mt-5 max-w-[470px] text-[16px] leading-[1.55] text-[#a9adb4] sm:text-[18px] xl:mt-[3.2vh] min-[1800px]:max-w-[600px] min-[1800px]:text-[21px]">
          Un média d’information économique et financière consacré au&nbsp;Niger&nbsp;: l’énergie, les banques, la bourse, les entreprises.
        </p>
        <div className="mt-8 max-w-[470px] xl:mt-[5vh] min-[1800px]:max-w-[560px]">
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

      <footer className="relative z-10 order-3 mt-4 flex items-center lg:col-start-1 lg:row-start-3 xl:mt-0">
        <nav className="-ml-2.5 flex items-center gap-1" aria-label="NFI REPORT sur les réseaux sociaux">
          {/* Dégradé officiel d'Instagram, appelé par .nfi-reseau--instagram. */}
          <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
            <defs>
              <radialGradient id="nfi-degrade-instagram" cx="0.3" cy="1.07" r="1.5">
                <stop offset="0" stopColor="#fdf497" />
                <stop offset="0.05" stopColor="#fdf497" />
                <stop offset="0.45" stopColor="#fd5949" />
                <stop offset="0.6" stopColor="#d6249f" />
                <stop offset="0.9" stopColor="#285aeb" />
              </radialGradient>
            </defs>
          </svg>
          {SOCIALS.map(({ label, cle, Icon, url, fond }) => (
            <a
              key={label}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className={`nfi-reseau nfi-reseau--${cle} relative flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4f4f5]`}
            >
              {fond && (
                <svg viewBox="0 0 24 24" fill="#ffffff" className="nfi-reseau-fond absolute h-[18px] w-[18px]" aria-hidden="true">
                  {fond}
                </svg>
              )}
              <Icon className="relative h-[18px] w-[18px]" />
            </a>
          ))}
        </nav>
      </footer>
    </main>
  );
}
