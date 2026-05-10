import type { Metadata } from 'next';
import { DynamicLegalPage } from '@/components/DynamicLegalPage';
import { fetchLegalSections } from '@/lib/legal-sections';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation",
  description: "Conditions générales d'utilisation de NFI Report : accès au service, abonnement premium, droits et obligations.",
  alternates: { canonical: '/cgu' },
};

export default async function CGUPage() {
  const initialSections = await fetchLegalSections('cgu');
  return (
    <DynamicLegalPage
      title="Conditions Générales d'Utilisation"
      initialSections={initialSections}
      introParagraphs={[
        "Les présentes conditions générales d'utilisation (CGU) régissent l'accès et l'usage du site NFI Report (https://nfireport.com), édité par NFI Report, média d'information économique et financière dédié au Niger et à l'Afrique de l'Ouest. En accédant au site, en créant un compte ou en souscrivant à un abonnement Premium, l'utilisateur reconnaît avoir pris connaissance des présentes conditions et les accepter sans réserve.",
        "Ces CGU couvrent l'ensemble des services proposés par NFI Report : consultation des articles gratuits et premium, accès aux outils financiers (simulateurs d'emprunt, calculateurs d'intérêts, simulateur de salaire, budget familial), utilisation des contenus pédagogiques, abonnement à la newsletter, participation aux espaces de commentaires, et tout service supplémentaire qui pourrait être ajouté ultérieurement. Elles définissent les droits et obligations réciproques entre NFI Report et ses utilisateurs.",
        "NFI Report se réserve le droit de modifier les présentes conditions à tout moment, pour s'adapter à l'évolution des services, du cadre légal nigérien (notamment la loi n° 2017-28 sur la protection des données personnelles, l'OHADA et les textes UEMOA), ou des bonnes pratiques du secteur. Les utilisateurs seront informés de toute modification substantielle par notification sur le site ou par email. La version en vigueur est celle accessible sur le site à la date de consultation.",
      ]}
      fallbackSections={[
        { heading: 'Objet', text: "Les présentes conditions générales d'utilisation régissent l'accès et l'utilisation du site NFI REPORT. En accédant au site, vous acceptez sans réserve les présentes conditions." },
        { heading: 'Accès au service', text: "L'accès aux articles gratuits est ouvert à tous. L'accès au contenu premium nécessite la création d'un compte et la souscription d'un abonnement payant." },
        { heading: 'Abonnement Premium', text: "L'abonnement Premium donne accès à l'ensemble du contenu du site, aux outils d'analyse avancés et aux indices économiques. L'abonnement est renouvelable et peut être résilié à tout moment." },
        { heading: 'Commentaires', text: 'Les utilisateurs inscrits peuvent publier des commentaires. Tout commentaire contraire aux lois en vigueur sera supprimé sans préavis.' },
        { heading: 'Modification des CGU', text: 'NFI REPORT se réserve le droit de modifier les présentes conditions à tout moment. Les utilisateurs seront informés des modifications par email ou par notification sur le site.' },
      ]}
    />
  );
}
