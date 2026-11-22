import type { Metadata } from 'next';
import { DynamicLegalPage } from '@/components/DynamicLegalPage';
import { fetchLegalSections } from '@/lib/legal-sections';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Politique de cookies : usage et préférences',
  description: 'Politique de cookies de NFI Report : les cookies utilisés et la façon de les gérer.',
  alternates: { canonical: '/cookies' },
};

// Règle éditoriale du 22/11/2026 : texte général, sans nom d'outil ni
// fonction annoncée qui n'existe pas.
export default async function CookiesPage() {
  const initialSections = await fetchLegalSections('cookies');
  return (
    <DynamicLegalPage
      title="Politique de Cookies"
      initialSections={initialSections}
      introParagraphs={[
        'La présente politique explique l’usage des cookies sur nfireport.com. Un cookie est un petit fichier enregistré par votre navigateur, qui permet à un site de vous reconnaître ou de mesurer son audience.',
        'Le site utilise des cookies nécessaires à son fonctionnement, par exemple pour vous garder connecté à votre compte. Si vous l’acceptez, il utilise aussi des outils de mesure d’audience et de suivi des erreurs techniques.',
        'Vous pouvez accepter ou refuser ces outils lors de votre première visite, et supprimer les cookies à tout moment depuis les réglages de votre navigateur.',
      ]}
      fallbackSections={[
        { heading: "Qu'est-ce qu'un cookie ?", text: 'Un cookie est un petit fichier enregistré par votre navigateur lors de votre visite. Il permet au site de vous reconnaître et de mémoriser vos préférences.' },
        { heading: 'Cookies utilisés', text: 'Le site utilise des cookies nécessaires à son fonctionnement, par exemple pour vous garder connecté à votre compte. Si vous l’acceptez, il utilise aussi des outils de mesure d’audience et de suivi des erreurs techniques.' },
        { heading: 'Gestion des cookies', text: 'Vous pouvez à tout moment modifier vos préférences en matière de cookies via les paramètres de votre navigateur.' },
      ]}
    />
  );
}
