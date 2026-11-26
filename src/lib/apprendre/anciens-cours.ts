/**
 * Les thèmes regroupés le 26/11/2026 (choix de Raouf : « 5 thèmes », Immobilier
 * retiré) : l'ancienne adresse d'un thème mène au thème qui l'a repris. Une
 * chaîne vide renvoie à la page Apprendre (thème retiré).
 */
export const ANCIENS_COURS: Readonly<Record<string, string>> = {
  'economie-niger': 'economie-monnaie',
  'devises-change': 'economie-monnaie',
  'bourse-investissement': 'bourse-crypto',
  'crypto-blockchain': 'bourse-crypto',
  'budget-banque': 'budget-assurance',
  'assurance-prevoyance': 'budget-assurance',
  entrepreneuriat: 'entreprise-impots',
  'fiscalite-droit': 'entreprise-impots',
  immobilier: '',
};

/** L'adresse qui remplace celle d'un ancien thème ; null si ce n'en est pas un. */
export function adresseDuThemeRegroupe(slug: string): string | null {
  if (!Object.hasOwn(ANCIENS_COURS, slug)) return null;
  const nouveau = ANCIENS_COURS[slug];
  return nouveau ? `/apprendre/${nouveau}` : '/apprendre';
}
