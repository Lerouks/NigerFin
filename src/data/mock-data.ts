import type { MarketData, NavigationSection } from '@/types';

export const navigationSections: NavigationSection[] = [
  { id: '1', label: 'Économie', path: '/economie', order: 1 },
  { id: '2', label: 'Finance', path: '/finance', order: 2 },
  { id: '3', label: 'Marchés', path: '/marches', order: 3 },
  { id: '4', label: 'Entreprises', path: '/entreprises', order: 4 },
  { id: '5', label: 'Niger', path: '/niger', order: 5 },
  { id: '6', label: 'Éducation', path: '/education', order: 6 },
  { id: '7', label: 'Outils', path: '/outils', order: 7 },
];

export const marketData: MarketData[] = [
  { id: '1', name: 'EUR/XOF', value: 655.957, change: 0.12, changePercent: 0.018, type: 'currency', symbol: 'EUR/XOF', description: 'Taux de change fixe entre l\'euro et le franc CFA (UEMOA), garanti par la France. Référence incontournable pour le commerce extérieur de la zone UEMOA.', educationLink: '/education/devises-change' },
  { id: '2', name: 'USD/XOF', value: 567.57, change: -1.34, changePercent: -0.22, type: 'currency', symbol: 'USD/XOF', description: 'Taux de change du dollar américain contre le franc CFA. Varie en fonction du cours EUR/USD car le XOF est arrimé à l\'euro.', educationLink: '/education/devises-change' },
  { id: '3', name: 'Or (once)', value: 4676.86, change: 0, changePercent: 0, type: 'commodity', symbol: 'XAU', unit: 'USD', description: 'Cours de l\'once d\'or (31,1 g) sur les marchés internationaux. Valeur refuge par excellence, l\'or est aussi une ressource minière clé pour le Niger.', educationLink: '/education/matieres-premieres' },
  { id: '4', name: 'Pétrole brut Brent', value: 70.00, change: 0, changePercent: 0, type: 'commodity', symbol: 'ICEEUR:BRN1!', unit: 'USD/baril', description: 'Contrat futures Brent front-month (ICE Europe). Référence mondiale du prix du pétrole brut. Impacte directement le coût de l\'énergie et des transports au Niger et dans la sous-région.', educationLink: '/education/matieres-premieres' },
  { id: '5', name: 'Uranium (lb)', value: 84.00, change: 0.50, changePercent: 0.60, type: 'commodity', symbol: 'U3O8', unit: 'USD', description: 'Prix de la livre d\'uranium (U₃O₈). Ressource stratégique du Niger, premier producteur africain, essentielle pour l\'industrie nucléaire mondiale.', educationLink: '/education/matieres-premieres' },
  { id: '6', name: 'BRVM Composite', value: 417.00, change: 2.18, changePercent: 0.52, type: 'index', symbol: 'BRVMC', unit: 'PTS', description: 'Indice principal de la Bourse Régionale des Valeurs Mobilières d\'Abidjan, regroupant toutes les sociétés cotées de l\'UEMOA.', educationLink: '/education/bourse-marches' },
  { id: '7', name: 'Nasdaq Composite', value: 21578.79, change: -261.42, changePercent: -1.20, type: 'index', symbol: 'IXIC', unit: 'PTS', description: 'Indice regroupant plus de 3 000 valeurs cotées au Nasdaq, fortement orienté vers les entreprises technologiques américaines.', educationLink: '/education/bourse-marches' },
  { id: '8', name: 'S&P 500', value: 6579.00, change: 3.95, changePercent: 0.06, type: 'index', symbol: 'GSPC', unit: 'PTS', description: 'Indice regroupant les 500 plus grandes entreprises cotées aux États-Unis, pondéré par capitalisation boursière. Référence mondiale des marchés actions.', educationLink: '/education/bourse-marches' },
  { id: '9', name: 'STOXX Europe 600', value: 598.00, change: 14.60, changePercent: 2.50, type: 'index', symbol: 'SXXP', unit: 'PTS', description: 'Indice boursier européen regroupant 600 grandes, moyennes et petites capitalisations de 17 pays européens.', educationLink: '/education/bourse-marches' },
  { id: '10', name: 'Bitcoin', value: 66246.00, change: -2041.00, changePercent: -2.99, type: 'crypto', symbol: 'BTC', unit: 'USD', description: 'Première cryptomonnaie décentralisée, créée en 2009 par Satoshi Nakamoto. Référence du marché des actifs numériques avec la plus grande capitalisation.', educationLink: '/education/cryptomonnaies' },
  { id: '11', name: 'Ethereum', value: 2030.00, change: -93.00, changePercent: -4.38, type: 'crypto', symbol: 'ETH', unit: 'USD', description: 'Deuxième cryptomonnaie par capitalisation. Plateforme de contrats intelligents (smart contracts) et base de la finance décentralisée (DeFi).', educationLink: '/education/cryptomonnaies' },
];

export const fallbackImageUrl = 'https://images.unsplash.com/photo-1658402834565-80bf66bda0f0?w=1920&h=960&fit=crop&q=90';
