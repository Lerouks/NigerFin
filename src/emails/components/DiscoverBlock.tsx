import * as React from 'react';
import { Section, Text } from '@react-email/components';
import { colors, fonts, fontSizes, lineHeights } from './tokens';

export interface DiscoverItem {
  /** Emoji ou pictogramme court. */
  emoji?: string;
  /** Libellé court de la rubrique (ex: "Éducation financière"). */
  rubric: string;
  /** Titre principal de l'invitation (ex: "Comprendre la BRVM en 6 leçons"). */
  title: string;
  /** Phrase d'accroche, 1 à 2 lignes max. */
  description: string;
  /** URL absolue vers la rubrique du site. */
  url: string;
  /** Libellé du bouton (default: "Explorer"). */
  ctaLabel?: string;
}

export interface DiscoverBlockProps {
  sectionNumeral?: string;
  eyebrow?: string;
  title?: string;
  caption?: string;
  items: DiscoverItem[];
}

/**
 * Bloc "Continuer sur NFI Report" : met en valeur les rubriques du site
 * complementaires a celles deja presentes dans la newsletter (education,
 * entreprises, niger interactive, etc.). Format magazine, 1 card par rubrique.
 */
export function DiscoverBlock({
  sectionNumeral,
  eyebrow = 'Continuer la lecture',
  title = 'Aussi cette semaine sur NFI Report',
  caption,
  items,
}: DiscoverBlockProps) {
  if (!items.length) return null;

  return (
    <Section style={{ padding: '48px 32px 32px' }}>
      <table role="presentation" cellPadding={0} cellSpacing={0} border={0} width="100%" style={{ borderCollapse: 'collapse', marginBottom: '28px' }}>
        <tr>
          {sectionNumeral ? (
            <td width={64} style={{ verticalAlign: 'top', paddingRight: '16px' }}>
              <Text
                style={{
                  margin: 0,
                  color: colors.gold,
                  fontFamily: fonts.sans,
                  fontSize: '46px',
                  fontWeight: 900,
                  letterSpacing: '-1px',
                  lineHeight: 0.9,
                }}
              >
                {sectionNumeral}
              </Text>
            </td>
          ) : null}
          <td style={{ verticalAlign: 'top' }}>
            <Text
              style={{
                margin: '0 0 10px',
                color: colors.gold,
                fontFamily: fonts.sans,
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '4px',
                textTransform: 'uppercase',
              }}
            >
              {eyebrow}
            </Text>
            <Text
              style={{
                margin: 0,
                color: colors.ink,
                fontFamily: fonts.sans,
                fontSize: '24px',
                fontWeight: 800,
                letterSpacing: '-0.4px',
                lineHeight: 1.2,
              }}
            >
              {title}
            </Text>
            {caption ? (
              <Text
                style={{
                  margin: '8px 0 0',
                  color: colors.inkMuted,
                  fontFamily: fonts.sans,
                  fontSize: fontSizes.small,
                  lineHeight: lineHeights.normal,
                }}
              >
                {caption}
              </Text>
            ) : null}
          </td>
        </tr>
      </table>

      <table role="presentation" cellPadding={0} cellSpacing={0} border={0} width="100%" style={{ borderCollapse: 'collapse' }}>
        <tbody>
          {items.map((item, idx) => {
            return (
              <tr key={idx}>
                <td
                  style={{
                    padding: '20px 0',
                    borderTop: idx === 0 ? `1px solid ${colors.divider}` : 'none',
                    borderBottom: `1px solid ${colors.divider}`,
                  }}
                >
                  <table role="presentation" cellPadding={0} cellSpacing={0} border={0} width="100%" style={{ borderCollapse: 'collapse' }}>
                    <tr>
                      {item.emoji ? (
                        <td
                          width={56}
                          style={{
                            verticalAlign: 'top',
                            paddingRight: '14px',
                            fontSize: '32px',
                            lineHeight: 1,
                          }}
                        >
                          {item.emoji}
                        </td>
                      ) : null}
                      <td style={{ verticalAlign: 'top' }}>
                        <Text
                          style={{
                            margin: '0 0 4px',
                            color: colors.gold,
                            fontFamily: fonts.sans,
                            fontSize: '10px',
                            fontWeight: 700,
                            letterSpacing: '3px',
                            textTransform: 'uppercase',
                          }}
                        >
                          {item.rubric}
                        </Text>
                        <Text
                          style={{
                            margin: '0 0 6px',
                            color: colors.ink,
                            fontFamily: fonts.sans,
                            fontSize: '17px',
                            fontWeight: 700,
                            letterSpacing: '-0.2px',
                            lineHeight: 1.25,
                          }}
                        >
                          {item.title}
                        </Text>
                        <Text
                          style={{
                            margin: '0 0 10px',
                            color: colors.inkSoft,
                            fontFamily: fonts.sans,
                            fontSize: '14px',
                            lineHeight: lineHeights.normal,
                          }}
                        >
                          {item.description}
                        </Text>
                        <a
                          href={item.url}
                          style={{
                            display: 'inline-block',
                            color: colors.primary,
                            fontFamily: fonts.sans,
                            fontSize: '12px',
                            fontWeight: 700,
                            letterSpacing: '1.5px',
                            textTransform: 'uppercase',
                            textDecoration: 'none',
                            borderBottom: `2px solid ${colors.gold}`,
                            paddingBottom: '2px',
                          }}
                        >
                          {item.ctaLabel ?? 'Explorer'} &rarr;
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Section>
  );
}
