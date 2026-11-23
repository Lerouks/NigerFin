import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { NB, soude, typo } from '@/lib/emails/edition';
import {
  COOKIE_DESABONNEMENT,
  lireEtatDesabonnement,
  type EtatDesabonnement,
} from '@/lib/newsletter/desabonnement';
import { seDesabonner, seReabonner } from './actions';
import { BoutonEnvoi } from './BoutonEnvoi';

// Page lue avec le cookie du lien du mail : jamais mise en cache.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Désabonnement de la newsletter',
  description: 'Se désabonner de la newsletter de NFI REPORT.',
  robots: { index: false },
};

interface SearchParams {
  /** « invalide » : le lien suivi était incomplet ou mal formé. */
  lien?: string;
  /** Dernière action faite sur la page : « fait » ou « reabonne ». */
  apres?: string;
  erreur?: string;
}

type Etat = EtatDesabonnement['etat'];

const CONTACT = 'contact@nfireport.com';
/** Fin de titre qui ne se coupe pas : « de la newsletter ? » reste d'un bloc. */
const bloc = (s: string) => typo(s).replace(/ /g, NB);

/** Titres en deux tons, comme sur le reste du site : le début en noir, la fin en gris. */
const TITRES: Record<Etat, [string, string]> = {
  question: ['Se désabonner', bloc('de la newsletter ?')],
  fait: ['Désabonnement', 'confirmé'],
  reabonne: ['Abonnement', 'rétabli'],
  inactif: ['Ce lien', bloc('n’est plus valable')],
  'sans-lien': ['Se désabonner', bloc('de la newsletter')],
  erreur: ['Une erreur', bloc('est survenue')],
};

const CORPS: Record<Etat, string> = {
  question: soude('Vous ne la recevrez plus à cette adresse.'),
  fait: soude('Nous n’enverrons plus la newsletter à cette adresse.'),
  reabonne: soude('Cette adresse est de nouveau inscrite à la newsletter.'),
  inactif: soude('Si vous recevez encore notre newsletter, utilisez le lien en bas du dernier envoi.'),
  'sans-lien': soude('Le lien de désabonnement se trouve en bas de chacun de nos envois.'),
  erreur: soude('Réessayez dans un instant, ou écrivez-nous si le problème continue.'),
};

const ANNEAU = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111] focus-visible:ring-offset-2 focus-visible:ring-offset-background';
const BOUTON = `inline-flex h-[50px] w-full items-center justify-center rounded-md bg-[#111] px-7 text-[15px] font-semibold text-white transition-colors hover:bg-[#2b2b2b] disabled:cursor-wait disabled:opacity-70 sm:w-auto ${ANNEAU}`;
const BOUTON_CONTOUR = `inline-flex h-[46px] w-full items-center justify-center whitespace-nowrap rounded-md border-[1.5px] border-[#111] px-[22px] text-[15px] font-semibold text-[#111] transition-colors hover:bg-[#111] hover:text-white disabled:cursor-wait disabled:opacity-70 sm:w-auto ${ANNEAU}`;
const LIEN = `rounded-sm text-[15px] font-semibold text-[#111] underline decoration-[#111]/30 underline-offset-4 transition-colors hover:decoration-[#111] ${ANNEAU}`;

export default async function PageDesabonnement({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const etat = await lireEtatDesabonnement({
    jeton: (await cookies()).get(COOKIE_DESABONNEMENT)?.value,
    lienInvalide: sp.lien === 'invalide',
    apres: sp.apres,
    erreur: sp.erreur === '1',
  });
  const [debut, fin] = TITRES[etat.etat];

  return (
    <div className="mx-auto w-full max-w-[640px] px-6 pb-16 pt-[9svh] sm:px-10 sm:pt-[13vh]">
      <h1 className="text-[clamp(31px,10.2vw,38px)] font-bold leading-[1.06] tracking-[-0.03em] text-[#111] sm:text-[52px] sm:leading-[1.05] sm:tracking-[-0.035em]">
        {debut} <span className="text-[#8a8e95]">{fin}</span>
      </h1>
      <p className="mt-[22px] max-w-[560px] text-[17px] leading-[1.6] text-[#4b4f56] sm:text-[18px]">{CORPS[etat.etat]}</p>

      {'adresse' in etat && (
        <div className="mt-[26px] flex max-w-[560px] items-baseline justify-between gap-4 border-y border-[#e4e5e8] py-[17px]">
          <span className="text-[14px] text-[#6b6f76]">Adresse</span>
          <span className="min-w-0 text-right text-[16px] font-semibold text-[#111] [overflow-wrap:anywhere]">{etat.adresse}</span>
        </div>
      )}

      {etat.etat === 'question' && (
        <div className="mt-[34px] flex flex-col items-stretch gap-5 text-center sm:flex-row sm:items-center sm:gap-7 sm:text-left">
          <form action={seDesabonner} className="w-full sm:w-auto">
            <BoutonEnvoi className={BOUTON} enCours="Un instant…">Me désabonner</BoutonEnvoi>
          </form>
          <Link href="/" className={LIEN}>Garder la newsletter</Link>
        </div>
      )}

      {etat.etat === 'fait' && etat.reabonnable && (
        <div className="mt-[34px] flex max-w-[560px] flex-col items-stretch gap-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
          <p className="text-[16px] text-[#4b4f56]">{typo('Vous changez d’avis ?')}</p>
          <form action={seReabonner} className="w-full sm:w-auto">
            <BoutonEnvoi className={BOUTON_CONTOUR} enCours="Un instant…">Me réabonner</BoutonEnvoi>
          </form>
        </div>
      )}

      {(etat.etat === 'inactif' || etat.etat === 'erreur') && (
        <p className="mt-[30px]">
          <a href={`mailto:${CONTACT}`} className={LIEN}>
            {`Écrire à${NB}${CONTACT}`}
          </a>
        </p>
      )}

      {'essai' in etat && etat.essai && (
        <p className="mt-7 text-[14px] text-[#6b6f76]">{typo('Lien d’essai : rien n’est enregistré.')}</p>
      )}
    </div>
  );
}
