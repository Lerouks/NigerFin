import { describe, it, expect } from 'vitest';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { sanitizeEmailHtml } from '@/emails/lib/sanitize';

/**
 * Ces tests gardent la barrière qui a remplacé DOMPurify + jsdom le
 * 6 septembre 2026. Ils vérifient deux choses à parts égales : que le code
 * hostile ne passe pas, et que le HTML légitime d'un article n'est pas mutilé
 * au passage — c'est la deuxième moitié qu'un changement de moteur casse.
 */

describe('sanitizeHtml, côté serveur', () => {
  it('supprime une balise script et son contenu', () => {
    const out = sanitizeHtml('<p>Bonjour</p><script>alert("xss")</script>');
    expect(out).toContain('Bonjour');
    expect(out).not.toContain('script');
    expect(out).not.toContain('alert');
  });

  it('supprime les gestionnaires d\'événements', () => {
    const out = sanitizeHtml('<img src="https://x.test/a.png" onerror="alert(1)">');
    expect(out).not.toContain('onerror');
    expect(out).toContain('src="https://x.test/a.png"');
  });

  it('supprime un lien javascript:', () => {
    const out = sanitizeHtml('<a href="javascript:alert(1)">clic</a>');
    expect(out).not.toContain('javascript');
    expect(out).toContain('clic');
  });

  it('supprime une iframe et un objet embarqué', () => {
    const out = sanitizeHtml('<iframe src="https://evil.test"></iframe><object data="x"></object>');
    expect(out).not.toContain('iframe');
    expect(out).not.toContain('object');
  });

  it('force rel="noopener noreferrer" sur un lien qui ouvre un onglet', () => {
    const out = sanitizeHtml('<a href="https://x.test" target="_blank">lien</a>');
    expect(out).toContain('rel="noopener noreferrer"');
  });

  it('conserve la mise en forme éditoriale complète', () => {
    const source = [
      '<h2>Titre</h2>',
      '<p><strong>gras</strong> <em>italique</em></p>',
      '<ul><li>un</li><li>deux</li></ul>',
      '<blockquote>citation</blockquote>',
      '<figure><img src="https://x.test/a.png" alt="légende"><figcaption>source</figcaption></figure>',
      '<table><tbody><tr><td colspan="2">cellule</td></tr></tbody></table>',
    ].join('');
    const out = sanitizeHtml(source);
    for (const morceau of ['<h2>', '<strong>', '<em>', '<ul>', '<li>', '<blockquote>', '<figure>', '<img', '<figcaption>', '<table>', 'colspan="2"']) {
      expect(out, `${morceau} a disparu`).toContain(morceau);
    }
  });

  it('conserve les attributs data- posés par l\'éditeur', () => {
    const out = sanitizeHtml('<span data-type="chiffre" data-value="18,8" data-label="PIB">18,8</span>');
    expect(out).toContain('data-type="chiffre"');
    expect(out).toContain('data-value="18,8"');
  });

  it('conserve un alignement mais jette une propriété de style non prévue', () => {
    const out = sanitizeHtml('<p style="text-align:center;position:fixed">texte</p>');
    expect(out).toContain('text-align:center');
    expect(out).not.toContain('position');
  });

  it('conserve les accents et les caractères français', () => {
    const out = sanitizeHtml('<p>Économie nigérienne : hausse de 6,9 %, d’après l’INS</p>');
    expect(out).toContain('Économie nigérienne');
    expect(out).toContain('d’après');
  });

  it('accepte une image collée en data: mais pas un lien data:', () => {
    expect(sanitizeHtml('<img src="data:image/png;base64,iVBORw0KGgo=">')).toContain('data:image/png');
    expect(sanitizeHtml('<a href="data:text/html,<script>alert(1)</script>">x</a>')).not.toContain('data:text/html');
  });

  it('renvoie une chaîne vide sur une entrée vide ou absente', () => {
    expect(sanitizeHtml('')).toBe('');
    expect(sanitizeHtml(null)).toBe('');
    expect(sanitizeHtml(undefined)).toBe('');
  });
});

describe('sanitizeEmailHtml, politique restreinte', () => {
  it('conserve le texte mis en forme et les liens', () => {
    const out = sanitizeEmailHtml('<p>Bonjour <strong>Raouf</strong></p><a href="https://nfireport.com">le site</a>');
    expect(out).toContain('<strong>Raouf</strong>');
    expect(out).toContain('href="https://nfireport.com"');
  });

  it('refuse les images et les tableaux, qui n\'ont rien à faire dans un e-mail éditorial', () => {
    const out = sanitizeEmailHtml('<img src="https://x.test/a.png"><table><tr><td>x</td></tr></table>');
    expect(out).not.toContain('<img');
    expect(out).not.toContain('<table');
  });

  it('supprime script et gestionnaires d\'événements', () => {
    const out = sanitizeEmailHtml('<script>alert(1)</script><p onclick="alert(2)">texte</p>');
    expect(out).not.toContain('script');
    expect(out).not.toContain('onclick');
    expect(out).toContain('texte');
  });
});
