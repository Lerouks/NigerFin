import * as React from 'react';
import { Section, Img, Text } from '@react-email/components';
import { colors, fonts, fontSizes, letterSpacing, lineHeights } from './tokens';

export interface ChartBlockProps {
  eyebrow?: string;
  title: string;
  imageUrl: string;
  imageAlt: string;
  caption?: string;
  source?: string;
}

export function ChartBlock({ eyebrow = 'Graphique du jour', title, imageUrl, imageAlt, caption, source }: ChartBlockProps) {
  return (
    <Section
      style={{
        padding: '24px 32px',
        backgroundColor: colors.muted,
        margin: '24px 0',
      }}
    >
      <Text
        style={{
          margin: '0 0 4px',
          color: colors.gold,
          fontFamily: fonts.sans,
          fontSize: fontSizes.tiny,
          fontWeight: 700,
          letterSpacing: letterSpacing.caps,
          textTransform: 'uppercase',
        }}
      >
        {eyebrow}
      </Text>
      <Text
        style={{
          margin: '0 0 16px',
          color: colors.ink,
          fontFamily: fonts.sans,
          fontSize: fontSizes.h2,
          fontWeight: 700,
          letterSpacing: '-0.3px',
          lineHeight: lineHeights.tight,
        }}
      >
        {title}
      </Text>
      <Img
        src={imageUrl}
        alt={imageAlt}
        width="576"
        height="auto"
        style={{
          width: '100%',
          maxWidth: '576px',
          height: 'auto',
          display: 'block',
          borderRadius: '6px',
          backgroundColor: colors.surface,
        }}
      />
      {caption ? (
        <Text
          style={{
            margin: '12px 0 0',
            color: colors.inkSoft,
            fontFamily: fonts.sans,
            fontSize: fontSizes.small,
            fontStyle: 'italic',
            lineHeight: lineHeights.normal,
          }}
        >
          {caption}
        </Text>
      ) : null}
      {source ? (
        <Text
          style={{
            margin: '6px 0 0',
            color: colors.inkFaint,
            fontFamily: fonts.sans,
            fontSize: '11px',
            lineHeight: lineHeights.normal,
          }}
        >
          Source : {source}
        </Text>
      ) : null}
    </Section>
  );
}
