import * as React from 'react';
import { Section, Text } from '@react-email/components';
import { colors, fonts, fontSizes, letterSpacing, lineHeights } from './tokens';
import { Sparkline } from './Sparkline';

export interface MarketRow {
  label: string;
  value: string;
  changePercent: number;
  unit?: string;
  asOf?: string;
  /** Série 7 jours pour sparkline. Optionnelle. */
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

/**
 * Style "ticker Bloomberg Terminal" : table dense 1 row par marché.
 * Symbol uppercase + valeur tabular-nums big + variation pill colorée + sparkline.
 * Plus dense et plus pro finance que les cards 2-col.
 */
export function MarketTable({ title = 'Marchés au dernier point', caption, rows, source }: MarketTableProps) {
  return (
    <Section style={{ padding: '52px 32px 24px' }}>
      <table role="presentation" cellPadding={0} cellSpacing={0} border={0} width="100%" style={{ borderCollapse: 'collapse', marginBottom: '14px' }}>
        <tr>
          <td>
            <Text
              style={{
                margin: '0 0 10px',
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

      {/* Container ticker */}
      <table
        role="presentation"
        cellPadding={0}
        cellSpacing={0}
        border={0}
        width="100%"
        style={{
          borderCollapse: 'collapse',
          backgroundColor: colors.surface,
          border: `1px solid ${colors.divider}`,
          borderRadius: '10px',
          overflow: 'hidden',
        }}
      >
        <tbody>
          {rows.map((row, i) => {
            const isLast = i === rows.length - 1;
            const isUp = row.changePercent > 0;
            const isFlat = row.changePercent === 0;
            const trendColor = isFlat ? colors.inkMuted : isUp ? colors.positive : colors.negative;
            const trendBg = isFlat ? colors.muted : isUp ? colors.positiveBg : colors.negativeBg;
            const arrow = isFlat ? '◆' : isUp ? '▲' : '▼';

            return (
              <tr key={i}>
                {/* SYMBOL */}
                <td
                  style={{
                    padding: '12px 8px 12px 16px',
                    borderBottom: isLast ? 'none' : `1px solid ${colors.divider}`,
                    verticalAlign: 'middle',
                    width: '40%',
                  }}
                >
                  <Text
                    style={{
                      margin: 0,
                      color: colors.ink,
                      fontFamily: fonts.sans,
                      fontSize: '11px',
                      fontWeight: 800,
                      letterSpacing: letterSpacing.caps,
                      textTransform: 'uppercase',
                      lineHeight: 1.2,
                    }}
                  >
                    {row.label}
                  </Text>
                </td>

                {/* VALUE */}
                <td
                  align="right"
                  style={{
                    padding: '12px 8px',
                    borderBottom: isLast ? 'none' : `1px solid ${colors.divider}`,
                    verticalAlign: 'middle',
                    width: '20%',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Text
                    style={{
                      margin: 0,
                      color: colors.ink,
                      fontFamily: fonts.sans,
                      fontSize: '17px',
                      fontWeight: 800,
                      letterSpacing: '-0.3px',
                      lineHeight: 1.2,
                    }}
                  >
                    {row.value}
                    {row.unit ? (
                      <span
                        style={{
                          color: colors.inkMuted,
                          fontWeight: 500,
                          fontSize: '10px',
                          marginLeft: '4px',
                        }}
                      >
                        {row.unit}
                      </span>
                    ) : null}
                  </Text>
                </td>

                {/* CHANGE PILL */}
                <td
                  align="right"
                  style={{
                    padding: '12px 8px',
                    borderBottom: isLast ? 'none' : `1px solid ${colors.divider}`,
                    verticalAlign: 'middle',
                    width: '20%',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      backgroundColor: trendBg,
                      color: trendColor,
                      fontFamily: fonts.sans,
                      fontSize: '11px',
                      fontWeight: 800,
                      letterSpacing: '0.2px',
                      padding: '4px 8px',
                      borderRadius: '4px',
                    }}
                  >
                    {arrow} {isFlat ? 'fixe' : formatPct(row.changePercent)}
                  </span>
                </td>

                {/* SPARKLINE */}
                <td
                  align="right"
                  style={{
                    padding: '12px 16px 12px 8px',
                    borderBottom: isLast ? 'none' : `1px solid ${colors.divider}`,
                    verticalAlign: 'middle',
                    width: '20%',
                  }}
                >
                  {row.spark && row.spark.length >= 2 ? (
                    <Sparkline
                      values={row.spark}
                      strokeColor={trendColor}
                      fillColor={trendColor}
                      width={64}
                      height={20}
                      ariaLabel={`${row.label} sur 7 jours`}
                    />
                  ) : null}
                </td>
              </tr>
            );
          })}
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
