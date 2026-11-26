'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Fragment, useEffect, useState, type CSSProperties } from 'react';
import { flushSync } from 'react-dom';
import { AjusteurLignes } from '@/components/apprendre/AjusteurLignes';
import type { FormeTuile } from '@/data/institutions-finance';

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
  forme: FormeTuile;
  logo: { largeur: number; hauteur: number };
  presentation: string[];
  pourVous: string[];
  chiffres: ChiffreAffiche[];
  /** Une phrase par élément. */
  sources: string[];
  /** Le chiffre du jour affiché sur la tuile elle-même (BCEAO, UEMOA, BRVM). */
  vedette?: { valeur: string; libelle: string };
  site?: { libelle: string; url: string };
  lienInterne?: { libelle: string; href: string };
  ordreTuile: number;
  ordreFicheTelephone: number;
  ordreFicheOrdi: number;
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

const TAILLES: Record<FormeTuile, { telephone: [number, number, number]; ordi: [number, number, number] }> = {
  grande: { telephone: [4200, 64, 170], ordi: [22000, 130, 330] },
  large: { telephone: [2400, 52, 120], ordi: [8200, 92, 200] },
  petite: { telephone: [2400, 52, 120], ordi: [6200, 80, 190] },
};

function Logo({ institution, version, telephone, ordi }: { institution: InstitutionAffichee; version: 'clair' | 'sur-noir'; telephone: number; ordi: number }) {
  const { id, logo } = institution;
  return (
    <span
      className="relative block w-[var(--l-tel)] max-w-full md:w-[var(--l-ordi)]"
      style={{ '--l-tel': `${telephone}px`, '--l-ordi': `${ordi}px`, aspectRatio: `${logo.largeur} / ${logo.hauteur}` } as CSSProperties}
    >
      <Image
        src={`/logos/institutions/${id}${version === 'sur-noir' ? '-sur-noir' : ''}.png`}
        alt=""
        fill
        sizes={`(max-width: 767px) ${telephone}px, ${ordi}px`}
        className="object-contain"
      />
    </span>
  );
}

function Vedette({ vedette, forme }: { vedette: NonNullable<InstitutionAffichee['vedette']>; forme: FormeTuile }) {
  const taille =
    forme === 'grande'
      ? 'text-[44px] md:text-[52px] lg:text-[64px] @[440px]:text-right'
      : 'mt-2 text-[24px] md:mt-0 md:text-[38px]';
  return (
    <span className={`block font-bold leading-none tracking-[-0.03em] tabular-nums text-white ${taille}`}>
      {vedette.valeur}
      <span className="mt-1.5 block text-[12px] font-normal tracking-normal text-[#8a8e95] md:mt-2 md:text-[13px]">{vedette.libelle}</span>
    </span>
  );
}

function Tuile({ institution, choisie, onChoisir }: { institution: InstitutionAffichee; choisie: boolean; onChoisir: () => void }) {
  const { forme, vedette } = institution;
  const [surfaceTel, hTel, lTel] = TAILLES[forme].telephone;
  const [surfaceOrdi, hOrdi, lOrdi] = TAILLES[forme].ordi;
  const logo = (
    <Logo
      institution={institution}
      version="sur-noir"
      telephone={largeurOptique(institution.logo, surfaceTel, hTel, lTel)}
      ordi={largeurOptique(institution.logo, surfaceOrdi, hOrdi, lOrdi)}
    />
  );
  const nom = (
    <span className="block min-w-0">
      <span className="block text-[13.5px] font-semibold text-white md:text-[15px]">{institution.sigle}</span>
      <span className="mt-0.5 block text-[12px] leading-snug text-[#8a8e95] [text-wrap:balance] md:text-[13.5px]">{institution.role}</span>
    </span>
  );
  const enLigne = forme === 'large' && vedette;

  return (
    <button
      type="button"
      id={`tuile-${institution.id}`}
      aria-expanded={choisie}
      aria-controls={institution.id}
      onClick={onChoisir}
      style={{ order: institution.ordreTuile, '--vt': `tuile-${institution.id}` } as CSSProperties}
      className={[
        'flex min-w-0 scroll-mt-20 flex-col rounded-[14px] border text-left transition-colors [view-transition-name:var(--vt)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:rounded-2xl lg:scroll-mt-32',
        choisie ? 'border-white/85 bg-[#18191c]' : 'border-white/[0.07] bg-[#131416] hover:border-white/25',
        forme === 'grande'
          ? '@container col-span-2 min-h-[200px] p-[18px] md:row-span-2 md:px-[30px] md:pt-7 md:pb-[26px]'
          : 'p-3.5 md:px-[22px] md:pt-5 md:pb-[18px]',
        forme === 'large' ? 'md:col-span-2' : '',
        enLigne ? 'md:flex-row md:items-stretch md:gap-6' : '',
      ].join(' ')}
    >
      {forme === 'grande' ? (
        <>
          <span className="flex flex-1 items-start">{logo}</span>
          <span className="mt-4 flex flex-col items-start gap-3 @[440px]:flex-row @[440px]:items-end @[440px]:justify-between @[440px]:gap-4">
            {nom}
            {vedette ? <Vedette vedette={vedette} forme={forme} /> : null}
          </span>
        </>
      ) : enLigne ? (
        <>
          <span className="flex flex-1 items-center justify-center py-2 md:flex-[0_0_44%] md:py-0">{logo}</span>
          <span className="flex min-w-0 flex-col md:flex-1 md:justify-between">
            {nom}
            <Vedette vedette={vedette} forme={forme} />
          </span>
        </>
      ) : (
        <>
          <span className="flex flex-1 items-center justify-center py-2">{logo}</span>
          {nom}
        </>
      )}
    </button>
  );
}

function Fiche({ institution, ouverte, onFermer }: { institution: InstitutionAffichee; ouverte: boolean; onFermer: () => void }) {
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
      style={
        {
          '--ordre-tel': institution.ordreFicheTelephone,
          '--ordre-ordi': institution.ordreFicheOrdi,
          '--vt': 'fiche-institution',
        } as CSSProperties
      }
      className="relative order-[var(--ordre-tel)] col-span-full rounded-[14px] bg-white px-4 pt-5 pb-6 min-[400px]:px-5 text-[#1a1a1a] [view-transition-name:var(--vt)] md:order-[var(--ordre-ordi)] md:rounded-2xl md:px-[34px] md:pt-[30px] md:pb-8"
    >
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
            <h2 id={`${institution.id}-titre`} className="text-[23px] font-bold leading-tight tracking-[-0.02em] text-[#111] md:text-[30px]">
              {institution.sigle}
            </h2>
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
                <h3 className="mt-6 text-[16px] font-bold text-[#111]">Ce que cela change pour vous</h3>
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
              <h3 className="text-[16px] font-bold text-[#111]">Ses chiffres du jour</h3>
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
        {/* Les sources sous toute la fiche : une ligne chacune, même sur un petit téléphone. */}
        {institution.sources.length > 0 ? (
          <div className="mt-6 border-t border-black/[0.08] pt-3">
            {institution.sources.map((s) => (
              <p key={s} className="text-[12.5px] leading-normal text-[#8b9098]">
                {s}
              </p>
            ))}
          </div>
        ) : null}
      </AjusteurLignes>
    </section>
  );
}

type DocumentAvecTransitions = Document & { startViewTransition?: (rappel: () => void) => { finished: Promise<void> } };

/**
 * Le mur des neuf institutions (maquette C, « la mosaïque », choisie le
 * 26/11/2026) : une tuile touchée reste à sa place, cerclée de blanc, et sa
 * fiche claire s'ouvre sous son bloc. Les fiches sont toutes dans la page dès
 * le serveur (lisibles par les moteurs de recherche), une seule est montrée.
 * L'adresse suit la fiche ouverte (#bceao), pour les liens venus d'ailleurs.
 */
export function MosaiqueInstitutions({ institutions }: { institutions: InstitutionAffichee[] }) {
  const [ouverte, setOuverte] = useState<string | null>(null);

  // Arrivée par un lien (/finance/institutions#brvm) : la fiche s'ouvre, la tuile vient en haut.
  useEffect(() => {
    const ouvrirDepuisAdresse = () => {
      const id = window.location.hash.slice(1);
      if (!institutions.some((i) => i.id === id)) return;
      setOuverte(id);
      window.requestAnimationFrame(() => document.getElementById(`tuile-${id}`)?.scrollIntoView({ block: 'start' }));
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
        // La fiche s'ouvre sous le bloc : si elle tombe trop bas, on la remonte doucement.
        const fiche = document.getElementById(id);
        const haut = fiche?.getBoundingClientRect().top ?? 0;
        if (haut > window.innerHeight * 0.75) window.scrollBy({ top: haut - window.innerHeight * 0.35, behavior: 'smooth' });
      } else if (precedente) {
        document.getElementById(`tuile-${precedente}`)?.focus({ preventScroll: true });
      }
    };
    if (transition) void transition.finished.then(suite, suite);
    else suite();
  };

  return (
    <div className="mt-7 grid auto-rows-[minmax(158px,auto)] grid-cols-2 gap-2 md:mt-10 md:auto-rows-[minmax(176px,auto)] md:grid-cols-4 md:gap-3">
      {institutions.map((institution) => (
        <Fragment key={institution.id}>
          <Tuile
            institution={institution}
            choisie={ouverte === institution.id}
            onChoisir={() => changer(ouverte === institution.id ? null : institution.id)}
          />
          <Fiche institution={institution} ouverte={ouverte === institution.id} onFermer={() => changer(null)} />
        </Fragment>
      ))}
    </div>
  );
}
