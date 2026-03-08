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
  { id: '2', name: 'USD/XOF', value: 602.45, change: -1.34, changePercent: -0.22, type: 'currency', symbol: 'USD/XOF', description: 'Taux de change du dollar américain contre le franc CFA. Varie en fonction du cours EUR/USD car le XOF est arrimé à l\'euro.', educationLink: '/education/devises-change' },
  { id: '3', name: 'Or (once)', value: 2625.80, change: 15.40, changePercent: 0.59, type: 'commodity', symbol: 'XAU', description: 'Cours de l\'once d\'or (31,1 g) sur les marchés internationaux. Valeur refuge par excellence, l\'or est aussi une ressource minière clé pour le Niger.', educationLink: '/education/matieres-premieres' },
  { id: '4', name: 'Pétrole Brent', value: 82.45, change: -0.87, changePercent: -1.04, type: 'commodity', symbol: 'BRENT', description: 'Référence mondiale du prix du pétrole brut. Impacte directement le coût de l\'énergie et des transports au Niger et dans la sous-région.', educationLink: '/education/matieres-premieres' },
  { id: '5', name: 'BRVM Composite', value: 234.56, change: 2.34, changePercent: 1.01, type: 'index', symbol: 'BRVMC', description: 'Indice principal de la Bourse Régionale des Valeurs Mobilières d\'Abidjan, regroupant toutes les sociétés cotées de l\'UEMOA.', educationLink: '/education/bourse-marches' },
  { id: '6', name: 'Uranium (lb)', value: 89.50, change: 1.25, changePercent: 1.42, type: 'commodity', symbol: 'U3O8', description: 'Prix de la livre d\'uranium (U₃O₈). Ressource stratégique du Niger, premier producteur africain, essentielle pour l\'industrie nucléaire mondiale.', educationLink: '/education/matieres-premieres' },
];

export const fallbackImageUrl = 'https://images.unsplash.com/photo-1658402834565-80bf66bda0f0?w=1200&h=600&fit=crop';
