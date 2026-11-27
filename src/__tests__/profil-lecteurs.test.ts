import { describe, it, expect } from 'vitest';
import { agregerProfils, part } from '@/lib/audience/profil-lecteurs';
import { TRANCHES_AGE } from '@/lib/regles-du-compte';

const vide = { civility: null, age_range: null, profession: null };

describe('agregerProfils', () => {
  it('compte femmes, hommes et absences de réponse', () => {
    const r = agregerProfils(
      [
        { ...vide, civility: 'Mme' },
        { ...vide, civility: 'Mme' },
        { ...vide, civility: 'M.' },
        vide,
        { ...vide, civility: 'Madame' },
      ],
      2
    );
    expect(r.lecteurs).toBe(5);
    expect(r.equipe).toBe(2);
    expect(r.civilite).toEqual({ femmes: 2, hommes: 1, sansReponse: 2 });
  });

  it('garde les sept tranches dans l’ordre des âges, même vides', () => {
    const r = agregerProfils([{ ...vide, age_range: '25-34' }, { ...vide, age_range: 'inconnue' }], 0);
    // Les libellés du site portent des espaces insécables : on les reprend à la source.
    expect(r.ages.tranches.map((t) => t.libelle)).toEqual(TRANCHES_AGE.map((t) => t.libelle));
    expect(r.ages.tranches[2]?.nombre).toBe(1);
    expect(r.ages.sansReponse).toBe(1);
  });

  it('classe les professions citées, l’apostrophe droite redressée', () => {
    const r = agregerProfils(
      [
        { ...vide, profession: 'Étudiant' },
        { ...vide, profession: "Cadre d'entreprise" },
        { ...vide, profession: 'Cadre d’entreprise' },
        { ...vide, profession: 'Astronaute' },
      ],
      0
    );
    expect(r.professions.liste).toEqual([
      { libelle: 'Cadre d’entreprise', nombre: 2 },
      { libelle: 'Étudiant', nombre: 1 },
    ]);
    expect(r.professions.sansReponse).toBe(1);
  });
});

describe('part', () => {
  it('arrondit au pour cent et ne divise jamais par zéro', () => {
    expect(part(1, 3)).toBe(33);
    expect(part(2, 3)).toBe(67);
    expect(part(0, 0)).toBeNull();
  });
});
