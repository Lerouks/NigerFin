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
 * Cover "magazine premium" :
 *  - Liseré or "ÉDITION N°XX" + lien web view
 *  - Watermark or 8 % géant du numéro derrière le contenu
 *  - Logo NFI argenté (logo-white.png) en chapeau, 56px
 *  - Wordmark "NFI REPORT" 30px tracking 6px en blanc
 *  - Tagline or italique
 *  - Niger contour or 140px avec point Niamey lumineux
 *  - Liseré décoratif "ÉDITION EXCLUSIVE PREMIUM" entre filets or
 *  - Ligne or 4px de séparation
 *  - Méta : date + temps de lecture
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
      {/* Bandeau du haut */}
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

      {/* Cover principale : numéro watermark + logo + Niger + wordmark + filet édition exclusive */}
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
              padding: '24px 32px 26px',
              backgroundColor: colors.primary,
              position: 'relative',
            }}
          >
            {/* Watermark "N°01" or 8 % opacité, géant derrière */}
            <div
              aria-hidden="true"
              style={{
                color: colors.gold,
                opacity: 0.08,
                fontFamily: fonts.sans,
                fontSize: '220px',
                fontWeight: 900,
                letterSpacing: '-14px',
                lineHeight: 1,
                margin: '0 0 -130px',
                userSelect: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              {issueGiantLabel}
            </div>

            {/* Bloc cover central */}
            <table
              role="presentation"
              cellPadding={0}
              cellSpacing={0}
              border={0}
              align="center"
              style={{ margin: '0 auto', position: 'relative' }}
            >
              {/* Wordmark NFI REPORT */}
              <tr>
                <td align="center">
                  <Text
                    style={{
                      margin: 0,
                      color: colors.surface,
                      fontFamily: fonts.sans,
                      fontSize: '32px',
                      fontWeight: 900,
                      letterSpacing: '7px',
                      textTransform: 'uppercase',
                      lineHeight: 1,
                    }}
                  >
                    NFI Report
                  </Text>
                </td>
              </tr>

              {/* Tagline or italique */}
              <tr>
                <td align="center" style={{ paddingTop: '8px', paddingBottom: '18px' }}>
                  <Text
                    style={{
                      margin: 0,
                      color: colors.gold,
                      fontFamily: "Arial, Helvetica, sans-serif",
                      fontSize: '13px',
                      fontStyle: 'italic',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {tagline}
                  </Text>
                </td>
              </tr>

              {/* Niger contour proéminent + point Niamey */}
              <tr>
                <td align="center" style={{ paddingBottom: '16px' }}>
                  <NigerMapAccent
                    width={150}
                    fill={colors.gold}
                    opacity={0.5}
                    showNiamey
                    niameyColor={colors.gold}
                    ariaLabel="Contour du Niger avec Niamey indiquée"
                  />
                </td>
              </tr>

              {/* Filet décoratif "ÉDITION EXCLUSIVE PREMIUM" */}
              <tr>
                <td align="center">
                  <table role="presentation" cellPadding={0} cellSpacing={0} border={0} align="center">
                    <tr>
                      <td style={{ borderTop: `1px solid ${colors.gold}`, width: '40px', fontSize: 0, lineHeight: 0 }}>&nbsp;</td>
                      <td style={{ padding: '0 14px' }}>
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
                      <td style={{ borderTop: `1px solid ${colors.gold}`, width: '40px', fontSize: 0, lineHeight: 0 }}>&nbsp;</td>
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
