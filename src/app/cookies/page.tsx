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
      introParagraphs={[
        "La présente politique de cookies explique l'usage des traceurs déposés sur votre terminal lors de votre navigation sur nfireport.com. Un cookie est un petit fichier texte enregistré par votre navigateur qui permet à un site web de vous reconnaître, de mémoriser vos préférences ou de mesurer son audience. Les cookies sont indispensables au fonctionnement de la majorité des sites modernes et leur usage est strictement encadré par la législation nigérienne sur la protection des données personnelles.",
        "NFI Report utilise plusieurs catégories de cookies, chacune ayant une finalité distincte. Les cookies strictement nécessaires assurent le fonctionnement du site (authentification, panier d'abonnement, sécurité, préférences de session) et ne requièrent pas votre consentement préalable. Les cookies de mesure d'audience (PostHog) nous aident à comprendre comment vous utilisez le site afin de l'améliorer ; leur dépôt est conditionné à votre consentement explicite. Les cookies de personnalisation adaptent l'expérience à vos centres d'intérêt déclarés.",
        "Vous gardez le contrôle total sur les cookies qui vous concernent. Lors de votre première visite, un bandeau vous permet d'accepter, de refuser ou de personnaliser le dépôt de chaque catégorie de cookie non essentielle. Vous pouvez à tout moment modifier vos préférences via les paramètres de votre navigateur (Chrome, Firefox, Safari, Edge proposent tous une gestion avancée des cookies) ou en supprimant les cookies déjà déposés sur votre terminal. Notez que le refus des cookies peut limiter certaines fonctionnalités du site, notamment la connexion à votre compte ou la mémorisation de vos préférences.",
      ]}
      fallbackSections={[
        { heading: "Qu'est-ce qu'un cookie ?", text: "Un cookie est un petit fichier texte déposé sur votre terminal lors de votre visite sur notre site. Il nous permet de vous reconnaître et de mémoriser vos préférences." },
        { heading: 'Cookies utilisés', text: "Nous utilisons des cookies strictement nécessaires au fonctionnement du site, des cookies d'analyse pour améliorer nos services, et des cookies de personnalisation pour adapter le contenu à vos centres d'intérêt." },
        { heading: 'Gestion des cookies', text: 'Vous pouvez à tout moment modifier vos préférences en matière de cookies via les paramètres de votre navigateur.' },
      ]}
    />
  );
}
