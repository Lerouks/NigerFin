import Image from 'next/image';
import { COUNTRIES, getFlagSrc, type CountryCode } from '@/lib/country-flags';

interface CountryFlagProps {
  country: CountryCode;
  size?: number;
  className?: string;
  monochrome?: boolean;
}

/**
 * Affiche un drapeau SVG (public/flags/) avec aria-label pays.
 * monochrome=true applique grayscale + opacity reduite pour cohesion atlas.
 */
export function CountryFlag({
  country,
  size = 16,
  className,
  monochrome = false,
}: CountryFlagProps) {
  const info = COUNTRIES[country];
  return (
    <Image
      src={getFlagSrc(country)}
      alt={info.name}
      width={size}
      height={Math.round(size * 0.66)}
      className={[
        'inline-block shrink-0 rounded-[2px] ring-1 ring-black/5',
        monochrome ? 'grayscale opacity-80' : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      unoptimized
    />
  );
}
