import * as React from 'react';
import { Section, Text } from '@react-email/components';
import { colors, fonts, fontSizes, letterSpacing, lineHeights } from './tokens';
import { Sparkline } from './Sparkline';

export interface MarketRow {
  label: string;
  value: string;
  changePercent: number; // signé : -1.23 = -1.23%
  unit?: string;
  asOf?: string;
  /** Série 7 jours pour sparkline. Optionnelle ; si absente, pas de sparkline. */
  spark?: number[];
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
  const isFlat = row.changePercent === 0;
  const trendColor = isFlat ? colors.inkMuted : isUp ? colors.positive : colors.negative;
  const arrow = isFlat ? '◆' : isUp ? '▲' : '▼';
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
        <td style={{ padding: '14px 16px 12px' }}>
          {/* label + sparkline en bandeau */}
          <table role="presentation" cellPadding={0} cellSpacing={0} border={0} width="100%" style={{ borderCollapse: 'collapse' }}>
            <tr>
              <td style={{ verticalAlign: 'middle' }}>
                <Text
                  style={{
                    margin: 0,
                    color: colors.inkMuted,
                    fontFamily: fonts.sans,
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: letterSpacing.caps,
                    textTransform: 'uppercase',
                    lineHeight: lineHeights.tight,
                  }}
                >
                  {row.label}
                </Text>
              </td>
              {row.spark && row.spark.length >= 2 ? (
                <td align="right" style={{ verticalAlign: 'middle' }}>
                  <Sparkline
                    values={row.spark}
                    strokeColor={trendColor}
                    fillColor={trendColor}
                    width={64}
                    height={18}
                    ariaLabel={`${row.label} sur 7 jours`}
                  />
                </td>
              ) : null}
            </tr>
          </table>

          {/* valeur + trend pill */}
          <table
            role="presentation"
            cellPadding={0}
            cellSpacing={0}
            border={0}
            style={{ marginTop: '8px', borderCollapse: 'collapse' }}
          >
            <tr>
              <td style={{ paddingRight: '10px', verticalAlign: 'baseline' }}>
                <Text
                  style={{
                    margin: 0,
                    color: colors.ink,
                    fontFamily: fonts.sans,
                    fontSize: '20px',
                    fontWeight: 800,
                    letterSpacing: '-0.4px',
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
                        marginLeft: '5px',
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
                    color: trendColor,
                    fontFamily: fonts.sans,
                    fontSize: '12px',
                    fontWeight: 800,
                    letterSpacing: '0.2px',
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
  // Pair the rows two-by-two for a 2-column grid
  const pairs: [MarketRow, MarketRow | null][] = [];
  for (let i = 0; i < rows.length; i += 2) {
    const left = rows[i];
    const right = rows[i + 1] ?? null;
    if (!left) continue;
    pairs.push([left, right]);
  }

  return (
    <Section style={{ padding: '40px 32px 12px' }}>
      <table role="presentation" cellPadding={0} cellSpacing={0} border={0} width="100%" style={{ borderCollapse: 'collapse', marginBottom: '20px' }}>
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
              I · Tableau de bord
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
          </td>
        </tr>
      </table>
      {caption ? (
        <Text
          style={{
            margin: '0 0 18px',
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
                  borderRadius: '12px',
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
                  borderRadius: '12px',
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
            margin: '14px 0 0',
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
