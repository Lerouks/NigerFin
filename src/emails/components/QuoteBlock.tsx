import * as React from 'react';
import { Section, Text } from '@react-email/components';
import { colors, fonts, fontSizes, letterSpacing, lineHeights } from './tokens';

export interface QuoteBlockProps {
  text: string;
  author: string;
  role?: string;
  /** Eyebrow type "Citation de la semaine". */
  eyebrow?: string;
}

/**
 * Moment d'arrêt visuel. Citation centrée, gros guillemet or, fond crème,
 * contour Niger en watermark derrière.
 */
export function QuoteBlock({ text, author, role, eyebrow = 'La phrase de la semaine' }: QuoteBlockProps) {
  return (
    <Section
      style={{
        padding: '48px 32px 44px',
        backgroundColor: colors.secondary,
        margin: '32px 0',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Text
        style={{
          margin: '0 0 12px',
          color: colors.gold,
          fontFamily: fonts.sans,
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '4px',
          textTransform: 'uppercase',
          position: 'relative',
        }}
      >
        {eyebrow}
      </Text>

      <Text
        style={{
          margin: '0 0 14px',
          color: colors.gold,
          fontFamily: "'Playfair Display', Georgia, 'Times New Roman', serif",
          fontSize: '64px',
          fontWeight: 800,
          lineHeight: 0.9,
          position: 'relative',
        }}
      >
        “
      </Text>

      <Text
        style={{
          margin: '0 auto 22px',
          color: colors.ink,
          fontFamily: "'Playfair Display', Georgia, 'Times New Roman', serif",
          fontSize: '21px',
          fontWeight: 500,
          lineHeight: 1.4,
          fontStyle: 'italic',
          letterSpacing: '-0.3px',
          maxWidth: '460px',
          position: 'relative',
        }}
      >
        {text}
      </Text>

      <table role="presentation" cellPadding={0} cellSpacing={0} border={0} align="center" style={{ margin: '0 auto', position: 'relative' }}>
        <tr>
          <td style={{ borderTop: `1px solid ${colors.gold}`, width: '24px', fontSize: 0, lineHeight: 0 }}>&nbsp;</td>
          <td style={{ padding: '0 12px' }}>
            <Text
              style={{
                margin: 0,
                color: colors.inkSoft,
                fontFamily: fonts.sans,
                fontSize: fontSizes.tiny,
                fontWeight: 700,
                letterSpacing: letterSpacing.caps,
                textTransform: 'uppercase',
                lineHeight: lineHeights.tight,
              }}
            >
              {author}
              {role ? <span style={{ color: colors.inkMuted, fontWeight: 500 }}> · {role}</span> : null}
            </Text>
          </td>
          <td style={{ borderTop: `1px solid ${colors.gold}`, width: '24px', fontSize: 0, lineHeight: 0 }}>&nbsp;</td>
        </tr>
      </table>
    </Section>
  );
}
