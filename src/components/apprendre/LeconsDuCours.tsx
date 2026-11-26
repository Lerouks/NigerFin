'use client';

import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronDown, Lock } from 'lucide-react';
import { typographieFr } from '@/lib/typographie-fr';

export interface LigneLecon {
  id: string;
  slug: string;
  numero: number;
  titre: string;
  premium: boolean;
  /** La phrase d'entrée de la leçon, montrée au survol sur ordinateur. */
  chapeau: string;
}

/** Le bas de l'en-tête collant du site : une leçon ouverte vient se placer juste dessous. */
function basDeLEnTete(): number {
  const entete = document.querySelector('header');
  if (!entete) return 0;
  const { position } = getComputedStyle(entete);
  return position === 'sticky' || position === 'fixed' ? Math.max(0, entete.getBoundingClientRect().bottom) : 0;
}

/**
 * Les leçons d'un cours, maquette « Grand format » choisie par Raouf le
 * 26/11/2026 (« ça doit s'ouvrir en cliquant ou survolant mais dans la même
 * page ») : une ligne par leçon, numérotée 01, 02… Un clic l'ouvre juste en
 * dessous et referme celle qui était ouverte ; elle vient se placer en haut de
 * l'écran. Sur ordinateur, la souris sur une ligne montre sa phrase d'entrée.
 * L'adresse suit la leçon ouverte (#leçon) : un lien y mène directement.
 * Les contenus (rendus par le serveur) arrivent en enfants, dans l'ordre.
 */
export function LeconsDuCours({ lecons, children }: { lecons: LigneLecon[]; children: ReactNode }) {
  const contenus = Children.toArray(children);
  const [ouverte, setOuverte] = useState<string | null>(null);
  // Sans animation à l'arrivée sur la page, et quand une leçon se ferme pour en laisser ouvrir une autre.
  const [instantane, setInstantane] = useState(true);
  const lignes = useRef(new Map<string, HTMLElement>());
  const aAmener = useRef<{ slug: string; doux: boolean } | null>(null);
  const aOuvrir = useRef<string | null>(null);

  const amener = useCallback((slug: string, doux: boolean) => {
    const ligne = lignes.current.get(slug);
    if (!ligne) return;
    const haut = ligne.getBoundingClientRect().top + window.scrollY - basDeLEnTete() - 8;
    const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: Math.max(0, haut), behavior: doux && !reduit ? 'smooth' : 'auto' });
  }, []);

  // La leçon de l'adresse (#leçon) s'ouvre à l'arrivée : lien partagé, ancienne page de leçon.
  useEffect(() => {
    const depuisAdresse = () => {
      const slug = decodeURIComponent(window.location.hash.slice(1));
      if (!lecons.some((l) => l.slug === slug)) return;
      aAmener.current = { slug, doux: false };
      setInstantane(true);
      setOuverte(slug);
    };
    let suite = 0;
    const debut = window.requestAnimationFrame(() => {
      depuisAdresse();
      suite = window.requestAnimationFrame(() => setInstantane(false));
    });
    window.addEventListener('hashchange', depuisAdresse);
    return () => {
      window.cancelAnimationFrame(debut);
      window.cancelAnimationFrame(suite);
      window.removeEventListener('hashchange', depuisAdresse);
    };
  }, [lecons]);

  useEffect(() => {
    let image = 0;
    const suivante = aOuvrir.current;
    if (suivante && ouverte === null) {
      // L'ancienne leçon vient de se refermer d'un coup : la nouvelle monte en haut de l'écran, puis s'ouvre.
      aOuvrir.current = null;
      amener(suivante, true);
      image = window.requestAnimationFrame(() => {
        setInstantane(false);
        setOuverte(suivante);
      });
    } else if (aAmener.current) {
      const { slug, doux } = aAmener.current;
      aAmener.current = null;
      amener(slug, doux);
      if (!doux) image = window.requestAnimationFrame(() => setInstantane(false));
    }
    return () => window.cancelAnimationFrame(image);
  }, [ouverte, amener]);

  const basculer = (slug: string) => {
    if (ouverte === slug) {
      setOuverte(null);
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      return;
    }
    if (ouverte) {
      aOuvrir.current = slug;
      setInstantane(true);
      setOuverte(null);
    } else {
      aAmener.current = { slug, doux: true };
      setInstantane(false);
      setOuverte(slug);
    }
    window.history.replaceState(null, '', `#${slug}`);
  };

  return (
    <div className="mt-7 border-t border-[#111] sm:mt-9 lg:mt-11">
      {lecons.map((l, i) => {
        const estOuverte = ouverte === l.slug;
        return (
          <section
            key={l.id}
            id={l.slug}
            ref={(el) => {
              if (el) lignes.current.set(l.slug, el);
              else lignes.current.delete(l.slug);
            }}
            className="scroll-mt-20 border-b border-black/12 lg:scroll-mt-36"
          >
            <h2>
              <button
                type="button"
                id={`titre-${l.slug}`}
                aria-expanded={estOuverte}
                aria-controls={`lecon-${l.slug}`}
                onClick={() => basculer(l.slug)}
                className="group grid min-h-[66px] w-full cursor-pointer grid-cols-[34px_minmax(0,1fr)_24px] items-center gap-x-2.5 py-3.5 text-left focus-visible:rounded-[6px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#111] sm:min-h-[76px] sm:grid-cols-[56px_minmax(0,1fr)_28px] sm:gap-x-5 sm:py-4 lg:min-h-[84px] lg:grid-cols-[72px_minmax(0,1fr)_minmax(0,340px)_28px] lg:gap-x-6 lg:py-[18px]"
              >
                <span
                  aria-hidden="true"
                  className={`text-[19px] leading-none tracking-[-0.03em] tabular-nums transition-colors sm:text-[24px] lg:text-[28px] ${
                    estOuverte ? 'text-[#111]' : 'text-[#b8bcc2] group-hover:text-[#111]'
                  }`}
                >
                  {String(l.numero).padStart(2, '0')}
                </span>
                <span className="flex min-w-0 items-baseline gap-2.5">
                  <span className="text-balance text-[17.5px] font-semibold leading-[1.3] tracking-[-0.015em] text-[#111] sm:text-[20px] lg:text-[22px]">
                    {typographieFr(l.titre)}
                  </span>
                  {l.premium && (
                    <>
                      <Lock className="h-[15px] w-[15px] shrink-0 translate-y-px text-gray-400" strokeWidth={2} aria-hidden="true" />
                      <span className="sr-only">, Premium</span>
                    </>
                  )}
                </span>
                <span
                  aria-hidden="true"
                  className={`hidden text-[15px] leading-[1.5] text-gray-500 transition duration-200 lg:block ${
                    estOuverte ? 'lg:invisible' : 'translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100'
                  }`}
                >
                  {typographieFr(l.chapeau)}
                </span>
                <ChevronDown
                  aria-hidden="true"
                  strokeWidth={2}
                  className={`h-5 w-5 justify-self-end text-[#111] transition-transform duration-300 ${estOuverte ? 'rotate-180' : ''}`}
                />
              </button>
            </h2>
            <div
              id={`lecon-${l.slug}`}
              role="region"
              aria-labelledby={`titre-${l.slug}`}
              className={`grid ${instantane ? '' : 'transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.22,0.8,0.22,1)]'} ${
                estOuverte ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              }`}
            >
              <div
                inert={!estOuverte}
                className={`min-h-0 overflow-hidden ${instantane ? '' : 'transition-opacity duration-300'} ${estOuverte ? 'opacity-100' : 'opacity-0'}`}
              >
                <div className="pb-10 sm:pb-12 sm:pl-[76px] lg:pl-24">{contenus[i]}</div>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
