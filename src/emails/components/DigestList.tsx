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
  title?: string;
  items: DigestItem[];
}

export function DigestList({ title = 'Le digest', items }: DigestListProps) {
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
        En bref
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
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        const titleNode = (
          <Text
            style={{
              margin: '0 0 4px',
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
              <td style={{ padding: '14px 0' }}>
                {titleNode}
                <Text
                  style={{
                    margin: 0,
                    color: colors.inkSoft,
                    fontFamily: fonts.sans,
                    fontSize: fontSizes.body,
                    lineHeight: lineHeights.normal,
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
