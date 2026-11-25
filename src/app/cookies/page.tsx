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
// fonction annoncée qui n'existe pas. Le lien « Choix des cookies » du pied de
// page existe depuis le 25/11/2026 (il rouvre le bandeau) : le texte le cite.
// La section « Gestion des cookies » affichée vient de la base (legal_sections) ;
// la version de secours ci-dessous porte le même texte.
export default async function CookiesPage() {
  const initialSections = await fetchLegalSections('cookies');
  return (
    <DynamicLegalPage
      title="Politique de cookies"
      initialSections={initialSections}
      introParagraphs={[
        'La présente politique explique l’usage des cookies sur nfireport.com. Un cookie est un petit fichier enregistré par votre navigateur, qui permet à un site de vous reconnaître ou de mesurer son audience.',
        'Le site utilise des cookies nécessaires à son fonctionnement, par exemple pour vous garder connecté à votre compte. Si vous l’acceptez, il utilise aussi des outils de mesure d’audience et de suivi des erreurs techniques.',
        'Vous pouvez accepter ou refuser ces outils lors de votre première visite, puis changer d’avis à tout moment avec le lien “Choix des cookies”, en bas de chaque page.',
      ]}
      fallbackSections={[
        { heading: "Qu'est-ce qu'un cookie ?", text: 'Un cookie est un petit fichier enregistré par votre navigateur lors de votre visite. Il permet au site de vous reconnaître et de mémoriser vos préférences.' },
        { heading: 'Cookies utilisés', text: 'Le site utilise des cookies nécessaires à son fonctionnement, par exemple pour vous garder connecté à votre compte. Si vous l’acceptez, il utilise aussi des outils de mesure d’audience et de suivi des erreurs techniques.' },
        { heading: 'Gestion des cookies', text: 'Le lien “Choix des cookies”, en bas de chaque page, rouvre le bandeau pour changer d’avis aussi simplement que la première fois ; les cookies déjà enregistrés se suppriment depuis les paramètres de votre navigateur.' },
      ]}
    />
  );
}
