import * as React from 'react';
import { Section, Img, Link, Text } from '@react-email/components';
import { colors, fonts, fontSizes, letterSpacing, lineHeights } from './tokens';

export interface SponsorProps {
  label?: string;
  name: string;
  pitch: string;
  ctaLabel: string;
  ctaUrl: string;
  imageUrl?: string;
  imageAlt?: string;
}

export function Sponsor({ label = 'Partenaire', name, pitch, ctaLabel, ctaUrl, imageUrl, imageAlt }: SponsorProps) {
  return (
    <Section
      style={{
        padding: '24px 32px',
        backgroundColor: colors.surface,
        border: `1px solid ${colors.divider}`,
        borderRadius: '10px',
        margin: '24px 32px',
      }}
    >
      <Text
        style={{
          margin: '0 0 10px',
          color: colors.inkFaint,
          fontFamily: fonts.sans,
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: letterSpacing.caps,
          textTransform: 'uppercase',
        }}
      >
        {label} ·  Sponsorisé
      </Text>
      {imageUrl ? (
        <Img
          src={imageUrl}
          alt={imageAlt ?? name}
          width="540"
          height="auto"
          style={{
            width: '100%',
            maxWidth: '540px',
            height: 'auto',
            display: 'block',
            borderRadius: '6px',
            marginBottom: '14px',
          }}
        />
      ) : null}
      <Text
        style={{
          margin: '0 0 8px',
          color: colors.ink,
          fontFamily: fonts.sans,
          fontSize: fontSizes.h3,
          fontWeight: 700,
          lineHeight: lineHeights.tight,
        }}
      >
        {name}
      </Text>
      <Text
        style={{
          margin: '0 0 14px',
          color: colors.inkSoft,
          fontFamily: fonts.sans,
          fontSize: fontSizes.small,
          lineHeight: lineHeights.normal,
        }}
      >
        {pitch}
      </Text>
      <Link
        href={ctaUrl}
        style={{
          display: 'inline-block',
          backgroundColor: colors.gold,
          color: colors.primary,
          fontFamily: fonts.sans,
          fontSize: fontSizes.small,
          fontWeight: 700,
          padding: '10px 20px',
          borderRadius: '6px',
          textDecoration: 'none',
          letterSpacing: '0.3px',
        }}
      >
        {ctaLabel} →
      </Link>
    </Section>
  );
}
