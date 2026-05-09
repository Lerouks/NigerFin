import * as React from 'react';
import { Section, Link, Text } from '@react-email/components';
import { colors, fonts, fontSizes, letterSpacing, lineHeights } from './tokens';

export interface DigestItem {
  emoji?: string;
  title: string;
  body: string;
  url?: string;
}

export interface DigestListProps {
  sectionNumeral?: string;
  eyebrow?: string;
  title?: string;
  items: DigestItem[];
}

export function DigestList({ sectionNumeral, eyebrow = 'En bref', title = 'Le digest', items }: DigestListProps) {
  return (
    <Section style={{ padding: '48px 32px' }}>
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
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        const titleNode = (
          <Text
            style={{
              margin: '0 0 6px',
              color: colors.ink,
              fontFamily: fonts.sans,
              fontSize: fontSizes.h3,
              fontWeight: 700,
              letterSpacing: '-0.1px',
              lineHeight: lineHeights.tight,
            }}
          >
            {item.emoji ? <span style={{ marginRight: '8px' }}>{item.emoji}</span> : null}
            {item.url ? (
              <Link href={item.url} style={{ color: colors.ink, textDecoration: 'none' }}>
                {item.title}
              </Link>
            ) : (
              item.title
            )}
          </Text>
        );
        return (
          <table
            key={idx}
            role="presentation"
            cellPadding={0}
            cellSpacing={0}
            border={0}
            width="100%"
            style={{
              borderCollapse: 'collapse',
              borderBottom: isLast ? 'none' : `1px solid ${colors.divider}`,
            }}
          >
            <tr>
              <td width={36} style={{ verticalAlign: 'top', paddingTop: '22px', paddingRight: '12px' }}>
                <Text
                  style={{
                    margin: 0,
                    color: colors.gold,
                    fontFamily: fonts.sans,
                    fontSize: '11px',
                    fontWeight: 800,
                    letterSpacing: letterSpacing.caps,
                  }}
                >
                  {String(idx + 1).padStart(2, '0')}
                </Text>
              </td>
              <td style={{ padding: '20px 0' }}>
                {titleNode}
                <Text
                  style={{
                    margin: 0,
                    color: colors.inkSoft,
                    fontFamily: fonts.sans,
                    fontSize: fontSizes.body,
                    lineHeight: lineHeights.relaxed,
                  }}
                >
                  {item.body}
                </Text>
              </td>
            </tr>
          </table>
        );
      })}
    </Section>
  );
}
