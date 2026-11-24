import { describe, expect, it } from 'vitest';
import { typographier, typographierHtml } from '@/lib/typographie';

const INSECABLE = ' ';

describe('typographier', () => {
  it('colle le deux-points au mot qui le précède', () => {
    expect(typographier('Gazoduc Nigeria-Algérie : où en est le Niger ?')).toBe(
      `Gazoduc Nigeria-Algérie${INSECABLE}: où en est le Niger${INSECABLE}?`,
    );
  });

  it('remplace l’apostrophe droite entre deux lettres', () => {
    expect(typographier("l'économie d'aujourd'hui")).toBe('l’économie d’aujourd’hui');
  });

  it('colle les guillemets français à leur contenu', () => {
    expect(typographier('« Niger »')).toBe(`«${INSECABLE}Niger${INSECABLE}»`);
  });

  it('ne touche pas à une adresse web ni à un texte vide', () => {
    expect(typographier('https://nfireport.com')).toBe('https://nfireport.com');
    expect(typographier('')).toBe('');
    expect(typographier(null)).toBeNull();
  });
});

describe('typographierHtml', () => {
  it('ne modifie que le texte, jamais les balises ni leurs attributs', () => {
    const html = '<p class="a b">Le PIB : en hausse ?</p><a href="https://x.ne/?q=1 :">l\'article</a>';
    expect(typographierHtml(html)).toBe(
      `<p class="a b">Le PIB${INSECABLE}: en hausse${INSECABLE}?</p><a href="https://x.ne/?q=1 :">l’article</a>`,
    );
  });
});

describe('finSoudee et paragrapheFr : jamais une dernière ligne de deux ou trois mots', () => {
  it('soude les quatre derniers mots', async () => {
    const { finSoudee } = await import('@/lib/typographie-fr');
    expect(finSoudee('un deux trois quatre cinq six')).toBe('un deux trois\u00a0quatre\u00a0cinq\u00a0six');
  });
  it('ne soude jamais plus de 28 caractères, pour ne pas déborder d\u2019un écran de 320 px', async () => {
    const { paragrapheFr } = await import('@/lib/typographie-fr');
    const r = paragrapheFr('Les sociétés qui pèsent dans l\u2019économie du pays.');
    const queue = r.slice(r.lastIndexOf(' ') + 1);
    expect(queue.length).toBeLessThanOrEqual(28);
    expect(queue).toBe('dans\u00a0l\u2019économie\u00a0du\u00a0pays.');
  });
  it('est idempotente', async () => {
    const { paragrapheFr } = await import('@/lib/typographie-fr');
    const une = paragrapheFr('Part de chaque secteur dans le PIB 2025');
    expect(paragrapheFr(une)).toBe(une);
  });
  it('laisse un texte d\u2019un seul morceau tel quel', async () => {
    const { finSoudee } = await import('@/lib/typographie-fr');
    expect(finSoudee('Niger')).toBe('Niger');
  });
});
