import * as React from 'react';
import { Body, Container, Head, Html, Preview, Section, Text, Hr } from '@react-email/components';
import { colors, fonts, fontSizes, letterSpacing, lineHeights, sizes } from './components/tokens';
import { Header } from './components/Header';
import { MarketTable } from './components/MarketTable';
import { HeadlineCard } from './components/HeadlineCard';
import { ChartBlock } from './components/ChartBlock';
import { QuoteBlock } from './components/QuoteBlock';
import { DigestList } from './components/DigestList';
import { Sponsor } from './components/Sponsor';
import { Radar } from './components/Radar';
import { Footer } from './components/Footer';
import type { NewsletterIssue } from './types';

export interface PremiumBriefingProps {
  issue: NewsletterIssue;
  siteUrl: string;
  managePreferencesUrl?: string;
  unsubscribeUrl?: string;
  socials?: { instagram?: string; facebook?: string; linkedin?: string; tiktok?: string };
}

export function PremiumBriefing({
  issue,
  siteUrl,
  managePreferencesUrl,
  unsubscribeUrl,
  socials,
}: PremiumBriefingProps) {
  const headlines = issue.headlines ?? [];
  return (
    <Html lang="fr">
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <meta name="x-apple-disable-message-reformatting" />
        <meta name="color-scheme" content="light only" />
        <meta name="supported-color-schemes" content="light only" />
        <title>{issue.subject}</title>
      </Head>
      <Preview>{issue.preheader}</Preview>
      <Body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: colors.paper,
          fontFamily: fonts.sans,
          color: colors.ink,
          WebkitTextSizeAdjust: '100%',
        }}
      >
        <Container
          style={{
            width: '100%',
            maxWidth: `${sizes.containerWidth}px`,
            margin: '0 auto',
            backgroundColor: colors.surface,
            borderTop: `4px solid ${colors.gold}`,
          }}
        >
          <Header
            issueNumber={issue.number}
            issueDateLabel={issue.issueDateLabel}
            readTimeMinutes={issue.readTimeMinutes}
            webViewUrl={issue.webViewUrl}
          />

          {/* Intro éditoriale */}
          <Section style={{ padding: '36px 32px 12px' }}>
            {issue.intro.eyebrow ? (
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
                {issue.intro.eyebrow}
              </Text>
            ) : null}
            <Text
              style={{
                margin: '0 0 14px',
                color: colors.ink,
                fontFamily: fonts.sans,
                fontSize: '24px',
                fontWeight: 800,
                letterSpacing: '-0.5px',
                lineHeight: '1.2',
              }}
            >
              {issue.intro.heading}
            </Text>
            <Text
              style={{
                margin: '0 0 20px',
                color: colors.inkSoft,
                fontFamily: fonts.sans,
                fontSize: fontSizes.body,
                lineHeight: lineHeights.relaxed,
              }}
            >
              {issue.intro.paragraph}
            </Text>
            {issue.intro.teasers && issue.intro.teasers.length > 0 ? (
              <table role="presentation" cellPadding={0} cellSpacing={0} border={0} width="100%" style={{ borderCollapse: 'collapse', backgroundColor: colors.muted, borderRadius: '8px' }}>
                <tr>
                  <td style={{ padding: '14px 18px' }}>
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
                      Au programme
                    </Text>
                    {issue.intro.teasers.map((teaser, idx) => (
                      <Text
                        key={idx}
                        style={{
                          margin: '6px 0',
                          color: colors.inkSoft,
                          fontFamily: fonts.sans,
                          fontSize: fontSizes.small,
                          lineHeight: lineHeights.normal,
                        }}
                      >
                        {teaser}
                      </Text>
                    ))}
                  </td>
                </tr>
              </table>
            ) : null}
          </Section>

          <MarketTable
            title={issue.market.title}
            caption={issue.market.caption}
            rows={issue.market.rows}
            source={issue.market.source}
          />

          <Hr style={{ borderColor: colors.divider, margin: '12px 32px' }} />

          {headlines[0] ? <HeadlineCard {...headlines[0]} /> : null}

          {issue.chart ? <ChartBlock {...issue.chart} /> : null}

          {issue.sponsor ? <Sponsor {...issue.sponsor} /> : null}

          {headlines[1] ? <HeadlineCard {...headlines[1]} /> : null}

          {issue.digest ? <DigestList title={issue.digest.title} items={issue.digest.items} /> : null}

          {issue.quote ? <QuoteBlock {...issue.quote} /> : null}

          {issue.radar ? <Radar title={issue.radar.title} items={issue.radar.items} /> : null}

          <Footer
            siteUrl={siteUrl}
            managePreferencesUrl={managePreferencesUrl}
            unsubscribeUrl={unsubscribeUrl}
            socials={socials}
          />
        </Container>

        {/* Marge bas pour aérer dans Gmail web */}
        <Section style={{ height: '32px', backgroundColor: colors.paper }}>&nbsp;</Section>
      </Body>
    </Html>
  );
}

export default PremiumBriefing;
