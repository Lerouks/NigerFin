import type { Metadata } from 'next';
import { DynamicLegalPage } from '@/components/DynamicLegalPage';

export const revalidate = 86400;

export const metadata: Metadata = { title: 'Politique de Confidentialité', description: 'Politique de confidentialité de NFI Report : collecte, utilisation et protection de vos données personnelles.' };

export default function ConfidentialitePage() {
  return (
    <DynamicLegalPage
      slug="confidentialite"
      title="Politique de Confidentialité"
      fallbackSections={[
        { heading: 'Collecte des données', text: 'NFI REPORT collecte uniquement les données nécessaires au bon fonctionnement de ses services : adresse email (inscription newsletter), données de navigation anonymisées, et informations de compte pour les abonnés.' },
        { heading: 'Utilisation des données', text: "Vos données sont utilisées exclusivement pour : l'envoi de la newsletter, la personnalisation de votre expérience de lecture, l'amélioration de nos services, et la gestion de votre abonnement." },
        { heading: 'Protection des données', text: 'Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données personnelles contre tout accès non autorisé, modification, divulgation ou destruction.' },
        { heading: 'Vos droits', text: "Conformément à la législation en vigueur, vous disposez d'un droit d'accès, de rectification, de suppression et de portabilité de vos données personnelles. Contactez-nous à : contact@nfireport.com." },
      ]}
    />
  );
}
