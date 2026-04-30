import * as React from 'react';
import { Section, Row, Column, Text } from '@react-email/components';
import { colors, fonts, fontSizes, letterSpacing } from './tokens';
import { NigerMapAccent } from './NigerMapAccent';

export interface HeaderProps {
  issueNumber: number;
  issueDateLabel: string;
  readTimeMinutes?: number;
  webViewUrl?: string;
}

export function Header({ issueNumber, issueDateLabel, readTimeMinutes, webViewUrl }: HeaderProps) {
  const issueLabel = `Édition n°${String(issueNumber).padStart(2, '0')}`;
  return (
    <Section
      style={{
        backgroundColor: colors.primary,
        padding: '0',
        position: 'relative',
        margin: 0,
      }}
    >
      <Row>
        <Column align="left" style={{ padding: '14px 32px 12px', verticalAlign: 'middle' }}>
          <Text
            style={{
              margin: 0,
              color: colors.gold,
              fontFamily: fonts.sans,
              fontSize: fontSizes.tiny,
              fontWeight: 600,
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

      {/* Cover : wordmark + Niger filigrane */}
      <table
        role="presentation"
        cellPadding={0}
        cellSpacing={0}
        border={0}
        width="100%"
        style={{ borderCollapse: 'collapse', backgroundColor: colors.primary }}
      >
        <tr>
          <td
            align="center"
            style={{
              padding: '36px 32px 28px',
              position: 'relative',
              backgroundColor: colors.primary,
            }}
          >
            <table
              role="presentation"
              cellPadding={0}
              cellSpacing={0}
              border={0}
              align="center"
              style={{ margin: '0 auto' }}
            >
              <tr>
                <td align="center" style={{ paddingBottom: '14px' }}>
                  <NigerMapAccent
                    width={80}
                    fill={colors.gold}
                    opacity={0.18}
                    ariaLabel="Niger"
                  />
                </td>
              </tr>
              <tr>
                <td align="center">
                  <Text
                    style={{
                      margin: 0,
                      color: colors.surface,
                      fontFamily: fonts.sans,
                      fontSize: fontSizes.wordmark,
                      fontWeight: 800,
                      letterSpacing: letterSpacing.wordmark,
                      textTransform: 'uppercase',
                      lineHeight: 1.2,
                    }}
                  >
                    NFI Report
                  </Text>
                </td>
              </tr>
              <tr>
                <td align="center" style={{ paddingTop: '6px' }}>
                  <Text
                    style={{
                      margin: 0,
                      color: colors.gold,
                      fontFamily: fonts.sans,
                      fontSize: '10px',
                      fontWeight: 600,
                      letterSpacing: letterSpacing.caps,
                      textTransform: 'uppercase',
                    }}
                  >
                    Premium Briefing
                  </Text>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      {/* Ligne or accent */}
      <Row>
        <Column style={{ backgroundColor: colors.gold, height: '3px', fontSize: 0, lineHeight: 0 }}>
          &nbsp;
        </Column>
      </Row>

      {/* Méta : date + read time */}
      <Row>
        <Column align="left" style={{ padding: '14px 32px', backgroundColor: colors.primary, verticalAlign: 'middle' }}>
          <Text
            style={{
              margin: 0,
              color: colors.inkFaint,
              fontFamily: fonts.sans,
              fontSize: fontSizes.tiny,
              fontWeight: 500,
              letterSpacing: letterSpacing.loose,
              textTransform: 'uppercase',
            }}
          >
            {issueDateLabel}
          </Text>
        </Column>
        {readTimeMinutes ? (
          <Column align="right" style={{ padding: '14px 32px', backgroundColor: colors.primary, verticalAlign: 'middle' }}>
            <Text
              style={{
                margin: 0,
                color: colors.inkFaint,
                fontFamily: fonts.sans,
                fontSize: fontSizes.tiny,
                fontWeight: 500,
                letterSpacing: letterSpacing.loose,
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
