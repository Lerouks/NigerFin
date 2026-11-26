import {
  Banknote,
  BarChart3,
  BookOpen,
  Briefcase,
  Building2,
  Coins,
  Globe,
  GraduationCap,
  Landmark,
  LineChart,
  PiggyBank,
  Scale,
  ShieldCheck,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

/** Les icônes qu'on peut choisir pour un thème dans l'administration (damier, couverture, leçon). */
export const ICONES: Record<string, LucideIcon> = {
  BookOpen,
  TrendingUp,
  BarChart3,
  Landmark,
  Banknote,
  PiggyBank,
  LineChart,
  Wallet,
  Scale,
  ShieldCheck,
  Globe,
  Briefcase,
  Building2,
  Coins,
  GraduationCap,
};

/** L'icône d'un thème ; le livre ouvert si le nom est inconnu. Toujours décorative : le titre du thème l'accompagne. */
export function IconeTheme({ nom, className, strokeWidth = 1.5 }: { nom: string; className?: string; strokeWidth?: number }) {
  const Icone = ICONES[nom] ?? BookOpen;
  return <Icone className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
}
