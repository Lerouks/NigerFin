import * as React from 'react';
import { Section, Link, Text } from '@react-email/components';
import { colors, fonts, fontSizes, letterSpacing, lineHeights } from './tokens';
import { NigerMapAccent } from './NigerMapAccent';

export interface FooterProps {
  siteUrl: string;
  managePreferencesUrl?: string;
  unsubscribeUrl?: string;
  contactEmail?: string;
  socials?: { instagram?: string; facebook?: string; linkedin?: string; tiktok?: string };
  signatureLine?: string;
}

function SocialPill({ label, url }: { label: string; url: string }) {
  return (
    <td style={{ padding: '0 6px' }}>
      <Link
        href={url}
        style={{
          display: 'inline-block',
          padding: '6px 14px',
          borderRadius: '999px',
          border: `1px solid ${colors.divider}`,
          color: colors.ink,
          fontFamily: fonts.sans,
          fontSize: '12px',
          fontWeight: 600,
          textDecoration: 'none',
          letterSpacing: '0.2px',
        }}
      >
        {label}
      </Link>
    </td>
  );
}

export function Footer({
  siteUrl,
  managePreferencesUrl,
  unsubscribeUrl,
  contactEmail = 'contact@nfireport.com',
  socials,
  signatureLine = 'Composé avec passion par NFI et l’équipe NFI Report depuis Niamey.',
}: FooterProps) {
  return (
    <Section style={{ backgroundColor: colors.primary, padding: '40px 32px 32px' }}>
      <table role="presentation" cellPadding={0} cellSpacing={0} border={0} width="100%" style={{ borderCollapse: 'collapse' }}>
        <tr>
          <td align="center" style={{ paddingBottom: '20px' }}>
            <NigerMapAccent width={56} fill={colors.gold} opacity={0.55} ariaLabel="" />
          </td>
        </tr>
        <tr>
          <td align="center" style={{ paddingBottom: '6px' }}>
            <Text
              style={{
                margin: 0,
                color: colors.surface,
                fontFamily: fonts.sans,
                fontSize: '16px',
                fontWeight: 800,
                letterSpacing: letterSpacing.caps,
                textTransform: 'uppercase',
              }}
            >
              NFI Report
            </Text>
          </td>
        </tr>
        <tr>
          <td align="center" style={{ paddingBottom: '24px' }}>
            <Text
              style={{
                margin: 0,
                color: colors.gold,
                fontFamily: fonts.sans,
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: letterSpacing.caps,
                textTransform: 'uppercase',
              }}
            >
              Premium Briefing
            </Text>
          </td>
        </tr>
        <tr>
          <td align="center" style={{ paddingBottom: '24px' }}>
            <Text
              style={{
                margin: 0,
                color: colors.inkFaint,
                fontFamily: fonts.sans,
                fontSize: fontSizes.small,
                lineHeight: lineHeights.relaxed,
                fontStyle: 'italic',
                maxWidth: '420px',
              }}
            >
              {signatureLine}
            </Text>
          </td>
        </tr>
      </table>

      {socials && (socials.instagram || socials.facebook || socials.linkedin || socials.tiktok) ? (
        <table
          role="presentation"
          cellPadding={0}
          cellSpacing={0}
          border={0}
          align="center"
          style={{ margin: '0 auto 24px', borderCollapse: 'collapse' }}
        >
          <tr>
            {socials.instagram ? <SocialPill label="Instagram" url={socials.instagram} /> : null}
            {socials.facebook ? <SocialPill label="Facebook" url={socials.facebook} /> : null}
            {socials.linkedin ? <SocialPill label="LinkedIn" url={socials.linkedin} /> : null}
            {socials.tiktok ? <SocialPill label="TikTok" url={socials.tiktok} /> : null}
          </tr>
        </table>
      ) : null}

      <table role="presentation" cellPadding={0} cellSpacing={0} border={0} width="100%" style={{ borderCollapse: 'collapse', borderTop: `1px solid ${colors.inkSoft}`, paddingTop: '20px' }}>
        <tr>
          <td align="center" style={{ paddingTop: '20px' }}>
            <Text
              style={{
                margin: '0 0 6px',
                color: colors.inkFaint,
                fontFamily: fonts.sans,
                fontSize: '12px',
                lineHeight: lineHeights.normal,
              }}
            >
              Cet e-mail vous est envoyé en tant qu’abonné Premium NFI Report.
            </Text>
            <Text
              style={{
                margin: '0 0 12px',
                color: colors.inkFaint,
                fontFamily: fonts.sans,
                fontSize: '12px',
                lineHeight: lineHeights.normal,
              }}
            >
              Pour toute question, écrivez-nous à{' '}
              <Link href={`mailto:${contactEmail}`} style={{ color: colors.gold, textDecoration: 'underline' }}>
                {contactEmail}
              </Link>
              .
            </Text>
            <Text
              style={{
                margin: '0 0 6px',
                color: colors.inkFaint,
                fontFamily: fonts.sans,
                fontSize: '11px',
                lineHeight: lineHeights.normal,
              }}
            >
              <Link href={siteUrl} style={{ color: colors.inkFaint, textDecoration: 'underline' }}>
                nfireport.com
              </Link>
              {managePreferencesUrl ? (
                <>
                  {' · '}
                  <Link href={managePreferencesUrl} style={{ color: colors.inkFaint, textDecoration: 'underline' }}>
                    Gérer mes préférences
                  </Link>
                </>
              ) : null}
              {unsubscribeUrl ? (
                <>
                  {' · '}
                  <Link href={unsubscribeUrl} style={{ color: colors.inkFaint, textDecoration: 'underline' }}>
                    Se désabonner
                  </Link>
                </>
              ) : null}
              {' · '}
              <Link href={`${siteUrl}/confidentialite`} style={{ color: colors.inkFaint, textDecoration: 'underline' }}>
                Confidentialité
              </Link>
            </Text>
            <Text
              style={{
                margin: '12px 0 0',
                color: colors.inkSoft,
                fontFamily: fonts.sans,
                fontSize: '10px',
                lineHeight: lineHeights.normal,
              }}
            >
              © {new Date().getFullYear()} NFI Report · Niamey, Niger
            </Text>
          </td>
        </tr>
      </table>
    </Section>
  );
}
