'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { flushSync } from 'react-dom';
import { AjusteurLignes } from '@/components/apprendre/AjusteurLignes';

export interface ChiffreAffiche {
  libelle: string;
  valeur: string;
  detail?: string;
}

/** Une institution prête à l'affichage : textes déjà passés par la typographie française. */
export interface InstitutionAffichee {
  id: string;
  sigle: string;
  nomComplet: string;
  role: string;
  logo: { largeur: number; hauteur: number };
  presentation: string[];
  pourVous: string[];
  chiffres: ChiffreAffiche[];
  /** Une phrase par élément. */
  sources: string[];
  site?: { libelle: string; url: string };
  lienInterne?: { libelle: string; href: string };
}

/**
 * Taille optique d'un logo : chaque logo couvre à peu près la même surface,
 * qu'il soit en longueur (CIMA) ou en hauteur (BOAD), sans dépasser ni la
 * hauteur ni la largeur permises.
 */
function largeurOptique(logo: { largeur: number; hauteur: number }, surface: number, hauteurMax: number, largeurMax: number) {
  const ratio = logo.largeur / logo.hauteur;
  let hauteur = Math.min(Math.sqrt(surface / ratio), hauteurMax);
  let largeur = hauteur * ratio;
  if (largeur > largeurMax) {
    largeur = largeurMax;
    hauteur = largeur / ratio;
  }
  return Math.round(largeur);
}

function Logo({ institution, version, telephone, ordi }: { institution: InstitutionAffichee; version: 'clair' | 'sur-noir'; telephone: number; ordi: number }) {
  const { id, logo } = institution;
  return (
    <span
      className="relative block w-[var(--l-tel)] max-w-full lg:w-[var(--l-ordi)]"
      style={{ '--l-tel': `${telephone}px`, '--l-ordi': `${ordi}px`, aspectRatio: `${logo.largeur} / ${logo.hauteur}` } as CSSProperties}
    >
      <Image
        src={`/logos/institutions/${id}${version === 'sur-noir' ? '-sur-noir' : ''}.png`}
        alt=""
        fill
        sizes={`(max-width: 1023px) ${telephone}px, ${ordi}px`}
        className="object-contain"
      />
    </span>
  );
}

function Fiche({
  institution,
  ouverte,
  encoche,
  onFermer,
  mention,
}: {
  institution: InstitutionAffichee;
  ouverte: boolean;
  encoche: number | null;
  onFermer: () => void;
  mention: string[];
}) {
  const avecChiffres = institution.chiffres.length > 0;
  const liens =
    institution.site || institution.lienInterne ? (
      <p className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[15px]">
        {institution.site ? (
          <a
            href={institution.site.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[#111] underline underline-offset-4 hover:no-underline"
          >
            {institution.site.libelle}
          </a>
        ) : null}
        {institution.lienInterne ? (
          <Link href={institution.lienInterne.href} className="font-semibold text-[#111] underline underline-offset-4 hover:no-underline">
            {institution.lienInterne.libelle}
          </Link>
        ) : null}
      </p>
    ) : null;

  return (
    <section
      id={institution.id}
      aria-labelledby={`${institution.id}-titre`}
      hidden={!ouverte}
      style={{ '--vt': 'fiche-institution' } as CSSProperties}
      className="relative mt-3 scroll-mt-24 rounded-xl border border-black/10 bg-white px-4 pt-5 pb-6 lg:scroll-mt-36 text-[#1a1a1a] [view-transition-name:var(--vt)] min-[400px]:px-5 sm:px-6 md:px-[34px] md:pt-[30px] md:pb-8"
    >
      {/* La pointe relie la fiche au logo choisi, juste au-dessus. */}
      {encoche !== null ? (
        <span
          aria-hidden="true"
          className="absolute -top-[7px] h-3.5 w-3.5 -translate-x-1/2 rotate-45 border-t border-l border-black/10 bg-white"
          style={{ left: `${encoche}px` }}
        />
      ) : null}
      {/* Remonté à chaque ouverture : les fins de ligne se règlent sur la fiche visible. */}
      <AjusteurLignes key={ouverte ? 'ouverte' : 'fermee'}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-[22px] md:pr-28">
          <span className="flex h-[50px] w-[86px] shrink-0 items-center md:h-[70px] md:w-[136px]">
            <Logo
              institution={institution}
              version="clair"
              telephone={largeurOptique(institution.logo, 2500, 50, 86)}
              ordi={largeurOptique(institution.logo, 5400, 70, 136)}
            />
          </span>
          <div className="min-w-0">
            <h3 id={`${institution.id}-titre`} className="text-[23px] font-bold leading-tight tracking-[-0.02em] text-[#111] md:text-[30px]">
              {institution.sigle}
            </h3>
            <p className="mt-1 text-[14px] text-gray-500 md:text-[15px]">{institution.nomComplet}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onFermer}
          className="absolute top-3 right-3 inline-flex min-h-[44px] items-center gap-1.5 px-2.5 text-[14px] text-gray-600 hover:text-[#111] md:top-6 md:right-6"
        >
          Fermer
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>

        <p className="mt-4 border-t border-black/[0.08] pt-4 text-[18px] font-semibold leading-snug tracking-[-0.01em] text-[#111] md:mt-[22px] md:pt-5 md:text-[21px]">
          {institution.role}.
        </p>

        <div className={avecChiffres ? 'mt-3.5 grid gap-0 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] md:gap-14' : 'mt-3.5 max-w-[780px]'}>
          <div>
            {institution.presentation.map((phrase, index) => (
              <p key={phrase} className={`${index === 0 ? '' : 'mt-2'} text-[16px] leading-relaxed text-gray-800`}>
                {phrase}
              </p>
            ))}
            {institution.pourVous.length > 0 ? (
              <>
                <h4 className="mt-6 text-[16px] font-bold text-[#111]">Ce que cela change pour vous</h4>
                {/* Puces natives : une puce dessinée en bloc dans le li empêchait le réglage des fins de ligne. */}
                <ul className="mt-2.5 list-disc space-y-2 pl-5 marker:text-[#111]">
                  {institution.pourVous.map((texte) => (
                    <li key={texte} className="pl-0.5 text-[16px] leading-relaxed text-gray-800">
                      {texte}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
            {avecChiffres ? null : liens}
          </div>
          {avecChiffres ? (
            <div className="mt-6 border-t border-black/[0.08] pt-5 md:mt-0 md:self-start md:border-t-0 md:border-l md:pt-0 md:pl-9">
              <h4 className="text-[16px] font-bold text-[#111]">Ses chiffres du jour</h4>
              <dl className="mt-3 grid gap-y-4 md:gap-y-[18px]">
                {institution.chiffres.map((c) => (
                  <div key={c.libelle}>
                    <dt className="text-[13px] text-gray-500">{c.libelle}</dt>
                    <dd className="mt-1 text-[25px] font-bold leading-tight tracking-[-0.02em] tabular-nums text-[#111] md:text-[30px]">{c.valeur}</dd>
                    {c.detail ? <dd className="mt-0.5 text-[13px] text-gray-500">{c.detail}</dd> : null}
                  </div>
                ))}
              </dl>
              {liens}
            </div>
          ) : null}
        </div>
        {/* Les sources et la mention sous toute la fiche, une ligne chacune autant que possible. */}
        <div className="mt-6 border-t border-black/[0.08] pt-3">
          {[...institution.sources, ...mention].map((s) => (
            <p key={s} className="text-[12.5px] leading-normal text-[#8b9098]">
              {s}
            </p>
          ))}
        </div>
      </AjusteurLignes>
    </section>
  );
}

type DocumentAvecTransitions = Document & { startViewTransition?: (rappel: () => void) => { finished: Promise<void> } };

/**
 * « Le système financier de l'UEMOA », dans la page Finance sous les cours du
 * jour (choix de Raouf, 26/11/2026 : « je voulais que ça fasse partie de la
 * page finance », puis « Carte noire dans la page » et « Compact » ; l'ancien
 * titre « Qui fait quoi dans la finance » jugé « amateur »). Une carte
 * noire avec les neuf logos en couleurs officielles, sur une rangée sur
 * ordinateur et en 3 × 3 sur téléphone ; la fiche claire de l'institution
 * choisie s'ouvre juste dessous, une pointe vers son logo. Les neuf fiches
 * sont dans la page dès le serveur (lisibles par les moteurs de recherche),
 * une seule est montrée, et l'adresse suit la fiche ouverte (#bceao).
 */
export function QuiFaitQuoi({
  institutions,
  titre,
  intro,
  aide,
  mention,
}: {
  institutions: InstitutionAffichee[];
  titre: string;
  intro: string;
  aide: string;
  mention: string[];
}) {
  const [ouverte, setOuverte] = useState<string | null>(null);
  const [encoche, setEncoche] = useState<number | null>(null);
  const section = useRef<HTMLElement>(null);

  const placerEncoche = useCallback(() => {
    const racine = section.current;
    const bouton = ouverte ? document.getElementById(`logo-${ouverte}`) : null;
    if (!racine || !bouton) return setEncoche(null);
    const r = bouton.getBoundingClientRect();
    setEncoche(Math.round(r.left + r.width / 2 - racine.getBoundingClientRect().left));
  }, [ouverte]);

  useLayoutEffect(() => {
    placerEncoche();
    const racine = section.current;
    if (!racine) return;
    const observateur = new ResizeObserver(placerEncoche);
    observateur.observe(racine);
    return () => observateur.disconnect();
  }, [placerEncoche]);

  // Arrivée par un lien (/finance#brvm) : la fiche s'ouvre et vient en haut de l'écran.
  useEffect(() => {
    const ouvrirDepuisAdresse = () => {
      const id = window.location.hash.slice(1);
      if (id === 'institutions') return;
      if (!institutions.some((i) => i.id === id)) return;
      setOuverte(id);
      // On arrive sur la fiche demandée, la rangée de logos juste au-dessus.
      window.requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: 'start' }));
    };
    ouvrirDepuisAdresse();
    window.addEventListener('hashchange', ouvrirDepuisAdresse);
    return () => window.removeEventListener('hashchange', ouvrirDepuisAdresse);
  }, [institutions]);

  const changer = (id: string | null) => {
    const precedente = ouverte;
    const appliquer = () => flushSync(() => setOuverte(id));
    const doc = document as DocumentAvecTransitions;
    const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const transition = !reduit && doc.startViewTransition ? doc.startViewTransition(appliquer) : null;
    if (!transition) appliquer();
    window.history.replaceState(window.history.state, '', id ? `#${id}` : window.location.pathname + window.location.search);

    const suite = () => {
      if (id) {
        // La fiche s'ouvre sous la carte : si elle tombe trop bas, on la remonte doucement.
        const fiche = document.getElementById(id);
        const haut = fiche?.getBoundingClientRect().top ?? 0;
        if (haut > window.innerHeight * 0.75) window.scrollBy({ top: haut - window.innerHeight * 0.35, behavior: 'smooth' });
      } else if (precedente) {
        document.getElementById(`logo-${precedente}`)?.focus({ preventScroll: true });
      }
    };
    if (transition) void transition.finished.then(suite, suite);
    else suite();
  };

  return (
    <section ref={section} id="institutions" aria-labelledby="institutions-titre" className="relative scroll-mt-20 lg:scroll-mt-32">
      <div className="rounded-xl bg-[#0b0b0c] px-4 py-5 text-white sm:px-6 sm:py-6">
        <AjusteurLignes>
          <h2 id="institutions-titre" className="text-[18px] sm:text-[19px] font-bold tracking-tight">
            {titre}
          </h2>
          <p className="mt-1.5 max-w-2xl text-[15px] leading-relaxed text-[#c9ccd1]">{intro}</p>
        </AjusteurLignes>
        <p className="mt-1 text-[13px] text-[#8a8e95] [text-wrap:balance]">{aide}</p>

        <div className="mt-4 grid grid-cols-3 gap-1 sm:gap-2 lg:grid-cols-9" role="group" aria-label="Les institutions">
          {institutions.map((institution) => {
            const choisie = ouverte === institution.id;
            return (
              <button
                key={institution.id}
                type="button"
                id={`logo-${institution.id}`}
                aria-expanded={choisie}
                aria-controls={institution.id}
                onClick={() => changer(choisie ? null : institution.id)}
                className={`flex min-w-0 flex-col items-center gap-2.5 rounded-lg px-1 pt-3 pb-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                  choisie ? 'bg-white/[0.08]' : 'hover:bg-white/[0.05]'
                }`}
              >
                <span className="flex h-[44px] w-full items-center justify-center lg:h-[50px]">
                  <Logo
                    institution={institution}
                    version="sur-noir"
                    telephone={largeurOptique(institution.logo, 2000, 40, 92)}
                    ordi={largeurOptique(institution.logo, 2600, 46, 112)}
                  />
                </span>
                <span className={`relative pb-1.5 text-center text-[12px] leading-tight sm:text-[12.5px] ${choisie ? 'text-white' : 'text-[#8a8e95]'}`}>
                  {institution.sigle}
                  <span
                    aria-hidden="true"
                    className={`absolute inset-x-0 bottom-0 h-[2px] origin-center bg-white transition-transform duration-200 ${choisie ? 'scale-x-100' : 'scale-x-0'}`}
                  />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {institutions.map((institution) => (
        <Fiche
          key={institution.id}
          institution={institution}
          ouverte={ouverte === institution.id}
          encoche={ouverte === institution.id ? encoche : null}
          onFermer={() => changer(null)}
          mention={mention}
        />
      ))}
    </section>
  );
}
