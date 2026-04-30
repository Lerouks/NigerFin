import * as React from 'react';
import { Section, Link, Text } from '@react-email/components';
import { colors, fonts, fontSizes, letterSpacing, lineHeights } from './tokens';

export interface RadarItem {
  title: string;
  hint?: string;
  url?: string;
}

export interface RadarProps {
  title?: string;
  items: RadarItem[];
}

export function Radar({ title = 'Sur notre radar', items }: RadarProps) {
  return (
    <Section style={{ padding: '24px 32px' }}>
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
        À retenir
      </Text>
      <Text
        style={{
          margin: '0 0 18px',
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
      <table role="presentation" cellPadding={0} cellSpacing={0} border={0} width="100%" style={{ borderCollapse: 'collapse' }}>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx}>
              <td
                width={32}
                style={{
                  paddingTop: '2px',
                  paddingRight: '12px',
                  verticalAlign: 'top',
                  width: '32px',
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: '26px',
                    height: '26px',
                    lineHeight: '26px',
                    textAlign: 'center',
                    backgroundColor: colors.gold,
                    color: colors.primary,
                    fontFamily: fonts.sans,
                    fontSize: '12px',
                    fontWeight: 800,
                    borderRadius: '50%',
                  }}
                >
                  {idx + 1}
                </span>
              </td>
              <td style={{ paddingTop: '2px', paddingBottom: '14px', verticalAlign: 'top' }}>
                <Text
                  style={{
                    margin: '0 0 4px',
                    color: colors.ink,
                    fontFamily: fonts.sans,
                    fontSize: fontSizes.body,
                    fontWeight: 600,
                    lineHeight: lineHeights.normal,
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
                      lineHeight: lineHeights.normal,
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
