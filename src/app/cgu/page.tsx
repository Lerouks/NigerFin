import type { Metadata } from 'next';
import { LegalPageLayout } from '@/components/LegalPageLayout';

export const metadata: Metadata = { title: "Conditions Générales d'Utilisation", description: "Conditions générales d'utilisation de NFI Report : accès au service, abonnement premium, droits et obligations." };

export default function CGUPage() {
  return (
    <LegalPageLayout
      title="Conditions Générales d'Utilisation"
      sections={[
        { heading: 'Objet', text: "Les présentes conditions générales d'utilisation régissent l'accès et l'utilisation du site NFI REPORT. En accédant au site, vous acceptez sans réserve les présentes conditions." },
        { heading: 'Accès au service', text: "L'accès aux articles gratuits est ouvert à tous. L'accès au contenu premium nécessite la création d'un compte et la souscription d'un abonnement payant." },
        { heading: 'Abonnement Premium', text: "L'abonnement Premium donne accès à l'ensemble du contenu du site, aux outils d'analyse avancés et aux indices économiques. L'abonnement est renouvelable et peut être résilié à tout moment." },
        { heading: 'Commentaires', text: 'Les utilisateurs inscrits peuvent publier des commentaires. Tout commentaire contraire aux lois en vigueur sera supprimé sans préavis.' },
        { heading: 'Modification des CGU', text: 'NFI REPORT se réserve le droit de modifier les présentes conditions à tout moment. Les utilisateurs seront informés des modifications par email ou par notification sur le site.' },
      ]}
    />
  );
}
