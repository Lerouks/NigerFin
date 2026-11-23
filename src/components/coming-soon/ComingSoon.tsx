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
 * Page d'attente du pré-lancement (maquette « la carte », 23/11/2026).
 *
 * - Téléphone (version D) : la carte en tête, puis le titre et le formulaire.
 *   Le premier écran prend la hauteur visible exacte de Safari et la carte
 *   occupe la place que laissent le titre et le formulaire.
 * - Tablette et ordinateur (version B) : tout est centré, le titre et le
 *   formulaire en haut, la carte en dessous comme un horizon.
 * - Entrée (globals.css et CarteNiger) : la carte s'assemble d'ouest en est, le
 *   titre monte mot par mot puis « en clair » passe du flou au net, le reste
 *   arrive en fondu ; sur ordinateur, la souris éclaire les points qu'elle
 *   survole. Tout est coupé pour qui demande moins de mouvement.
 */
export function ComingSoon() {
  return (
    <main className="relative flex min-h-svh w-full flex-col overflow-hidden bg-[#09090a] px-[22px] pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 text-[#f4f4f5] antialiased [-webkit-tap-highlight-color:transparent] sm:items-center sm:px-10 sm:pt-6 sm:text-center xl:px-14 xl:pb-6 xl:pt-7">
      {/* Tablette et ordinateur : la carte sous le texte, centrée, comme un horizon.
          Elle prend toute la hauteur que laissent le texte et les réseaux : la page
          tient dans l'écran, du portable 1280 × 720 à l'écran 2560. */}
      <div className="relative hidden sm:order-2 sm:mt-[2.4vh] sm:block sm:max-h-[62vh] sm:min-h-[170px] sm:w-full sm:flex-1 sm:self-stretch">
        <CarteNiger ajuster centrer className="pointer-events-none absolute inset-0 block h-full w-full" />
      </div>

      {/* Téléphone : le premier écran (marque, carte, titre, formulaire) prend la
          hauteur visible exacte ; à partir de la tablette, ce bloc s'efface et ses
          éléments rejoignent la colonne centrée (display: contents). */}
      <div className="flex min-h-[calc(100svh-1.75rem)] flex-col sm:contents">
        <header className="relative z-10 order-0 sm:self-stretch">
          <p className="font-[family-name:var(--font-playfair)] text-[22px] font-bold tracking-[0.01em] 2xl:text-[26px]">NFI&nbsp;REPORT</p>
        </header>

        <div className="relative my-[1.2svh] min-h-[110px] flex-1 sm:hidden">
          <CarteNiger ajuster className="pointer-events-none absolute inset-0 block h-full w-full" />
        </div>

        <section className="relative z-10 flex max-w-[560px] flex-col sm:order-1 sm:max-w-[640px] sm:items-center sm:pt-[6vh] lg:max-w-none lg:pt-[4.2vh]">
          {/* Sans point final, comme un titre de presse. Chaque groupe de mots
              monte de sous un cache ; « en clair » passe du flou au net. */}
          <h1 className="text-[clamp(34px,11.2vw,52px)] font-bold leading-[0.98] tracking-[-0.045em] sm:text-[clamp(44px,6.6vw,64px)] lg:whitespace-nowrap lg:text-[clamp(44px,4.3vw,84px)] 2xl:text-[clamp(66px,4.3vw,110px)]">
            <span className="nfi-mot"><span style={{ '--i': 0 } as React.CSSProperties}>L’économie</span></span>{' '}
            <span className="nfi-mot"><span style={{ '--i': 1 } as React.CSSProperties}>du&nbsp;Niger,</span></span>{' '}
            <span className="nfi-net text-[#7d8189]">en&nbsp;clair</span>
          </h1>
          <p className="nfi-apparait mt-[clamp(10px,1.6svh,16px)] max-w-[470px] text-[clamp(15px,4.1vw,18px)] leading-[1.55] text-[#a9adb4] sm:mx-auto sm:mt-[2.4vh] sm:text-[18px] 2xl:max-w-[600px] 2xl:text-[20px]">
            Un média d’information économique et financière consacré au&nbsp;Niger&nbsp;: l’énergie, les banques, la bourse, les entreprises.
          </p>
          <div className="nfi-apparait nfi-apparait-2 mt-[clamp(14px,2.4svh,24px)] w-full max-w-[470px] sm:mx-auto sm:mt-[3.4vh] 2xl:max-w-[540px]">
            <WaitlistForm />
            {/* La page collecte une adresse : qui la donne doit pouvoir lire qui la
                collecte, et sortir. Ces pages restent ouvertes en pré-lancement. */}
            <p className="mt-1 hidden text-[13px] leading-relaxed text-[#8a8e95] sm:block xl:text-[12px] xl:text-[#7d8189]">
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
      </div>

      {/* Téléphone : la mention suit le bouton, juste sous le premier écran. */}
      <p className="mt-3 text-[clamp(12.5px,3.3vw,14px)] leading-relaxed text-[#8a8e95] sm:hidden">
        Votre adresse ne sert qu’à vous prévenir de l’ouverture.{' '}
        <a
          href="/confidentialite"
          className="whitespace-nowrap underline underline-offset-[3px] transition-colors hover:text-[#f4f4f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4f4f5]"
        >
          Politique de confidentialité
        </a>
      </p>

      <footer className="nfi-apparait nfi-apparait-3 relative z-10 order-3 mt-5 flex items-center sm:justify-center sm:pt-[2.4vh]">
        <nav className="-ml-2.5 flex items-center gap-1 sm:ml-0" aria-label="NFI REPORT sur les réseaux sociaux">
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
