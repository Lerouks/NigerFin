import type { MarketRow } from './components/MarketTable';
import type { HeadlineCardProps } from './components/HeadlineCard';
import type { ChartBlockProps } from './components/ChartBlock';
import type { QuoteBlockProps } from './components/QuoteBlock';
import type { DigestItem } from './components/DigestList';
import type { RadarItem } from './components/Radar';
import type { SponsorProps } from './components/Sponsor';
import type { NigerKpiItem } from './components/NigerKpiBlock';
import type { ToolPromoItem } from './components/ToolsPromoBlock';
import type { DiscoverItem } from './components/DiscoverBlock';

/**
 * Forme typée d'un numéro de Premium Briefing.
 * Sérialisable en JSON pour stockage dans la table newsletter_issues.
 */
export interface NewsletterIssue {
  number: number;
  slug: string;
  subject: string;
  preheader: string;
  issueDateLabel: string;
  readTimeMinutes?: number;
  webViewUrl?: string;
  /** Accroche éditoriale courte (~80 chars) affichée dans la cover, sous le wordmark. */
  coverHeadline?: string;

  /**
   * Type d'édition :
   *  - 'standard' (défaut) : Premium Briefing hebdomadaire du lundi
   *  - 'special'           : édition spéciale (élections, choc marché, hors-série)
   *  - 'flash'             : alerte courte hors cadence
   * Adapte l'eyebrow de la cover (ex: "ÉDITION SPÉCIALE · N°01" en or italique).
   */
  editionType?: 'standard' | 'special' | 'flash';

  /** Mot du rédacteur en ouverture (avant la citation). HTML rich autorisé dans body. */
  editoNote?: {
    eyebrow?: string;
    body: string;
    signature?: string;
  };

  intro: {
    eyebrow?: string;
    heading: string;
    paragraph: string;
    /** Sommaire visuel numéroté (3 items max idéalement). */
    summary?: { number: string; label: string }[];
  };

  market: {
    title?: string;
    caption?: string;
    rows: MarketRow[];
    source?: string;
    /**
     * Si true, le helper de rendu remplace `rows` (et optionnellement `source`)
     * par les valeurs vivantes de la table public.market_data au moment du
     * rendu. Garantit que la newsletter affiche toujours les chiffres a jour
     * gérés depuis le dashboard admin du site.
     */
    autoSync?: boolean;
  };

  /** Bloc "Niger en chiffres" : 3 KPI clés. */
  nigerKpi?: {
    eyebrow?: string;
    title?: string;
    caption?: string;
    items: NigerKpiItem[];
  };

  headlines: HeadlineCardProps[];

  chart?: ChartBlockProps;

  sponsor?: SponsorProps;

  digest?: { sectionNumeral?: string; eyebrow?: string; title?: string; items: DigestItem[] };

  quote?: QuoteBlockProps;

  radar?: { sectionNumeral?: string; eyebrow?: string; title?: string; items: RadarItem[] };

  /** Bloc promotionnel des outils Premium NFI Report (simulateurs, calculateurs). */
  toolsPromo?: {
    sectionNumeral?: string;
    eyebrow?: string;
    title?: string;
    caption?: string;
    items: ToolPromoItem[];
  };

  /**
   * Bloc "Continuer sur NFI Report" : invitations vers les autres rubriques
   * du site (education, entreprises BRVM, niger interactive, etc.) afin de
   * valoriser la profondeur du produit au dela de l'edito de la semaine.
   */
  discover?: {
    sectionNumeral?: string;
    eyebrow?: string;
    title?: string;
    caption?: string;
    items: DiscoverItem[];
  };

  /** Date du prochain envoi en clair (footer). */
  nextIssueLabel?: string;
}
