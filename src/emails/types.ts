import type { MarketRow } from './components/MarketTable';
import type { HeadlineCardProps } from './components/HeadlineCard';
import type { ChartBlockProps } from './components/ChartBlock';
import type { QuoteBlockProps } from './components/QuoteBlock';
import type { DigestItem } from './components/DigestList';
import type { RadarItem } from './components/Radar';
import type { SponsorProps } from './components/Sponsor';

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

  intro: {
    eyebrow?: string;
    heading: string;
    paragraph: string;
    teasers?: string[];
  };

  market: {
    title?: string;
    caption?: string;
    rows: MarketRow[];
    source?: string;
  };

  headlines: HeadlineCardProps[];

  chart?: ChartBlockProps;

  sponsor?: SponsorProps;

  digest?: { title?: string; items: DigestItem[] };

  quote?: QuoteBlockProps;

  radar?: { title?: string; items: RadarItem[] };
}
