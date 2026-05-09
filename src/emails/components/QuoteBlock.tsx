import * as React from 'react';
import { Section, Text, Img } from '@react-email/components';
import { colors, fonts, fontSizes, letterSpacing, lineHeights } from './tokens';

export interface QuoteBlockProps {
  text: string;
  author: string;
  role?: string;
  /** Eyebrow type "Citation de la semaine". */
  eyebrow?: string;
  /** URL de la photo de l'auteur (carrée idéalement, ratio 1:1). Affichée en rond 64px au-dessus de la citation. */
  authorPhotoUrl?: string;
}

/**
 * Moment d'arrêt visuel. Citation centrée, gros guillemet or, fond crème.
 * Photo d'auteur optionnelle en haut, ronde et discrète.
 */
export function QuoteBlock({ text, author, role, eyebrow = 'La phrase de la semaine', authorPhotoUrl }: QuoteBlockProps) {
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
      {authorPhotoUrl ? (
        <table role="presentation" cellPadding={0} cellSpacing={0} border={0} align="center" style={{ margin: '0 auto 18px' }}>
          <tr>
            <td align="center">
              <Img
                src={authorPhotoUrl}
                alt={author}
                width={72}
                height={72}
                style={{
                  display: 'block',
                  width: '72px',
                  height: '72px',
                  borderRadius: '36px',
                  objectFit: 'cover',
                  border: `2px solid ${colors.gold}`,
                  margin: '0 auto',
                }}
              />
            </td>
          </tr>
        </table>
      ) : null}

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
          fontFamily: "Arial, Helvetica, sans-serif",
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
          fontFamily: "Arial, Helvetica, sans-serif",
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
