import type { Metadata } from 'next';
import { AjusteurLignes } from '@/components/apprendre/AjusteurLignes';
import { MosaiqueInstitutions, type ChiffreAffiche, type InstitutionAffichee } from '@/components/finance/MosaiqueInstitutions';
import { BLOCS_ORDI, BLOCS_TELEPHONE, INSTITUTIONS_FINANCE, ordreFiche, ordreTuile } from '@/data/institutions-finance';
import { DETTE_PUBLIQUE } from '@/data/niger-chiffres';
import { encadreBceao } from '@/lib/bceao';
import { lireSeanceComplete, lireSeancesBrvm, SYMBOLE_BOA_NIGER } from '@/lib/brvm-seances';
import { dateLongueFr } from '@/lib/cours-du-jour';
import { typographieFr } from '@/lib/typographie-fr';

/**
 * « Qui fait quoi dans la finance » (25/11/2026), ouverte depuis la page
 * Finance. Idée de Raouf : « la BCEAO, l'UEMOA, ce sont des acteurs
 * importants, plein de gens ne comprennent pas ce qu'ils font, et il n'y a pas
 * qu'eux ».
 *
 * Mise en page refaite le 26/11/2026 sur le choix de Raouf : un mur des neuf
 * logos sur le noir, en couleurs officielles, en mosaïque (maquette C) ; la
 * fiche claire de chaque institution s'ouvre sur place.
 *
 * Cadre éditorial, tenu ligne par ligne : ce que fait chaque institution et ce
 * que cela change pour l'argent du lecteur, par les mécanismes et les chiffres.
 * Ni histoire du franc CFA, ni débat sur l'avenir de l'Union : la politique et
 * les références étrangères sont hors du champ de NFI Report. Les chiffres se
 * lisent seuls (BCEAO, relevé de la BRVM) ou viennent de l'INS, et disparaissent
 * si leur source ne répond plus. Règle de Raouf (26/11/2026) : aucun chiffre
 * incertain ni antérieur à 2025.
 */

export const revalidate = 3600;
export const metadata: Metadata = {
  title: 'BCEAO, UEMOA, BRVM : qui fait quoi dans la finance de l’UEMOA',
  description:
    'Ce que font la BCEAO, l’UEMOA, la BRVM, l’AMF-UMOA, UMOA-Titres, la BOAD, la Commission bancaire, le FGDR-UMOA et la CIMA, et ce que cela change pour votre argent au Niger.',
  alternates: { canonical: '/finance/institutions' },
};

const NB = ' ';
/** Plus ancienne année qu'un chiffre de la page peut porter. */
const ANNEE_MINIMALE = 2025;

const nombre = (valeur: number, decimales: number) =>
  new Intl.NumberFormat('fr-FR', { minimumFractionDigits: decimales, maximumFractionDigits: decimales }).format(valeur);

const pourcentage = (valeur: number, decimales: number) => `${nombre(valeur, decimales)}${NB}%`;

export default async function InstitutionsPage() {
  const [encadre, composite, seance] = await Promise.all([
    encadreBceao().catch(() => null),
    lireSeancesBrvm('composite').catch(() => []),
    lireSeanceComplete().catch(() => null),
  ]);
  const taux = encadre?.taux ?? null;
  const uemoa = encadre?.uemoa ?? null;
  const derniereSeance = composite.at(-1) ?? null;
  const boan = seance?.actions.find((a) => a.symbole === SYMBOLE_BOA_NIGER) ?? null;
  const nombreActions = seance?.actions.length ?? null;

  const croissance =
    uemoa?.croissance !== null && uemoa?.croissance !== undefined && uemoa.anneeEstimations && uemoa.anneeEstimations >= ANNEE_MINIMALE
      ? { valeur: uemoa.croissance, annee: uemoa.anneeEstimations }
      : null;
  const inflation = uemoa?.inflation && uemoa.inflation.annee >= ANNEE_MINIMALE ? uemoa.inflation : null;

  const chiffres: Record<'bceao' | 'uemoa' | 'brvm', ChiffreAffiche[]> = {
    bceao: taux
      ? [
          { libelle: 'Taux directeur', valeur: pourcentage(taux.principal, 2), detail: `depuis le ${dateLongueFr(taux.depuis)}` },
          ...(taux.pretMarginal !== null
            ? [{ libelle: 'Taux du prêt marginal', valeur: pourcentage(taux.pretMarginal, 2), detail: 'pour les besoins urgents des banques' }]
            : []),
        ]
      : [],
    uemoa: [
      ...(croissance
        ? [{ libelle: `Croissance de l’Union en ${croissance.annee}`, valeur: pourcentage(croissance.valeur, 1), detail: 'estimation de la BCEAO' }]
        : []),
      ...(inflation ? [{ libelle: `Inflation de l’Union en ${inflation.annee}`, valeur: pourcentage(inflation.valeur, 1), detail: 'en moyenne sur l’année' }] : []),
      {
        libelle: 'Dette publique du Niger en 2025',
        valeur: pourcentage(DETTE_PUBLIQUE.totale, 1),
        detail: `du PIB, pour un plafond de ${DETTE_PUBLIQUE.plafondUemoa}${NB}%`,
      },
    ],
    brvm: [
      ...(derniereSeance
        ? [{ libelle: 'BRVM Composite', valeur: nombre(derniereSeance.cloture, 2), detail: `clôture du ${dateLongueFr(derniereSeance.date)}` }]
        : []),
      ...(boan ? [{ libelle: 'Bank of Africa Niger', valeur: `${nombre(boan.cloture, 0)}${NB}FCFA`, detail: 'cours de clôture' }] : []),
    ],
  };

  // Une ligne par source, assez courte pour tenir sur un téléphone de 320 px.
  const sources: Record<string, string[]> = {
    bceao: taux ? ['Taux relevés chaque jour sur le site de la BCEAO.'] : [],
    uemoa: [
      ...(croissance || inflation ? [`Union : BCEAO${uemoa?.miseAJour ? `, au ${dateLongueFr(uemoa.miseAJour)}` : ''}.`] : []),
      'Dette du Niger : INS, 2025.',
    ],
    brvm: chiffres.brvm.length > 0 ? ['Cours relevés après chaque séance de la BRVM.'] : [],
  };

  const vedettes: Record<string, InstitutionAffichee['vedette']> = {
    bceao: taux ? { valeur: pourcentage(taux.principal, 2), libelle: 'taux directeur' } : undefined,
    uemoa: croissance ? { valeur: pourcentage(croissance.valeur, 1), libelle: `croissance en ${croissance.annee}` } : undefined,
    brvm: derniereSeance ? { valeur: nombre(derniereSeance.cloture, 2), libelle: 'BRVM Composite' } : undefined,
  };

  const phraseBoaNiger = nombreActions
    ? `Bank of Africa Niger est la seule société nigérienne parmi les ${nombreActions} sociétés cotées.`
    : 'Bank of Africa Niger est la seule société nigérienne cotée.';

  const institutions: InstitutionAffichee[] = INSTITUTIONS_FINANCE.map((i, index) => ({
    id: i.id,
    sigle: i.sigle,
    nomComplet: typographieFr(i.nomComplet),
    role: typographieFr(i.role),
    forme: i.forme,
    logo: i.logo,
    presentation: i.presentation.map(typographieFr),
    pourVous: (i.id === 'brvm' ? [...i.pourVous, phraseBoaNiger] : i.pourVous).map(typographieFr),
    chiffres: (chiffres[i.id as keyof typeof chiffres] ?? []).map((c) => ({
      libelle: typographieFr(c.libelle),
      valeur: c.valeur,
      detail: c.detail ? typographieFr(c.detail) : undefined,
    })),
    sources: (sources[i.id] ?? []).map(typographieFr),
    vedette: vedettes[i.id] ? { valeur: vedettes[i.id]!.valeur, libelle: typographieFr(vedettes[i.id]!.libelle) } : undefined,
    site: i.site,
    lienInterne: i.lienInterne,
    ordreTuile: ordreTuile(index),
    ordreFicheTelephone: ordreFiche(i.id, BLOCS_TELEPHONE),
    ordreFicheOrdi: ordreFiche(i.id, BLOCS_ORDI),
  }));

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-[#0b0b0c] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-9 pb-10 md:pt-14 md:pb-16">
          <AjusteurLignes>
            <div>
                <h1 className="text-[34px] sm:text-[42px] lg:text-[50px] font-bold tracking-[-0.03em] leading-[1.04] wrap-break-word">
                  {`Qui fait quoi dans${NB}la${NB}finance`}
                </h1>
                <p className="mt-3 md:mt-4 max-w-[680px] text-[17px] md:text-[19px] leading-normal text-[#c9ccd1]">
                  {typographieFr(
                    'Ce que font les neuf grandes institutions de la finance ouest-africaine, et ce que cela change pour votre argent au Niger.',
                  )}
                </p>
            </div>
          </AjusteurLignes>
          {/* Hors de l'ajusteur : l'équilibre natif coupe la phrase en deux moitiés égales. */}
          <p className="mt-3 max-w-[300px] text-[14px] text-[#8a8e95] [text-wrap:balance]">
            {typographieFr('Choisissez une institution pour ouvrir sa fiche.')}
          </p>
          <MosaiqueInstitutions institutions={institutions} />
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-9 pb-16 md:pb-20">
        <AjusteurLignes>
          <section aria-labelledby="mention-titre">
            <h2 id="mention-titre" className="sr-only">
              Mention
            </h2>
            {[
              'Ces informations sont données à titre indicatif, à jour en novembre 2026.',
              'Elles peuvent évoluer : vérifiez-les auprès de l’institution concernée avant toute démarche.',
              'Elles ne constituent pas un conseil d’investissement.',
            ].map((phrase) => (
              <p key={phrase} className="text-[14px] leading-relaxed text-gray-500">
                {typographieFr(phrase)}
              </p>
            ))}
          </section>
        </AjusteurLignes>
      </div>
    </div>
  );
}
