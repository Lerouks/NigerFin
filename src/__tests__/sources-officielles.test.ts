import { describe, it, expect, vi } from 'vitest';

vi.mock('next/cache', () => ({
  unstable_cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}));

import { analyserCoursBceao, analyserEncadreBceao, dateBceao, joursOuvres, nombreBceao } from '@/lib/bceao';
import { nairaEnFcfa } from '@/lib/cbn';
import {
  analyserActiviteMarche,
  analyserTousLesIndices,
  analyserToutesLesActions,
  construireSeanceComplete,
} from '@/lib/brvm-seances';
import { palmares } from '@/components/marches/SeanceBrvm';
import { lignesDevises } from '@/components/marches/DevisesBceao';
import { lignesNewsletter, sourcesNewsletter } from '@/lib/newsletter/market-sync';
import type { Cours } from '@/lib/cours-du-jour';

/**
 * SOURCES OFFICIELLES DES COURS (25/11/2026)
 *
 * La BCEAO (cours de référence jour par jour, taux directeurs et indicateurs
 * de l'UEMOA), la Banque centrale du Nigeria (naira) et la séance complète de
 * la BRVM, lus tels que leurs sites les servent ce jour-là.
 */

// Fragment servi par la BCEAO pour un jour (extrait du 25/11/2026).
const COURS_BCEAO = `
        <h2>Cours des devises du mercredi 25 novembre 2026</h2>
            <table>
                <tbody>
                <tr><th>Devise</th><th>CFA</th></tr>
                <tr><td>Euro</td><td>655,9570</td></tr>
                <tr><td>Dollar us</td><td>599,8700</td></tr>
                <tr><td>Yen japonais</td><td>3,7651</td></tr>
                <tr><td>Livre sterling</td><td>783,4200</td></tr>
                <tr><td>Dinar Koweitien</td><td>1.935,7360</td></tr>
                </tbody>
            </table>`;

// Encadré de la page d'accueil de la BCEAO (extrait du 25/11/2026).
const ACCUEIL_BCEAO = `
<p>*estimations 2025 (sauf pour le taux d’inflation)</p>
<p><strong>* Date de mise à jour : 9 octobre 2026</strong></p>
<ul>
	<li>PIB :  148 380 Mds Fcfa</li>
	<li>Taux de croissance : 6,5 %</li>
	<li>Solde budgétaire/PIB (dons compris) : <span style="font-size:11pt"><span>-3,2</span></span> %</li>
	<li>Solde ext. cour./PIB (dons compris) : <span>-1,0</span> %</li>
	<li>Taux d'inflation : 0,0 % (2025)</li>
</ul>
<ul>
	<li>Taux minimum de soumission : 3,00 %</li>
	<li>Taux du guichet de prêt marginal: 5,00 %</li>
</ul>
<p class="pttTxt"><strong>Effectifs depuis le 16 mars 2026</strong></p>`;

describe('BCEAO', () => {
  it('lit les nombres et les dates comme la BCEAO les écrit', () => {
    expect(nombreBceao('599,8700')).toBe(599.87);
    expect(nombreBceao('1.935,7360')).toBe(1935.736);
    expect(nombreBceao('148 380')).toBe(148380);
    expect(nombreBceao('-3,2')).toBe(-3.2);
    expect(nombreBceao('n.d.')).toBeNull();
    expect(dateBceao('mardi 24 Novembre 2026')).toBe('2026-11-24');
    expect(dateBceao('16 mars 2026')).toBe('2026-03-16');
    expect(dateBceao('1 août 2026')).toBe('2026-08-01');
    expect(dateBceao('25 décembre 2026')).toBe('2026-12-25');
  });

  it('lit le tableau d’un jour : la date du titre et chaque devise en FCFA', () => {
    const cours = analyserCoursBceao(COURS_BCEAO)!;
    expect(cours.date).toBe('2026-11-25');
    expect(cours.devises['Dollar us']).toBe(599.87);
    expect(cours.devises['Euro']).toBe(655.957);
    expect(cours.devises['Dinar Koweitien']).toBe(1935.736);
  });

  it('ne retient rien un samedi ou un jour férié, où la BCEAO sert un titre sans tableau', () => {
    expect(analyserCoursBceao('<h2>Cours des devises du saturday 21 novembre 2026</h2>')).toBeNull();
    expect(analyserCoursBceao('<p>Erreur</p>')).toBeNull();
  });

  it('lit les taux directeurs et les indicateurs de l’UEMOA de la page d’accueil', () => {
    const encadre = analyserEncadreBceao(ACCUEIL_BCEAO);
    expect(encadre.taux).toEqual({ principal: 3, pretMarginal: 5, depuis: '2026-03-16' });
    expect(encadre.uemoa).toEqual({
      miseAJour: '2026-10-09',
      anneeEstimations: 2025,
      pibMilliards: 148380,
      croissance: 6.5,
      soldeBudgetaire: -3.2,
      inflation: { valeur: 0, annee: 2025 },
    });
  });

  it('ne fabrique aucun taux quand l’encadré a disparu', () => {
    const encadre = analyserEncadreBceao('<p>Page refaite</p>');
    expect(encadre.taux).toBeNull();
    expect(encadre.uemoa.croissance).toBeNull();
  });

  it('ne demande que les jours ouvrés', () => {
    // Du samedi 21 au mercredi 25 novembre 2026 : lundi, mardi, mercredi.
    expect(joursOuvres(new Date('2026-11-25T20:00:00Z'), 4)).toEqual(['2026-11-23', '2026-11-24', '2026-11-25']);
  });
});

describe('Banque centrale du Nigeria', () => {
  it('donne 100 nairas en FCFA à partir du cours « CFA », sans les autres devises', () => {
    const serie = nairaEnFcfa([
      { currency: 'CFA', ratedate: '2026-11-24', centralrate: '2.3139' },
      { currency: 'US DOLLAR', ratedate: '2026-11-25', centralrate: '1391.7481' },
      { currency: 'CFA', ratedate: '2026-11-25', centralrate: '2.3192' },
      { currency: 'CFA', ratedate: 'pas une date', centralrate: '2.3' },
      { currency: 'CFA', ratedate: '2026-11-23', centralrate: '0' },
    ]);
    expect(serie.map((p) => p.date)).toEqual(['2026-11-24', '2026-11-25']);
    expect(serie[1]!.valeur).toBeCloseTo(43.118, 3);
  });

  it('rend une série vide sur une réponse inattendue', () => {
    expect(nairaEnFcfa({} as never)).toEqual([]);
  });
});

// Extraits des pages de la BRVM du 25/11/2026.
const PAGE_INDICES = `
<table><tr><td>Valeur des transactions</td><td>2 221 676 762 FCFA</td><td></td></tr>
<tr><td>Capitalisation Actions</td><td>18 226 419 319 289 FCFA</td><td></td></tr></table>
<table><tr><td>BRVM-C</td><td>464,78</td><td>-1,54%</td><td></td></tr></table>
<table><tr><th>Nom</th><th>Fermeture précédente</th><th>Fermeture</th><th>Variation (%)</th><th>Variation 31 décembre (%)</th></tr>
<tr><td>BRVM-30</td><td>228,62</td><td>224,99</td><td>-1,59</td><td>1,97</td></tr>
<tr><td>BRVM - COMPOSITE</td><td>472,04</td><td>464,78</td><td>-1,54</td><td>1,70</td></tr>
<tr><td>BRVM - PRESTIGE</td><td>180,92</td><td>178,37</td><td>-1,41</td><td>1,47</td></tr></table>`;

const ligneAction = (s: string, nom: string, cloture: string, variation: string) =>
  `<tr><td>${s}</td><td>${nom}</td><td>1 000</td><td>${cloture}</td><td>${cloture}</td><td>${cloture}</td><td>${variation}</td></tr>`;
const PAGE_ACTIONS = `<table><tr><th>Symbole</th><th>Nom</th><th>Volume</th><th>Cours veille (FCFA)</th><th>Cours Ouverture (FCFA)</th><th>Cours Clôture (FCFA)</th><th>Variation (%)</th></tr>
${ligneAction('BOAN', 'BANK OF AFRICA NIGER', '4 350', '5,97')}
${ligneAction('SNTS', 'SONATEL SENEGAL', '3 750', '-3,60')}
${ligneAction('ORAC', "ORANGE COTE D'IVOIRE", '18 500', '-1,07')}
${ligneAction('SHEC', 'VIVO ENERGY CI', '1 900', '5,56')}
${ligneAction('FTSC', 'FILTISAC CI', '1 365', '-7,46')}
${ligneAction('ABJC', 'SERVAIR ABIDJAN CI', '2 000', '0,00')}
${ligneAction('BICC', 'BICI CI', '29 000', '-6,38')}
${ligneAction('SCRC', 'SUCRIVOIRE', '1 335', '5,53')}
${ligneAction('BBGC', 'BERNABE CI', '7 800', '4,00')}
${ligneAction('SAFC', 'SAFCA CI', '2 900', '3,57')}
${ligneAction('CIEC', 'CIE CI', '4 000', '-5,88')}
</table>`;

describe('Séance complète de la BRVM', () => {
  it('lit les indices détaillés, sans les lignes de résumé', () => {
    const indices = analyserTousLesIndices(PAGE_INDICES);
    expect(indices.map((i) => i.nom)).toEqual(['BRVM-30', 'BRVM - COMPOSITE', 'BRVM - PRESTIGE']);
    expect(indices[1]).toEqual({ nom: 'BRVM - COMPOSITE', precedent: 472.04, cloture: 464.78, variation: -1.54, variationAnnee: 1.7 });
  });

  it('lit la capitalisation et la valeur échangée', () => {
    expect(analyserActiviteMarche(PAGE_INDICES)).toEqual({
      capitalisationActions: 18226419319289,
      valeurTransactions: 2221676762,
    });
  });

  it('lit toutes les actions, BOA Niger comprise', () => {
    const actions = analyserToutesLesActions(PAGE_ACTIONS);
    expect(actions).toHaveLength(11);
    expect(actions[0]).toEqual({ symbole: 'BOAN', nom: 'BANK OF AFRICA NIGER', cloture: 4350, variation: 5.97, volume: 1000 });
  });

  it('ne range une séance complète qu’avec la page des actions lisible', () => {
    expect(construireSeanceComplete('2026-11-25', PAGE_INDICES, null)).toBeNull();
    expect(construireSeanceComplete('2026-11-25', PAGE_INDICES, '<p>vide</p>')).toBeNull();
    const seance = construireSeanceComplete('2026-11-25', PAGE_INDICES, PAGE_ACTIONS)!;
    expect(seance.date).toBe('2026-11-25');
    expect(seance.actions).toHaveLength(11);
    expect(seance.indices).toHaveLength(3);
  });

  it('classe les cinq plus fortes hausses et baisses, sans les actions inchangées', () => {
    const { hausses, baisses } = palmares(analyserToutesLesActions(PAGE_ACTIONS));
    expect(hausses.map((a) => a.symbole)).toEqual(['BOAN', 'SHEC', 'SCRC', 'BBGC', 'SAFC']);
    expect(baisses.map((a) => a.symbole)).toEqual(['FTSC', 'BICC', 'CIEC', 'SNTS', 'ORAC']);
  });
});

describe('Le franc CFA face aux devises', () => {
  it('met l’euro en tête, compte le yen par cent et compare au jour publié précédent', () => {
    const lignes = lignesDevises([
      { date: '2026-11-24', devises: { 'Dollar us': 598.34, 'Yen japonais': 3.7614 } },
      { date: '2026-11-25', devises: { 'Dollar us': 599.87, 'Yen japonais': 3.7651 } },
    ]);
    expect(lignes[0]).toEqual({ libelle: 'Euro', valeur: 655.957, variation: null });
    const dollar = lignes.find((l) => l.libelle === 'Dollar américain')!;
    expect(dollar.valeur).toBe(599.87);
    expect(dollar.variation).toBeCloseTo(0.2557, 3);
    expect(lignes.find((l) => l.libelle.startsWith('100'))!.valeur).toBeCloseTo(376.51, 2);
  });

  it('ne donne aucune variation sans jour précédent, et rien sans cours', () => {
    expect(lignesDevises([{ date: '2026-11-25', devises: { 'Dollar us': 599.87 } }])[1]!.variation).toBeNull();
    expect(lignesDevises([])).toEqual([]);
  });
});

describe('Tableau des marchés de la newsletter', () => {
  const cours = (cle: Cours['cle'], extra: Partial<Cours> = {}): Cours => ({
    cle,
    libelle: cle,
    valeur: 1,
    unite: 'FCFA',
    decimales: 2,
    date: '2026-11-25',
    variation: 0.5,
    serie: [],
    source: '',
    ...extra,
  });

  it('reprend les cours du jour du site, sans le taux directeur, et jamais un zéro inventé', () => {
    const lignes = lignesNewsletter([
      cours('dollar', { libelle: 'Dollar', valeur: 599.87, decimales: 0, serie: [{ date: '2026-11-24', valeur: 598.34 }, { date: '2026-11-25', valeur: 599.87 }] }),
      cours('euro', { libelle: 'Euro', valeur: 655.957, decimales: 3, variation: null, date: null }),
      cours('taux', { libelle: 'Taux BCEAO', valeur: 3, unite: '%', variation: null, date: null }),
    ]);
    expect(lignes.map((l) => l.label)).toEqual(['Dollar', 'Euro']);
    expect(lignes[0]).toMatchObject({ value: '600', changePercent: 0.5, spark: [598.34, 599.87] });
    // L'euro : variation nulle, que le tableau affiche « fixe ».
    expect(lignes[1]).toMatchObject({ value: '655,957', changePercent: 0, spark: undefined });
  });

  it('nomme les sources réellement utilisées, sans doublon', () => {
    expect(
      sourcesNewsletter([
        cours('dollar', { source: 'Cours de référence publié chaque jour par la BCEAO.' }),
        cours('naira'),
        cours('brvm'),
        cours('boan'),
        cours('or'),
        cours('brent'),
        cours('euro'),
      ]),
    ).toBe('BCEAO, Banque centrale du Nigeria, BRVM, COMEX et NYMEX (New York)');
    expect(sourcesNewsletter([cours('dollar', { source: 'Cours de référence de la Banque centrale européenne…' })])).toBe('Banque centrale européenne');
  });
});
