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
  it('ne soude jamais plus de 32 caractères, pour ne pas déborder d\u2019un écran de 320 px', async () => {
    const { paragrapheFr } = await import('@/lib/typographie-fr');
    const r = paragrapheFr('Les sociétés qui pèsent dans l\u2019économie du pays.');
    const queue = r.slice(r.lastIndexOf(' ') + 1);
    expect(queue.length).toBeLessThanOrEqual(32);
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

describe('debutsSoudes : une phrase ne commence jamais en fin de ligne', () => {
  it('soude les quatre premiers mots de chaque phrase après la première', async () => {
    const { debutsSoudes } = await import('@/lib/typographie-fr');
    expect(debutsSoudes('Une phrase finit ici. La suivante commence par ces mots et continue.')).toBe(
      'Une phrase finit ici. La\u00a0suivante\u00a0commence\u00a0par ces mots et continue.',
    );
  });
  it('ne soude pas au-delà de la fin d\u2019une phrase courte', async () => {
    const { debutsSoudes } = await import('@/lib/typographie-fr');
    expect(debutsSoudes('Fin. Oui. Puis la suite vient ici.')).toBe('Fin. Oui. Puis\u00a0la\u00a0suite\u00a0vient ici.');
  });
});

describe('un point d’interrogation n’est pas un mot (25/11/2026)', () => {
  it('une phrase qui finit par « ? » garde quatre vrais mots sur sa dernière ligne', async () => {
    const { finSoudee, typographieFr } = await import('@/lib/typographie-fr');
    const soudee = finSoudee(typographieFr('Que pourrez-vous acheter avec cette somme ?'));
    // « acheter avec cette somme ? » : quatre mots, plus le point d’interrogation.
    expect(soudee.endsWith('acheter\u00a0avec\u00a0cette\u00a0somme\u202f?')).toBe(true);
  });

  it('un début de phrase soudé ne compte pas la ponctuation comme un mot', async () => {
    const { debutsSoudes, typographieFr } = await import('@/lib/typographie-fr');
    // « Note : » compte pour un mot : le début soudé va jusqu'à « baisse. ».
    const soude = debutsSoudes(typographieFr('Avant tout. Note : le chiffre baisse.'));
    expect(soude).toContain('Note\u00a0:\u00a0le\u00a0chiffre\u00a0baisse.');
  });
});

describe('un nombre et son unité restent ensemble (25/11/2026)', () => {
  it('soude %, FCFA, min et les autres unités au nombre', async () => {
    const { typographieFr } = await import('@/lib/typographie-fr');
    expect(typographieFr('une hausse de 9,1 % en 2024')).toContain('9,1\u00a0%');
    expect(typographieFr('environ 950 000 FCFA d’avant')).toContain('950\u202f000\u00a0FCFA');
    expect(typographieFr('3 min de lecture')).toBe('3\u00a0min de\u00a0lecture');
    expect(typographieFr('pendant 20 ans')).toContain('20\u00a0ans');
  });

  it('ne touche ni aux mots qui commencent comme une unité, ni deux fois au même texte', async () => {
    const { typographieFr } = await import('@/lib/typographie-fr');
    expect(typographieFr('en 2025 ministres')).not.toContain('2025\u00a0min');
    expect(typographieFr('les 3 hommes')).not.toContain('3\u00a0h');
    const une = typographieFr('9,1 % et 3 min');
    expect(typographieFr(une)).toBe(une);
  });
});
