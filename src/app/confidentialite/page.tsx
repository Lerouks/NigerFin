import type { Metadata } from 'next';
import { DynamicLegalPage } from '@/components/DynamicLegalPage';
import { fetchLegalSections } from '@/lib/legal-sections';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Politique de confidentialité et données',
  description: 'Politique de confidentialité de NFI Report : les données recueillies sur le site, leur usage et vos droits.',
  alternates: { canonical: '/confidentialite' },
};

// Règle éditoriale du 22/11/2026 : aucune promesse au nom de NFI (délai,
// garantie, engagement) et aucun nom de prestataire. Le texte reste général.
export default async function ConfidentialitePage() {
  const initialSections = await fetchLegalSections('confidentialite');
  return (
    <DynamicLegalPage
      title="Politique de Confidentialité"
      initialSections={initialSections}
      introParagraphs={[
        'La présente politique décrit les données recueillies sur le site nfireport.com, l’usage qui en est fait et les droits dont vous disposez.',
        'Elle s’inscrit dans le cadre de la loi n° 2017-28 du 3 mai 2017 relative à la protection des données à caractère personnel. La Haute Autorité de Protection des Données à Caractère Personnel (HAPDP) du Niger est l’autorité de contrôle compétente.',
      ]}
      fallbackSections={[
        {
          heading: 'Responsable du traitement et collecte des données',
          text: 'Le responsable du traitement des données personnelles recueillies sur le site NFI Report est NFI Group SARL, dont le siège est à Niamey (Niger). NFI Group SARL recueille l’adresse e-mail des inscrits à la newsletter, des données de navigation pour mesurer l’audience du site et les informations de compte des abonnés.',
        },
        {
          heading: 'Utilisation des données',
          text: 'Vos données servent à envoyer la newsletter, à gérer votre compte et votre abonnement, et à améliorer le site.',
        },
        {
          heading: 'Vos droits',
          text: 'Conformément à la loi n° 2017-28 du 3 mai 2017 relative à la protection des données à caractère personnel, vous disposez d’un droit d’accès, de rectification, de suppression et de portabilité de vos données. Pour l’exercer, écrivez à contact@nfireport.com.',
        },
      ]}
    />
  );
}
