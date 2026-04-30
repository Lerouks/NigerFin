import * as React from 'react';
import { Section, Img, Link, Text } from '@react-email/components';
import { colors, fonts, fontSizes, lineHeights, letterSpacing } from './tokens';

export interface HeadlineCardProps {
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
}

function Block({ heading, body }: { heading: string; body: string }) {
  return (
    <table role="presentation" cellPadding={0} cellSpacing={0} border={0} width="100%" style={{ marginBottom: '14px', borderCollapse: 'collapse' }}>
      <tr>
        <td width={3} style={{ backgroundColor: colors.gold, width: '3px', minWidth: '3px' }} />
        <td style={{ paddingLeft: '14px' }}>
          <Text
            style={{
              margin: '0 0 6px',
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
          <Text
            style={{
              margin: 0,
              color: colors.inkSoft,
              fontFamily: fonts.sans,
              fontSize: fontSizes.body,
              lineHeight: lineHeights.normal,
            }}
            dangerouslySetInnerHTML={{ __html: body }}
          />
        </td>
      </tr>
    </table>
  );
}

export function HeadlineCard({
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
}: HeadlineCardProps) {
  return (
    <Section style={{ padding: '12px 32px 24px' }}>
      {eyebrow ? (
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
          {eyebrow}
        </Text>
      ) : null}
      <Text
        style={{
          margin: '0 0 16px',
          color: colors.ink,
          fontFamily: fonts.sans,
          fontSize: fontSizes.h1,
          fontWeight: 800,
          letterSpacing: '-0.5px',
          lineHeight: '1.18',
        }}
      >
        {emoji ? <span style={{ marginRight: '8px' }}>{emoji}</span> : null}
        {title}
      </Text>
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
      <Block heading="Ce qu'il se passe" body={whatHappening} />
      <Block heading="Ce que ça veut dire" body={whatItMeans} />
      <Block heading="Pourquoi ça compte" body={whyCare} />
      {ctaLabel && ctaUrl ? (
        <Text style={{ margin: '20px 0 0', textAlign: 'left' }}>
          <Link
            href={ctaUrl}
            style={{
              display: 'inline-block',
              backgroundColor: colors.primary,
              color: colors.surface,
              fontFamily: fonts.sans,
              fontSize: fontSizes.small,
              fontWeight: 600,
              padding: '12px 22px',
              borderRadius: '6px',
              textDecoration: 'none',
              letterSpacing: '0.3px',
            }}
          >
            {ctaLabel} →
          </Link>
        </Text>
      ) : null}
    </Section>
  );
}
