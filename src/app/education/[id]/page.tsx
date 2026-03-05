import Link from 'next/link';
import { ArrowLeft, BookOpen, Clock, Lock } from 'lucide-react';
import { notFound } from 'next/navigation';

const categoryContent: Record<string, { title: string; description: string; articles: { title: string; duration: string; free: boolean }[] }> = {
  'bases-finance': {
    title: 'Les bases de la finance',
    description: 'Comprenez les fondamentaux de la finance personnelle et des marchés financiers.',
    articles: [
      { title: 'Qu\'est-ce que la finance ?', duration: '5 min', free: true },
      { title: 'Les différents types de marchés financiers', duration: '8 min', free: true },
      { title: 'Comprendre l\'inflation et ses effets', duration: '6 min', free: true },
      { title: 'Les taux d\'intérêt expliqués simplement', duration: '7 min', free: false },
      { title: 'Introduction aux produits financiers', duration: '10 min', free: false },
    ],
  },
  'bourse-marches': {
    title: 'Bourse & Marchés',
    description: 'Tout savoir sur le fonctionnement de la bourse et des marchés financiers.',
    articles: [
      { title: 'Comment fonctionne la bourse ?', duration: '6 min', free: true },
      { title: 'Actions, obligations, fonds : les bases', duration: '8 min', free: true },
      { title: 'Lire un graphique boursier', duration: '7 min', free: true },
      { title: 'Les indices boursiers africains', duration: '9 min', free: false },
      { title: 'Investir sur les marchés émergents', duration: '12 min', free: false },
    ],
  },
  'analyse-technique': {
    title: 'Analyse technique',
    description: 'Apprenez à lire les graphiques et identifier les tendances de marché.',
    articles: [
      { title: 'Introduction à l\'analyse technique', duration: '5 min', free: true },
      { title: 'Supports et résistances', duration: '7 min', free: true },
      { title: 'Les moyennes mobiles', duration: '8 min', free: false },
      { title: 'Le RSI et les indicateurs de momentum', duration: '10 min', free: false },
      { title: 'Les figures chartistes essentielles', duration: '12 min', free: false },
    ],
  },
  'analyse-fondamentale': {
    title: 'Analyse fondamentale',
    description: 'Évaluez la valeur réelle d\'une entreprise ou d\'un actif.',
    articles: [
      { title: 'Qu\'est-ce que l\'analyse fondamentale ?', duration: '5 min', free: true },
      { title: 'Lire un bilan comptable', duration: '10 min', free: true },
      { title: 'Les ratios financiers clés', duration: '8 min', free: false },
      { title: 'Évaluer une entreprise : méthodes DCF', duration: '15 min', free: false },
    ],
  },
  'economie-macro': {
    title: 'Économie & Macro',
    description: 'Comprenez les grands mécanismes économiques qui influencent les marchés.',
    articles: [
      { title: 'PIB, croissance et récession', duration: '6 min', free: true },
      { title: 'La politique monétaire en zone UEMOA', duration: '8 min', free: true },
      { title: 'Commerce international et balance des paiements', duration: '10 min', free: false },
      { title: 'L\'impact du pétrole sur l\'économie nigérienne', duration: '9 min', free: false },
    ],
  },
  'epargne-investissement': {
    title: 'Épargne & Investissement',
    description: 'Stratégies pour épargner et faire fructifier votre capital.',
    articles: [
      { title: 'Épargner vs Investir : quelle différence ?', duration: '5 min', free: true },
      { title: 'Construire un portefeuille diversifié', duration: '8 min', free: true },
      { title: 'Les comptes d\'épargne en zone UEMOA', duration: '7 min', free: false },
      { title: 'Stratégies d\'investissement à long terme', duration: '12 min', free: false },
    ],
  },
  'gestion-budget': {
    title: 'Gestion de budget',
    description: 'Maîtrisez vos finances personnelles au quotidien.',
    articles: [
      { title: 'Créer son premier budget', duration: '5 min', free: true },
      { title: 'La règle 50/30/20', duration: '4 min', free: true },
      { title: 'Réduire ses dépenses sans sacrifier son confort', duration: '7 min', free: false },
      { title: 'Constituer un fonds d\'urgence', duration: '6 min', free: false },
    ],
  },
  'brvm-uemoa': {
    title: 'BRVM & UEMOA',
    description: 'Focus sur la Bourse Régionale des Valeurs Mobilières et l\'espace UEMOA.',
    articles: [
      { title: 'Comprendre la BRVM', duration: '6 min', free: true },
      { title: 'Les entreprises cotées à la BRVM', duration: '8 min', free: true },
      { title: 'Investir à la BRVM : guide pratique', duration: '10 min', free: false },
      { title: 'L\'intégration financière en zone UEMOA', duration: '12 min', free: false },
    ],
  },
  'fiscalite-droit': {
    title: 'Fiscalité & Droit',
    description: 'Comprendre le cadre fiscal et juridique de vos investissements.',
    articles: [
      { title: 'Les bases de la fiscalité au Niger', duration: '7 min', free: true },
      { title: 'Fiscalité des revenus d\'investissement', duration: '9 min', free: false },
      { title: 'Droits des actionnaires en zone OHADA', duration: '10 min', free: false },
    ],
  },
};

const availableIds = Object.keys(categoryContent);

export function generateStaticParams() {
  return availableIds.map((id) => ({ id }));
}

export default async function EducationCategoryPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const content = categoryContent[id];

  if (!content) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Hero */}
      <section className="bg-[#111] text-white py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/education"
            className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 transition-colors text-[13px] mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l&apos;éducation
          </Link>
          <div className="flex items-center gap-3 mb-3">
            <BookOpen className="w-6 h-6 text-white/60" />
            <span className="text-[11px] tracking-[0.2em] uppercase text-white/40">
              Éducation
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">{content.title}</h1>
          <p className="text-white/50 text-[15px] max-w-xl">{content.description}</p>
        </div>
      </section>

      {/* Articles list */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-lg font-semibold">{content.articles.length} leçons</h2>
          <div className="flex-1 h-px bg-black/[0.06]" />
        </div>

        <div className="space-y-3">
          {content.articles.map((article, i) => (
            <div
              key={i}
              className={`group flex items-center justify-between p-5 rounded-xl border transition-all duration-150 ${
                article.free
                  ? 'bg-white border-black/[0.06] hover:border-black/[0.12] hover:shadow-sm cursor-pointer'
                  : 'bg-white/60 border-black/[0.04] cursor-default'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="w-8 h-8 rounded-full bg-[#f5f5f0] flex items-center justify-center text-[13px] font-medium text-gray-500">
                  {i + 1}
                </span>
                <div>
                  <p className={`text-[15px] font-medium ${article.free ? 'text-gray-900' : 'text-gray-400'}`}>
                    {article.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-3.5 h-3.5 text-gray-300" />
                    <span className="text-[12px] text-gray-400">{article.duration}</span>
                  </div>
                </div>
              </div>
              {!article.free && (
                <span className="flex items-center gap-1.5 text-[11px] text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                  <Lock className="w-3 h-3" />
                  Premium
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="mt-10 p-6 bg-[#111] text-white rounded-xl text-center">
          <h3 className="text-lg font-semibold mb-2">Contenu en cours de développement</h3>
          <p className="text-white/50 text-[14px] mb-4">
            De nouvelles leçons sont ajoutées régulièrement. Abonnez-vous à la newsletter pour être informé.
          </p>
          <Link
            href="/#newsletter"
            className="inline-flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-lg text-[14px] font-medium hover:bg-white/90 transition-colors"
          >
            S&apos;inscrire à la newsletter
          </Link>
        </div>
      </div>
    </div>
  );
}
