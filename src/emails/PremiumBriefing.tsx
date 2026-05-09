import * as React from 'react';
import { Body, Container, Head, Html, Preview, Section, Text, Hr } from '@react-email/components';
import { colors, fonts, lineHeights, sizes } from './components/tokens';
import { Header } from './components/Header';
import { MarketTable } from './components/MarketTable';
import { NigerKpiBlock } from './components/NigerKpiBlock';
import { HeadlineCard } from './components/HeadlineCard';
import { ChartBlock } from './components/ChartBlock';
import { QuoteBlock } from './components/QuoteBlock';
import { DigestList } from './components/DigestList';
import { Sponsor } from './components/Sponsor';
import { Radar } from './components/Radar';
import { ToolsPromoBlock } from './components/ToolsPromoBlock';
import { Footer } from './components/Footer';
import type { NewsletterIssue } from './types';

export interface PremiumBriefingProps {
  issue: NewsletterIssue;
  siteUrl: string;
  managePreferencesUrl?: string;
  unsubscribeUrl?: string;
  socials?: { instagram?: string; facebook?: string; linkedin?: string; tiktok?: string };
}

function IntroBlock({ issue }: { issue: NewsletterIssue }) {
  // Lettrine sur la première lettre alphabétique du paragraphe.
  const match = issue.intro.paragraph.match(/^(\s*)([\p{L}])/u);
  const firstChar = match?.[2] ?? '';
  const remainder = match ? issue.intro.paragraph.slice((match[1]?.length ?? 0) + (match[2]?.length ?? 0)) : issue.intro.paragraph;

  return (
    <Section style={{ padding: '40px 32px 8px' }}>
      {issue.intro.eyebrow ? (
        <Text
          style={{
            margin: '0 0 14px',
            color: colors.gold,
            fontFamily: fonts.sans,
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '4px',
            textTransform: 'uppercase',
          }}
        >
          {issue.intro.eyebrow}
        </Text>
      ) : null}
      <Text
        style={{
          margin: '0 0 22px',
          color: colors.ink,
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: '30px',
          fontWeight: 700,
          letterSpacing: '-0.7px',
          lineHeight: 1.18,
        }}
      >
        {issue.intro.heading}
      </Text>
      <Text
        style={{
          margin: '0 0 28px',
          color: colors.inkSoft,
          fontFamily: fonts.sans,
          fontSize: '16px',
          lineHeight: lineHeights.relaxed,
        }}
      >
        {firstChar ? (
          <span
            style={{
              display: 'inline-block',
              float: 'left',
              color: colors.gold,
              fontFamily: "Arial, Helvetica, sans-serif",
              fontSize: '64px',
              fontWeight: 700,
              letterSpacing: '-2px',
              lineHeight: 0.85,
              marginRight: '12px',
              marginTop: '4px',
            }}
          >
            {firstChar}
          </span>
        ) : null}
        {remainder}
      </Text>

      {issue.intro.summary && issue.intro.summary.length > 0 ? (
        <table
          role="presentation"
          cellPadding={0}
          cellSpacing={0}
          border={0}
          width="100%"
          style={{ borderCollapse: 'collapse', borderTop: `1px solid ${colors.divider}`, borderBottom: `1px solid ${colors.divider}`, margin: '8px 0 4px' }}
        >
          <tr>
            <td style={{ padding: '14px 0' }}>
              <Text
                style={{
                  margin: '0 0 12px',
                  color: colors.gold,
                  fontFamily: fonts.sans,
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '4px',
                  textTransform: 'uppercase',
                }}
              >
                Au sommaire
              </Text>
              {issue.intro.summary.map((item, idx) => {
                const isLast = idx === issue.intro.summary!.length - 1;
                return (
                  <table key={idx} role="presentation" cellPadding={0} cellSpacing={0} border={0} width="100%" style={{ borderCollapse: 'collapse' }}>
                    <tr>
                      <td width={56} style={{ verticalAlign: 'middle', paddingRight: '14px' }}>
                        <Text
                          style={{
                            margin: 0,
                            color: colors.gold,
                            fontFamily: fonts.sans,
                            fontSize: '20px',
                            fontWeight: 900,
                            letterSpacing: '0.5px',
                            lineHeight: 1,
                          }}
                        >
                          {item.number}
                        </Text>
                      </td>
                      <td style={{ verticalAlign: 'middle', padding: isLast ? '10px 0 0' : '10px 0', borderTop: idx === 0 ? 'none' : `1px dashed ${colors.divider}` }}>
                        <Text
                          style={{
                            margin: 0,
                            color: colors.ink,
                            fontFamily: fonts.sans,
                            fontSize: '15px',
                            fontWeight: 600,
                            lineHeight: lineHeights.normal,
                            letterSpacing: '-0.1px',
                          }}
                        >
                          {item.label}
                        </Text>
                      </td>
                    </tr>
                  </table>
                );
              })}
            </td>
          </tr>
        </table>
      ) : null}
    </Section>
  );
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
            coverHeadline={issue.coverHeadline}
          />

          {issue.quote ? <QuoteBlock {...issue.quote} /> : null}

          <IntroBlock issue={issue} />

          <MarketTable
            title={issue.market.title}
            caption={issue.market.caption}
            rows={issue.market.rows}
            source={issue.market.source}
          />

          {issue.nigerKpi ? (
            <NigerKpiBlock
              eyebrow={issue.nigerKpi.eyebrow}
              title={issue.nigerKpi.title}
              caption={issue.nigerKpi.caption}
              items={issue.nigerKpi.items}
            />
          ) : (
            <Hr style={{ borderColor: colors.divider, margin: '8px 32px' }} />
          )}

          {headlines[0] ? <HeadlineCard {...headlines[0]} sectionNumeral={headlines[0].sectionNumeral ?? 'III'} dropCap /> : null}

          {issue.chart ? <ChartBlock {...issue.chart} /> : null}

          {issue.sponsor ? <Sponsor {...issue.sponsor} /> : null}

          {headlines[1] ? <HeadlineCard {...headlines[1]} sectionNumeral={headlines[1].sectionNumeral ?? 'IV'} /> : null}

          {issue.digest ? (
            <DigestList
              sectionNumeral={issue.digest.sectionNumeral ?? 'V'}
              eyebrow={issue.digest.eyebrow}
              title={issue.digest.title}
              items={issue.digest.items}
            />
          ) : null}

          {issue.radar ? (
            <Radar
              sectionNumeral={issue.radar.sectionNumeral ?? 'VI'}
              eyebrow={issue.radar.eyebrow}
              title={issue.radar.title}
              items={issue.radar.items}
            />
          ) : null}

          {issue.toolsPromo ? (
            <ToolsPromoBlock
              sectionNumeral={issue.toolsPromo.sectionNumeral ?? 'VII'}
              eyebrow={issue.toolsPromo.eyebrow}
              title={issue.toolsPromo.title}
              caption={issue.toolsPromo.caption}
              items={issue.toolsPromo.items}
            />
          ) : null}

          <Footer
            siteUrl={siteUrl}
            managePreferencesUrl={managePreferencesUrl}
            unsubscribeUrl={unsubscribeUrl}
            socials={socials}
            nextIssueLabel={issue.nextIssueLabel}
          />
        </Container>

        {/* Marge bas pour aérer dans Gmail web */}
        <Section style={{ height: '32px', backgroundColor: colors.paper }}>&nbsp;</Section>
      </Body>
    </Html>
  );
}

export default PremiumBriefing;
