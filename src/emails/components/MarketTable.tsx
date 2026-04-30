import * as React from 'react';
import { Section, Text } from '@react-email/components';
import { colors, fonts, fontSizes, letterSpacing, lineHeights } from './tokens';

export interface MarketRow {
  label: string;
  value: string;
  changePercent: number; // signé : -1.23 = -1.23%
  unit?: string;
  asOf?: string;
}

export interface MarketTableProps {
  title?: string;
  caption?: string;
  rows: MarketRow[];
  source?: string;
}

function formatPct(pct: number): string {
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(2)}%`;
}

function MarketCell({ row }: { row: MarketRow }) {
  const isUp = row.changePercent >= 0;
  const pillBg = isUp ? colors.positiveBg : colors.negativeBg;
  const pillColor = isUp ? colors.positive : colors.negative;
  const arrow = isUp ? '▲' : '▼';
  return (
    <table
      role="presentation"
      cellPadding={0}
      cellSpacing={0}
      border={0}
      width="100%"
      style={{ borderCollapse: 'collapse' }}
    >
      <tr>
        <td style={{ padding: '14px 16px' }}>
          <Text
            style={{
              margin: 0,
              color: colors.inkMuted,
              fontFamily: fonts.sans,
              fontSize: fontSizes.tiny,
              fontWeight: 600,
              letterSpacing: letterSpacing.caps,
              textTransform: 'uppercase',
              lineHeight: lineHeights.tight,
            }}
          >
            {row.label}
          </Text>
          <table
            role="presentation"
            cellPadding={0}
            cellSpacing={0}
            border={0}
            style={{ marginTop: '6px', borderCollapse: 'collapse' }}
          >
            <tr>
              <td style={{ paddingRight: '8px', verticalAlign: 'baseline' }}>
                <Text
                  style={{
                    margin: 0,
                    color: colors.ink,
                    fontFamily: fonts.sans,
                    fontSize: '18px',
                    fontWeight: 700,
                    letterSpacing: '-0.2px',
                    lineHeight: lineHeights.tight,
                  }}
                >
                  {row.value}
                  {row.unit ? (
                    <span
                      style={{
                        color: colors.inkMuted,
                        fontWeight: 500,
                        fontSize: fontSizes.tiny,
                        marginLeft: '4px',
                      }}
                    >
                      {row.unit}
                    </span>
                  ) : null}
                </Text>
              </td>
              <td style={{ verticalAlign: 'baseline' }}>
                <span
                  style={{
                    backgroundColor: pillBg,
                    color: pillColor,
                    fontFamily: fonts.sans,
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.2px',
                    padding: '2px 7px',
                    borderRadius: '999px',
                    display: 'inline-block',
                  }}
                >
                  {arrow} {formatPct(row.changePercent)}
                </span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  );
}

export function MarketTable({ title = 'Marchés au dernier point', caption, rows, source }: MarketTableProps) {
  // Pair the rows two-by-two for a 2-column grid (mobile clients will stack via media queries)
  const pairs: [MarketRow, MarketRow | null][] = [];
  for (let i = 0; i < rows.length; i += 2) {
    const left = rows[i];
    const right = rows[i + 1] ?? null;
    if (!left) continue;
    pairs.push([left, right]);
  }

  return (
    <Section style={{ padding: '36px 32px 8px' }}>
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
        Tableau de bord
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
      {caption ? (
        <Text
          style={{
            margin: '0 0 16px',
            color: colors.inkMuted,
            fontFamily: fonts.sans,
            fontSize: fontSizes.small,
            lineHeight: lineHeights.normal,
          }}
        >
          {caption}
        </Text>
      ) : null}

      <table
        role="presentation"
        cellPadding={0}
        cellSpacing={0}
        border={0}
        width="100%"
        style={{ borderCollapse: 'separate', borderSpacing: '8px 8px', marginLeft: '-8px', marginRight: '-8px' }}
      >
        <tbody>
          {pairs.map((pair, i) => (
            <tr key={i}>
              <td
                width="50%"
                style={{
                  backgroundColor: colors.surface,
                  border: `1px solid ${colors.divider}`,
                  borderRadius: '10px',
                  verticalAlign: 'top',
                }}
              >
                <MarketCell row={pair[0]} />
              </td>
              <td
                width="50%"
                style={{
                  backgroundColor: pair[1] ? colors.surface : 'transparent',
                  border: pair[1] ? `1px solid ${colors.divider}` : 'none',
                  borderRadius: '10px',
                  verticalAlign: 'top',
                }}
              >
                {pair[1] ? <MarketCell row={pair[1]} /> : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {source ? (
        <Text
          style={{
            margin: '12px 0 0',
            color: colors.inkFaint,
            fontFamily: fonts.sans,
            fontSize: '11px',
            fontStyle: 'italic',
            lineHeight: lineHeights.normal,
          }}
        >
          Source : {source}
        </Text>
      ) : null}
    </Section>
  );
}

