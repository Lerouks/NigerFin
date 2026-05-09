import type { MarketRow } from './components/MarketTable';
import type { HeadlineCardProps } from './components/HeadlineCard';
import type { ChartBlockProps } from './components/ChartBlock';
import type { QuoteBlockProps } from './components/QuoteBlock';
import type { DigestItem } from './components/DigestList';
import type { RadarItem } from './components/Radar';
import type { SponsorProps } from './components/Sponsor';
import type { NigerKpiItem } from './components/NigerKpiBlock';
import type { ToolPromoItem } from './components/ToolsPromoBlock';

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

  /** Date du prochain envoi en clair (footer). */
  nextIssueLabel?: string;
}
