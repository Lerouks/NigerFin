import { SITE_URL } from '@/lib/config';

function emailLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f4;font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f4;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

<!-- Header -->
<tr><td style="background-color:#111111;padding:28px 32px;text-align:center;">
  <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:2px;text-decoration:none;font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;">NFI REPORT</span>
</td></tr>
<!-- Gold accent line -->
<tr><td style="background-color:#d4a843;height:3px;font-size:0;line-height:0;">&nbsp;</td></tr>

<!-- Content -->
<tr><td style="background-color:#ffffff;padding:40px 32px;">
${content}
</td></tr>

<!-- Footer -->
<tr><td style="background-color:#fafaf9;padding:24px 32px;border-top:1px solid #e5e5e5;text-align:center;">
  <p style="margin:0 0 6px;font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:13px;font-style:italic;color:#d4a843;letter-spacing:0.3px;">La connaissance, votre meilleur capital.</p>
  <p style="margin:0 0 8px;font-size:12px;color:#a3a3a3;">NFI Report, actualités économiques et financières du Niger</p>
  <p style="margin:0;font-size:12px;color:#d4d4d4;">
    <a href="${SITE_URL}" style="color:#a3a3a3;text-decoration:underline;">nfireport.com</a>
    &nbsp;&middot;&nbsp;
    <a href="${SITE_URL}/confidentialite" style="color:#a3a3a3;text-decoration:underline;">Confidentialité</a>
    &nbsp;&middot;&nbsp;
    <a href="${SITE_URL}/contact" style="color:#a3a3a3;text-decoration:underline;">Contact</a>
  </p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

function button(label: string, href: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px 0;">
<tr><td style="background-color:#111111;border-radius:6px;padding:12px 28px;">
  <a href="${href}" style="color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;display:inline-block;">${label}</a>
</td></tr>
</table>`;
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#111111;">${text}</h1>`;
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#404040;">${text}</p>`;
}

function signature(): string {
  return `<p style="margin:24px 0 0;font-size:15px;line-height:1.6;color:#404040;">Cordialement,<br/>L'équipe NFI Report</p>`;
}

// ─── Receipt-style layout (sober, Apple-style, used by invoice email) ───
// Not the same universe as emailLayout(): no gold brand line, no slogan,
// no editorial tone. Receipts are legal documents, not brand moments.

function receiptLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="x-apple-disable-message-reformatting"/>
<meta name="color-scheme" content="light only"/>
<meta name="supported-color-schemes" content="light only"/>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Inter','Helvetica Neue',Helvetica,Arial,sans-serif;color:#1d1d1f;-webkit-font-smoothing:antialiased;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f7;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;">

<tr><td align="center" style="padding:32px 32px 24px;border-bottom:1px solid #d2d2d7;">
  <p style="margin:0 0 4px;color:#1d1d1f;font-family:'Inter',sans-serif;font-size:17px;font-weight:700;letter-spacing:3px;">NFI REPORT</p>
  <p style="margin:0;color:#86868b;font-family:'Inter',sans-serif;font-size:11px;letter-spacing:1px;text-transform:uppercase;">Reçu de paiement</p>
</td></tr>

${content}

<tr><td align="center" style="padding:24px 32px 28px;background-color:#f5f5f7;border-top:1px solid #d2d2d7;">
  <p style="margin:0 0 6px;color:#1d1d1f;font-family:'Inter',sans-serif;font-size:13px;font-weight:600;">NFI Group SARL</p>
  <p style="margin:0 0 12px;color:#86868b;font-family:'Inter',sans-serif;font-size:11px;line-height:1.65;letter-spacing:0.2px;">SARL au capital de 1 000 000 FCFA &middot; Siège : Quartier Plateau, Niamey, Niger<br/>Tél. +227 97 76 91 31</p>
  <p style="margin:0;color:#86868b;font-family:'Inter',sans-serif;font-size:11px;line-height:1.65;">
    <a href="mailto:contact@nfireport.com" style="color:#1d1d1f;text-decoration:underline;">contact@nfireport.com</a>&nbsp;&middot;&nbsp;
    <a href="${SITE_URL}" style="color:#1d1d1f;text-decoration:underline;">nfireport.com</a>
  </p>
  <p style="margin:14px 0 0;color:#86868b;font-family:'Inter',sans-serif;font-size:10px;font-style:italic;letter-spacing:0.3px;">Document généré électroniquement, valide sans signature manuscrite.</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

function formatDateFr(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatXofAmount(amount: number): string {
  return `${amount.toLocaleString('fr-FR')} FCFA`;
}

// ─── Email templates ───

export function welcomeSignupEmail(name: string): { subject: string; html: string } {
  return {
    subject: 'Bienvenue sur NFI Report !',
    html: emailLayout(`
${heading('Bienvenue sur NFI Report')}
${paragraph(`Bonjour ${name},`)}
${paragraph("Votre compte a bien été créé. Vous avez désormais accès à nos articles, analyses économiques et outils financiers dédiés au Niger et à l'Afrique de l'Ouest.")}
${paragraph('Avec votre compte gratuit, vous pouvez lire jusqu\'à 3 articles premium par mois, accéder aux outils de base et vous abonner à notre newsletter.')}
${button('Découvrir les articles', `${SITE_URL}`)}
${paragraph('Pour un accès illimité à tous nos contenus et outils premium, découvrez notre offre Premium.')}
${signature()}
    `),
  };
}

export function newsletterWelcomeEmail(): { subject: string; html: string } {
  return {
    subject: 'Bienvenue sur NFI Report',
    html: emailLayout(`
${heading('Bienvenue sur NFI Report')}
${paragraph("Vous êtes désormais inscrit. Vous recevrez nos briefings économiques sur le Niger et l'Afrique de l'Ouest : analyses, données de marché et décryptages.")}
${button('Lire les derniers articles', `${SITE_URL}`)}
<div style="background-color:#fafaf9;border-radius:8px;padding:20px 24px;margin:24px 0;">
  <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#111;">Envie d'aller plus loin ?</p>
  <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#404040;">Les abonnés Premium reçoivent 2 analyses exclusives par semaine, des alertes en temps réel et l'accès à tous nos outils financiers.</p>
  <a href="${SITE_URL}/pricing" style="color:#d4a843;font-size:14px;font-weight:600;text-decoration:underline;">Découvrir l'offre Premium →</a>
</div>
${signature()}
    `),
  };
}

export function contactConfirmationEmail(name: string): { subject: string; html: string } {
  return {
    subject: 'Nous avons bien reçu votre message - NFI Report',
    html: emailLayout(`
${heading('Message bien reçu')}
${paragraph(`Bonjour ${name},`)}
${paragraph('Nous avons bien reçu votre message et notre équipe vous répondra dans les plus brefs délais.')}
${paragraph("En attendant, n'hésitez pas à consulter nos derniers articles et analyses.")}
${button('Consulter le site', `${SITE_URL}`)}
${signature()}
    `),
  };
}

export function contactNotificationEmail(name: string, email: string, subject: string, message: string): { subject: string; html: string } {
  return {
    subject: `[Contact] ${subject} - ${name}`,
    html: emailLayout(`
${heading('Nouveau message de contact')}
<table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
  <tr><td style="padding:8px 0;font-size:14px;color:#737373;width:80px;">Nom</td><td style="padding:8px 0;font-size:15px;color:#111;">${name}</td></tr>
  <tr><td style="padding:8px 0;font-size:14px;color:#737373;">Email</td><td style="padding:8px 0;font-size:15px;color:#111;"><a href="mailto:${email}" style="color:#111;">${email}</a></td></tr>
  <tr><td style="padding:8px 0;font-size:14px;color:#737373;">Sujet</td><td style="padding:8px 0;font-size:15px;color:#111;">${subject}</td></tr>
</table>
<div style="background-color:#fafaf9;border-left:3px solid #111;padding:16px;margin:16px 0;font-size:15px;line-height:1.6;color:#404040;">
${message}
</div>
    `),
  };
}

export function paymentConfirmationEmail(name: string, tier: string, billingCycle: string, expiresAt: string): { subject: string; html: string } {
  const cycleLabel = billingCycle === 'annual' ? 'annuel' : billingCycle === 'semi_annual' ? 'semestriel' : 'mensuel';
  const formattedDate = new Date(expiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  return {
    subject: 'Votre abonnement Premium est activé - NFI Report',
    html: emailLayout(`
${heading('Abonnement Premium activé')}
${paragraph(`Bonjour ${name},`)}
${paragraph(`Votre paiement a été vérifié et votre abonnement <strong>Premium ${cycleLabel}</strong> est maintenant actif.`)}
<table style="width:100%;border-collapse:collapse;background-color:#fafaf9;border-radius:8px;margin:16px 0;padding:16px;">
  <tr><td style="padding:12px 16px;font-size:14px;color:#737373;">Formule</td><td style="padding:12px 16px;font-size:15px;color:#111;font-weight:600;">Premium ${cycleLabel}</td></tr>
  <tr><td style="padding:12px 16px;font-size:14px;color:#737373;">Valide jusqu'au</td><td style="padding:12px 16px;font-size:15px;color:#111;font-weight:600;">${formattedDate}</td></tr>
</table>
${paragraph("Vous avez désormais un accès illimité à tous les articles, analyses, outils premium et newsletters exclusives.")}
${button('Accéder à votre compte', `${SITE_URL}/compte`)}
${signature()}
    `),
  };
}

export function paymentRejectionEmail(name: string, reason?: string): { subject: string; html: string } {
  const reasonBlock = reason
    ? `${paragraph(`<strong>Motif :</strong> ${reason}`)}`
    : '';

  return {
    subject: 'Paiement non validé - NFI Report',
    html: emailLayout(`
${heading('Paiement non validé')}
${paragraph(`Bonjour ${name},`)}
${paragraph("Nous n'avons pas pu valider votre paiement. Votre abonnement n'a pas été activé.")}
${reasonBlock}
${paragraph("Si vous pensez qu'il s'agit d'une erreur, vous pouvez soumettre une nouvelle demande ou nous contacter directement.")}
${button('Réessayer le paiement', `${SITE_URL}/pricing`)}
${paragraph('Vous pouvez aussi nous contacter à <a href="mailto:contact@nfireport.com" style="color:#111;text-decoration:underline;">contact@nfireport.com</a>.')}
${signature()}
    `),
  };
}

export function subscriptionExpirationWarningEmail(name: string, expiresAt: string): { subject: string; html: string } {
  const formattedDate = new Date(expiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  return {
    subject: 'Votre abonnement expire bientôt - NFI Report',
    html: emailLayout(`
${heading('Votre abonnement expire bientôt')}
${paragraph(`Bonjour ${name},`)}
${paragraph(`Votre abonnement Premium expire le <strong>${formattedDate}</strong>. Après cette date, vous perdrez l'accès aux articles premium, outils avancés et newsletters exclusives.`)}
${paragraph('Renouvelez dès maintenant pour continuer à bénéficier de tous les avantages Premium sans interruption.')}
${button('Renouveler mon abonnement', `${SITE_URL}/pricing`)}
${signature()}
    `),
  };
}

// ─── Admin subscription management emails ───

export function adminPremiumGrantedEmail(name: string, startDate: string, endDate: string): { subject: string; html: string } {
  const formattedStart = new Date(startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const formattedEnd = new Date(endDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  return {
    subject: 'Votre abonnement Premium NFI REPORT est activé',
    html: emailLayout(`
${heading('Votre abonnement Premium est activé')}
${paragraph(`Bonjour ${name},`)}
${paragraph("Nous avons le plaisir de vous informer que votre abonnement <strong>Premium NFI Report</strong> est désormais actif.")}
<table style="width:100%;border-collapse:collapse;background-color:#fafaf9;border-radius:8px;margin:16px 0;">
  <tr><td style="padding:12px 16px;font-size:14px;color:#737373;">Type d'abonnement</td><td style="padding:12px 16px;font-size:15px;color:#111;font-weight:600;">Premium</td></tr>
  <tr><td style="padding:12px 16px;font-size:14px;color:#737373;">Date de début</td><td style="padding:12px 16px;font-size:15px;color:#111;font-weight:600;">${formattedStart}</td></tr>
  <tr><td style="padding:12px 16px;font-size:14px;color:#737373;">Date de fin</td><td style="padding:12px 16px;font-size:15px;color:#111;font-weight:600;">${formattedEnd}</td></tr>
</table>
${paragraph("Vous avez désormais un accès immédiat et illimité à tous les contenus premium : articles, analyses, outils avancés et newsletters exclusives.")}
${button('Accéder aux contenus Premium', `${SITE_URL}/compte`)}
${signature()}
    `),
  };
}

export function adminDowngradeToFreeEmail(name: string): { subject: string; html: string } {
  return {
    subject: 'Modification de votre abonnement NFI REPORT',
    html: emailLayout(`
${heading('Modification de votre abonnement')}
${paragraph(`Bonjour ${name},`)}
${paragraph("Votre abonnement a été modifié. Votre statut est désormais <strong>Lecteur gratuit</strong>.")}
${paragraph("Ce changement prend effet immédiatement. Vous conservez l'accès aux articles gratuits et à un nombre limité d'articles premium par mois.")}
${paragraph("Pour retrouver un accès illimité à tous nos contenus et outils premium, vous pouvez vous réabonner à tout moment.")}
${button('Voir les offres Premium', `${SITE_URL}/pricing`)}
${signature()}
    `),
  };
}

export function passwordChangedEmail(name: string): { subject: string; html: string } {
  return {
    subject: 'Votre mot de passe NFI REPORT a été modifié',
    html: emailLayout(`
${heading('Mot de passe modifié')}
${paragraph(`Bonjour ${name},`)}
${paragraph("Votre mot de passe NFI Report a été modifié avec succès.")}
${paragraph("Si vous n'êtes pas à l'origine de cette modification, veuillez nous contacter immédiatement à <a href=\"mailto:contact@nfireport.com\" style=\"color:#111;text-decoration:underline;\">contact@nfireport.com</a> pour sécuriser votre compte.")}
${button('Accéder à votre compte', `${SITE_URL}/compte`)}
${signature()}
    `),
  };
}

// ─── Invoice email (receipt Apple-style universe, no slogan) ───

export function invoiceEmail({
  customerName,
  invoiceNumber,
  amountXof,
  paidAt,
  periodStart,
  periodEnd,
  downloadUrl,
}: {
  customerName: string;
  invoiceNumber: string;
  amountXof: number;
  paidAt: string;
  periodStart?: string;
  periodEnd?: string;
  downloadUrl: string;
}): { subject: string; html: string } {
  const periodLine = periodStart && periodEnd
    ? `Accès illimité aux articles, analyses, simulateurs et briefings exclusifs, du ${formatDateFr(periodStart)} au ${formatDateFr(periodEnd)}.`
    : 'Accès illimité aux articles, analyses, simulateurs et briefings exclusifs.';

  const content = `
<tr><td style="padding:32px 32px 22px;">
  <h1 style="margin:0 0 12px;color:#1d1d1f;font-family:'Inter',sans-serif;font-size:24px;font-weight:700;letter-spacing:-0.4px;line-height:1.2;">Votre facture est disponible</h1>
  <p style="margin:0 0 8px;color:#3a3a3c;font-family:'Inter',sans-serif;font-size:15px;line-height:1.55;">Bonjour ${customerName},</p>
  <p style="margin:0;color:#3a3a3c;font-family:'Inter',sans-serif;font-size:15px;line-height:1.55;">Vous trouverez ci-joint au format PDF votre facture pour l'activation de votre abonnement Premium. Vous pouvez la télécharger ici, ou la retrouver à tout moment dans votre espace compte.</p>
</td></tr>

<tr><td style="padding:0 32px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1d1d1f;border-radius:10px;">
    <tr><td style="padding:22px 24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="50%" style="padding:0 12px 0 0;">
            <p style="margin:0 0 4px;color:rgba(255,255,255,0.55);font-family:'Inter',sans-serif;font-size:9.5px;font-weight:600;letter-spacing:1.8px;text-transform:uppercase;">Numéro</p>
            <p style="margin:0;color:#ffffff;font-family:'Inter',sans-serif;font-size:14px;font-weight:600;font-variant-numeric:tabular-nums;">${invoiceNumber}</p>
          </td>
          <td width="50%">
            <p style="margin:0 0 4px;color:rgba(255,255,255,0.55);font-family:'Inter',sans-serif;font-size:9.5px;font-weight:600;letter-spacing:1.8px;text-transform:uppercase;">Date</p>
            <p style="margin:0;color:#ffffff;font-family:'Inter',sans-serif;font-size:14px;font-weight:600;">${formatDateFr(paidAt)}</p>
          </td>
        </tr>
        <tr><td colspan="2" style="height:18px;line-height:18px;font-size:0;">&nbsp;</td></tr>
        <tr>
          <td width="50%" style="padding:0 12px 0 0;">
            <p style="margin:0 0 4px;color:rgba(255,255,255,0.55);font-family:'Inter',sans-serif;font-size:9.5px;font-weight:600;letter-spacing:1.8px;text-transform:uppercase;">Montant</p>
            <p style="margin:0;color:#ffffff;font-family:'Inter',sans-serif;font-size:18px;font-weight:700;font-variant-numeric:tabular-nums;">${formatXofAmount(amountXof)}</p>
          </td>
          <td width="50%">
            <p style="margin:0 0 4px;color:rgba(255,255,255,0.55);font-family:'Inter',sans-serif;font-size:9.5px;font-weight:600;letter-spacing:1.8px;text-transform:uppercase;">Statut</p>
            <p style="margin:0;color:#16a34a;font-family:'Inter',sans-serif;font-size:14px;font-weight:700;letter-spacing:0.5px;">PAYÉ ✓</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</td></tr>

<tr><td style="padding:24px 32px 8px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f7;border-radius:8px;">
    <tr><td style="padding:16px 20px;">
      <p style="margin:0 0 4px;color:#86868b;font-family:'Inter',sans-serif;font-size:10px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;">Prestation</p>
      <p style="margin:0 0 4px;color:#1d1d1f;font-family:'Inter',sans-serif;font-size:14.5px;font-weight:600;">Abonnement Premium</p>
      <p style="margin:0;color:#3a3a3c;font-family:'Inter',sans-serif;font-size:13px;line-height:1.5;">${periodLine}</p>
    </td></tr>
  </table>
</td></tr>

<tr><td align="center" style="padding:28px 32px 4px;">
  <table role="presentation" cellpadding="0" cellspacing="0">
    <tr><td style="background-color:#1d1d1f;border-radius:8px;">
      <a href="${downloadUrl}" style="display:inline-block;padding:14px 32px;color:#ffffff;font-family:'Inter',sans-serif;font-size:14px;font-weight:600;letter-spacing:0.3px;text-decoration:none;">Télécharger la facture (PDF)</a>
    </td></tr>
  </table>
</td></tr>

<tr><td align="center" style="padding:8px 32px 28px;">
  <a href="${SITE_URL}/compte/factures" style="font-family:'Inter',sans-serif;font-size:13px;color:#86868b;text-decoration:underline;">Voir toutes mes factures dans mon compte</a>
</td></tr>

<tr><td style="padding:0 32px 28px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fff9eb;border-left:3px solid #d97706;">
    <tr><td style="padding:12px 16px;">
      <p style="margin:0;color:#5c4308;font-family:'Inter',sans-serif;font-size:11.5px;line-height:1.55;"><strong>Conservation.</strong> Cette facture est un document comptable. Conservez-en une copie pour votre comptabilité (durée légale OHADA, 10 ans).</p>
    </td></tr>
  </table>
</td></tr>`;

  return {
    subject: `Votre facture ${invoiceNumber} - NFI Report`,
    html: receiptLayout(content),
  };
}

export function subscriptionExpiredEmail(name: string, expiresAt: string): { subject: string; html: string } {
  const formattedDate = new Date(expiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  return {
    subject: 'Votre abonnement Premium NFI REPORT a expiré',
    html: emailLayout(`
${heading('Votre abonnement Premium a expiré')}
${paragraph(`Bonjour ${name},`)}
${paragraph(`Votre abonnement Premium a expiré le <strong>${formattedDate}</strong>.`)}
${paragraph("Vous n'avez plus accès aux articles premium, outils avancés et newsletters exclusives. Votre statut est désormais Lecteur gratuit.")}
${paragraph("Renouvelez votre abonnement dès maintenant pour retrouver un accès illimité à tous nos contenus.")}
${button('Renouveler mon abonnement', `${SITE_URL}/pricing`)}
${signature()}
    `),
  };
}
