import { Facebook, Instagram, Youtube } from '@/components/icons/social';
import { defaultSocialLinks } from '@/lib/site-data';
import { WaitlistForm } from './WaitlistForm';
import { CarteAtlas } from './CarteAtlas';

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
 * Page d'attente du pré-lancement, version « l'atlas » (choisie par Raouf le
 * 26/11/2026, l'ancienne carte en points lumineux « faisait trop IA »).
 *
 * - Une seule page : tout tient dans l'écran, sans défiler, de l'iPhone SE
 *   (375 × 553 visibles dans Safari) à l'écran 2560. La carte prend la place
 *   qui reste entre le texte et la signature, et rapetisse seule sur les
 *   petits écrans.
 * - Même composition partout : le texte d'abord, centré, puis la carte, puis
 *   le slogan et les réseaux. Sur téléphone, la carte va d'un bord à l'autre.
 * - Aucune animation : la page s'affiche d'un coup.
 */
export function ComingSoon() {
  return (
    <main className="relative flex min-h-svh w-full flex-col items-center overflow-hidden bg-[#09090a] px-[22px] pb-[max(14px,env(safe-area-inset-bottom))] pt-[14px] text-center text-[#f4f4f5] antialiased [-webkit-tap-highlight-color:transparent] md:px-12 md:pb-[22px] md:pt-[26px]">
      <header>
        <p className="font-[family-name:var(--font-playfair)] text-[20px] font-bold tracking-[0.01em] md:text-[24px] 2xl:text-[28px]">NFI&nbsp;REPORT</p>
      </header>

      <section className="mt-[3.4svh] flex w-full flex-col items-center md:mt-[4vh]">
        {/* Sans point final, comme un titre de presse. Deux lignes sur téléphone,
            une seule à partir de la tablette ; « du Niger, en clair » ne se coupe jamais. */}
        <h1 className="text-[calc((100vw-44px)*0.108)] font-[650] leading-[1.04] tracking-[-0.025em] md:whitespace-nowrap md:text-[min(6.2vw,9.4vh)]">
          L’économie
          <br className="md:hidden" /> <span className="whitespace-nowrap">du Niger, en clair</span>
        </h1>
        {/* « et » et « les » ne finissent jamais une ligne, et la dernière ligne
            garde au moins quatre mots, à toutes les largeurs. */}
        <p className="mt-[10px] max-w-[470px] text-[15px] leading-[1.5] text-[#a9adb4] md:mt-[2.2vh] md:max-w-[560px] md:text-[18px] 2xl:max-w-[660px] 2xl:text-[21px] [@media(max-height:640px)]:mt-2 [@media(max-height:640px)]:text-[14.5px]">
          Un média d’information économique et&nbsp;financière consacré au&nbsp;Niger&nbsp;: l’énergie, les&nbsp;banques,{' '}
          <span className="whitespace-nowrap">la bourse, les entreprises.</span>
        </p>
        <div className="mt-[18px] w-full max-w-[470px] md:mt-[3.2vh] 2xl:max-w-[560px] [@media(max-height:640px)]:mt-[14px]">
          <WaitlistForm />
        </div>
        {/* La page collecte une adresse : qui la donne doit pouvoir lire qui la
            collecte, et sortir. Ces pages restent ouvertes en pré-lancement.
            « Politique de confidentialité » ne finit jamais seule sur sa ligne. */}
        <p className="mt-[9px] max-w-[470px] text-[12.5px] leading-[1.5] text-[#8a8e95] 2xl:max-w-[560px] 2xl:text-[14px]">
          Votre adresse ne sert qu’à vous prévenir{' '}
          <span className="whitespace-nowrap">
            de l’ouverture.{' '}
            <a
              href="/confidentialite"
              className="underline underline-offset-[3px] transition-colors hover:text-[#f4f4f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4f4f5]"
            >
              Politique de confidentialité
            </a>
          </span>
        </p>
      </section>

      {/* La carte prend toute la place qui reste ; sur téléphone, d'un bord à l'autre. */}
      <CarteAtlas className="-mx-[22px] mb-[14px] mt-2 min-h-0 flex-1 basis-0 self-stretch md:mx-0 md:mb-[1vh] md:mt-[3vh] [@media(max-height:640px)]:mb-[10px]" />

      {/* Le slogan signe la page au-dessus des réseaux, comme à la fin de nos posts. */}
      <footer className="flex flex-col items-center">
        <p className="font-[family-name:var(--font-playfair)] text-[15.5px] leading-snug text-[#a9adb4] md:text-[17px] 2xl:text-[20px]">
          La connaissance, votre meilleur&nbsp;capital.
        </p>
        <nav className="mt-0.5 flex items-center gap-1" aria-label="NFI REPORT sur les réseaux sociaux">
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
