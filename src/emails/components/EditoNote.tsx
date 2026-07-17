import * as React from 'react';
import { Section, Text } from '@react-email/components';
import { colors, fonts, fontSizes, lineHeights } from './tokens';
import { sanitizeEmailHtml } from '../lib/sanitize';

export interface EditoNoteProps {
  /** Salutation en eyebrow or, ex: "Bonjour" ou "La note du redacteur". */
  eyebrow?: string;
  /** Texte HTML rich (gras, italique, lien autorises). */
  body: string;
  /** Signature en italique or sous le mot, ex: "La redaction NFI Report". */
  signature?: string;
}

/**
 * Mot du redacteur en chef en ouverture de newsletter.
 * Format magazine : eyebrow or, paragraphe(s) rich text, signature italique.
 */
export function EditoNote({
  eyebrow = 'La note du rédacteur',
  body,
  signature = 'La rédaction NFI Report',
}: EditoNoteProps) {
  return (
    <Section style={{ padding: '48px 32px 24px' }}>
      <Text
        style={{
          margin: '0 0 20px',
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
      <div
        style={{
          margin: 0,
          color: colors.inkSoft,
          fontFamily: fonts.sans,
          fontSize: fontSizes.body,
          lineHeight: lineHeights.relaxed,
        }}
        dangerouslySetInnerHTML={{ __html: sanitizeEmailHtml(body) }}
      />
      <Text
        style={{
          margin: '26px 0 0',
          color: colors.gold,
          fontFamily: fonts.sans,
          fontSize: '13px',
          fontStyle: 'italic',
          letterSpacing: '0.3px',
        }}
      >
        {signature}
      </Text>
    </Section>
  );
}
