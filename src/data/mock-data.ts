import type { Article, MarketData, NavigationSection } from '@/types';

export const navigationSections: NavigationSection[] = [
  { id: '1', label: 'Économie', path: '/economie', order: 1 },
  { id: '2', label: 'Finance', path: '/finance', order: 2 },
  { id: '3', label: 'Marchés', path: '/marches', order: 3 },
  { id: '4', label: 'Entreprises', path: '/entreprises', order: 4 },
  { id: '5', label: 'Éducation', path: '/education', order: 5 },
  { id: '6', label: 'Outils', path: '/outils', order: 6 },
];

export const marketData: MarketData[] = [
  { id: '1', name: 'EUR/XOF', value: 655.957, change: 0.12, changePercent: 0.018, type: 'currency', symbol: 'EUR/XOF' },
  { id: '2', name: 'USD/XOF', value: 602.45, change: -1.34, changePercent: -0.22, type: 'currency', symbol: 'USD/XOF' },
  { id: '3', name: 'Or (once)', value: 2625.80, change: 15.40, changePercent: 0.59, type: 'commodity', symbol: 'XAU' },
  { id: '4', name: 'Pétrole Brent', value: 82.45, change: -0.87, changePercent: -1.04, type: 'commodity', symbol: 'BRENT' },
  { id: '5', name: 'BRVM Composite', value: 234.56, change: 2.34, changePercent: 1.01, type: 'index', symbol: 'BRVMC' },
  { id: '6', name: 'Uranium (lb)', value: 89.50, change: 1.25, changePercent: 1.42, type: 'commodity', symbol: 'U3O8' },
];

export const mockArticles: Article[] = [
  {
    _id: '1',
    slug: { current: 'niger-budget-2026-priorites-secteur-minier' },
    title: 'Budget 2026 : Le Niger mise sur le secteur minier pour stimuler la croissance',
    subtitle: "Une augmentation de 18% des investissements dans l'extraction d'uranium",
    excerpt: "Le gouvernement nigérien a dévoilé son budget 2026 avec un focus particulier sur l'exploitation minière, notamment l'uranium qui représente 70% des exportations du pays.",
    category: 'Économie',
    author: { name: 'Aminata Diallo' },
    publishedAt: '2026-03-04T09:30:00Z',
    mainImage: null,
    body: [
      { _type: 'block', _key: 'b1', style: 'normal', children: [{ _type: 'span', _key: 's1', text: "Le ministre de l'Économie et des Finances a présenté ce mercredi le projet de budget 2026, marqué par une orientation stratégique vers le secteur minier.", marks: [] }] },
      { _type: 'block', _key: 'b2', style: 'h2', children: [{ _type: 'span', _key: 's2', text: "Des investissements massifs dans l'infrastructure minière", marks: [] }] },
      { _type: 'block', _key: 'b3', style: 'normal', children: [{ _type: 'span', _key: 's3', text: 'Le budget alloue 450 milliards de FCFA au développement du secteur minier, représentant une hausse de 18% par rapport à 2025.', marks: [] }] },
    ],
    isPremium: false,
    readTime: 5,
    tags: ['Budget', 'Secteur minier', 'Uranium', 'Économie'],
  },
  {
    _id: '2',
    slug: { current: 'brvm-performances-exceptionnelles-q1-2026' },
    title: 'La BRVM enregistre des performances exceptionnelles au premier trimestre 2026',
    excerpt: "L'indice composite de la Bourse Régionale des Valeurs Mobilières affiche une hausse de 12,3% depuis janvier.",
    category: 'Finance',
    author: { name: 'Moussa Ibrahim' },
    publishedAt: '2026-03-03T14:20:00Z',
    mainImage: null,
    body: [
      { _type: 'block', _key: 'c1', style: 'normal', children: [{ _type: 'span', _key: 'cs1', text: 'La Bourse Régionale des Valeurs Mobilières (BRVM) confirme sa dynamique haussière avec une performance remarquable au premier trimestre 2026.', marks: [] }] },
    ],
    isPremium: true,
    readTime: 6,
    tags: ['BRVM', 'Bourse', 'Investissement', 'UEMOA'],
  },
  {
    _id: '3',
    slug: { current: 'fintech-niger-revolution-mobile-money' },
    title: 'Les fintechs nigériennes révolutionnent les paiements mobiles',
    excerpt: "Le mobile money connaît une croissance de 45% en 2025, transformant l'inclusion financière au Niger.",
    category: 'Éducation',
    author: { name: 'Fatoumata Sow' },
    publishedAt: '2026-03-02T11:15:00Z',
    mainImage: null,
    body: [
      { _type: 'block', _key: 'd1', style: 'normal', children: [{ _type: 'span', _key: 'ds1', text: "Le secteur fintech nigérien connaît une expansion sans précédent, porté par l'adoption massive du mobile money dans les zones rurales.", marks: [] }] },
    ],
    isPremium: false,
    readTime: 4,
    tags: ['Fintech', 'Mobile Money', 'Innovation', 'Inclusion financière'],
  },
  {
    _id: '4',
    slug: { current: 'outils-numeriques-niger-gestion-financiere' },
    title: 'Outils numériques : Le Niger adopte de nouvelles solutions de gestion financière',
    excerpt: 'Les entreprises nigériennes se tournent vers les outils numériques pour optimiser leur gestion comptable et financière.',
    category: 'Outils',
    author: { name: 'Issoufou Maman' },
    publishedAt: '2026-03-01T08:45:00Z',
    mainImage: null,
    body: [
      { _type: 'block', _key: 'e1', style: 'normal', children: [{ _type: 'span', _key: 'es1', text: 'Les outils numériques de gestion financière connaissent une adoption rapide au Niger.', marks: [] }] },
    ],
    isPremium: false,
    readTime: 5,
    tags: ['Outils', 'Numérique', 'Gestion', 'PME'],
  },
  {
    _id: '5',
    slug: { current: 'crypto-adoption-afrique-ouest-niger-pionnier' },
    title: "Le Niger, pionnier de l'adoption des cryptomonnaies en Afrique de l'Ouest",
    excerpt: "Une étude révèle que 28% des jeunes nigériens utilisent des cryptomonnaies pour les transferts d'argent.",
    category: 'Finance',
    author: { name: 'Aïcha Mahamadou' },
    publishedAt: '2026-02-28T16:30:00Z',
    mainImage: null,
    body: [
      { _type: 'block', _key: 'f1', style: 'normal', children: [{ _type: 'span', _key: 'fs1', text: 'Les cryptomonnaies gagnent du terrain au Niger, particulièrement auprès des jeunes entrepreneurs et de la diaspora.', marks: [] }] },
    ],
    isPremium: true,
    readTime: 7,
    tags: ['Crypto', 'Bitcoin', 'Blockchain', 'Innovation'],
  },
];

export const fallbackImageUrl = 'https://images.unsplash.com/photo-1658402834565-80bf66bda0f0?w=1200&h=600&fit=crop';

export const articleImages: Record<string, string> = {
  'niger-budget-2026-priorites-secteur-minier': 'https://images.unsplash.com/photo-1658402834565-80bf66bda0f0?w=1200&h=600&fit=crop',
  'brvm-performances-exceptionnelles-q1-2026': 'https://images.unsplash.com/photo-1767424196045-030bbde122a4?w=1200&h=600&fit=crop',
  'fintech-niger-revolution-mobile-money': 'https://images.unsplash.com/photo-1739269552506-377309b10c7c?w=1200&h=600&fit=crop',
  'outils-numeriques-niger-gestion-financiere': 'https://images.unsplash.com/photo-1618265317491-8b7b2324320e?w=1200&h=600&fit=crop',
  'crypto-adoption-afrique-ouest-niger-pionnier': 'https://images.unsplash.com/photo-1744473331990-0e5024953832?w=1200&h=600&fit=crop',
};
