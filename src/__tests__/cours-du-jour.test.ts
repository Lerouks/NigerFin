import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('next/cache', () => ({
  unstable_cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}));

const seancesEnBase = vi.hoisted(() => ({ valeur: [] as unknown[], boan: [] as unknown[] }));
vi.mock('@/lib/brvm-seances', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/brvm-seances')>();
  return {
    ...original,
    lireSeancesBrvm: vi.fn(async (historique = 'composite') =>
      historique === 'boan' ? seancesEnBase.boan : seancesEnBase.valeur,
    ),
  };
});

import {
  PARITE_EURO_FCFA,
  ageEnJours,
  dernierMois,
  dollarEnFcfa,
  getCoursDuJour,
  orEnFcfaLeGramme,
  pointA,
  pointsYahoo,
  variationPourcent,
} from '@/lib/cours-du-jour';
import {
  ajouterSeance,
  ajouterSeanceAction,
  analyserCoursActionBrvm,
  analyserIndicesBrvm,
  nombreFr,
  type SeanceBrvm,
} from '@/lib/brvm-seances';

/**
 * LES COURS DU JOUR (page Finance, 24/11/2026)
 *
 * Chaque cours vient d'une source réelle et datée ; une source en panne ou un
 * cours trop ancien retire sa tuile, l'euro reste toujours.
 */

const PAGE_BRVM = `
<p class="header-seance">Mardi, 24 novembre, 2026 - 15:52</p>
<div class="block-seance"><div class="seance-fermee">
  Séance fermée </div></div>
<table><thead><tr><th>Nom</th><th>Fermeture précédente</th><th>Fermeture</th><th>Variation (%)</th><th>Variation 31 décembre (%)</th></tr></thead>
<tbody>
<tr><td>BRVM - COMPOSITE TOTAL RETURN</td><td class="text-right">1 230,86</td><td class="text-right">1 228,62</td><td class="text-right"><span class="text-bad">-0,18</span></td><td>1,97</td> </tr>
<tr><td>BRVM - COMPOSITE</td><td class="text-right">476,54</td><td class="text-right">472,04</td><td class="text-right"><span class="text-bad">-0,94</span><span class="icone-seance bad"></span></td><td class="text-right"><span class="text-bad">1,70</span></td> </tr>
<tr><td>BRVM - PRESTIGE</td><td class="text-right">182,29</td><td class="text-right">180,92</td><td class="text-right">-0,75</td><td>1,47</td></tr>
</tbody></table>`;

// Extrait de brvm.org/fr/cours-actions/0 (25/11/2026) : la séance du 24/11.
const PAGE_ACTIONS = `
<p class="header-seance">Mercredi, 25 novembre, 2026 - 07:24</p>
<table><thead><tr><th>Symbole</th><th>Nom</th><th>Volume</th><th>Cours veille (FCFA)</th><th>Cours Ouverture (FCFA)</th><th>Cours Clôture (FCFA)</th><th>Variation (%)</th></tr></thead>
<tbody>
<tr><td>BOAM</td><td>BANK OF AFRICA MALI</td><td>1 020</td><td>3 900</td><td>3 900</td><td>3 950</td><td>1,28</td></tr>
<tr><td>BOAN</td><td>BANK OF AFRICA NIGER</td><td>11 468</td><td>4 165</td><td>4 160</td><td>4 105</td><td><span class="text-bad">-1,44</span></td></tr>
<tr><td>SEMC</td><td>EVIOSYS PACKAGING SIEM COTE D'IVOIRE</td><td>0</td><td>1 495</td><td>0</td><td>1 495</td><td>0,00</td></tr>
</tbody></table>`;

describe('Lecture de la page des indices de la BRVM', () => {
  it('lit les nombres à la française, espaces fines et signe moins compris', () => {
    expect(nombreFr('476,54')).toBe(476.54);
    expect(nombreFr('-0,94')).toBe(-0.94);
    expect(nombreFr('\u22120,94')).toBe(-0.94);
    expect(nombreFr('1\u202f230,86')).toBe(1230.86);
    expect(nombreFr('6,42%')).toBe(6.42);
    expect(nombreFr('ND')).toBeNull();
  });

  it('trouve le BRVM Composite, pas le Composite Total Return, avec la date et le statut', () => {
    expect(analyserIndicesBrvm(PAGE_BRVM)).toEqual({
      statut: 'fermee',
      date: '2026-11-24',
      composite: { precedent: 476.54, cloture: 472.04, variation: -0.94 },
    });
  });

  it('reconnaît une séance ouverte et une page sans tableau', () => {
    const ouverte = PAGE_BRVM.replace('seance-fermee">\n  Séance fermée', 'seance-ouverte">Séance ouverte');
    expect(analyserIndicesBrvm(ouverte).statut).toBe('ouverte');
    expect(analyserIndicesBrvm('<p>Maintenance</p>')).toEqual({ statut: 'inconnu', date: null, composite: null });
  });
});

describe('Historique des séances', () => {
  const s = (date: string, cloture: number): SeanceBrvm => ({ date, precedent: cloture - 1, cloture, variation: 0.2 });
  const fermee = analyserIndicesBrvm(PAGE_BRVM);

  it('ajoute une séance fermée, triée par date', () => {
    const apres = ajouterSeance([s('2026-11-20', 492.89), s('2026-11-23', 476.54)], fermee);
    expect(apres.map((x) => x.date)).toEqual(['2026-11-20', '2026-11-23', '2026-11-24']);
    expect(apres.at(-1)).toEqual({ date: '2026-11-24', precedent: 476.54, cloture: 472.04, variation: -0.94 });
  });

  it('remplace une séance déjà connue au lieu de la doubler', () => {
    const apres = ajouterSeance([s('2026-11-24', 470)], fermee);
    expect(apres).toHaveLength(1);
    expect(apres[0]!.cloture).toBe(472.04);
  });

  it("n'enregistre jamais une séance ouverte ni une lecture incomplète", () => {
    const avant = [s('2026-11-23', 476.54)];
    expect(ajouterSeance(avant, { ...fermee, statut: 'ouverte' })).toBe(avant);
    expect(ajouterSeance(avant, { ...fermee, date: null })).toBe(avant);
    expect(ajouterSeance(avant, { ...fermee, composite: null })).toBe(avant);
  });

  it("n'ajoute pas un jour férié, où la page répète la dernière séance sous la date du jour", () => {
    const avant = ajouterSeance([s('2026-11-23', 476.54)], fermee);
    const ferie = { ...fermee, date: '2026-11-25' };
    expect(ajouterSeance(avant, ferie)).toBe(avant);
    // Une vraie séance part de la clôture de la précédente : elle entre.
    const suivante = { ...ferie, composite: { precedent: 472.04, cloture: 474.1, variation: 0.44 } };
    expect(ajouterSeance(avant, suivante).at(-1)).toEqual({ date: '2026-11-25', precedent: 472.04, cloture: 474.1, variation: 0.44 });
  });
});

describe('BOA Niger (page des cours des actions)', () => {
  it('lit la ligne de BOAN : cours de la veille, clôture, variation publiée', () => {
    expect(analyserCoursActionBrvm(PAGE_ACTIONS, 'BOAN')).toEqual({ precedent: 4165, cloture: 4105, variation: -1.44 });
  });

  it("lit une action sans échange (clôture égale à la veille) et ignore un symbole absent", () => {
    expect(analyserCoursActionBrvm(PAGE_ACTIONS, 'SEMC')).toEqual({ precedent: 1495, cloture: 1495, variation: 0 });
    expect(analyserCoursActionBrvm(PAGE_ACTIONS, 'SNTS')).toBeNull();
    expect(analyserCoursActionBrvm('<p>Maintenance</p>', 'BOAN')).toBeNull();
  });

  it('range la séance à la date du Composite, sans doublon', () => {
    const valeurs = { precedent: 4165, cloture: 4105, variation: -1.44 };
    const avant: SeanceBrvm[] = [{ date: '2026-11-20', precedent: 4150, cloture: 4420, variation: 6.51 }];
    const apres = ajouterSeanceAction(avant, '2026-11-24', valeurs);
    expect(apres.map((x) => x.date)).toEqual(['2026-11-20', '2026-11-24']);
    expect(ajouterSeanceAction(apres, '2026-11-24', { ...valeurs, cloture: 4110 })).toHaveLength(2);
  });
});

describe('Calculs des cours', () => {
  it('convertit le dollar de la BCE en FCFA par la parité fixe', () => {
    const serie = dollarEnFcfa({ '2026-11-24': { USD: 1.0963 }, '2026-11-23': { USD: 1.1 }, '2026-11-22': {} });
    expect(serie.map((p) => p.date)).toEqual(['2026-11-23', '2026-11-24']);
    expect(serie[1]!.valeur).toBeCloseTo(PARITE_EURO_FCFA / 1.0963, 6);
  });

  it('calcule la variation depuis le cours précédent', () => {
    expect(variationPourcent([{ date: '2026-11-23', valeur: 100 }, { date: '2026-11-24', valeur: 101 }])).toBeCloseTo(1, 10);
    expect(variationPourcent([{ date: '2026-11-24', valeur: 100 }])).toBeNull();
  });

  it('garde un mois de courbe avant le dernier point', () => {
    const serie = ['2026-10-01', '2026-10-23', '2026-10-24', '2026-11-24'].map((date) => ({ date, valeur: 1 }));
    expect(dernierMois(serie).map((p) => p.date)).toEqual(['2026-10-24', '2026-11-24']);
  });

  it("convertit l'or en FCFA le gramme avec le dollar du même jour ou de la veille", () => {
    const dollar = [{ date: '2026-11-20', valeur: 600 }, { date: '2026-11-24', valeur: 598 }];
    expect(pointA(dollar, '2026-11-22')!.valeur).toBe(600);
    const or = orEnFcfaLeGramme([{ date: '2026-11-22', valeur: 3110.34768 }, { date: '2026-11-24', valeur: 3110.34768 }], dollar);
    expect(or[0]!.valeur).toBeCloseTo(60_000, 6);
    expect(or[1]!.valeur).toBeCloseTo(59_800, 6);
  });

  it("date les clôtures de Yahoo à l'heure de la place et saute les trous", () => {
    const points = pointsYahoo({
      chart: {
        result: [
          {
            meta: { gmtoffset: -18000 },
            // Minuit à New York (5 h UTC) les 20, 23 et 24 novembre.
            timestamp: [1795150800, 1795410000, 1795496400],
            indicators: { quote: [{ close: [87.5, null, 87.12] }] },
          },
        ],
      },
    });
    expect(points).toEqual([
      { date: '2026-11-20', valeur: 87.5 },
      { date: '2026-11-24', valeur: 87.12 },
    ]);
  });

  it("mesure l'âge d'un cours en jours", () => {
    expect(ageEnJours('2026-11-20', new Date('2026-11-24T22:00:00Z'))).toBe(4);
  });
});

describe('Assemblage des tuiles', () => {
  const AUJOURDHUI = new Date('2026-11-24T18:00:00Z');

  function repondre(routes: Record<string, unknown>) {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        const cle = Object.keys(routes).find((k) => String(url).includes(k));
        const route = cle ? routes[cle] : 'panne';
        if (route === 'panne') return new Response('panne', { status: 503 });
        const corps = typeof route === 'function' ? (route as (u: string) => unknown)(String(url)) : route;
        return new Response(JSON.stringify(corps), { status: 200 });
      }),
    );
  }

  // Un fichier de currency-api par jour, daté par son adresse.
  const naira = (url: string) => ({ date: url.match(/currency-api@(\d{4}-\d{2}-\d{2})/)![1], eur: { ngn: 1480.938 } });

  const yahoo = (valeurs: number[]) => ({
    chart: {
      result: [
        {
          meta: { gmtoffset: -18000 },
          timestamp: [1795150800, 1795410000, 1795496400],
          indicators: { quote: [{ close: valeurs }] },
        },
      ],
    },
  });

  beforeEach(() => {
    seancesEnBase.valeur = [
      { date: '2026-11-23', precedent: 492.89, cloture: 476.54, variation: -3.32 },
      { date: '2026-11-24', precedent: 476.54, cloture: 472.04, variation: -0.94 },
    ];
    seancesEnBase.boan = [
      { date: '2026-11-20', precedent: 4150, cloture: 4420, variation: 6.51 },
      { date: '2026-11-24', precedent: 4165, cloture: 4105, variation: -1.44 },
    ];
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.useFakeTimers({ toFake: ['Date'], now: AUJOURDHUI });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('assemble les sept tuiles, BOA Niger après le Composite et l’euro en dernier', async () => {
    repondre({
      'api.frankfurter.dev': { rates: { '2026-11-23': { USD: 1.1 }, '2026-11-24': { USD: 1.0963 } } },
      'currency-api@': naira,
      'GC%3DF': yahoo([3600, 3590, 3582.8]),
      'BZ%3DF': yahoo([88, 87.6, 87.12]),
    });
    const cours = await getCoursDuJour(AUJOURDHUI);
    expect(cours.map((c) => c.cle)).toEqual(['dollar', 'naira', 'brvm', 'boan', 'or', 'brent', 'euro']);
    const brvm = cours.find((c) => c.cle === 'brvm')!;
    expect(brvm.valeur).toBe(472.04);
    expect(brvm.variation).toBe(-0.94);
    // BOA Niger : la variation publiée par la BRVM, pas un calcul sur un historique troué.
    expect(cours.find((c) => c.cle === 'boan')).toMatchObject({ valeur: 4105, variation: -1.44, unite: 'FCFA', date: '2026-11-24' });
    expect(cours.at(-1)).toMatchObject({ cle: 'euro', valeur: 655.957, mention: 'parité fixe', date: null });
  });

  it('retire la tuile d’une source en panne, et l’or sans dollar', async () => {
    repondre({
      'api.frankfurter.dev': 'panne',
      'currency-api@': naira,
      'GC%3DF': yahoo([3600, 3590, 3582.8]),
      'BZ%3DF': 'panne',
    });
    const cours = await getCoursDuJour(AUJOURDHUI);
    expect(cours.map((c) => c.cle)).toEqual(['naira', 'brvm', 'boan', 'euro']);
  });

  it('retire un cours de plus de dix jours', async () => {
    seancesEnBase.valeur = [
      { date: '2026-11-02', precedent: 534.71, cloture: 525.3, variation: -1.76 },
      { date: '2026-11-03', precedent: 525.3, cloture: 529.41, variation: 0.78 },
    ];
    seancesEnBase.boan = [
      { date: '2026-11-03', precedent: 5000, cloture: 4975, variation: -0.5 },
      { date: '2026-11-04', precedent: 4975, cloture: 5000, variation: 0.5 },
    ];
    repondre({ 'api.frankfurter.dev': 'panne', 'currency-api@': 'panne', 'GC%3DF': 'panne', 'BZ%3DF': 'panne' });
    const cours = await getCoursDuJour(AUJOURDHUI);
    expect(cours.map((c) => c.cle)).toEqual(['euro']);
  });
});
