import type { Metadata } from 'next';
import { DynamicLegalPage } from '@/components/DynamicLegalPage';

export const revalidate = 86400;

export const metadata: Metadata = { title: 'Politique de Cookies', description: 'Politique de cookies de NFI Report : types de cookies utilisés, finalités et gestion de vos préférences.' };

export default function CookiesPage() {
  return (
    <DynamicLegalPage
      slug="cookies"
      title="Politique de Cookies"
      fallbackSections={[
        { heading: "Qu'est-ce qu'un cookie ?", text: "Un cookie est un petit fichier texte déposé sur votre terminal lors de votre visite sur notre site. Il nous permet de vous reconnaître et de mémoriser vos préférences." },
        { heading: 'Cookies utilisés', text: "Nous utilisons des cookies strictement nécessaires au fonctionnement du site, des cookies d'analyse pour améliorer nos services, et des cookies de personnalisation pour adapter le contenu à vos centres d'intérêt." },
        { heading: 'Gestion des cookies', text: 'Vous pouvez à tout moment modifier vos préférences en matière de cookies via les paramètres de votre navigateur.' },
      ]}
    />
  );
}
