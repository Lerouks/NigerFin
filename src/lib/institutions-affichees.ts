import type { ChiffreAffiche, InstitutionAffichee } from '@/components/finance/QuiFaitQuoi';
import { INSTITUTIONS_FINANCE } from '@/data/institutions-finance';
import { DETTE_PUBLIQUE } from '@/data/niger-chiffres';
import { encadreBceao } from '@/lib/bceao';
import { lireSeanceComplete, lireSeancesBrvm, SYMBOLE_BOA_NIGER } from '@/lib/brvm-seances';
import { dateLongueFr } from '@/lib/cours-du-jour';
import { typographieFr } from '@/lib/typographie-fr';

/**
 * Les neuf institutions de la carte « Le système financier de l'UEMOA », prêtes
 * pour la page Finance : textes passés par la typographie française,
 * chiffres du jour lus chaque jour (BCEAO, relevé de la BRVM) ou pris à l'INS.
 * Un chiffre dont la source ne répond plus disparaît. Règle de Raouf
 * (26/11/2026) : aucun chiffre incertain ni antérieur à 2025.
 */

const NB = ' ';
/** Plus ancienne année qu'un chiffre de la page peut porter. */
const ANNEE_MINIMALE = 2025;

const nombre = (valeur: number, decimales: number) =>
  new Intl.NumberFormat('fr-FR', { minimumFractionDigits: decimales, maximumFractionDigits: decimales }).format(valeur);

const pourcentage = (valeur: number, decimales: number) => `${nombre(valeur, decimales)}${NB}%`;

export async function lireInstitutionsAffichees(): Promise<InstitutionAffichee[]> {
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

  const phraseBoaNiger = nombreActions
    ? `Bank of Africa Niger est la seule société nigérienne parmi les ${nombreActions} sociétés cotées.`
    : 'Bank of Africa Niger est la seule société nigérienne cotée.';

  const institutions: InstitutionAffichee[] = INSTITUTIONS_FINANCE.map((i) => ({
    id: i.id,
    sigle: i.sigle,
    nomComplet: typographieFr(i.nomComplet),
    role: typographieFr(i.role),
    logo: i.logo,
    presentation: i.presentation.map(typographieFr),
    pourVous: (i.id === 'brvm' ? [...i.pourVous, phraseBoaNiger] : i.pourVous).map(typographieFr),
    chiffres: (chiffres[i.id as keyof typeof chiffres] ?? []).map((c) => ({
      libelle: typographieFr(c.libelle),
      valeur: c.valeur,
      detail: c.detail ? typographieFr(c.detail) : undefined,
    })),
    sources: (sources[i.id] ?? []).map(typographieFr),
    site: i.site,
    lienInterne: i.lienInterne,
  }));

  return institutions;
}

/** Les textes fixes de la carte, passés par la typographie française. */
export const TEXTES_QUI_FAIT_QUOI = {
  // Choisi par Raouf le 26/11/2026, à la place de « Qui fait quoi dans la finance ».
  titre: typographieFr('Le système financier de l’UEMOA'),
  intro: typographieFr(
    'Ce que font les neuf grandes institutions de la finance ouest-africaine, et ce que cela change pour votre argent au Niger.',
  ),
  aide: typographieFr('Choisissez une institution pour ouvrir sa fiche.'),
  mention: [
    'Ces informations sont données à titre indicatif, à jour en novembre 2026.',
    'Elles peuvent évoluer : vérifiez-les auprès de l’institution avant toute démarche.',
    'Elles ne constituent pas un conseil d’investissement.',
  ].map(typographieFr),
};
