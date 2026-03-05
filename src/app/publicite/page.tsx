import type { Metadata } from 'next';
import { LegalPageLayout } from '@/components/LegalPageLayout';

export const metadata: Metadata = { title: 'Publicité & Partenariats' };

export default function PublicitePage() {
  return (
    <LegalPageLayout
      title="Publicité & Partenariats"
      sections={[
        { heading: 'Opportunités publicitaires', text: "NFI REPORT offre des opportunités publicitaires premium pour toucher une audience qualifiée de professionnels, investisseurs et décideurs au Niger et en Afrique de l'Ouest." },
        { heading: 'Formats disponibles', text: "Nous proposons différents formats : bannières display, articles sponsorisés, newsletters dédiées, et partenariats événementiels." },
        { heading: 'Notre audience', text: "Notre lectorat est composé principalement de cadres dirigeants, d'entrepreneurs, d'investisseurs et de professionnels du secteur financier en Afrique de l'Ouest." },
        { heading: 'Contact commercial', text: 'Pour toute demande de partenariat ou de publicité, contactez notre équipe commerciale à : publicite@nfireport.ne ou au +227 20 73 XX XX.' },
      ]}
    />
  );
}
