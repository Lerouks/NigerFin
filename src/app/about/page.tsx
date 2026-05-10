import type { Metadata } from 'next';
import { AboutHero } from './AboutHero';
import { AboutContent } from './AboutContent';
import { AboutSeoBlock } from './AboutSeoBlock';
import { fetchLegalSections } from '@/lib/legal-sections';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'À propos : notre mission et notre équipe',
  description: "Découvrez la mission, les valeurs et les fondateurs de NFI Report, source d'information économique et financière du Niger et de l'Afrique.",
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'À propos : notre mission et notre équipe',
    description: "Découvrez NFI Report, votre source d'information économique et financière de référence pour le Niger et l'Afrique.",
    type: 'website',
  },
};

const FALLBACK_SECTIONS = [
  {
    id: 'fallback-1',
    heading: 'Notre mission',
    text: "NFI Report a été fondé pour combler un manque criant : l'accès à une information économique et financière fiable, contextualisée et exploitable pour le Niger et l'Afrique de l'Ouest. Trop souvent, les médias internationaux survolent la région ou en présentent une vision simpliste, et les sources locales manquent de moyens pour proposer des analyses approfondies. Nous voulons changer cela en proposant chaque jour des décryptages rigoureux, des données vérifiées et des outils pratiques qui aident les Nigériens à comprendre leur économie, à protéger leur patrimoine et à saisir les opportunités.",
    display_order: 1,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'fallback-2',
    heading: 'Indépendance éditoriale',
    text: "Nous croyons à une presse économique indépendante, libre des pressions politiques et commerciales. Nos analyses sont guidées par les faits, les données et l'intérêt du lecteur, jamais par les intérêts particuliers d'annonceurs ou de groupes d'influence. La frontière entre contenu éditorial et contenu sponsorisé est strictement respectée et explicitement signalée.",
    display_order: 2,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'fallback-3',
    heading: 'Rigueur et pédagogie',
    text: "L'économie peut paraître intimidante. Notre rôle est de la rendre accessible sans la simplifier à outrance. Chaque article est relu, chaque chiffre est sourcé, chaque concept complexe est expliqué avec clarté. Nous écrivons pour les professionnels comme pour les curieux, du dirigeant d'entreprise au jeune diplômé.",
    display_order: 3,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'fallback-4',
    heading: 'Ancrage régional, ouverture mondiale',
    text: "Notre cœur de couverture est le Niger et la zone UEMOA, mais nous gardons toujours un regard sur l'écosystème mondial qui influence notre région : décisions des grandes banques centrales, mouvements des matières premières, géopolitique, transition énergétique. Comprendre l'ailleurs aide à mieux comprendre ici.",
    display_order: 4,
    updated_at: new Date().toISOString(),
  },
];

export default async function AboutPage() {
  const dbSections = await fetchLegalSections('about');
  const sections = dbSections.length > 0 ? dbSections : FALLBACK_SECTIONS;
  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <AboutHero />
      <AboutContent sections={sections} />
      <AboutSeoBlock />
    </div>
  );
}
