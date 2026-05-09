import * as React from 'react';
import { Section, Text } from '@react-email/components';
import { colors, fonts, fontSizes, lineHeights } from './tokens';
import { NigerMapAccent } from './NigerMapAccent';

export interface NigerKpiItem {
  label: string;
  value: string;
  unit?: string;
  delta?: string;
  source?: string;
}

export interface NigerKpiBlockProps {
  eyebrow?: string;
  title?: string;
  caption?: string;
  items: NigerKpiItem[];
}

/**
 * Bloc d'identité forte : 3 KPI clés du Niger sur fond noir, avec contour
 * du pays en accent à droite. Utilisé comme moment d'arrêt visuel entre
 * deux sections analytiques.
 */
export function NigerKpiBlock({
  eyebrow = 'II · Niger en chiffres',
  title = 'L’économie nigérienne, en un coup d’œil',
  caption,
  items,
}: NigerKpiBlockProps) {
  return (
    <Section
      style={{
        backgroundColor: colors.primary,
        padding: '52px 32px 48px',
        margin: '40px 0',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <table role="presentation" cellPadding={0} cellSpacing={0} border={0} width="100%" style={{ borderCollapse: 'collapse' }}>
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
              {eyebrow}
            </Text>
            <Text
              style={{
                margin: '0 0 6px',
                color: colors.surface,
                fontFamily: fonts.sans,
                fontSize: '22px',
                fontWeight: 800,
                letterSpacing: '-0.4px',
                lineHeight: 1.2,
              }}
            >
              {title}
            </Text>
            {caption ? (
              <Text
                style={{
                  margin: '0 0 22px',
                  color: colors.inkFaint,
                  fontFamily: fonts.sans,
                  fontSize: fontSizes.small,
                  lineHeight: lineHeights.relaxed,
                  maxWidth: '400px',
                }}
              >
                {caption}
              </Text>
            ) : null}
          </td>
        </tr>
      </table>

      <table
        role="presentation"
        cellPadding={0}
        cellSpacing={0}
        border={0}
        width="100%"
        style={{ borderCollapse: 'separate', borderSpacing: '12px 0', marginLeft: '-12px', marginRight: '-12px' }}
      >
        <tr>
          {items.map((item, idx) => (
            <td
              key={idx}
              width={`${100 / items.length}%`}
              style={{
                verticalAlign: 'top',
                borderLeft: idx === 0 ? `2px solid ${colors.gold}` : `1px solid ${colors.inkSoft}`,
                paddingLeft: '12px',
              }}
            >
              <Text
                style={{
                  margin: '0 0 8px',
                  color: colors.gold,
                  fontFamily: fonts.sans,
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  lineHeight: lineHeights.tight,
                }}
              >
                {item.label}
              </Text>
              <Text
                style={{
                  margin: 0,
                  color: colors.surface,
                  fontFamily: fonts.sans,
                  fontSize: '32px',
                  fontWeight: 900,
                  letterSpacing: '-1px',
                  lineHeight: 1,
                }}
              >
                {item.value}
                {item.unit ? (
                  <span
                    style={{
                      color: colors.inkFaint,
                      fontWeight: 600,
                      fontSize: '14px',
                      marginLeft: '4px',
                    }}
                  >
                    {item.unit}
                  </span>
                ) : null}
              </Text>
              {item.delta ? (
                <Text
                  style={{
                    margin: '6px 0 0',
                    color: colors.inkFaint,
                    fontFamily: fonts.sans,
                    fontSize: '12px',
                    fontWeight: 600,
                    letterSpacing: '0.2px',
                  }}
                >
                  {item.delta}
                </Text>
              ) : null}
              {item.source ? (
                <Text
                  style={{
                    margin: '8px 0 0',
                    color: colors.inkSoft,
                    fontFamily: fonts.sans,
                    fontSize: '10px',
                    letterSpacing: '0.2px',
                    fontStyle: 'italic',
                  }}
                >
                  {item.source}
                </Text>
              ) : null}
            </td>
          ))}
        </tr>
      </table>

      {/* Contour Niger en accent bas-droit */}
      <table role="presentation" cellPadding={0} cellSpacing={0} border={0} width="100%" style={{ borderCollapse: 'collapse', marginTop: '24px' }}>
        <tr>
          <td align="right" style={{ paddingRight: '4px' }}>
            <NigerMapAccent
              width={80}
              fill={colors.gold}
              opacity={0.45}
              showNiamey
              niameyColor={colors.surface}
              ariaLabel="Niger, Niamey"
            />
          </td>
        </tr>
      </table>
    </Section>
  );
}
