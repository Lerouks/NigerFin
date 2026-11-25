import type { Metadata } from 'next';
import { CategoryHero } from '@/components/CategoryHero';
import { HubFooter } from '@/components/HubFooter';
import { GrilleSimulateurs } from '@/components/simulateurs/GrilleSimulateurs';
import { OffrePremiumSimulateurs } from '@/components/simulateurs/OffrePremiumSimulateurs';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Simulateurs\u00a0: salaire, emprunt, épargne et budget au Niger',
  description: 'Simulateurs financiers adaptés au Niger et à l\'UEMOA\u00a0: salaire net, emprunt, intérêts simples et composés, budget familial et indicateurs économiques, en francs CFA.',
  alternates: { canonical: '/simulateurs' },
  openGraph: {
    title: 'Simulateurs\u00a0: salaire, emprunt, épargne et budget au Niger',
    description: 'Simulateurs financiers adaptés au Niger et à l\'UEMOA\u00a0: salaire net, emprunt, intérêts, budget familial.',
    type: 'website',
    images: ['/og-image.png'],
  },
};

export default function SimulateursPage() {
  return (
    <div className="min-h-screen bg-background">
      <CategoryHero
        title="Simulateurs"
        description="Calculez un salaire, un emprunt, un budget ou les intérêts d'une épargne, en francs CFA."
      />
      <section aria-labelledby="simulateurs-liste" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 md:pt-12 md:pb-24">
        <h2 id="simulateurs-liste" className="sr-only">Les simulateurs</h2>
        <GrilleSimulateurs />
        <OffrePremiumSimulateurs className="mt-8" />
      </section>
      <HubFooter
        paragraphs={[
          "Les calculateurs de NFI Report sont conçus spécifiquement pour le contexte économique du Niger et de la zone UEMOA. Que vous prépariez l'achat d'une voiture, le financement d'un projet immobilier, l'analyse de votre salaire ou la gestion de votre budget familial, nos simulateurs vous donnent la réponse en quelques secondes.",
          "Ils intègrent les paramètres locaux pertinents : barème CNSS et impôt sur les traitements et salaires (ITS) du Niger, devise FCFA, indicateurs économiques du Niger. Vous n'avez plus besoin de jongler avec des calculateurs étrangers mal adaptés au contexte africain, ni de vous fier à des calculs approximatifs.",
          "Les simulateurs gratuits couvrent les besoins courants (simulateur d'emprunt, calculateur d'intérêts simples, indices économiques). Les simulateurs Premium offrent des fonctionnalités avancées : analyse de salaire avec barème CNSS+ITS officiel, intérêts composés sur le long terme, budget familial avec recommandations personnalisées et export PDF. Les calculs se font dans votre navigateur. Seul l'export PDF, réservé aux abonnés Premium, garde une copie de ses chiffres sur nos serveurs.",
        ]}
        highlights={[
          { title: 'Simulateurs de crédit', body: 'Calculez vos mensualités, le coût total et les intérêts d\'un emprunt aux taux pratiqués au Niger.' },
          { title: 'Salaire net Niger', body: 'Estimez votre salaire net depuis le brut avec le barème CNSS et l\'ITS officiels.' },
          { title: 'Intérêts simples et composés', body: 'Modélisez la croissance de votre épargne sur le court ou le long terme.' },
          { title: 'Budget familial', body: 'Analysez vos revenus et dépenses avec la méthode 50/30/20 adaptée au Niger.' },
        ]}
      />
    </div>
  );
}
