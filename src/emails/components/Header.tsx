import * as React from 'react';
import { Section, Row, Column, Text } from '@react-email/components';
import { colors, fonts, fontSizes, letterSpacing } from './tokens';
import { NigerMapAccent } from './NigerMapAccent';

export interface HeaderProps {
  issueNumber: number;
  issueDateLabel: string;
  readTimeMinutes?: number;
  webViewUrl?: string;
  tagline?: string;
}

/**
 * Cover "magazine" : numéro géant en arrière-plan or 6 % opacité, contour
 * Niger en haut avec point Niamey, wordmark NFI REPORT en gros, sous-titre
 * Premium Briefing, ligne or, méta date + read time en bas.
 */
export function Header({
  issueNumber,
  issueDateLabel,
  readTimeMinutes,
  webViewUrl,
  tagline = 'Le Premium Briefing',
}: HeaderProps) {
  const issueLabel = `Édition n°${String(issueNumber).padStart(2, '0')}`;
  const issueGiantLabel = `N°${String(issueNumber).padStart(2, '0')}`;
  return (
    <Section style={{ backgroundColor: colors.primary, padding: 0, margin: 0 }}>
      {/* Bandeau du haut : édition + lien web */}
      <Row>
        <Column align="left" style={{ padding: '14px 32px 12px', verticalAlign: 'middle' }}>
          <Text
            style={{
              margin: 0,
              color: colors.gold,
              fontFamily: fonts.sans,
              fontSize: fontSizes.tiny,
              fontWeight: 700,
              letterSpacing: letterSpacing.caps,
              textTransform: 'uppercase',
            }}
          >
            {issueLabel}
          </Text>
        </Column>
        {webViewUrl ? (
          <Column align="right" style={{ padding: '14px 32px 12px', verticalAlign: 'middle' }}>
            <a
              href={webViewUrl}
              style={{
                color: colors.inkFaint,
                fontFamily: fonts.sans,
                fontSize: fontSizes.tiny,
                fontWeight: 500,
                letterSpacing: letterSpacing.loose,
                textTransform: 'uppercase',
                textDecoration: 'underline',
              }}
            >
              Voir dans le navigateur
            </a>
          </Column>
        ) : null}
      </Row>

      {/* Cover : numéro géant en watermark + wordmark + Niger */}
      <table
        role="presentation"
        cellPadding={0}
        cellSpacing={0}
        border={0}
        width="100%"
        style={{ borderCollapse: 'collapse', backgroundColor: colors.primary, position: 'relative' }}
      >
        <tr>
          <td
            align="center"
            style={{
              padding: '20px 32px 18px',
              backgroundColor: colors.primary,
              position: 'relative',
            }}
          >
            {/* Watermark "N°01" en or 6 % opacité, derrière le contenu (Gmail-safe : pseudo-superposition par marges négatives) */}
            <div
              aria-hidden="true"
              style={{
                color: colors.gold,
                opacity: 0.07,
                fontFamily: fonts.sans,
                fontSize: '180px',
                fontWeight: 900,
                letterSpacing: '-12px',
                lineHeight: 1,
                margin: '0 0 -110px',
                userSelect: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              {issueGiantLabel}
            </div>

            {/* Niger silhouette + Niamey */}
            <table role="presentation" cellPadding={0} cellSpacing={0} border={0} align="center" style={{ margin: '0 auto', position: 'relative' }}>
              <tr>
                <td align="center" style={{ paddingBottom: '16px' }}>
                  <NigerMapAccent
                    width={96}
                    fill={colors.gold}
                    opacity={0.35}
                    showNiamey
                    niameyColor={colors.gold}
                    ariaLabel="Contour du Niger avec Niamey indiquée"
                  />
                </td>
              </tr>
              <tr>
                <td align="center" style={{ paddingBottom: '6px' }}>
                  <Text
                    style={{
                      margin: 0,
                      color: colors.gold,
                      fontFamily: fonts.sans,
                      fontSize: '10px',
                      fontWeight: 700,
                      letterSpacing: '6px',
                      textTransform: 'uppercase',
                    }}
                  >
                    {tagline}
                  </Text>
                </td>
              </tr>
              <tr>
                <td align="center">
                  <Text
                    style={{
                      margin: 0,
                      color: colors.surface,
                      fontFamily: fonts.sans,
                      fontSize: '34px',
                      fontWeight: 900,
                      letterSpacing: '6px',
                      textTransform: 'uppercase',
                      lineHeight: 1,
                    }}
                  >
                    NFI Report
                  </Text>
                </td>
              </tr>
              <tr>
                <td align="center" style={{ paddingTop: '14px' }}>
                  <table role="presentation" cellPadding={0} cellSpacing={0} border={0} align="center">
                    <tr>
                      <td style={{ borderTop: `1px solid ${colors.gold}`, width: '32px', fontSize: 0, lineHeight: 0 }}>&nbsp;</td>
                      <td style={{ padding: '0 12px' }}>
                        <Text
                          style={{
                            margin: 0,
                            color: colors.gold,
                            fontFamily: fonts.sans,
                            fontSize: '11px',
                            fontWeight: 700,
                            letterSpacing: '4px',
                            textTransform: 'uppercase',
                            lineHeight: 1,
                          }}
                        >
                          Édition exclusive Premium
                        </Text>
                      </td>
                      <td style={{ borderTop: `1px solid ${colors.gold}`, width: '32px', fontSize: 0, lineHeight: 0 }}>&nbsp;</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      {/* Ligne or accent */}
      <Row>
        <Column style={{ backgroundColor: colors.gold, height: '4px', fontSize: 0, lineHeight: 0 }}>
          &nbsp;
        </Column>
      </Row>

      {/* Méta : date + read time */}
      <Row>
        <Column align="left" style={{ padding: '16px 32px', backgroundColor: colors.primary, verticalAlign: 'middle' }}>
          <Text
            style={{
              margin: 0,
              color: colors.surface,
              fontFamily: fonts.sans,
              fontSize: fontSizes.tiny,
              fontWeight: 700,
              letterSpacing: '3px',
              textTransform: 'uppercase',
            }}
          >
            {issueDateLabel}
          </Text>
        </Column>
        {readTimeMinutes ? (
          <Column align="right" style={{ padding: '16px 32px', backgroundColor: colors.primary, verticalAlign: 'middle' }}>
            <Text
              style={{
                margin: 0,
                color: colors.gold,
                fontFamily: fonts.sans,
                fontSize: fontSizes.tiny,
                fontWeight: 600,
                letterSpacing: '3px',
                textTransform: 'uppercase',
              }}
            >
              {readTimeMinutes} min de lecture
            </Text>
          </Column>
        ) : null}
      </Row>
    </Section>
  );
}
