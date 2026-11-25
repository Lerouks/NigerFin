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

/**
 * Logos posés sur le bandeau noir des fiches, sans carré blanc (demande de
 * Raouf, 25/11/2026). Les écritures noires de SOMAÏR et le petit texte vert
 * foncé de BAGRI disparaissaient sur le noir : leur version « sur noir » passe
 * ces seules parties en blanc, les couleurs de la marque restent les vraies.
 * Les autres logos se lisent tels quels sur le noir.
 */
const LOGOS_SUR_NOIR = new Set(['somair', 'bagri']);

export function logoSurNoir(slug: string, logoAdmin: string | null | undefined): string | null {
  return LOGOS_SUR_NOIR.has(slug) ? `/logos/entreprises/${slug}-sur-noir.png` : logoEntreprise(slug, logoAdmin);
}

export interface PhotoEntreprise {
  src: string;
  /** Dimensions du fichier : la photo s'affiche entière, à son format d'origine. */
  largeur: number;
  hauteur: number;
  /** Ce que montre la photo, écrit dessous. */
  legende: string;
}

/**
 * Une photo par entreprise, dans public/photos/entreprises.
 * Choix du 25/11/2026 : sous chaque photo, sa description seulement, jamais de
 * source ni de crédit. Une photo dont la licence exige le nom de son auteur
 * (Wikimedia Commons en CC BY ou CC BY-SA) n'a donc pas sa place ici.
 * Sans photo ici, la fiche prend celle de l'admin si elle existe, sinon la
 * mise en page se resserre d'elle-même.
 */
export const PHOTO_ENTREPRISE: Record<string, PhotoEntreprise> = {
  somair: {
    src: '/photos/entreprises/somair.jpg',
    largeur: 1122,
    hauteur: 1402,
    legende: 'L’immeuble de la SOMAÏR à Niamey',
  },
  sonidep: {
    src: '/photos/entreprises/sonidep.jpg',
    largeur: 1670,
    hauteur: 941,
    legende: 'Le siège de la SONIDEP à Niamey',
  },
  nigelec: {
    src: '/photos/entreprises/nigelec.jpg',
    largeur: 1452,
    hauteur: 1083,
    legende: 'La direction régionale de la NIGELEC à Agadez',
  },
  'niger-telecoms': {
    src: '/photos/entreprises/niger-telecoms.jpg',
    largeur: 1537,
    hauteur: 1023,
    legende: 'Une agence de Niger Telecoms',
  },
  sonibank: {
    src: '/photos/entreprises/sonibank.jpg',
    largeur: 1254,
    hauteur: 1254,
    legende: 'Le siège de la SONIBANK à Niamey',
  },
  bagri: {
    src: '/photos/entreprises/bagri.jpg',
    largeur: 1920,
    hauteur: 1080,
    legende: 'L’agence principale de la BAGRI',
  },
  sopamin: {
    src: '/photos/entreprises/sopamin.jpg',
    largeur: 1920,
    hauteur: 1280,
    legende: 'Le siège de la SOPAMIN à Niamey',
  },
};

/** Lettres seules, sans accents ni ponctuation : pour comparer deux libellés. */
function cle(texte: string): string {
  return texte
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Points clés de la fiche, sans celui qui répète la ligne de l'entreprise
 * (SONIBANK : « Type : Banque commerciale » sous « Banque commerciale »).
 */
export function pointsSansRepetition(
  points: { label: string; value: string }[] | null | undefined,
  ligne: string | null | undefined,
): { label: string; value: string }[] {
  const repetee = ligne ? cle(ligne) : null;
  return (points ?? []).filter((p) => p.label && p.value && cle(p.value) !== repetee).slice(0, 3);
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

/**
 * Lien du site officiel : seulement une adresse web (http ou https). Une
 * valeur saisie dans l'admin ne doit jamais devenir un lien « javascript: ».
 */
export function siteOfficiel(adresse: string | null | undefined): { url: string; libelle: string } | null {
  if (!adresse) return null;
  try {
    const url = new URL(adresse.trim());
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    const libelle = `${url.hostname.replace(/^www\./, '')}${url.pathname === '/' ? '' : url.pathname}`.replace(/\/$/, '');
    return { url: url.toString(), libelle };
  } catch {
    return null;
  }
}
