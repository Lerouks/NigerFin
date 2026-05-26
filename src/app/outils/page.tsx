import type { Metadata } from 'next';
import { CategoryHero } from '@/components/CategoryHero';
import { HubFooter } from '@/components/HubFooter';
import { PracticalTools } from '@/components/PracticalTools';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Outils financiers : simulateurs gratuits Niger',
  description: 'Simulateurs et calculateurs financiers gratuits adaptés au Niger et à l\'UEMOA : emprunt, intérêts simples et composés, salaire, budget familial.',
  alternates: { canonical: '/outils' },
  openGraph: {
    title: 'Outils financiers : simulateurs gratuits Niger',
    description: 'Simulateurs et calculateurs financiers gratuits adaptés au Niger et à l\'UEMOA : emprunt, intérêts, salaire, budget familial.',
    type: 'website',
  },
};

export default function OutilsPage() {
  return (
    <div className="min-h-screen bg-background">
      <CategoryHero
        label="Rubrique"
        title="Outils Financiers"
        description="Simulateurs et calculateurs financiers optimisés pour le contexte économique africain."
      />
      <PracticalTools />
      <HubFooter
        paragraphs={[
          "Les outils financiers de NFI Report sont conçus spécifiquement pour le contexte économique du Niger et de la zone UEMOA. Que vous prépariez l'achat d'une voiture, le financement d'un projet immobilier, l'analyse de votre salaire ou la gestion de votre budget familial, nos simulateurs vous aident à prendre des décisions éclairées en quelques secondes.",
          "Tous nos calculateurs intègrent les paramètres locaux pertinents : taux d'usure BCEAO, barème CNSS et impôt sur les traitements et salaires (ITS) du Niger, devise FCFA, indices économiques régionaux (UEMOA, CEDEAO). Vous n'avez plus besoin de jongler avec des outils internationaux mal adaptés au contexte africain ou de faire des calculs approximatifs : nos formules sont validées par des professionnels de la finance.",
          "Les outils gratuits couvrent les besoins courants (simulateur d'emprunt, calculateur d'intérêts simples, indices économiques). Les outils Premium offrent des fonctionnalités avancées : analyse de salaire avec barème CNSS+ITS officiel, intérêts composés long terme avec inflation, budget familial avec recommandations personnalisées et export PDF. Toutes les données sont calculées localement dans votre navigateur, sans transmission à nos serveurs.",
        ]}
        highlights={[
          { title: 'Simulateurs de crédit', body: 'Calculez vos mensualités, le coût total et les intérêts d\'un emprunt selon les taux pratiqués au Niger.' },
          { title: 'Salaire net Niger', body: 'Estimez votre salaire net depuis le brut avec le barème CNSS et l\'ITS officiels.' },
          { title: 'Intérêts simples & composés', body: 'Modélisez la croissance de votre épargne sur le court ou le long terme.' },
          { title: 'Budget familial', body: 'Analysez vos revenus et dépenses avec la méthode 50/30/20 adaptée au Niger.' },
        ]}
      />
    </div>
  );
}
