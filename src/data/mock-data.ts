import type { NavigationSection } from '@/types';

export const navigationSections: NavigationSection[] = [
  { id: '1', label: 'Économie', path: '/economie', order: 1 },
  { id: '2', label: 'Finance', path: '/finance', order: 2 },
  { id: '3', label: 'Marchés', path: '/marches', order: 3 },
  { id: '4', label: 'Entreprises', path: '/entreprises', order: 4 },
  { id: '5', label: 'Niger', path: '/niger', order: 5 },
  { id: '6', label: 'Éducation', path: '/education', order: 6 },
  { id: '7', label: 'Outils', path: '/outils', order: 7 },
];

export const fallbackImageUrl = 'https://images.unsplash.com/photo-1658402834565-80bf66bda0f0?w=1920&h=960&fit=crop&q=90';
