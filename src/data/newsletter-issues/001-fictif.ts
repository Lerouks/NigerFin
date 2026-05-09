import type { NewsletterIssue } from '@/emails/types';
import { SITE_URL } from '@/lib/config';

/**
 * Édition n°01, calée pour un envoi "type" du lundi 11 mai 2026.
 *
 * AVERTISSEMENT IMPORTANT POUR LA RÉDACTION :
 * Avant tout envoi réel à des abonnés payants, la rédaction NFI Report
 * DOIT VÉRIFIER ET METTRE À JOUR :
 *   - Toutes les valeurs marchés (BRVM Composite, BRVM 30, USD/XOF, Or,
 *     Brent) à la clôture réelle du vendredi précédent
 *   - Les sparklines (séries 7 jours réelles)
 *   - Les chiffres KPI Niger (PIB, inflation, dette publique)
 *   - Toutes les actualités du digest (FAO, BCEAO, CNPC, ARTP)
 *   - Le texte des analyses (faits, dates, montants)
 * Sources à utiliser : sites officiels BRVM, BCEAO, FMI, INS Niger, LBMA, ICE.
 *
 * Note BCEAO : la parité EUR/XOF est fixe à 655.957. Le franc CFA UEMOA
 * suit l'euro par convention monétaire ; toute variation EUR/XOF affichée
 * différente de 0,00 % serait incorrecte.
 */

export const issue001Demo: NewsletterIssue = {
  number: 1,
  slug: '001',
  subject: 'Premium Briefing n°01, l’or du Niger sous tension, la BRVM tient le cap',
  preheader:
    'Or, BRVM, BCEAO : trois lectures pour démarrer la semaine côté finances Niger. Plus la phrase de la semaine et notre digest des marchés.',
  issueDateLabel: 'Lundi 11 mai 2026',
  readTimeMinutes: 5,
  editionType: 'standard',
  // webViewUrl will be set once the public archive (/newsletter/[slug]) is built (Sprint 4).
  // Leaving it undefined removes the "Voir dans le navigateur" link from the cover header.

  editoNote: {
    eyebrow: 'Bonjour',
    body: `<p style="margin:0 0 14px;"><strong>Vous êtes parmi nos tout premiers lecteurs Premium</strong> et c'est un honneur. Un immense merci pour votre confiance dès cette première édition. On va tout donner pour la mériter, semaine après semaine.</p>
<p style="margin:0 0 14px;">Quelques mots sur la citation ci-dessus. Schweitzer n'a pas dit "le meilleur moyen", il a dit <em>"le seul"</em>. Les mots ne convainquent personne. Ce qui transforme les autres, c'est ce qu'ils nous voient faire.</p>
<p style="margin:0 0 14px;">Une équipe ne travaille avec rigueur que si elle voit ses dirigeants la pratiquer. Des enfants n'épargnent que s'ils voient leurs parents le faire. <strong>La cohérence entre ce que l'on dit et ce que l'on fait est la seule monnaie qui compte vraiment.</strong></p>
<p style="margin:0;">Cette semaine, posons-nous la question pour chaque conseil donné : <em>est-ce que je l'applique moi-même ?</em> Bonne semaine de rigueur et de construction à tous.</p>`,
    signature: 'La rédaction NFI Report',
  },

  intro: {
    eyebrow: 'Édition n°01 · 11 mai 2026',
    heading: 'L’or sous les projecteurs, la BRVM en silence',
    paragraph:
      'Pendant que le cours de l’or atteint un nouveau record et que le pétrole consolide, la BRVM enchaîne sa quatrième séance de hausse, discrètement. On revient sur ce que ça change pour vos placements en zone UEMOA, et pourquoi le Niger reste un cas à part dans ce cycle.',
    summary: [
      { number: '01', label: 'L’or à 4 632 $ : pourquoi le Niger ne capte qu’une fraction de la rente' },
      { number: '02', label: 'BRVM : ce que la nouvelle politique BOAD change pour les PME' },
      { number: '03', label: 'Le digest de la semaine : agriculture, mobile money, BCEAO' },
    ],
  },

  market: {
    title: 'Marchés à la clôture du vendredi 8 mai',
    caption: 'Les variations sont calculées sur la séance précédente. Mini graphiques sur 7 jours.',
    // autoSync : au moment du rendu, le helper renderPremiumBriefingHtml remplace
    // automatiquement `rows` (et `source`) par les valeurs vivantes de la table
    // public.market_data (gerée depuis le dashboard admin du site). Les rows
    // ci-dessous servent uniquement de fallback si la DB est inaccessible.
    autoSync: true,
    rows: [
      { label: 'BRVM Composite', value: '280,42', unit: 'pts', changePercent: 0.45, spark: [277.1, 276.8, 278.2, 277.9, 279.3, 279.1, 280.4] },
      { label: 'BRVM 30', value: '140,18', unit: 'pts', changePercent: 0.62, spark: [137.9, 138.1, 139.0, 138.7, 139.3, 139.6, 140.2] },
      { label: 'EUR / XOF', value: '655,957', changePercent: 0, spark: [655.957, 655.957, 655.957, 655.957, 655.957, 655.957, 655.957] },
      { label: 'USD / XOF', value: '605,30', changePercent: -0.18, spark: [607.9, 607.4, 606.8, 606.2, 605.9, 605.6, 605.3] },
      { label: 'Or (once)', value: '4 632', unit: 'USD', changePercent: 1.53, spark: [4485, 4502, 4548, 4561, 4587, 4561, 4632] },
      { label: 'Brent', value: '111,28', unit: 'USD', changePercent: 0.76, spark: [108.4, 108.9, 109.6, 110.1, 109.7, 110.4, 111.3] },
    ],
    source: 'BRVM, BCEAO, LBMA, ICE Brent · données indicatives',
  },

  nigerKpi: {
    title: 'L’économie nigérienne, en un coup d’œil',
    caption: 'Trois indicateurs pour cadrer toute analyse Niger : croissance, prix, dette publique.',
    items: [
      { label: 'Croissance PIB 2026', value: '+6,2', unit: '%', delta: 'projection FMI · article IV', source: 'FMI, avril 2026' },
      { label: 'Inflation à fin mars', value: '3,1', unit: '%', delta: 'glissement annuel, en repli', source: 'INS Niger' },
      { label: 'Dette publique / PIB', value: '52,4', unit: '%', delta: '+1,6 pt vs 2025', source: 'BCEAO, mars 2026' },
    ],
  },

  headlines: [
    {
      eyebrow: 'Analyse · Industrie',
      emoji: '🪙',
      title: 'L’or grimpe, le Niger encaisse, mais combien, vraiment ?',
      whatHappening:
        'Le cours de l’once a franchi 4 632 USD vendredi, en hausse de plus de 1,5 % sur la séance et de 28 % depuis le début de l’année. Pour le Niger, troisième producteur d’or de la sous-région, c’est une bouffée d’oxygène fiscal alors que les recettes douanières restent sous tension depuis la révision du Code minier de 2025.',
      whatItMeans:
        'La rente or est mécaniquement haussière, mais elle est <strong>captée à hauteur d’environ un tiers seulement</strong> par l’État via redevances et participations. Le reste sort du pays sous forme de dividendes des opérateurs étrangers et de règlements en devises. Tant que la chaîne de valeur (raffinage, garantie, certification) reste à l’extérieur, chaque dollar de hausse profite plus à Londres qu’à Niamey.',
      whyCare:
        'Si vous épargnez en CFA, l’or à ce niveau est <strong>une protection contre l’érosion du pouvoir d’achat</strong>, pas un pari spéculatif. Mais l’exposition via un compte titres BRVM (SGI agréée) reste limitée : aucune valeur or pure n’est cotée en zone UEMOA. Les alternatives sérieuses passent par la détention physique (lingots certifiés LBMA) ou un compte international, avec les frais et la fiscalité à anticiper.',
      ctaLabel: 'Lire l’analyse complète',
      ctaUrl: `${SITE_URL}/articles`,
    },
    {
      eyebrow: 'Analyse · Marchés régionaux',
      emoji: '📈',
      title: 'BRVM : la nouvelle ligne BOAD change la donne pour les PME',
      whatHappening:
        'La Banque Ouest-Africaine de Développement a annoncé jeudi un guichet de 50 milliards de FCFA dédié au refinancement des SGI (Sociétés de Gestion et d’Intermédiation) qui accompagnent des PME en levée de fonds sur le compartiment principal et le BRVM PME. La mesure entre en vigueur le 1ᵉʳ juillet.',
      whatItMeans:
        'C’est un signal fort : la BRVM a longtemps souffert d’un compartiment PME quasi désertique (4 sociétés cotées seulement fin 2025). Avec ce levier de refinancement, les SGI peuvent <strong>réduire leur coût d’intermédiation</strong> et donc baisser le ticket d’entrée pour les PME nigériennes, ivoiriennes ou sénégalaises qui souhaitent ouvrir leur capital.',
      whyCare:
        'Pour un épargnant nigérien, ça ouvre, à terme, <strong>de nouvelles opportunités d’investir dans des entreprises sous-régionales en croissance</strong>, sans passer par les blue chips ivoiriennes ou sénégalaises traditionnelles. Mais le compartiment PME reste structurellement plus risqué : ne jamais y exposer plus de 10 % d’un portefeuille diversifié.',
      ctaLabel: 'Tous nos outils financiers',
      ctaUrl: `${SITE_URL}/outils`,
    },
  ],

  chart: {
    title: 'L\'or sur 12 mois, en USD l\'once',
    imageUrl: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=1200&q=80&auto=format&fit=crop',
    imageAlt: 'Lingots et pièces d\'or, illustration LBMA',
    caption: 'Le record des 4 632 USD vendredi dernier porte la performance YTD à +28 %. Pour la rente fiscale du Niger, chaque dollar compte.',
    source: 'LBMA, données mensuelles',
  },

  digest: {
    title: 'Ce qui a bougé cette semaine',
    items: [
      {
        emoji: '🌾',
        title: 'Saison agricole : la FAO prudente sur le mil',
        body:
          'Les premières prévisions semis 2026 du CILSS pointent un retard de 2 semaines sur le bassin arachidier, lié à une transition tardive de l’ITCZ. Impact attendu sur les prix mil/sorgho fin août.',
      },
      {
        emoji: '🏦',
        title: 'BCEAO maintient son taux directeur à 3,50 %',
        body:
          'Sans surprise, le Comité de politique monétaire a confirmé le statu quo. La gouverneure souligne que la désinflation régionale (3,1 % en mars) reste fragile face aux chocs alimentaires.',
      },
      {
        emoji: '🇨🇳',
        title: 'CNPC investit 480 M$ supplémentaires sur Agadem',
        body:
          'Annonce signée à Pékin la semaine dernière : extension du champ pétrolier d’Agadem et upgrade du pipeline export Niger-Bénin. Création annoncée de ~3 000 emplois locaux d’ici 2028.',
      },
      {
        emoji: '📱',
        title: 'Mobile money : l’ARTP veut plafonner les frais',
        body:
          'L’Autorité de Régulation des Télécommunications et de la Poste a ouvert une consultation publique jusqu’au 30 mai sur un plafonnement des commissions cash-in/cash-out. Verdict attendu avant l’été.',
      },
    ],
  },

  quote: {
    text: "L'exemple n'est pas la meilleure façon de convaincre, c'est la seule.",
    author: 'Albert Schweitzer',
    role: 'médecin, prix Nobel de la paix',
    // Visuel finalisé du post du lundi (Insta/FB) recyclé directement dans la
    // newsletter pour cohérence cross-canal. Si on retire postImageUrl, le
    // QuoteBlock retombe automatiquement sur le rendu texte + photo ronde.
    postImageUrl: `${SITE_URL}/newsletter/citation-001-schweitzer.jpeg`,
  },

  radar: {
    title: 'À garder à l’œil cette semaine',
    items: [
      {
        title: 'Calendrier BCEAO : adjudication BAT mercredi',
        hint: 'Bons du Trésor 13 et 26 semaines, indicateur clé du coût de l’argent court régional.',
        url: 'https://www.bceao.int',
      },
      {
        title: 'INS Niger : indice des prix d’avril attendu vendredi',
        hint: 'Le glissement annuel passera-t-il sous 4 % pour la première fois depuis 2024 ?',
      },
      {
        title: 'Conférence des CEO BRVM à Abidjan, jeudi',
        hint: 'Sonatel, Ecobank, Onatel : les patrons des plus grosses capi présentent leurs perspectives 2026.',
      },
    ],
  },

  toolsPromo: {
    eyebrow: 'Vos outils Premium',
    title: 'Mettez vos analyses en chiffres',
    caption: 'Trois outils inclus dans votre abonnement Premium pour passer du décryptage à la décision.',
    items: [
      {
        emoji: '💼',
        title: 'Simulateur Salaire',
        description: 'IRPP, IUTS, cotisations CNSS : du brut au net en moins de 30 secondes.',
        url: `${SITE_URL}/outil/simulateur-salaire`,
      },
      {
        emoji: '💰',
        title: 'Intérêt Composé',
        description: 'Projetez votre épargne sur 1, 5, 10 ans avec inflation BCEAO incluse.',
        url: `${SITE_URL}/outil/interet-compose`,
      },
      {
        emoji: '📊',
        title: 'Budget Familial',
        description: 'Catégorisez vos dépenses, suivez votre épargne mensuelle, ajustez en temps réel.',
        url: `${SITE_URL}/outil/budget-familial`,
      },
    ],
  },

  nextIssueLabel: 'Lundi 18 mai · 7h GMT',
};
