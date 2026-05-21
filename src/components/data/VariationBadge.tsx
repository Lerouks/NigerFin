'use client';

import { TrendingUp, TrendingDown, Minus, ArrowUp, ArrowDown } from 'lucide-react';

interface VariationBadgeProps {
  /** Percentage change value */
  value: number;
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

  const displayValue = absolute
    ? `${isUp ? '+' : ''}${value.toFixed(decimals)}`
    : `${isUp ? '+' : ''}${value.toFixed(decimals)}${suffix}`;

  const label = isNeutral ? 'Stable' : null;

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
      {label ?? displayValue}
    </span>
  );
}
