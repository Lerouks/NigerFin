import type { Metadata } from 'next';
import { LegalPageLayout } from '@/components/LegalPageLayout';

export const metadata: Metadata = { title: 'Mentions Légales' };

export default function MentionsLegalesPage() {
  return (
    <LegalPageLayout
      title="Mentions Légales"
      sections={[
        { heading: 'Éditeur du site', text: 'NFI REPORT est édité par NFI Media SARL, société de droit nigérien au capital de 10 000 000 FCFA. Siège social : Niamey, Niger – Plateau, BP 800.' },
        { heading: 'Directeur de publication', text: 'Le directeur de publication est le représentant légal de NFI Media SARL.' },
        { heading: 'Hébergement', text: 'Le site est hébergé par des serveurs sécurisés conformes aux normes internationales de protection des données.' },
        { heading: 'Propriété intellectuelle', text: "L'ensemble du contenu du site NFI REPORT (articles, analyses, graphiques, logos, images) est protégé par les lois nigériennes et internationales relatives à la propriété intellectuelle. Toute reproduction, même partielle, est soumise à autorisation préalable." },
        { heading: 'Responsabilité', text: 'Les informations publiées sur NFI REPORT sont fournies à titre informatif uniquement et ne constituent en aucun cas un conseil en investissement.' },
      ]}
    />
  );
}
