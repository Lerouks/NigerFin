import type { Metadata } from 'next';
import { DynamicLegalPage } from '@/components/DynamicLegalPage';
import { fetchLegalSections } from '@/lib/legal-sections';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Publicité et partenariats : annonceurs',
  description: 'Découvrez nos offres publicitaires et partenariats pour toucher une audience de professionnels et investisseurs au Niger et en Afrique de l\'Ouest.',
  alternates: { canonical: '/publicite' },
};

export default async function PublicitePage() {
  const initialSections = await fetchLegalSections('publicite');
  return (
    <DynamicLegalPage
      title="Publicité & Partenariats"
      initialSections={initialSections}
      introParagraphs={[
        "NFI Report couvre l'économie et la finance du Niger et de l'Afrique de l'Ouest en français. Notre audience se compose principalement de cadres dirigeants, entrepreneurs, investisseurs particuliers et institutionnels, professionnels du secteur bancaire et financier, jeunes diplômés en quête de culture financière, et membres de la diaspora nigérienne dans le monde. Cette audience qualifiée constitue un canal premium pour les annonceurs cherchant à toucher les décideurs économiques de la sous-région.",
        "Nous proposons plusieurs formats publicitaires et de partenariat, tous compatibles avec notre charte éditoriale d'indépendance et de transparence. Les bannières display sur les pages d'articles offrent une visibilité forte au cœur du contenu éditorial. Les articles sponsorisés clairement signalés permettent aux marques de raconter leur histoire à notre audience. Les newsletters dédiées (mono-annonceur ou multi-annonceurs) ciblent nos abonnés Premium les plus engagés. Enfin, les partenariats événementiels, les co-productions de rapports sectoriels et les collaborations sur la durée permettent de construire une présence pérenne auprès de notre audience.",
        "Nos engagements éditoriaux sont stricts : tout contenu sponsorisé est explicitement identifié comme tel et n'est jamais confondu avec le contenu éditorial indépendant. Les annonceurs n'ont aucun droit de regard sur la ligne éditoriale, les analyses ou les choix de couverture. Les contenus sponsorisés doivent respecter notre charte de qualité (information vérifiée, absence de contenu trompeur, conformité aux lois nigériennes sur la publicité) et nous nous réservons le droit de refuser toute campagne incompatible avec nos valeurs.",
      ]}
      fallbackSections={[
        { heading: 'Opportunités publicitaires', text: "NFI REPORT offre des opportunités publicitaires premium pour toucher une audience qualifiée de professionnels, investisseurs et décideurs au Niger et en Afrique de l'Ouest." },
        { heading: 'Formats disponibles', text: "Nous proposons différents formats : bannières display, articles sponsorisés, newsletters dédiées, et partenariats événementiels." },
        { heading: 'Notre audience', text: "Notre audience diversifiée est composée de cadres dirigeants, d'entrepreneurs, d'investisseurs, de professionnels du secteur financier, ainsi que de jeunes diplômés et étudiants passionnés par l'économie et la finance en Afrique de l'Ouest." },
        { heading: 'Contact commercial', text: 'Pour toute demande de partenariat ou de publicité, contactez notre équipe commerciale à : contact@nfireport.com ou au +227 97 76 91 31.' },
      ]}
    />
  );
}
