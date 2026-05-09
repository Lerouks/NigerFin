import * as React from 'react';
import { Section, Link, Text } from '@react-email/components';
import { colors, fonts, lineHeights } from './tokens';
import { NigerMapAccent } from './NigerMapAccent';

export interface FooterProps {
  siteUrl: string;
  managePreferencesUrl?: string;
  unsubscribeUrl?: string;
  contactEmail?: string;
  socials?: { instagram?: string; facebook?: string; linkedin?: string; tiktok?: string };
  signatureLine?: string;
  /** Date en clair du prochain envoi : "Lundi 11 mai · 7h". */
  nextIssueLabel?: string;
}

function SocialPill({ label, url }: { label: string; url: string }) {
  return (
    <td style={{ padding: '0 5px' }}>
      <Link
        href={url}
        style={{
          display: 'inline-block',
          padding: '7px 16px',
          borderRadius: '999px',
          border: `1px solid ${colors.gold}`,
          color: colors.surface,
          fontFamily: fonts.sans,
          fontSize: '11px',
          fontWeight: 700,
          textDecoration: 'none',
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
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
  signatureLine = 'Cette édition a été composée par la rédaction NFI Report depuis Niamey.',
  nextIssueLabel,
}: FooterProps) {
  const hasSocials = socials && (socials.instagram || socials.facebook || socials.linkedin || socials.tiktok);
  return (
    <Section style={{ backgroundColor: colors.primary, padding: '48px 32px 36px' }}>
      {/* Carte Niger grand format avec point Niamey */}
      <table role="presentation" cellPadding={0} cellSpacing={0} border={0} width="100%" style={{ borderCollapse: 'collapse' }}>
        <tr>
          <td align="center" style={{ paddingBottom: '14px' }}>
            <NigerMapAccent
              width={120}
              variant="outline"
              stroke={colors.gold}
              strokeWidth={2}
              opacity={0.85}
              showNiamey
              niameyColor={colors.gold}
              ariaLabel="Niger, capitale Niamey"
            />
          </td>
        </tr>
        <tr>
          <td align="center" style={{ paddingBottom: '4px' }}>
            <Text
              style={{
                margin: 0,
                color: colors.inkFaint,
                fontFamily: fonts.sans,
                fontSize: '9px',
                fontWeight: 600,
                letterSpacing: '3px',
                textTransform: 'uppercase',
              }}
            >
              Niamey · Niger
            </Text>
          </td>
        </tr>
        <tr>
          <td align="center" style={{ paddingTop: '20px', paddingBottom: '6px' }}>
            <Text
              style={{
                margin: 0,
                color: colors.surface,
                fontFamily: fonts.sans,
                fontSize: '20px',
                fontWeight: 900,
                letterSpacing: '6px',
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
                fontWeight: 700,
                letterSpacing: '4px',
                textTransform: 'uppercase',
              }}
            >
              Le Premium Briefing
            </Text>
          </td>
        </tr>
        <tr>
          <td align="center" style={{ paddingBottom: '28px' }}>
            <Text
              style={{
                margin: 0,
                color: colors.inkFaint,
                fontFamily: "Arial, Helvetica, sans-serif",
                fontSize: '13px',
                lineHeight: lineHeights.relaxed,
                fontStyle: 'italic',
                maxWidth: '380px',
              }}
            >
              {signatureLine}
            </Text>
          </td>
        </tr>
      </table>

      {hasSocials ? (
        <table role="presentation" cellPadding={0} cellSpacing={0} border={0} align="center" style={{ margin: '0 auto 28px', borderCollapse: 'collapse' }}>
          <tr>
            {socials?.instagram ? <SocialPill label="Instagram" url={socials.instagram} /> : null}
            {socials?.facebook ? <SocialPill label="Facebook" url={socials.facebook} /> : null}
            {socials?.linkedin ? <SocialPill label="LinkedIn" url={socials.linkedin} /> : null}
            {socials?.tiktok ? <SocialPill label="TikTok" url={socials.tiktok} /> : null}
          </tr>
        </table>
      ) : null}

      {nextIssueLabel ? (
        <table role="presentation" cellPadding={0} cellSpacing={0} border={0} width="100%" style={{ borderCollapse: 'collapse', borderTop: `1px solid ${colors.inkSoft}`, marginBottom: '8px' }}>
          <tr>
            <td align="center" style={{ paddingTop: '20px', paddingBottom: '8px' }}>
              <Text
                style={{
                  margin: 0,
                  color: colors.gold,
                  fontFamily: fonts.sans,
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '4px',
                  textTransform: 'uppercase',
                }}
              >
                Prochain numéro
              </Text>
              <Text
                style={{
                  margin: '4px 0 0',
                  color: colors.surface,
                  fontFamily: fonts.sans,
                  fontSize: '13px',
                  fontWeight: 700,
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                }}
              >
                {nextIssueLabel}
              </Text>
            </td>
          </tr>
        </table>
      ) : null}

      <table role="presentation" cellPadding={0} cellSpacing={0} border={0} width="100%" style={{ borderCollapse: 'collapse', borderTop: nextIssueLabel ? 'none' : `1px solid ${colors.inkSoft}` }}>
        <tr>
          <td align="center" style={{ paddingTop: nextIssueLabel ? '16px' : '20px' }}>
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
                margin: '0 0 14px',
                color: colors.inkFaint,
                fontFamily: fonts.sans,
                fontSize: '12px',
                lineHeight: lineHeights.normal,
              }}
            >
              Pour toute question, écrivez à{' '}
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
                margin: '14px 0 0',
                color: colors.inkSoft,
                fontFamily: fonts.sans,
                fontSize: '10px',
                letterSpacing: '0.5px',
                lineHeight: lineHeights.normal,
              }}
            >
              © {new Date().getFullYear()} NFI Report · Niamey, Niger · Tous droits réservés
            </Text>
          </td>
        </tr>
      </table>
    </Section>
  );
}

