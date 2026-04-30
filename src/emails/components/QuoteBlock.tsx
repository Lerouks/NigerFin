import * as React from 'react';
import { Section, Text } from '@react-email/components';
import { colors, fonts, fontSizes, letterSpacing, lineHeights } from './tokens';

export interface QuoteBlockProps {
  text: string;
  author: string;
  role?: string;
}

export function QuoteBlock({ text, author, role }: QuoteBlockProps) {
  return (
    <Section
      style={{
        padding: '40px 32px',
        backgroundColor: colors.secondary,
        margin: '24px 0',
        textAlign: 'center',
      }}
    >
      <Text
        style={{
          margin: '0 0 18px',
          color: colors.gold,
          fontFamily: fonts.sans,
          fontSize: '36px',
          fontWeight: 800,
          lineHeight: 1,
        }}
      >
        “
      </Text>
      <Text
        style={{
          margin: '0 0 18px',
          color: colors.ink,
          fontFamily: fonts.sans,
          fontSize: '18px',
          fontWeight: 500,
          lineHeight: 1.45,
          fontStyle: 'italic',
          letterSpacing: '-0.2px',
        }}
      >
        {text}
      </Text>
      <Text
        style={{
          margin: 0,
          color: colors.inkMuted,
          fontFamily: fonts.sans,
          fontSize: fontSizes.tiny,
          fontWeight: 700,
          letterSpacing: letterSpacing.caps,
          textTransform: 'uppercase',
          lineHeight: lineHeights.tight,
        }}
      >
        — {author}
        {role ? <span style={{ color: colors.inkFaint, fontWeight: 500 }}> · {role}</span> : null}
      </Text>
    </Section>
  );
}
