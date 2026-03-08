import type { Metadata } from 'next';
import { LegalPageLayout } from '@/components/LegalPageLayout';

export const revalidate = 86400;

export const metadata: Metadata = { title: 'Publicité & Partenariats', description: 'Découvrez nos offres publicitaires et partenariats pour toucher une audience de professionnels et investisseurs au Niger.' };

export default function PublicitePage() {
  return (
    <LegalPageLayout
      title="Publicité & Partenariats"
      sections={[
        { heading: 'Opportunités publicitaires', text: "NFI REPORT offre des opportunités publicitaires premium pour toucher une audience qualifiée de professionnels, investisseurs et décideurs au Niger et en Afrique de l'Ouest." },
        { heading: 'Formats disponibles', text: "Nous proposons différents formats : bannières display, articles sponsorisés, newsletters dédiées, et partenariats événementiels." },
        { heading: 'Notre audience', text: "Notre audience diversifiée est composée de cadres dirigeants, d'entrepreneurs, d'investisseurs, de professionnels du secteur financier, ainsi que de jeunes diplômés et étudiants passionnés par l'économie et la finance en Afrique de l'Ouest." },
        { heading: 'Contact commercial', text: 'Pour toute demande de partenariat ou de publicité, contactez notre équipe commerciale à : contact@nfireport.com ou au +227 98 54 38 37.' },
      ]}
    />
  );
}
