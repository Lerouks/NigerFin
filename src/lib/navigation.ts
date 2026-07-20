/**
 * SOURCE UNIQUE DE VERITE DE LA TAXONOMIE DU SITE.
 *
 * Avant ce fichier, la meme liste de rubriques etait recopiee A LA MAIN dans six
 * endroits : Header, Footer, plan du site, sitemap, selecteur de section de
 * l'admin, et mock-data. Ils avaient deja diverge (7 entrees dans la barre, 6
 * dans SECTION_META, 6 dans l'admin, 7 dans le sitemap dont /outils mais pas
 * /premium). Ajouter ou retirer une rubrique demandait six modifications
 * coordonnees, et il suffisait d'en oublier une pour creer une incoherence
 * silencieuse. Tout se declare desormais ICI, une seule fois.
 *
 * REGLE D'OR : on renomme des LIBELLES, jamais des CHEMINS.
 * Aucune URL existante ne doit changer, aucune redirection n'est a ecrire. Les
 * `path` ci-dessous sont figes ; seuls les `label` sont du ressort editorial.
 */

/** Registre de lecture, qui separe visuellement la barre en deux blocs. */
export type NavRegister = 'comprendre' | 'agir';

export interface NavigationEntry {
  /** Cle stable utilisee en base (colonne articles.sections). Ne jamais renommer. */
  key: string;
  /** Libelle affiche. Modifiable librement, c'est un choix editorial. */
  label: string;
  /**
   * Sous-titre lecteur, affiche dans la barre desktop, le panneau mobile et en
   * tete de hub. C'est le dispositif qui rend Economie et Finance enfin
   * distinguables l'une de l'autre sans avoir a les fusionner.
   */
  subtitle?: string;
  /** URL. FIGEE : ne jamais modifier, des liens externes en dependent. */
  path: string;
  order: number;
  register: NavRegister;
  /** Presente dans la barre de navigation principale. */
  inNav: boolean;
  /** Presente dans le pied de page. */
  inFooter: boolean;
  /** Presente dans le sitemap XML et le plan du site. */
  inSitemap: boolean;
  /**
   * Assignable a un article depuis l'admin. `false` pour les hubs qui ne sont
   * pas des rubriques editoriales, comme les simulateurs.
   */
  isEditorial: boolean;
}

export const NAVIGATION: NavigationEntry[] = [
  // --- Registre « comprendre » : le contexte, ce qui se passe ---
  {
    key: 'economie',
    label: 'Économie',
    subtitle: 'Le pays',
    path: '/economie',
    order: 1,
    register: 'comprendre',
    inNav: true,
    inFooter: true,
    inSitemap: true,
    isEditorial: true,
  },
  {
    key: 'finance',
    label: 'Finance',
    subtitle: 'Votre argent',
    path: '/finance',
    order: 2,
    register: 'comprendre',
    inNav: true,
    inFooter: true,
    inSitemap: true,
    isEditorial: true,
  },

  // --- Registre « agir » : les ressources, ce qu'on en fait ---
  {
    key: 'entreprises',
    label: 'Entreprises',
    path: '/entreprises',
    order: 3,
    register: 'agir',
    inNav: true,
    inFooter: true,
    inSitemap: true,
    isEditorial: true,
  },
  {
    // Libelle change (« Éducation » devient « Apprendre »), CHEMIN INCHANGE.
    key: 'education',
    label: 'Apprendre',
    path: '/education',
    order: 4,
    register: 'agir',
    inNav: true,
    inFooter: true,
    inSitemap: true,
    isEditorial: true,
  },
  {
    // Libelle change (« Outils » devient « Simulateurs »), CHEMIN INCHANGE.
    // Hub de simulateurs, pas une rubrique sous laquelle classer un article :
    // isEditorial reste false, ce qui etait deja le cas de fait, mais par
    // omission silencieuse plutot que par declaration explicite.
    key: 'outils',
    label: 'Simulateurs',
    path: '/outils',
    order: 5,
    register: 'agir',
    inNav: true,
    inFooter: true,
    inSitemap: true,
    isEditorial: false,
  },

  // --- Hors barre de navigation, mais toujours vivants ---
  {
    // Marches sort de la barre, la PAGE RESTE en 200 et n'est JAMAIS redirigee.
    // Ses articles remontent dans Finance, via la facette « Marches & BRVM ».
    // La cle reste dans SECTION_META (voir sections.ts) pour que les liens de
    // tag deja publies continuent de fonctionner, en pointant vers /finance.
    // Precedent : le Wall Street Journal regroupe « Markets & Finance » sous
    // /finance tout en gardant Economy separee.
    key: 'marches',
    label: 'Marchés',
    path: '/marches',
    order: 6,
    register: 'comprendre',
    inNav: false,
    inFooter: true,
    inSitemap: true,
    isEditorial: false,
  },
  {
    // Niger sort de la barre, la PAGE RESTE en 200 et n'est JAMAIS redirigee.
    // Elle devient une page de reference, accessible depuis le pied de page.
    key: 'niger',
    label: 'Niger',
    path: '/niger',
    order: 7,
    register: 'comprendre',
    inNav: false,
    inFooter: true,
    inSitemap: true,
    isEditorial: true,
  },
];

/** Rubriques de la barre principale, dans l'ordre, tous registres confondus. */
export const NAV_ENTRIES = NAVIGATION.filter((e) => e.inNav).sort((a, b) => a.order - b.order);

/** Rubriques du pied de page. */
export const FOOTER_ENTRIES = NAVIGATION.filter((e) => e.inFooter).sort((a, b) => a.order - b.order);

/** Rubriques a exposer dans le sitemap XML et le plan du site. */
export const SITEMAP_ENTRIES = NAVIGATION.filter((e) => e.inSitemap).sort((a, b) => a.order - b.order);

/** Rubriques assignables a un article depuis l'admin. */
export const EDITORIAL_ENTRIES = NAVIGATION.filter((e) => e.isEditorial).sort((a, b) => a.order - b.order);

export interface NavGroup {
  register: NavRegister;
  entries: NavigationEntry[];
}

/**
 * Entrees de la barre groupees par registre, dans l'ordre d'affichage.
 * Le Header insere un filet vertical de 1 px entre deux groupes consecutifs.
 */
export const NAV_GROUPS: NavGroup[] = (['comprendre', 'agir'] as NavRegister[])
  .map((register) => ({ register, entries: NAV_ENTRIES.filter((e) => e.register === register) }))
  .filter((groupe) => groupe.entries.length > 0);

export function getNavigationEntry(key: string): NavigationEntry | undefined {
  return NAVIGATION.find((e) => e.key === key);
}
