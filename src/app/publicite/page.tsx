import type { Metadata } from 'next';
import { DynamicLegalPage } from '@/components/DynamicLegalPage';
import { fetchLegalSections } from '@/lib/legal-sections';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Publicité et partenariats : annonceurs',
  description: "Publicité et partenariats sur NFI Report, média économique du Niger et de l'Afrique de l'Ouest.",
  alternates: { canonical: '/publicite' },
};

// Règle éditoriale du 22/11/2026 : aucune promesse (formats, audience
// « qualifiée », engagements) et aucun chiffre d'audience qui change.
export default async function PublicitePage() {
  const initialSections = await fetchLegalSections('publicite');
  return (
    <DynamicLegalPage
      title="Publicité & Partenariats"
      initialSections={initialSections}
      introParagraphs={[
        'NFI Report couvre l’économie et la finance du Niger et de l’Afrique de l’Ouest, en français, sur son site et sur ses réseaux sociaux.',
        'Les entreprises et les institutions qui souhaitent toucher cette audience peuvent nous écrire pour en parler.',
      ]}
      fallbackSections={[
        { heading: 'Opportunités publicitaires', text: 'NFI Report propose aux annonceurs de toucher son audience, sur le site et sur ses réseaux sociaux.' },
        { heading: 'Notre audience', text: 'L’audience de NFI Report vit en majorité au Niger et suit l’économie du pays, sur le site comme sur nos réseaux sociaux.' },
        { heading: 'Contact commercial', text: 'Pour toute demande de partenariat ou de publicité, écrivez à contact@nfireport.com ou appelez le +227 91 70 71 94.' },
      ]}
    />
  );
}
