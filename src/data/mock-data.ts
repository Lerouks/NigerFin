import type { Article, MarketData, NavigationSection } from '../types';

// Données de navigation
export const navigationSections: NavigationSection[] = [
  { id: '1', label: 'Économie', path: '/economie', order: 1 },
  { id: '2', label: 'Finance', path: '/finance', order: 2 },
  { id: '3', label: 'Marchés', path: '/marches', order: 3 },
  { id: '4', label: 'Entreprises', path: '/entreprises', order: 4 },
  { id: '5', label: 'Éducation', path: '/education', order: 5 },
  { id: '6', label: 'Outils', path: '/outils', order: 6 },
];

// Données de marchés (UEMOA, devises, matières premières)
export const marketData: MarketData[] = [
  {
    id: '1',
    name: 'EUR/XOF',
    value: 655.957,
    change: 0.12,
    changePercent: 0.018,
    type: 'currency',
    symbol: 'EUR/XOF',
  },
  {
    id: '2',
    name: 'USD/XOF',
    value: 602.45,
    change: -1.34,
    changePercent: -0.22,
    type: 'currency',
    symbol: 'USD/XOF',
  },
  {
    id: '3',
    name: 'Or (once)',
    value: 2625.80,
    change: 15.40,
    changePercent: 0.59,
    type: 'commodity',
    symbol: 'XAU',
  },
  {
    id: '4',
    name: 'Pétrole Brent',
    value: 82.45,
    change: -0.87,
    changePercent: -1.04,
    type: 'commodity',
    symbol: 'BRENT',
  },
  {
    id: '5',
    name: 'BRVM Composite',
    value: 234.56,
    change: 2.34,
    changePercent: 1.01,
    type: 'index',
    symbol: 'BRVMC',
  },
  {
    id: '6',
    name: 'Uranium (lb)',
    value: 89.50,
    change: 1.25,
    changePercent: 1.42,
    type: 'commodity',
    symbol: 'U3O8',
  },
];

// Articles mockés avec Portable Text
export const articles: Article[] = [
  {
    id: '1',
    slug: 'niger-budget-2026-priorites-secteur-minier',
    title: 'Budget 2026 : Le Niger mise sur le secteur minier pour stimuler la croissance',
    subtitle: 'Une augmentation de 18% des investissements dans l\'extraction d\'uranium',
    excerpt: 'Le gouvernement nigérien a dévoilé son budget 2026 avec un focus particulier sur l\'exploitation minière, notamment l\'uranium qui représente 70% des exportations du pays.',
    category: 'Économie',
    author: {
      name: 'Aminata Diallo',
      avatar: 'https://images.unsplash.com/photo-1765648684630-ac9c15ac98d5?w=100&h=100&fit=crop',
    },
    publishedAt: '2026-03-04T09:30:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1658402834565-80bf66bda0f0?w=1200&h=600&fit=crop',
    content: [
      {
        _type: 'block',
        _key: 'b1',
        style: 'normal',
        children: [
          {
            _type: 'span',
            _key: 's1',
            text: 'Le ministre de l\'Économie et des Finances a présenté ce mercredi le projet de budget 2026, marqué par une orientation stratégique vers le secteur minier. Cette décision intervient dans un contexte de forte demande mondiale en uranium.',
            marks: [],
          },
        ],
      },
      {
        _type: 'block',
        _key: 'b2',
        style: 'h2',
        children: [
          {
            _type: 'span',
            _key: 's2',
            text: 'Des investissements massifs dans l\'infrastructure minière',
            marks: [],
          },
        ],
      },
      {
        _type: 'block',
        _key: 'b3',
        style: 'normal',
        children: [
          {
            _type: 'span',
            _key: 's3',
            text: 'Le budget alloue 450 milliards de FCFA au développement du secteur minier, représentant une hausse de 18% par rapport à 2025. Ces fonds seront principalement destinés à :',
            marks: [],
          },
        ],
      },
      {
        _type: 'block',
        _key: 'b4',
        style: 'normal',
        listItem: 'bullet',
        children: [
          {
            _type: 'span',
            _key: 's4',
            text: 'Modernisation des infrastructures d\'extraction',
            marks: [],
          },
        ],
      },
      {
        _type: 'block',
        _key: 'b5',
        style: 'normal',
        listItem: 'bullet',
        children: [
          {
            _type: 'span',
            _key: 's5',
            text: 'Formation de 2,000 techniciens spécialisés',
            marks: [],
          },
        ],
      },
      {
        _type: 'block',
        _key: 'b6',
        style: 'normal',
        listItem: 'bullet',
        children: [
          {
            _type: 'span',
            _key: 's6',
            text: 'Amélioration de la sécurité sur les sites',
            marks: [],
          },
        ],
      },
      {
        _type: 'block',
        _key: 'b7',
        style: 'normal',
        children: [
          {
            _type: 'span',
            _key: 's7',
            text: 'Cette stratégie vise à positionner le Niger comme un acteur incontournable du marché mondial de l\'uranium, particulièrement dans le contexte de la transition énergétique mondiale.',
            marks: ['strong'],
          },
        ],
      },
    ],
    isPremium: false,
    views: 12845,
    readTime: 5,
    tags: ['Budget', 'Secteur minier', 'Uranium', 'Économie'],
  },
  {
    id: '2',
    slug: 'brvm-performances-exceptionnelles-q1-2026',
    title: 'La BRVM enregistre des performances exceptionnelles au premier trimestre 2026',
    excerpt: 'L\'indice composite de la Bourse Régionale des Valeurs Mobilières affiche une hausse de 12,3% depuis janvier.',
    category: 'Finance',
    author: {
      name: 'Moussa Ibrahim',
      avatar: 'https://images.unsplash.com/photo-1765648684630-ac9c15ac98d5?w=100&h=100&fit=crop',
    },
    publishedAt: '2026-03-03T14:20:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1767424196045-030bbde122a4?w=1200&h=600&fit=crop',
    content: [
      {
        _type: 'block',
        _key: 'c1',
        style: 'normal',
        children: [
          {
            _type: 'span',
            _key: 'cs1',
            text: 'La Bourse Régionale des Valeurs Mobilières (BRVM) confirme sa dynamique haussière avec une performance remarquable au premier trimestre 2026.',
            marks: [],
          },
        ],
      },
    ],
    isPremium: true,
    views: 8234,
    readTime: 6,
    tags: ['BRVM', 'Bourse', 'Investissement', 'UEMOA'],
  },
  {
    id: '3',
    slug: 'fintech-niger-revolution-mobile-money',
    title: 'Les fintechs nigériennes révolutionnent les paiements mobiles',
    excerpt: 'Le mobile money connaît une croissance de 45% en 2025, transformant l\'inclusion financière au Niger.',
    category: 'Éducation',
    author: {
      name: 'Fatoumata Sow',
      avatar: 'https://images.unsplash.com/photo-1765648684630-ac9c15ac98d5?w=100&h=100&fit=crop',
    },
    publishedAt: '2026-03-02T11:15:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1739269552506-377309b10c7c?w=1200&h=600&fit=crop',
    content: [
      {
        _type: 'block',
        _key: 'd1',
        style: 'normal',
        children: [
          {
            _type: 'span',
            _key: 'ds1',
            text: 'Le secteur fintech nigérien connaît une expansion sans précédent, porté par l\'adoption massive du mobile money dans les zones rurales.',
            marks: [],
          },
        ],
      },
    ],
    isPremium: false,
    views: 15672,
    readTime: 4,
    tags: ['Fintech', 'Mobile Money', 'Innovation', 'Inclusion financière'],
  },
  {
    id: '4',
    slug: 'outils-numeriques-niger-gestion-financiere',
    title: 'Outils numériques : Le Niger adopte de nouvelles solutions de gestion financière',
    excerpt: 'Les entreprises nigériennes se tournent vers les outils numériques pour optimiser leur gestion comptable et financière.',
    category: 'Outils',
    author: {
      name: 'Issoufou Maman',
      avatar: 'https://images.unsplash.com/photo-1765648684630-ac9c15ac98d5?w=100&h=100&fit=crop',
    },
    publishedAt: '2026-03-01T08:45:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1618265317491-8b7b2324320e?w=1200&h=600&fit=crop',
    content: [
      {
        _type: 'block',
        _key: 'e1',
        style: 'normal',
        children: [
          {
            _type: 'span',
            _key: 'es1',
            text: 'Les outils numériques de gestion financière connaissent une adoption rapide au Niger, facilitant la comptabilité et le suivi des performances économiques des PME.',
            marks: [],
          },
        ],
      },
    ],
    isPremium: false,
    views: 9456,
    readTime: 5,
    tags: ['Outils', 'Numérique', 'Gestion', 'PME'],
  },
  {
    id: '5',
    slug: 'crypto-adoption-afrique-ouest-niger-pionnier',
    title: 'Le Niger, pionnier de l\'adoption des cryptomonnaies en Afrique de l\'Ouest',
    excerpt: 'Une étude révèle que 28% des jeunes nigériens utilisent des cryptomonnaies pour les transferts d\'argent.',
    category: 'Finance',
    author: {
      name: 'Aïcha Mahamadou',
      avatar: 'https://images.unsplash.com/photo-1765648684630-ac9c15ac98d5?w=100&h=100&fit=crop',
    },
    publishedAt: '2026-02-28T16:30:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1744473331990-0e5024953832?w=1200&h=600&fit=crop',
    content: [
      {
        _type: 'block',
        _key: 'f1',
        style: 'normal',
        children: [
          {
            _type: 'span',
            _key: 'fs1',
            text: 'Les cryptomonnaies gagnent du terrain au Niger, particulièrement auprès des jeunes entrepreneurs et de la diaspora.',
            marks: [],
          },
        ],
      },
    ],
    isPremium: true,
    views: 11234,
    readTime: 7,
    tags: ['Crypto', 'Bitcoin', 'Blockchain', 'Innovation'],
  },
];

// Commentaires mockés
export const mockComments = [
  {
    id: '1',
    articleId: '1',
    userId: 'user1',
    userName: 'Amadou Tanko',
    content: 'Excellente analyse ! Le secteur minier est vraiment crucial pour notre économie.',
    createdAt: '2026-03-04T10:15:00Z',
    likes: 12,
    isLiked: false,
  },
  {
    id: '2',
    articleId: '1',
    userId: 'user2',
    userName: 'Mariama Souley',
    content: 'J\'espère que ces investissements profiteront aussi aux populations locales.',
    createdAt: '2026-03-04T11:30:00Z',
    likes: 8,
    isLiked: false,
  },
];