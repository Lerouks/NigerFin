import { describe, expect, it } from 'vitest';
import { PAGE_ATTENTE, decidePorte, estPageOuverte, type DecisionPorte } from '@/lib/pre-lancement';

/** Visiteur anonyme pendant le pré-lancement. */
function visiteur(chemin: string, session = false): DecisionPorte {
  return decidePorte({ chemin, preLancement: true, admin: false, session });
}

describe('porte du pré-lancement, visiteur non admin', () => {
  it('ferme toutes les pages du site, accueil compris', () => {
    for (const chemin of [
      '/', '/articles', '/articles/banques-nigeriennes-sous-pression', '/economie', '/finance',
      '/entreprises', '/entreprises/somair', '/marches', '/niger', '/outils', '/outil/simulateur-emprunt', '/simulateurs', '/simulateurs/emprunt',
      '/education', '/apprendre', '/apprendre/bases-finance', '/apprendre/bases-finance/qu-est-ce-que-la-finance', '/premium', '/pricing', '/paiement', '/newsletter', '/contact', '/about',
      '/publicite', '/plan-du-site', '/inscription', '/inscription/completer-profil', '/inscription/bienvenue', '/compte',
      '/page-qui-n-existe-pas',
    ]) {
      expect(visiteur(chemin), chemin).toBe('attente');
    }
  });

  it('laisse lire la page d’attente, les pages légales, la connexion et le désabonnement', () => {
    for (const chemin of [
      PAGE_ATTENTE, '/mentions-legales', '/confidentialite', '/cgu', '/cookies', '/connexion',
      '/connexion/nouveau-mot-de-passe', '/auth/confirm', '/newsletter/desabonnement',
    ]) {
      expect(visiteur(chemin), chemin).toBe('passer');
    }
  });

  it('ne prend pas un chemin voisin pour une page ouverte', () => {
    expect(visiteur('/connexionx')).toBe('attente');
    expect(visiteur('/authentique')).toBe('attente');
    expect(visiteur('/confidentialite/autre')).toBe('attente');
    expect(visiteur('/newsletter/desabonnementx')).toBe('attente');
  });

  it('envoie l’espace admin vers la connexion sans session, vers l’attente avec un compte lecteur', () => {
    expect(visiteur('/admin')).toBe('connexion');
    expect(visiteur('/admin/contenu/articles')).toBe('connexion');
    expect(visiteur('/admin', true)).toBe('attente');
  });

  it('ferme les API de contenu', () => {
    for (const chemin of [
      '/api/articles', '/api/articles/un-article/content', '/api/search', '/api/comments', '/api/likes',
      '/api/discussions', '/api/education', '/api/apprendre/lecons/15f7c746-ff94-4265-bb84-e25f4bbf082c', '/api/markets/brvm/stocks', '/api/economy/macro',
      '/api/strategic-enterprises', '/api/niger-presentation', '/api/legal-sections', '/api/flash-banner',
      '/api/newsletter', '/api/contact', '/api/track', '/api/user/profile', '/api/payment/list',
      '/api/ipaymoney/checkout', '/api/waitlistx', '/api/cronjob',
    ]) {
      expect(visiteur(chemin), chemin).toBe('introuvable');
    }
  });

  it('laisse répondre les API dont le site a besoin pendant l’attente', () => {
    for (const chemin of [
      '/api/waitlist', '/api/auth/callback', '/api/auth/log-attempt', '/api/newsletter/unsubscribe',
      '/api/health', '/api/cron/update-market-data', '/api/webhooks/resend', '/api/ipaymoney/callback',
      '/api/revalidate', '/api/admin/stats', '/api/admin/site-features',
    ]) {
      expect(visiteur(chemin), chemin).toBe('passer');
    }
  });

  it('ferme le plan du site et les images de partage des pages fermées', () => {
    expect(visiteur('/sitemap.xml')).toBe('introuvable');
    expect(visiteur('/articles/un-article/opengraph-image')).toBe('introuvable');
    expect(visiteur('/entreprises/opengraph-image')).toBe('introuvable');
    expect(visiteur('/niger/opengraph-image')).toBe('introuvable');
    expect(visiteur('/pricing/opengraph-image')).toBe('introuvable');
  });

  it('sert les fichiers publics, robots.txt et l’image de partage de l’accueil', () => {
    for (const chemin of [
      '/robots.txt', '/sw.js', '/manifest.webmanifest', '/og-default.jpg', '/opengraph-image',
      '/_next/webpack-hmr', '/.well-known/security.txt',
    ]) {
      expect(visiteur(chemin), chemin).toBe('passer');
    }
  });
});

describe('porte du pré-lancement, admin et site lancé', () => {
  it('laisse passer un admin partout', () => {
    for (const chemin of ['/', '/articles/x', '/api/articles', '/sitemap.xml', '/admin', PAGE_ATTENTE]) {
      expect(decidePorte({ chemin, preLancement: true, admin: true, session: true }), chemin).toBe('passer');
    }
  });

  it('ouvre tout une fois le site lancé, et renvoie la page d’attente vers l’accueil', () => {
    for (const chemin of ['/', '/articles/x', '/api/articles', '/sitemap.xml', '/admin']) {
      expect(decidePorte({ chemin, preLancement: false, admin: false, session: false }), chemin).toBe('passer');
    }
    expect(decidePorte({ chemin: PAGE_ATTENTE, preLancement: false, admin: false, session: false })).toBe('accueil');
  });
});

describe('estPageOuverte', () => {
  it('reconnaît les pages ouvertes et leurs sous-pages, pas les voisines', () => {
    expect(estPageOuverte('/cgu')).toBe(true);
    expect(estPageOuverte('/connexion/nouveau-mot-de-passe')).toBe(true);
    expect(estPageOuverte('/auth/confirm')).toBe(true);
    expect(estPageOuverte('/')).toBe(false);
    expect(estPageOuverte(PAGE_ATTENTE)).toBe(false);
    expect(estPageOuverte('/cguv')).toBe(false);
  });
});
