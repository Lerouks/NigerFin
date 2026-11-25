import type { Metadata } from 'next';
import { CategoryHero } from '@/components/CategoryHero';
import { HubFooter } from '@/components/HubFooter';
import { CarresCours } from '@/components/apprendre/CarresCours';
import { getCours } from '@/lib/apprendre/donnees';

export const revalidate = 3600;

const DESCRIPTION =
  'Des cours courts, à suivre dans l’ordre, pour comprendre l’argent, l’économie et les marchés depuis le Niger.';

export const metadata: Metadata = {
  title: 'Apprendre : cours d’économie et de finance',
  description: DESCRIPTION,
  alternates: { canonical: '/apprendre' },
  openGraph: { title: 'Apprendre | NFI REPORT', description: DESCRIPTION, type: 'website' },
};

export default async function ApprendrePage() {
  const cours = await getCours();

  return (
    <div className="min-h-screen bg-background">
      <CategoryHero title="Apprendre" description={DESCRIPTION} />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <div className="space-y-12 md:space-y-16">
          {cours.map((c) => (
            <section key={c.id} aria-labelledby={`cours-${c.slug}`}>
              <CarresCours cours={c} />
            </section>
          ))}
        </div>
      </div>
      <HubFooter
        paragraphs={[
          'Apprendre réunit les cours de NFI REPORT sur l’argent, l’économie et les marchés. Chaque cours suit un ordre : la première leçon pose les bases, et chaque leçon mène à la suivante.',
          'Les exemples viennent du Niger et de la zone UEMOA : le franc CFA, les banques, la BRVM. Chaque leçon se lit en quelques minutes et se termine par l’essentiel à retenir et une question pour vérifier ce qu’on a compris.',
          'Certaines leçons sont réservées aux abonnés Premium, les autres sont en accès libre.',
        ]}
        highlights={[
          { title: 'Des cours dans l’ordre', body: 'Chaque leçon mène à la suivante, des premières notions aux placements.' },
          { title: 'Le Niger d’abord', body: 'Franc CFA, banques, BRVM : les exemples viennent d’ici.' },
          { title: 'Quelques minutes par leçon', body: 'Une leçon se lit d’une traite, sur téléphone comme sur ordinateur.' },
          { title: 'Votre progression', body: 'Avec un compte gratuit, les leçons lues restent cochées d’une visite à l’autre.' },
        ]}
      />
    </div>
  );
}
