/**
 * Génère un audit visuel statique de TOUS les emails NFI Report.
 *
 * Usage : `npx tsx scripts/audit-emails.ts`
 *
 * Sortie : `~/AUDIT EMAILS NFI/` contenant 1 HTML par email + un index navigable.
 * Aucune dépendance externe au site (pas d'envoi réel, données factices).
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

import { renderPremiumBriefingHtml } from '@/emails/render';
import { issue001Demo } from '@/data/newsletter-issues/001-fictif';
import { SITE_URL } from '@/lib/config';
import {
  welcomeSignupEmail,
  newsletterWelcomeEmail,
  contactConfirmationEmail,
  contactNotificationEmail,
  paymentConfirmationEmail,
  paymentRejectionEmail,
  subscriptionExpirationWarningEmail,
  adminPremiumGrantedEmail,
  adminDowngradeToFreeEmail,
  passwordChangedEmail,
  subscriptionExpiredEmail,
} from '@/lib/email-templates';

interface EmailEntry {
  filename: string;
  label: string;
  category: string;
  subject: string;
  html: string;
  trigger: string;
}

const OUT_DIR = join(homedir(), 'AUDIT EMAILS NFI');
const SAMPLE_NAME = 'Mansour Djermakoye';
const SAMPLE_EMAIL = 'mansour.djermakoye@example.com';

function plus(days: number): string {
  return new Date(Date.now() + days * 86400000).toISOString();
}

function minus(days: number): string {
  return new Date(Date.now() - days * 86400000).toISOString();
}

async function buildAllEntries(): Promise<EmailEntry[]> {
  const entries: EmailEntry[] = [];

  const newsletterHtml = await renderPremiumBriefingHtml({
    issue: issue001Demo,
    siteUrl: SITE_URL,
    managePreferencesUrl: `${SITE_URL}/compte/preferences-newsletter`,
    unsubscribeUrl: `${SITE_URL}/api/newsletter/unsubscribe?token=DEMO`,
    socials: {
      instagram: 'https://instagram.com/nfireport',
      facebook: 'https://facebook.com/nfireport',
      tiktok: 'https://tiktok.com/@nfireport',
    },
  });

  entries.push({
    filename: '01-newsletter-premium-briefing.html',
    label: 'Newsletter Premium Briefing n°01',
    category: 'Newsletter',
    subject: issue001Demo.subject,
    html: newsletterHtml,
    trigger: 'Envoyée chaque lundi à 7h GMT aux abonnés Premium (numéro de démonstration).',
  });

  const t1 = welcomeSignupEmail(SAMPLE_NAME);
  entries.push({
    filename: '02-welcome-signup.html',
    label: 'Bienvenue sur NFI Report (compte créé)',
    category: 'Onboarding',
    subject: t1.subject,
    html: t1.html,
    trigger: "Envoyé immédiatement après la création d'un compte gratuit.",
  });

  const t2 = newsletterWelcomeEmail();
  entries.push({
    filename: '03-newsletter-welcome.html',
    label: 'Bienvenue à la newsletter',
    category: 'Onboarding',
    subject: t2.subject,
    html: t2.html,
    trigger: "Envoyé après inscription au formulaire newsletter (visiteur ou utilisateur connecté).",
  });

  const t3 = contactConfirmationEmail(SAMPLE_NAME);
  entries.push({
    filename: '04-contact-confirmation.html',
    label: 'Confirmation message reçu',
    category: 'Contact',
    subject: t3.subject,
    html: t3.html,
    trigger: "Envoyé à l'utilisateur après soumission du formulaire de contact.",
  });

  const t4 = contactNotificationEmail(
    SAMPLE_NAME,
    SAMPLE_EMAIL,
    "Question sur l'abonnement Premium",
    "Bonjour, j'aimerais savoir si l'abonnement annuel donne accès à toutes les newsletters passées. Merci.",
  );
  entries.push({
    filename: '05-contact-notification-admin.html',
    label: 'Notif admin nouveau message contact',
    category: 'Contact',
    subject: t4.subject,
    html: t4.html,
    trigger: 'Envoyé à toi (admin) à chaque nouveau message de contact reçu.',
  });

  const t5 = paymentConfirmationEmail(SAMPLE_NAME, 'premium', 'annual', plus(365));
  entries.push({
    filename: '06-payment-confirmation.html',
    label: 'Paiement Premium validé',
    category: 'Paiement',
    subject: t5.subject,
    html: t5.html,
    trigger: "Envoyé après validation manuelle d'un paiement iPayMoney.",
  });

  const t6 = paymentRejectionEmail(
    SAMPLE_NAME,
    "Numéro de transaction iPayMoney introuvable. Veuillez vérifier le code de votre SMS de confirmation.",
  );
  entries.push({
    filename: '07-payment-rejection.html',
    label: 'Paiement Premium rejeté',
    category: 'Paiement',
    subject: t6.subject,
    html: t6.html,
    trigger: "Envoyé quand la vérification d'un paiement échoue.",
  });

  const t7 = subscriptionExpirationWarningEmail(SAMPLE_NAME, plus(7));
  entries.push({
    filename: '08-subscription-warning.html',
    label: 'Premium expire bientôt (J-7)',
    category: 'Cycle abonnement',
    subject: t7.subject,
    html: t7.html,
    trigger: "Envoyé chaque matin à 8h, 7 jours avant l'expiration Premium.",
  });

  const t8 = adminPremiumGrantedEmail(SAMPLE_NAME, new Date().toISOString(), plus(365));
  entries.push({
    filename: '09-admin-premium-granted.html',
    label: 'Admin a accordé Premium',
    category: 'Admin',
    subject: t8.subject,
    html: t8.html,
    trigger: 'Envoyé quand toi (admin) actives manuellement Premium pour un utilisateur.',
  });

  const t9 = adminDowngradeToFreeEmail(SAMPLE_NAME);
  entries.push({
    filename: '10-admin-downgrade.html',
    label: 'Admin a remis en Lecteur gratuit',
    category: 'Admin',
    subject: t9.subject,
    html: t9.html,
    trigger: 'Envoyé quand toi (admin) downgrades un utilisateur Premium en gratuit.',
  });

  const t10 = passwordChangedEmail(SAMPLE_NAME);
  entries.push({
    filename: '11-password-changed.html',
    label: 'Mot de passe modifié',
    category: 'Sécurité',
    subject: t10.subject,
    html: t10.html,
    trigger: "Envoyé à l'utilisateur après changement de mot de passe.",
  });

  const t11 = subscriptionExpiredEmail(SAMPLE_NAME, minus(1));
  entries.push({
    filename: '12-subscription-expired.html',
    label: 'Premium a expiré',
    category: 'Cycle abonnement',
    subject: t11.subject,
    html: t11.html,
    trigger: 'Envoyé le matin où Premium expire (cron 2h GMT, expire-subscriptions).',
  });

  return entries;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildIndexHtml(entries: EmailEntry[]): string {
  const byCategory = new Map<string, EmailEntry[]>();
  for (const e of entries) {
    const list = byCategory.get(e.category) ?? [];
    list.push(e);
    byCategory.set(e.category, list);
  }

  const generatedAt = new Date().toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const sections = Array.from(byCategory.entries())
    .map(([cat, list]) => {
      const cards = list
        .map(
          (e) => `
        <article class="card">
          <div class="card-frame">
            <iframe src="${escapeHtml(e.filename)}" loading="lazy" title="${escapeHtml(e.label)}"></iframe>
          </div>
          <div class="card-meta">
            <h3>${escapeHtml(e.label)}</h3>
            <p class="subject"><strong>Objet :</strong> ${escapeHtml(e.subject)}</p>
            <p class="trigger">${escapeHtml(e.trigger)}</p>
            <a class="cta" href="${escapeHtml(e.filename)}" target="_blank" rel="noopener">Ouvrir en plein écran &rarr;</a>
          </div>
        </article>`,
        )
        .join('');
      return `
      <section class="cat">
        <h2>${escapeHtml(cat)} <span class="count">(${list.length})</span></h2>
        <div class="grid">${cards}</div>
      </section>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Audit visuel des emails NFI Report</title>
<style>
  :root {
    --ink: #111;
    --ink-soft: #404040;
    --muted: #737373;
    --paper: #fafaf9;
    --surface: #fff;
    --gold: #d4a843;
    --divider: #e5e5e5;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--paper);
    color: var(--ink);
    font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Helvetica, sans-serif;
    line-height: 1.5;
  }
  header {
    background: var(--ink);
    color: #fff;
    padding: 32px 40px;
    border-bottom: 4px solid var(--gold);
  }
  header h1 {
    margin: 0 0 6px;
    font-size: 24px;
    letter-spacing: 0.5px;
  }
  header p {
    margin: 0;
    color: #d4d4d4;
    font-size: 14px;
  }
  main { padding: 40px; max-width: 1600px; margin: 0 auto; }
  .cat { margin-bottom: 56px; }
  .cat h2 {
    margin: 0 0 20px;
    font-size: 18px;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--gold);
    border-bottom: 1px solid var(--divider);
    padding-bottom: 8px;
  }
  .cat h2 .count { color: var(--muted); font-weight: 400; font-size: 13px; }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
    gap: 24px;
  }
  .card {
    background: var(--surface);
    border: 1px solid var(--divider);
    border-radius: 8px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transition: box-shadow 0.2s, transform 0.2s;
  }
  .card:hover {
    box-shadow: 0 8px 24px rgba(0,0,0,0.08);
    transform: translateY(-2px);
  }
  .card-frame {
    height: 420px;
    overflow: hidden;
    background: #f0efe9;
    position: relative;
  }
  .card-frame iframe {
    width: 200%;
    height: 200%;
    border: 0;
    transform: scale(0.5);
    transform-origin: 0 0;
    pointer-events: none;
  }
  .card-meta { padding: 18px 20px 20px; }
  .card-meta h3 {
    margin: 0 0 6px;
    font-size: 15px;
    font-weight: 700;
    color: var(--ink);
  }
  .card-meta .subject {
    margin: 0 0 10px;
    font-size: 13px;
    color: var(--ink-soft);
    line-height: 1.4;
  }
  .card-meta .trigger {
    margin: 0 0 14px;
    font-size: 12px;
    color: var(--muted);
    line-height: 1.5;
    border-left: 2px solid var(--gold);
    padding-left: 10px;
  }
  .card-meta .cta {
    display: inline-block;
    color: var(--ink);
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
    border-bottom: 1px solid var(--ink);
    padding-bottom: 1px;
  }
  .card-meta .cta:hover { color: var(--gold); border-bottom-color: var(--gold); }
  footer {
    text-align: center;
    padding: 24px;
    color: var(--muted);
    font-size: 12px;
    border-top: 1px solid var(--divider);
  }
</style>
</head>
<body>
<header>
  <h1>Audit visuel des emails NFI Report</h1>
  <p>État au ${escapeHtml(generatedAt)} · ${entries.length} emails · données factices · cliquer sur une carte pour voir l'email en plein écran</p>
</header>
<main>${sections}</main>
<footer>Généré par <code>scripts/audit-emails.ts</code> · NFI Report</footer>
</body>
</html>`;
}

async function main(): Promise<void> {
  await mkdir(OUT_DIR, { recursive: true });
  const entries = await buildAllEntries();

  for (const e of entries) {
    await writeFile(join(OUT_DIR, e.filename), e.html, 'utf-8');
  }

  await writeFile(join(OUT_DIR, 'index.html'), buildIndexHtml(entries), 'utf-8');

  process.stdout.write(`✓ Audit généré : ${OUT_DIR}\n`);
  process.stdout.write(`  ${entries.length} emails + index.html\n`);
  process.stdout.write(`\nOuvre dans ton navigateur : open "${OUT_DIR}/index.html"\n`);
}

main().catch((err: unknown) => {
  process.stderr.write(`Audit failed: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
