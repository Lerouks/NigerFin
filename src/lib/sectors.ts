import {
  Building2,
  Pickaxe,
  Zap,
  Phone,
  Landmark,
  Wheat,
  Truck,
  HardHat,
  Fuel,
  type LucideIcon,
} from 'lucide-react';

/**
 * Source de verite des secteurs d'entreprises strategiques du Niger.
 * Une seule definition par secteur, utilisee par :
 * - StrategicEnterprisesSection (listing /entreprises)
 * - EnterpriseContent (page detail /entreprises/[slug])
 *
 * Chaque secteur expose une couleur primaire (accents sur fond clair) et
 * une variante claire (accents sur fond fonce, ex : header noir page detail).
 * Couleurs choisies pour passer WCAG AA en texte sur fond blanc et rester
 * lisibles en accent sur fond #111.
 */
export interface Sector {
  key: string;
  label: string;
  icon: LucideIcon;
  hex: string;
  hexLight: string;
}

const SECTORS: Sector[] = [
  {
    key: 'mines',
    label: 'Mines & Ressources',
    icon: Pickaxe,
    hex: '#2563EB',
    hexLight: '#60A5FA',
  },
  {
    key: 'petrole',
    label: 'Pétrole & Énergie',
    icon: Fuel,
    hex: '#B45309',
    hexLight: '#FBBF24',
  },
  {
    key: 'electricite',
    label: 'Électricité & Énergie',
    icon: Zap,
    hex: '#CA8A04',
    hexLight: '#FACC15',
  },
  {
    key: 'telecoms',
    label: 'Télécommunications',
    icon: Phone,
    hex: '#7C3AED',
    hexLight: '#A78BFA',
  },
  {
    key: 'banque',
    label: 'Banque & Finance',
    icon: Landmark,
    hex: '#0F766E',
    hexLight: '#2DD4BF',
  },
  {
    key: 'agriculture',
    label: 'Agriculture & Agroalimentaire',
    icon: Wheat,
    hex: '#65A30D',
    hexLight: '#A3E635',
  },
  {
    key: 'transport',
    label: 'Transport & Logistique',
    icon: Truck,
    hex: '#C2410C',
    hexLight: '#FB923C',
  },
  {
    key: 'btp',
    label: 'BTP & Infrastructures',
    icon: HardHat,
    hex: '#525252',
    hexLight: '#A3A3A3',
  },
];

const SECTOR_BY_LABEL: Record<string, Sector> = SECTORS.reduce(
  (acc, sector) => {
    acc[sector.label] = sector;
    return acc;
  },
  {} as Record<string, Sector>
);

const FALLBACK_SECTOR: Sector = {
  key: 'other',
  label: 'Autre',
  icon: Building2,
  hex: '#525252',
  hexLight: '#A3A3A3',
};

export function getSector(label: string | null | undefined): Sector {
  if (!label) return FALLBACK_SECTOR;
  return SECTOR_BY_LABEL[label] || FALLBACK_SECTOR;
}

export function getSectorIcon(label: string | null | undefined): LucideIcon {
  return getSector(label).icon;
}

export function getSectorColor(label: string | null | undefined): string {
  return getSector(label).hex;
}

export function getSectorColorLight(label: string | null | undefined): string {
  return getSector(label).hexLight;
}

export { SECTORS };
