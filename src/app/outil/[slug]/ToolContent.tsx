'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft, Calculator, Percent, DollarSign, BarChart3, TrendingUp, Wallet, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

const Spinner = () => <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;

const SimulateurEmprunt = dynamic(() => import('@/components/tools/SimulateurEmprunt').then(m => ({ default: m.SimulateurEmprunt })), { loading: Spinner });
const InteretSimple = dynamic(() => import('@/components/tools/InteretSimple').then(m => ({ default: m.InteretSimple })), { loading: Spinner });
const SimulateurSalaire = dynamic(() => import('@/components/tools/SimulateurSalaire').then(m => ({ default: m.SimulateurSalaire })), { loading: Spinner });
const IndicesEconomiques = dynamic(() => import('@/components/tools/IndicesEconomiques').then(m => ({ default: m.IndicesEconomiques })), { loading: Spinner });
const InteretCompose = dynamic(() => import('@/components/tools/InteretCompose').then(m => ({ default: m.InteretCompose })), { loading: Spinner });
const BudgetFamilial = dynamic(() => import('@/components/tools/BudgetFamilial').then(m => ({ default: m.BudgetFamilial })), { loading: Spinner });

interface ToolContentProps {
  slug: string;
  title: string;
  description: string;
  isPremium: boolean;
}

const toolComponents: Record<string, React.ComponentType> = {
  'simulateur-emprunt': SimulateurEmprunt,
  'interet-simple': InteretSimple,
  'simulateur-salaire': SimulateurSalaire,
  'indices-economiques': IndicesEconomiques,
  'interet-compose': InteretCompose,
  'budget-familial': BudgetFamilial,
};

const toolIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'simulateur-emprunt': Calculator,
  'interet-simple': Percent,
  'simulateur-salaire': DollarSign,
  'indices-economiques': BarChart3,
  'interet-compose': TrendingUp,
  'budget-familial': Wallet,
};

/* ─── Contenu éducatif par outil ─── */
const toolEducation: Record<string, { sections: { heading: string; body: string }[] }> = {
  'interet-compose': {
    sections: [
      {
        heading: 'Comment fonctionnent les intérêts composés ?',
        body: `Les intérêts composés représentent l'un des concepts les plus puissants en finance. Contrairement aux intérêts simples, ils calculent les intérêts non seulement sur le capital initial, mais aussi sur les intérêts déjà accumulés, créant ainsi une croissance exponentielle.

La formule des intérêts composés s'exprime ainsi :

**Vf = Vi × (1 + ρ/n)^(n × t)**

Dans cette formule :
- **Vf** est la valeur future de l'investissement
- **Vi** représente la valeur initiale (le capital de départ)
- **ρ** (rho) est le taux d'intérêt annuel (exprimé en décimal : 5% = 0,05)
- **n** est le nombre de fois que l'intérêt est composé par an
- **t** est la durée en années

C'est ce mécanisme qui fait dire qu'Albert Einstein aurait qualifié les intérêts composés de « huitième merveille du monde ». Plus la durée est longue, plus l'effet de composition est spectaculaire.`,
      },
      {
        heading: 'Comment utiliser ce simulateur ?',
        body: `Renseignez votre capital initial, puis indiquez le montant que vous prévoyez d'épargner chaque mois. Choisissez votre horizon de placement en années et le taux d'intérêt annuel attendu.

Le simulateur calcule la croissance de votre capital en tenant compte des versements réguliers et de la capitalisation des intérêts. Vous obtenez une estimation du capital final que vous pourriez accumuler.

C'est un outil idéal pour planifier vos investissements à long terme, que ce soit dans des actifs boursiers, de l'immobilier, des cryptomonnaies ou des livrets d'épargne. Pour établir un plan d'épargne réaliste, utilisez aussi notre outil de budget familial.`,
      },
    ],
  },
  'interet-simple': {
    sections: [
      {
        heading: 'Comment fonctionnent les intérêts simples ?',
        body: `L'intérêt simple est le mode de calcul le plus élémentaire en finance. Les intérêts sont calculés uniquement sur le capital initial, sans tenir compte des intérêts déjà accumulés.

La formule est :

**I = C × t × n**

Où :
- **I** est le montant des intérêts
- **C** est le capital initial
- **t** est le taux d'intérêt par période (en décimal)
- **n** est le nombre de périodes

Le montant total à l'échéance est donc : **M = C + I = C × (1 + t × n)**`,
      },
      {
        heading: 'Quelle différence avec les intérêts composés ?',
        body: `Avec les intérêts simples, le montant des intérêts est identique chaque période puisqu'il est toujours calculé sur le même capital de départ. Avec les intérêts composés, les intérêts de chaque période s'ajoutent au capital et génèrent eux-mêmes des intérêts.

**Exemple concret** : 1 000 000 F CFA placés à 5% pendant 10 ans :
- En intérêts simples : 1 500 000 F CFA (gain de 500 000 F CFA)
- En intérêts composés : 1 628 895 F CFA (gain de 628 895 F CFA)

Les intérêts simples sont courants pour les prêts à court terme, les découverts bancaires et certains bons du Trésor. Pour un placement long terme, les intérêts composés sont toujours plus avantageux pour l'épargnant.`,
      },
      {
        heading: 'Comment utiliser ce simulateur ?',
        body: `Saisissez votre capital initial, le taux d'intérêt annuel et la durée du placement. Le simulateur calcule instantanément le montant des intérêts et la valeur totale à l'échéance.

Utilisez cet outil pour comparer les offres de placement à court terme ou évaluer le coût réel d'un emprunt à intérêts simples avant de vous engager.`,
      },
    ],
  },
  'simulateur-salaire': {
    sections: [
      {
        heading: 'Comment fonctionne l\'ITS au Niger ?',
        body: `L'Impôt sur les Traitements et Salaires (ITS) est un impôt progressif prélevé directement sur le salaire des employés au Niger. Il est régi par le Code Général des Impôts (Loi N°2012-37) et mis à jour par les lois de finances annuelles.

Le calcul suit ces étapes :
1. **Salaire brut** : votre rémunération totale avant déductions
2. **Cotisations sociales** : CNSS (3,6% plafonné à 500 000 F CFA) et INAM (2,5% sans plafond)
3. **Abattement forfaitaire** de 20% pour frais professionnels présumés
4. **Application du barème progressif** à 9 tranches (de 1% à 35%)
5. **Abattement pour charges de famille** selon le nombre de personnes à charge`,
      },
      {
        heading: 'Le barème ITS 2026',
        body: `Le barème progressif de l'ITS (Art. 150 nouveau, Ordonnance N°2025-44) comporte 9 tranches mensuelles :

- **0 à 25 000 F CFA** : 1%
- **25 001 à 50 000 F CFA** : 2%
- **50 001 à 100 000 F CFA** : 6%
- **100 001 à 150 000 F CFA** : 13%
- **150 001 à 300 000 F CFA** : 25%
- **300 001 à 400 000 F CFA** : 30%
- **400 001 à 700 000 F CFA** : 32%
- **700 001 à 1 000 000 F CFA** : 34%
- **Au-delà de 1 000 000 F CFA** : 35%

Chaque tranche n'est imposée qu'au taux correspondant. Par exemple, un salarié dont la base imposable est de 200 000 F CFA ne paiera pas 25% sur la totalité, mais 1% sur les 25 000 premiers francs, puis 2%, puis 6%, et ainsi de suite.`,
      },
      {
        heading: 'Les charges de famille (LF 2026)',
        body: `La Loi de Finances 2026 a revalorisé les taux d'abattement pour charges de famille, réduisant l'ITS pour les salariés ayant des personnes à charge :

- **0 charge** : 0% d'abattement
- **1 charge** : 7% (anciennement 5%)
- **2 charges** : 12% (anciennement 10%)
- **3 charges** : 17% (anciennement 12%)
- **4 charges** : 22% (anciennement 13%)
- **5 charges** : 25% (anciennement 14%)
- **6 charges** : 27% (anciennement 15%)
- **7 charges** : 30% (inchangé)

Sont considérées comme personnes à charge : le conjoint sans revenu et les enfants (mineurs, ou jusqu'à 25 ans s'ils poursuivent leurs études), dans la limite de 7 personnes par ménage.`,
      },
    ],
  },
  'simulateur-emprunt': {
    sections: [
      {
        heading: 'Comment fonctionne un emprunt à mensualités constantes ?',
        body: `La plupart des prêts bancaires au Niger et en zone UEMOA fonctionnent avec des mensualités constantes (amortissement français). Chaque mois, vous payez le même montant, mais la répartition entre capital et intérêts évolue :

- **Au début** : la part des intérêts est élevée et celle du capital remboursé est faible
- **À la fin** : c'est l'inverse, vous remboursez principalement du capital

La formule de la mensualité est :

**M = C × (t / (1 - (1 + t)^(-n)))**

Où :
- **M** est la mensualité
- **C** est le capital emprunté
- **t** est le taux d'intérêt mensuel (taux annuel ÷ 12)
- **n** est le nombre total de mensualités`,
      },
      {
        heading: 'Comprendre le coût total d\'un emprunt',
        body: `Le coût total d'un emprunt ne se limite pas au montant emprunté. Il inclut l'ensemble des intérêts versés sur toute la durée du prêt. Plus la durée est longue, plus les intérêts cumulés sont importants.

**Exemple** : un emprunt de 5 000 000 F CFA à 8% sur 5 ans coûte environ 1 066 000 F CFA d'intérêts. Le même emprunt sur 10 ans coûterait environ 2 280 000 F CFA d'intérêts, soit plus du double.

C'est pourquoi il est souvent préférable de choisir la durée la plus courte que votre budget peut supporter. Utilisez ce simulateur pour trouver le bon équilibre entre mensualité supportable et coût total maîtrisé.`,
      },
      {
        heading: 'Comment utiliser ce simulateur ?',
        body: `Renseignez le montant de l'emprunt, le taux d'intérêt annuel et la durée souhaitée. Le simulateur calcule automatiquement la mensualité, le coût total des intérêts et génère un tableau d'amortissement détaillé.

Comparez différents scénarios en modifiant la durée ou le taux pour optimiser votre emprunt avant de vous rendre à la banque.`,
      },
    ],
  },
  'budget-familial': {
    sections: [
      {
        heading: 'Pourquoi établir un budget familial ?',
        body: `Un budget familial est un outil essentiel pour maîtriser ses finances au quotidien. Il permet de visualiser clairement ses revenus et ses dépenses, d'identifier les postes où l'on peut économiser, et de planifier ses objectifs financiers.

Au Niger, où les revenus peuvent être irréguliers et les dépenses familiales importantes (scolarité, santé, alimentation, cérémonies), un budget structuré aide à :
- **Anticiper** les dépenses prévisibles (rentrée scolaire, Ramadan, Tabaski)
- **Constituer une épargne** de précaution
- **Éviter le surendettement**
- **Prendre des décisions financières éclairées**`,
      },
      {
        heading: 'La méthode 50/30/20 adaptée au Niger',
        body: `La règle 50/30/20 est un cadre simple pour répartir ses revenus :

- **50% pour les besoins essentiels** : loyer, alimentation, transport, santé, scolarité des enfants
- **30% pour les dépenses personnelles** : habillement, télécommunications, loisirs, cérémonies
- **20% pour l'épargne et le remboursement de dettes** : tontine, épargne CNSS, remboursement de prêts

Ces pourcentages sont indicatifs et doivent être adaptés à votre situation. Dans le contexte nigérien, les besoins essentiels peuvent représenter plus de 50% du budget, surtout pour les ménages à revenus modestes. L'important est de commencer à épargner, même un petit montant régulier.`,
      },
      {
        heading: 'Comment utiliser ce simulateur ?',
        body: `Renseignez vos revenus mensuels et détaillez vos différents postes de dépenses. Le simulateur calcule automatiquement votre solde, visualise la répartition de vos dépenses et vous fournit des conseils personnalisés.

Vous pouvez exporter votre budget en PDF pour le conserver ou le partager avec votre conjoint. Revisitez votre budget chaque mois pour l'ajuster à la réalité de vos dépenses.`,
      },
    ],
  },
  'indices-economiques': {
    sections: [
      {
        heading: 'Comprendre les indicateurs économiques',
        body: `Les indicateurs économiques sont des données statistiques qui permettent de mesurer la santé économique d'un pays ou d'une région. Ils sont essentiels pour les investisseurs, les entrepreneurs et les citoyens qui souhaitent comprendre l'environnement économique dans lequel ils évoluent.

Les principaux indicateurs suivis pour le Niger et la zone UEMOA :

- **PIB (Produit Intérieur Brut)** : mesure la richesse totale produite par un pays sur une année. La croissance du PIB indique si l'économie se développe ou se contracte
- **Inflation** : mesure la hausse générale des prix. Une inflation modérée (2-3%) est normale, mais une inflation élevée érode le pouvoir d'achat
- **Taux de change** : le F CFA est arrimé à l'euro (1 EUR = 655,957 F CFA), mais les taux avec le dollar et d'autres devises fluctuent
- **Balance commerciale** : différence entre les exportations et les importations du pays`,
      },
      {
        heading: 'Le Niger dans la zone UEMOA',
        body: `Le Niger fait partie de l'Union Économique et Monétaire Ouest-Africaine (UEMOA) qui regroupe 8 pays partageant le franc CFA. Cette intégration monétaire implique :

- **Une politique monétaire commune** gérée par la BCEAO (Banque Centrale des États de l'Afrique de l'Ouest)
- **Un taux de change fixe** avec l'euro, garantissant la stabilité monétaire
- **Des critères de convergence** que chaque pays membre doit respecter (déficit budgétaire, dette publique, inflation)

L'économie nigérienne repose principalement sur l'agriculture (40% du PIB), l'extraction minière (uranium, or, pétrole) et les services. Suivre ces indicateurs vous aide à anticiper les tendances et à prendre de meilleures décisions financières.`,
      },
      {
        heading: 'Comment utiliser cet outil ?',
        body: `Cet outil agrège les données économiques de sources officielles (Banque Mondiale, FMI, BCEAO) et les présente de manière claire et actualisée. Consultez les différents indicateurs pour suivre l'évolution de l'économie nigérienne et régionale.

Les données sont mises à jour régulièrement pour refléter les dernières publications statistiques disponibles.`,
      },
    ],
  },
};

export function ToolContent({ slug, title, description, isPremium }: ToolContentProps) {
  const { isSignedIn, userRole } = useAuth();
  const ToolComponent = toolComponents[slug];
  const Icon = toolIcons[slug] || Calculator;
  const education = toolEducation[slug];
  const canAccess = !isPremium || (isSignedIn && (userRole === 'premium' || userRole === 'admin'));
  const needsGate = !canAccess;

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-[#111] text-white py-10 md:py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/#outils" className="inline-flex items-center gap-1.5 text-[13px] text-white/70 hover:text-white/70 transition-colors mb-6"><ArrowLeft className="w-4 h-4" />Retour aux outils</Link>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/8 rounded-xl flex items-center justify-center"><Icon className="w-6 h-6 text-white/70" /></div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{title}</h1>
                {isPremium && <span className="text-[10px] bg-white/10 text-white/60 px-2.5 py-1 rounded-full tracking-wider uppercase">Premium</span>}
              </div>
              <p className="text-white/70 text-[14px] mt-1">{description}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 md:py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {needsGate ? (
            <div className="text-center py-20 bg-white border border-black/6 rounded-xl">
              <Lock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-3">Outil Premium</h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {isSignedIn
                  ? 'Débloquez les outils premium avec l\'abonnement Premium.'
                  : 'Connectez-vous et abonnez-vous pour accéder à cet outil professionnel.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {!isSignedIn && (
                  <Link href="/connexion" className="bg-[#111] text-white px-8 py-3 rounded-lg hover:bg-[#333] transition-colors text-[14px]">Se connecter</Link>
                )}
                <Link href="/pricing" className="bg-[#111] text-white px-8 py-3 rounded-lg hover:bg-[#333] transition-colors text-[14px]">Voir les abonnements</Link>
              </div>
            </div>
          ) : ToolComponent ? <ToolComponent /> : null}
        </div>
      </section>

      {/* ─── Contenu éducatif ─── */}
      {education && (
        <section className="pb-10 md:pb-14">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white border border-black/6 rounded-xl divide-y divide-black/6">
              {education.sections.map((sec, i) => (
                <div key={i} className="px-6 sm:px-8 py-8">
                  <h2 className="text-xl font-bold text-[#111] mb-4">{sec.heading}</h2>
                  <div className="text-[15px] text-[#374151] leading-[1.8] whitespace-pre-line [&>p]:mb-4 text-justify hyphens-auto">
                    {sec.body.split('\n\n').map((paragraph, j) => (
                      <p key={j}>
                        {paragraph.split(/(\*\*[^*]+\*\*)/).map((part, k) =>
                          part.startsWith('**') && part.endsWith('**')
                            ? <strong key={k} className="font-semibold text-[#111]">{part.slice(2, -2)}</strong>
                            : <span key={k}>{part}</span>
                        )}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
