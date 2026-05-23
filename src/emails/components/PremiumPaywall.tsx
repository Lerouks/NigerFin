import * as React from 'react';
import { Button, Section, Text } from '@react-email/components';
import { colors, fonts } from './tokens';

export interface PremiumPaywallProps {
  /** URL de la page d'inscription Premium sur le site. */
  upgradeUrl: string;
  /** Prix affiché (FCFA). Par défaut: 5000. */
  priceFcfa?: number;
}

/**
 * Bloc paywall affiché aux abonnés Gratuits à la place du contenu Premium.
 *
 * Stratégie : email coupé net après l'intro + headline featured, puis ce bloc
 * remplace toute la suite (marchés, KPI Niger, digest, citations, radar, etc.).
 *
 * Inspiré du paywall Substack / The Information / Stratechery : pas de
 * floutage CSS (instable sur Outlook/Yahoo), juste un bandeau premium clair
 * avec valeur perçue + CTA.
 */
export function PremiumPaywall({ upgradeUrl, priceFcfa = 5000 }: PremiumPaywallProps) {
  const benefits = [
    "L'analyse complète de cet édito (1500 à 2500 mots)",
    'Les indices BRVM et données macro Niger à jour chaque édition',
    'Les briefings exclusifs : entreprises stratégiques, radar et citations',
    "Archive intégrale de toutes les éditions précédentes",
  ];

  return (
    <Section style={{ padding: '24px 32px 40px' }}>
      <table
        role="presentation"
        cellPadding={0}
        cellSpacing={0}
        border={0}
        width="100%"
        style={{
          borderCollapse: 'collapse',
          backgroundColor: colors.primary,
          borderRadius: '16px',
          overflow: 'hidden',
        }}
      >
        <tbody>
          <tr>
            <td style={{ padding: '36px 32px 32px', textAlign: 'center' }}>
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
                Premium Briefing
              </Text>
              <Text
                style={{
                  margin: '0 0 14px',
                  color: '#ffffff',
                  fontFamily: 'Arial, Helvetica, sans-serif',
                  fontSize: '24px',
                  fontWeight: 700,
                  letterSpacing: '-0.4px',
                  lineHeight: 1.25,
                }}
              >
                La suite est réservée aux abonnés Premium
              </Text>
              <Text
                style={{
                  margin: '0 0 24px',
                  color: 'rgba(255,255,255,0.72)',
                  fontFamily: fonts.sans,
                  fontSize: '14px',
                  lineHeight: 1.6,
                }}
              >
                NFI Report Premium, l&apos;intelligence économique du Niger et de l&apos;UEMOA.
                Un investissement ponctuel de {priceFcfa.toLocaleString('fr-FR')} FCFA pour
                accéder à toutes nos analyses, données et briefings.
              </Text>

              <table
                role="presentation"
                cellPadding={0}
                cellSpacing={0}
                border={0}
                width="100%"
                style={{
                  borderCollapse: 'collapse',
                  margin: '0 0 28px',
                  textAlign: 'left',
                }}
              >
                <tbody>
                  {benefits.map((benefit) => (
                    <tr key={benefit}>
                      <td
                        valign="top"
                        style={{
                          width: '18px',
                          paddingBottom: '10px',
                          color: colors.gold,
                          fontFamily: fonts.sans,
                          fontSize: '14px',
                          fontWeight: 700,
                          lineHeight: 1.5,
                        }}
                      >
                        ✓
                      </td>
                      <td
                        style={{
                          paddingBottom: '10px',
                          color: 'rgba(255,255,255,0.85)',
                          fontFamily: fonts.sans,
                          fontSize: '14px',
                          lineHeight: 1.55,
                        }}
                      >
                        {benefit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <Button
                href={upgradeUrl}
                style={{
                  backgroundColor: colors.gold,
                  color: colors.primary,
                  fontFamily: fonts.sans,
                  fontSize: '15px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  padding: '14px 32px',
                  borderRadius: '10px',
                  letterSpacing: '-0.1px',
                  display: 'inline-block',
                }}
              >
                Devenir Premium pour {priceFcfa.toLocaleString('fr-FR')} FCFA
              </Button>

              <Text
                style={{
                  margin: '18px 0 0',
                  color: 'rgba(255,255,255,0.5)',
                  fontFamily: fonts.sans,
                  fontSize: '12px',
                  lineHeight: 1.5,
                }}
              >
                Paiement unique. Pas d&apos;abonnement récurrent. Pas de prélèvement automatique.
              </Text>
            </td>
          </tr>
        </tbody>
      </table>
    </Section>
  );
}
