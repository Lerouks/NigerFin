import * as React from 'react';
import { Section, Text } from '@react-email/components';
import { colors, fonts, fontSizes, lineHeights } from './tokens';

export interface ToolPromoItem {
  /** Emoji ou icône courte. */
  emoji?: string;
  /** Titre court de l'outil (ex: "Simulateur emprunt BRVM"). */
  title: string;
  /** 1 ligne d'accroche pour le contexte. */
  description: string;
  /** URL absolue du simulateur sur le site (ex: https://nfireport.com/outil/simulateur-emprunt). */
  url: string;
}

export interface ToolsPromoBlockProps {
  sectionNumeral?: string;
  eyebrow?: string;
  title?: string;
  caption?: string;
  items: ToolPromoItem[];
}

/**
 * Bloc "VOS OUTILS PREMIUM" : promotion des simulateurs et calculateurs financiers
 * NFI Report directement dans la newsletter. Style card list horizontale.
 */
export function ToolsPromoBlock({
  sectionNumeral,
  eyebrow = 'Vos outils Premium',
  title = 'Mettez vos analyses en chiffres',
  caption,
  items,
}: ToolsPromoBlockProps) {
  if (!items.length) return null;

  return (
    <Section style={{ padding: '48px 32px 32px' }}>
      <table role="presentation" cellPadding={0} cellSpacing={0} border={0} width="100%" style={{ borderCollapse: 'collapse', marginBottom: '28px' }}>
        <tr>
          <td>
            <Text
              style={{
                margin: '0 0 6px',
                color: colors.gold,
                fontFamily: fonts.sans,
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '4px',
                textTransform: 'uppercase',
              }}
            >
              {sectionNumeral ? `${sectionNumeral} · ` : ''}{eyebrow}
            </Text>
            <Text
              style={{
                margin: 0,
                color: colors.ink,
                fontFamily: fonts.sans,
                fontSize: fontSizes.h1,
                fontWeight: 800,
                letterSpacing: '-0.6px',
                lineHeight: 1.15,
              }}
            >
              {title}
            </Text>
            {caption ? (
              <Text
                style={{
                  margin: '6px 0 0',
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

      {/* Cards container with subtle gold gradient background */}
      <table
        role="presentation"
        cellPadding={0}
        cellSpacing={0}
        border={0}
        width="100%"
        style={{
          borderCollapse: 'collapse',
          backgroundColor: colors.goldFaint,
          border: `1px solid ${colors.goldSoft}`,
          borderRadius: '12px',
        }}
      >
        <tbody>
          {items.map((item, idx) => {
            const isLast = idx === items.length - 1;
            return (
              <tr key={idx}>
                <td
                  style={{
                    padding: '16px 18px',
                    borderBottom: isLast ? 'none' : `1px solid ${colors.goldSoft}`,
                  }}
                >
                  <table role="presentation" cellPadding={0} cellSpacing={0} border={0} width="100%" style={{ borderCollapse: 'collapse' }}>
                    <tr>
                      {item.emoji ? (
                        <td
                          width={36}
                          style={{
                            verticalAlign: 'top',
                            paddingRight: '12px',
                            fontSize: '22px',
                            lineHeight: 1,
                          }}
                        >
                          {item.emoji}
                        </td>
                      ) : null}
                      <td style={{ verticalAlign: 'top' }}>
                        <Text
                          style={{
                            margin: '0 0 3px',
                            color: colors.ink,
                            fontFamily: fonts.sans,
                            fontSize: '15px',
                            fontWeight: 700,
                            lineHeight: 1.3,
                          }}
                        >
                          {item.title}
                        </Text>
                        <Text
                          style={{
                            margin: 0,
                            color: colors.inkSoft,
                            fontFamily: fonts.sans,
                            fontSize: '13px',
                            lineHeight: lineHeights.normal,
                          }}
                        >
                          {item.description}
                        </Text>
                      </td>
                      <td align="right" style={{ verticalAlign: 'middle', paddingLeft: '12px' }}>
                        <a
                          href={item.url}
                          style={{
                            display: 'inline-block',
                            backgroundColor: colors.primary,
                            color: colors.surface,
                            fontFamily: fonts.sans,
                            fontSize: '12px',
                            fontWeight: 700,
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase',
                            textDecoration: 'none',
                            padding: '8px 14px',
                            borderRadius: '6px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Accéder &rarr;
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
