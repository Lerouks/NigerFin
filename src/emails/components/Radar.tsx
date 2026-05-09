import * as React from 'react';
import { Section, Link, Text } from '@react-email/components';
import { colors, fonts, fontSizes, lineHeights } from './tokens';

export interface RadarItem {
  title: string;
  hint?: string;
  url?: string;
}

export interface RadarProps {
  sectionNumeral?: string;
  eyebrow?: string;
  title?: string;
  items: RadarItem[];
}

export function Radar({ sectionNumeral, eyebrow = 'À retenir', title = 'Sur notre radar', items }: RadarProps) {
  return (
    <Section style={{ padding: '48px 32px 48px' }}>
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
                margin: '0 0 6px',
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
          </td>
        </tr>
      </table>
      <table role="presentation" cellPadding={0} cellSpacing={0} border={0} width="100%" style={{ borderCollapse: 'collapse' }}>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx}>
              <td
                width={42}
                style={{
                  paddingTop: '4px',
                  paddingRight: '14px',
                  verticalAlign: 'top',
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: '32px',
                    height: '32px',
                    lineHeight: '32px',
                    textAlign: 'center',
                    backgroundColor: colors.gold,
                    color: colors.primary,
                    fontFamily: fonts.sans,
                    fontSize: '13px',
                    fontWeight: 900,
                    borderRadius: '50%',
                    letterSpacing: 0,
                  }}
                >
                  {idx + 1}
                </span>
              </td>
              <td style={{ paddingTop: '4px', paddingBottom: '18px', verticalAlign: 'top' }}>
                <Text
                  style={{
                    margin: '0 0 4px',
                    color: colors.ink,
                    fontFamily: fonts.sans,
                    fontSize: fontSizes.h3,
                    fontWeight: 700,
                    lineHeight: lineHeights.tight,
                    letterSpacing: '-0.1px',
                  }}
                >
                  {item.url ? (
                    <Link href={item.url} style={{ color: colors.ink, textDecoration: 'underline', textDecorationColor: colors.gold }}>
                      {item.title}
                    </Link>
                  ) : (
                    item.title
                  )}
                </Text>
                {item.hint ? (
                  <Text
                    style={{
                      margin: 0,
                      color: colors.inkMuted,
                      fontFamily: fonts.sans,
                      fontSize: fontSizes.small,
                      lineHeight: lineHeights.relaxed,
                    }}
                  >
                    {item.hint}
                  </Text>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  );
}

