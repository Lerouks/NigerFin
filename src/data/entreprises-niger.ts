/**
 * Ce que montre le mur de logos de la page Niger (maquette B choisie par
 * Raouf le 24/11/2026, sans carte « Notre sélection » ni actionnariat).
 *
 * - Une ligne par entreprise : ce qu'elle fait, en mots simples. Une
 *   entreprise ajoutée dans l'admin sans ligne ici s'affiche quand même, avec
 *   son secteur seulement.
 * - Les logos recadrés sur leur partie visible vivent dans
 *   public/logos/entreprises : les fichiers d'origine (Supabase) ont des marges
 *   transparentes très inégales, qui faisaient des logos de tailles différentes.
 *   Sans fichier recadré, le mur prend le logo de l'admin.
 */

export const LIGNE_ENTREPRISE: Record<string, string> = {
  somair: 'L’uranium d’Arlit',
  sonidep: 'Les carburants du pays',
  nigelec: 'L’électricité du pays',
  'niger-telecoms': 'Téléphone, internet, fibre',
  sonibank: 'Banque commerciale',
  bagri: 'Le crédit agricole',
  sopamin: 'Les parts minières de l’État',
};

const LOGOS_RECADRES = new Set(['somair', 'sonidep', 'nigelec', 'niger-telecoms', 'sonibank', 'bagri', 'sopamin']);

export function logoEntreprise(slug: string, logoAdmin: string | null | undefined): string | null {
  return LOGOS_RECADRES.has(slug) ? `/logos/entreprises/${slug}.png` : (logoAdmin ?? null);
}

/** Secteur en un mot : « Mines & Ressources » devient « Mines ». */
const SECTEUR_COURT: Record<string, string> = {
  'Mines & Ressources': 'Mines',
  'Pétrole & Énergie': 'Pétrole',
  'Électricité & Énergie': 'Électricité',
  'Télécommunications': 'Télécoms',
  'Banque & Finance': 'Banque',
};

export function secteurCourt(secteur: string | null | undefined): string {
  if (!secteur) return '';
  return SECTEUR_COURT[secteur] ?? secteur.split(/\s+(?:&|et)\s+/)[0]!;
}
