import type { Metadata } from 'next';
import { DynamicLegalPage } from '@/components/DynamicLegalPage';
import { fetchLegalSections } from '@/lib/legal-sections';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation",
  description: "Conditions générales d'utilisation de NFI Report : accès au service, accès Premium, droits et obligations.",
  alternates: { canonical: '/cgu' },
};

// Règle éditoriale du 22/11/2026 : aucune promesse au nom de NFI et un texte
// général, sans détail inutile.
export default async function CGUPage() {
  const initialSections = await fetchLegalSections('cgu');
  return (
    <DynamicLegalPage
      title="Conditions générales d’utilisation"
      initialSections={initialSections}
      introParagraphs={[
        'Les présentes conditions générales d’utilisation régissent l’accès et l’usage du site NFI Report (nfireport.com), média d’information économique et financière consacré au Niger et à l’Afrique de l’Ouest, édité par NFI Group SARL. En utilisant le site, l’utilisateur accepte les présentes conditions.',
        'Elles s’appliquent à l’ensemble des services du site\u00a0: articles, simulateurs, cours,\u00a0newsletter\u00a0et\u00a0commentaires.',
        'NFI Report peut modifier les présentes conditions à tout moment. La version en vigueur est celle publiée sur le site.',
      ]}
      fallbackSections={[
        { heading: 'Objet', text: "Les présentes conditions générales d'utilisation régissent l'accès et l'utilisation du site NFI Report. En accédant au site, vous acceptez les présentes conditions." },
        { heading: 'Accès au service', text: "L'accès aux articles gratuits est ouvert à tous. Le contenu Premium nécessite un compte et l'achat d'un accès Premium." },
        { heading: 'Accès Premium', text: 'L’accès Premium s’achète pour une durée choisie, en un seul paiement, sans renouvellement automatique. Il prend fin à l’échéance.' },
        { heading: 'Commentaires', text: 'Les utilisateurs inscrits peuvent publier des commentaires. Tout commentaire contraire aux lois en vigueur sera supprimé sans préavis.' },
        { heading: 'Modification des CGU', text: 'NFI Report peut modifier les présentes conditions à tout moment. La version en vigueur est celle publiée sur le site.' },
      ]}
    />
  );
}
