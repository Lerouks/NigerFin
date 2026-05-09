import * as React from 'react';
import { Section, Img, Link, Text } from '@react-email/components';
import { colors, fonts, fontSizes, lineHeights, letterSpacing } from './tokens';

export interface HeadlineCardProps {
  /** Numéro de section (affiché en gros à gauche du titre, ex. "III"). Optionnel. */
  sectionNumeral?: string;
  eyebrow?: string;
  emoji?: string;
  title: string;
  imageUrl?: string;
  imageAlt?: string;
  whatHappening: string;
  whatItMeans: string;
  whyCare: string;
  ctaLabel?: string;
  ctaUrl?: string;
  /** Active la lettrine sur le 1er paragraphe ("Ce qu'il se passe"). */
  dropCap?: boolean;
}

function Block({ heading, body, dropCap = false }: { heading: string; body: string; dropCap?: boolean }) {
  // Sépare la première lettre alphabétique pour la lettrine
  let leadHtml = body;
  let firstChar = '';
  if (dropCap) {
    const match = body.match(/^(\s*)([\p{L}])/u);
    if (match) {
      const [, leadSpace, ch] = match;
      firstChar = ch ?? '';
      leadHtml = body.slice((leadSpace?.length ?? 0) + (ch?.length ?? 0));
    }
  }

  return (
    <table role="presentation" cellPadding={0} cellSpacing={0} border={0} width="100%" style={{ marginBottom: '16px', borderCollapse: 'collapse' }}>
      <tr>
        <td width={3} style={{ backgroundColor: colors.gold, width: '3px', minWidth: '3px' }} />
        <td style={{ paddingLeft: '14px' }}>
          <Text
            style={{
              margin: '0 0 8px',
              color: colors.gold,
              fontFamily: fonts.sans,
              fontSize: fontSizes.tiny,
              fontWeight: 700,
              letterSpacing: letterSpacing.caps,
              textTransform: 'uppercase',
            }}
          >
            {heading}
          </Text>
          {dropCap && firstChar ? (
            <Text
              style={{
                margin: 0,
                color: colors.inkSoft,
                fontFamily: fonts.sans,
                fontSize: fontSizes.body,
                lineHeight: lineHeights.relaxed,
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  float: 'left',
                  color: colors.gold,
                  fontFamily: fonts.sans,
                  fontSize: '52px',
                  fontWeight: 900,
                  letterSpacing: '-1px',
                  lineHeight: 0.85,
                  marginRight: '10px',
                  marginTop: '4px',
                }}
              >
                {firstChar}
              </span>
              <span dangerouslySetInnerHTML={{ __html: leadHtml }} />
            </Text>
          ) : (
            <Text
              style={{
                margin: 0,
                color: colors.inkSoft,
                fontFamily: fonts.sans,
                fontSize: fontSizes.body,
                lineHeight: lineHeights.relaxed,
              }}
              dangerouslySetInnerHTML={{ __html: body }}
            />
          )}
        </td>
      </tr>
    </table>
  );
}

export function HeadlineCard({
  sectionNumeral,
  eyebrow,
  emoji,
  title,
  imageUrl,
  imageAlt,
  whatHappening,
  whatItMeans,
  whyCare,
  ctaLabel,
  ctaUrl,
  dropCap = false,
}: HeadlineCardProps) {
  return (
    <Section style={{ padding: '24px 32px 28px' }}>
      {sectionNumeral || eyebrow ? (
        <table role="presentation" cellPadding={0} cellSpacing={0} border={0} width="100%" style={{ borderCollapse: 'collapse', marginBottom: '12px' }}>
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
              {eyebrow ? (
                <Text
                  style={{
                    margin: '0 0 8px',
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
              ) : null}
              <Text
                style={{
                  margin: 0,
                  color: colors.ink,
                  fontFamily: fonts.sans,
                  fontSize: '26px',
                  fontWeight: 800,
                  letterSpacing: '-0.6px',
                  lineHeight: 1.18,
                }}
              >
                {emoji ? <span style={{ marginRight: '8px' }}>{emoji}</span> : null}
                {title}
              </Text>
            </td>
          </tr>
        </table>
      ) : (
        <Text
          style={{
            margin: '0 0 16px',
            color: colors.ink,
            fontFamily: fonts.sans,
            fontSize: '26px',
            fontWeight: 800,
            letterSpacing: '-0.6px',
            lineHeight: 1.18,
          }}
        >
          {emoji ? <span style={{ marginRight: '8px' }}>{emoji}</span> : null}
          {title}
        </Text>
      )}
      {imageUrl ? (
        <Img
          src={imageUrl}
          alt={imageAlt ?? title}
          width="576"
          height="auto"
          style={{
            width: '100%',
            maxWidth: '576px',
            height: 'auto',
            display: 'block',
            borderRadius: '8px',
            marginBottom: '20px',
            border: `1px solid ${colors.divider}`,
          }}
        />
      ) : null}
      <Block heading="Ce qu'il se passe" body={whatHappening} dropCap={dropCap} />
      <Block heading="Ce que ça veut dire" body={whatItMeans} />
      <Block heading="Pourquoi ça compte" body={whyCare} />
      {ctaLabel && ctaUrl ? (
        <Text style={{ margin: '28px 0 0', textAlign: 'left' }}>
          <Link
            href={ctaUrl}
            style={{
              display: 'inline-block',
              backgroundColor: colors.primary,
              color: colors.surface,
              fontFamily: fonts.sans,
              fontSize: fontSizes.small,
              fontWeight: 800,
              padding: '15px 28px',
              borderRadius: '8px',
              textDecoration: 'none',
              letterSpacing: '0.6px',
              textTransform: 'uppercase',
              borderTop: `2px solid ${colors.gold}`,
              borderBottom: `2px solid ${colors.gold}`,
            }}
          >
            {ctaLabel} →
          </Link>
        </Text>
      ) : null}
    </Section>
  );
}
