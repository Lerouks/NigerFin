'use client';

import { TrendingUp, TrendingDown, Minus, ArrowUp, ArrowDown } from 'lucide-react';

interface VariationBadgeProps {
  /**
   * Variation en pourcentage, ou `null` quand elle n'a pas ete mesuree.
   *
   * `null` est un etat de premiere classe, et non un cas limite : une variation
   * inconnue doit se lire comme inconnue. Le composant affirmait auparavant
   * « Stable » des que la valeur valait 0, ce qui transformait une donnee non
   * renseignee en affirmation editoriale sur l'etat du marche.
   */
  value: number | null;
  /** Number of decimal places (default: 2) */
  decimals?: number;
  /** Display size variant */
  size?: 'sm' | 'md';
  /** Show as a pill with background color */
  pill?: boolean;
  /** Optional suffix (default: "%") */
  suffix?: string;
  /** Show the absolute value instead of percentage */
  absolute?: boolean;
}

type Intensity = 'strong' | 'moderate' | 'mild' | 'neutral';

function getIntensity(value: number): Intensity {
  const abs = Math.abs(value);
  if (abs === 0) return 'neutral';
  if (abs < 0.5) return 'mild';
  if (abs < 3) return 'moderate';
  return 'strong';
}

const upStyles: Record<Intensity, { text: string; bg: string }> = {
  strong:   { text: 'text-emerald-700', bg: 'bg-emerald-100' },
  moderate: { text: 'text-emerald-600', bg: 'bg-emerald-50' },
  mild:     { text: 'text-emerald-500', bg: 'bg-emerald-50/60' },
  neutral:  { text: 'text-gray-500',    bg: 'bg-gray-100' },
};

const downStyles: Record<Intensity, { text: string; bg: string }> = {
  strong:   { text: 'text-red-700',  bg: 'bg-red-100' },
  moderate: { text: 'text-red-600',  bg: 'bg-red-50' },
  mild:     { text: 'text-red-500',  bg: 'bg-red-50/60' },
  neutral:  { text: 'text-gray-500', bg: 'bg-gray-100' },
};

export function VariationBadge({
  value,
  decimals = 2,
  size = 'sm',
  pill = false,
  suffix = '%',
  absolute = false,
}: VariationBadgeProps) {
  // Variation non mesuree : un tiret neutre, sans couleur, sans fleche, sans mot.
  // Ne jamais rendre ici un 0, ni « Stable » : ce serait affirmer une mesure.
  if (value === null || !Number.isFinite(value)) {
    const textSizeVide = size === 'sm' ? 'text-[11px]' : 'text-[12px]';
    return (
      <span
        className={`inline-flex items-center font-medium text-gray-400 ${textSizeVide}`}
        title="Variation non disponible"
      >
        &ndash;
      </span>
    );
  }

  const intensity = getIntensity(value);
  const isUp = value > 0;
  const isNeutral = intensity === 'neutral';

  const styles = isNeutral
    ? upStyles.neutral
    : isUp
      ? upStyles[intensity]
      : downStyles[intensity];

  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';
  const textSize = size === 'sm' ? 'text-[11px]' : 'text-[12px]';

  const Icon = isNeutral
    ? Minus
    : intensity === 'strong'
      ? isUp ? ArrowUp : ArrowDown
      : isUp ? TrendingUp : TrendingDown;

  // Typographie francaise : virgule decimale, et espace insecable avant le %.
  const nombre = value.toFixed(decimals).replace('.', ',');
  const displayValue = absolute
    ? `${isUp ? '+' : ''}${nombre}`
    : `${isUp ? '+' : ''}${nombre} ${suffix}`;

  // Le mot « Stable » a ete retire : une variation mesuree a 0,00 % s'ecrit
  // 0,00 %. Le mot etait affiche des que la valeur valait 0, y compris quand ce
  // 0 etait un defaut d'insertion jamais renseigne, ce qui faisait dire au site
  // que le marche etait stable alors que personne n'avait rien mesure.

  return (
    <span
      className={[
        'inline-flex items-center gap-0.5 font-medium',
        textSize,
        styles.text,
        pill && `${styles.bg} px-1.5 py-0.5 rounded-full`,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <Icon className={iconSize} />
      {displayValue}
    </span>
  );
}
