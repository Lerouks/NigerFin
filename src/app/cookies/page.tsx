import type { Metadata } from 'next';
import { DynamicLegalPage } from '@/components/DynamicLegalPage';
import { fetchLegalSections } from '@/lib/legal-sections';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Politique de cookies : usage et préférences',
  description: 'Politique de cookies de NFI Report : types de cookies utilisés, finalités et gestion de vos préférences.',
  alternates: { canonical: '/cookies' },
};

export default async function CookiesPage() {
  const initialSections = await fetchLegalSections('cookies');
  return (
    <DynamicLegalPage
      title="Politique de Cookies"
      initialSections={initialSections}
      fallbackSections={[
        { heading: "Qu'est-ce qu'un cookie ?", text: "Un cookie est un petit fichier texte déposé sur votre terminal lors de votre visite sur notre site. Il nous permet de vous reconnaître et de mémoriser vos préférences." },
        { heading: 'Cookies utilisés', text: "Nous utilisons des cookies strictement nécessaires au fonctionnement du site, des cookies d'analyse pour améliorer nos services, et des cookies de personnalisation pour adapter le contenu à vos centres d'intérêt." },
        { heading: 'Gestion des cookies', text: 'Vous pouvez à tout moment modifier vos préférences en matière de cookies via les paramètres de votre navigateur.' },
      ]}
    />
  );
}
