import type { Metadata } from 'next';
import { SiteView } from './SiteView';

export const metadata: Metadata = {
  title: 'Site · NFI Cockpit',
  description:
    'Santé du site, cron jobs, journal d\'audit et données référentielles (marchés, Niger, entreprises).',
  robots: { index: false },
};

export default function SitePage() {
  return <SiteView />;
}
