import type { ReactNode } from 'react';

/**
 * La figure de chaque thème, sur sa couverture (choix de Raouf, 26/11/2026,
 * maquette « Le livre »). Règle : une figure tirée des leçons publiées du
 * thème, avec sa source, jamais une illustration du mot du titre (la carte du
 * Niger a été écartée : elle ne disait rien de ce que le cours enseigne).
 *
 * Chaque chiffre ci-dessous est recopié d'une leçon publiée et vérifié
 * (source en commentaire). Une leçon corrigée : corriger aussi sa figure.
 * Dessin sobre en noir et gris, directement sur la page claire, sans cadre ni
 * fond (Raouf, 26/11/2026 : « ça doit être sobre »). Toile 946 × 584.
 */

/** Trait principal (la valeur mise en avant). */
const FORT = '#111';
const ARGENT = '#8a8e95';
const PALE = '#d4d6da';
const TEXTE = '#374151';
const LEGER = '#6b7280';
/** Texte posé sur un aplat du trait principal. */
const SUR_FORT = '#fff';

export interface FigureTheme {
  figure: ReactNode;
  legende: string;
  source: string;
}

function Toile({ label, children }: { label: string; children: ReactNode }) {
  return (
    <svg viewBox="28 36 946 584" preserveAspectRatio="xMinYMid meet" role="img" aria-label={label} className="block h-auto w-full">
      {children}
    </svg>
  );
}

function T({ x, y, taille, couleur = FORT, poids = 500, ancre = 'start', children }: {
  x: number;
  y: number;
  taille: number;
  couleur?: string;
  poids?: number;
  ancre?: 'start' | 'middle' | 'end';
  children: ReactNode;
}) {
  return (
    <text x={x} y={y} fill={couleur} fontSize={taille} fontWeight={poids} textAnchor={ancre} letterSpacing={taille > 60 ? -2 : 0}>
      {children}
    </text>
  );
}

/** Une répartition : barre empilée, puis une ligne par part. */
function Repartition({ titre, label, parts, total }: {
  titre: string;
  label: string;
  total: number;
  parts: { nom: string; valeur: string; poids: number; couleur: string }[];
}) {
  let x = 40;
  return (
    <Toile label={label}>
      <T x={40} y={96} taille={34} couleur={LEGER}>{titre}</T>
      {parts.map((p) => {
        const w = (p.poids / total) * 920;
        const rect = <rect key={`b-${p.nom}`} x={x} y={150} width={Math.max(w - 6, 2)} height={110} rx={6} fill={p.couleur} />;
        x += w;
        return rect;
      })}
      {parts.map((p, i) => {
        const y = 360 + i * 82;
        return (
          <g key={`l-${p.nom}`}>
            <rect x={40} y={y - 26} width={26} height={26} rx={4} fill={p.couleur} />
            <T x={88} y={y} taille={34} couleur={TEXTE}>{p.nom}</T>
            <T x={960} y={y} taille={38} poids={700} ancre="end">{p.valeur}</T>
          </g>
        );
      })}
    </Toile>
  );
}

const fine = (n: number) => n.toLocaleString('fr-FR').replace(/[\u00a0\u202f ]/g, '\u202f');

/** 25 000 FCFA par mois à 8 % par an pendant 20 ans : environ 14,7 millions pour 6 millions versés (leçon 9). */
function Interets() {
  const mois = 240;
  const taux = 0.08 / 12;
  const versement = 25000;
  const X = (m: number) => 60 + (m / mois) * 880;
  const Y = (v: number) => 560 - (v / 15e6) * 420;
  let capital = 0;
  let courbe = `M${X(0)},${Y(0)}`;
  for (let m = 1; m <= mois; m++) {
    capital = capital * (1 + taux) + versement;
    if (m % 4 === 0 || m === mois) courbe += ` L${X(m).toFixed(1)},${Y(capital).toFixed(1)}`;
  }
  return (
    <Toile label="Courbe des intérêts composés">
      <line x1={60} y1={560} x2={940} y2={560} stroke={PALE} strokeWidth={2} />
      <path d={`M${X(0)},${Y(0)} L${X(mois)},${Y(versement * mois)}`} fill="none" stroke={ARGENT} strokeWidth={4} strokeDasharray="10 10" />
      <path d={courbe} fill="none" stroke={FORT} strokeWidth={7} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={X(mois)} cy={Y(capital)} r={12} fill={FORT} />
      <T x={X(mois)} y={Y(capital) - 36} taille={44} poids={700} ancre="end">14,7 millions FCFA</T>
      <T x={X(mois) - 10} y={Y(versement * mois) - 26} taille={30} couleur={ARGENT} ancre="end">6 millions versés</T>
      <T x={60} y={604} taille={26} couleur={ARGENT}>0</T>
      <T x={940} y={604} taille={26} couleur={ARGENT} ancre="end">20 ans</T>
    </Toile>
  );
}

/** Six étapes, de l'envoi à l'inscription dans la chaîne (leçon 1, « La blockchain expliquée simplement »). */
function Chaine() {
  const noms = ['Envoi', 'Diffusion', 'Vérification', 'Regroupement', 'Accord', 'Inscription'];
  return (
    <Toile label="Les six étapes d’une blockchain">
      {noms.map((nom, k) => {
        const col = k % 3;
        const rang = Math.floor(k / 3);
        const x = 40 + col * 320;
        const y = 90 + rang * 250;
        const plein = k === noms.length - 1;
        return (
          <g key={nom}>
            <rect x={x} y={y} width={270} height={150} rx={12} fill={plein ? FORT : 'none'} stroke={plein ? FORT : ARGENT} strokeWidth={4} />
            <T x={x + 24} y={y + 58} taille={40} poids={700} couleur={plein ? SUR_FORT : FORT}>{k + 1}</T>
            <T x={x + 24} y={y + 116} taille={32} poids={600} couleur={plein ? SUR_FORT : TEXTE}>{nom}</T>
            {col < 2 && <line x1={x + 270} y1={y + 75} x2={x + 320} y2={y + 75} stroke={ARGENT} strokeWidth={4} />}
          </g>
        );
      })}
      <path d={`M${40 + 2 * 320 + 135},240 L${40 + 2 * 320 + 135},290 L175,290 L175,340`} fill="none" stroke={ARGENT} strokeWidth={4} />
    </Toile>
  );
}

/** Barème de l'ITS, CGI 2026 (leçon 1, « Les bases de la fiscalité au Niger »). */
function BaremeIts() {
  const taux = [1, 2, 6, 13, 25, 30, 32, 34, 35];
  return (
    <Toile label="Barème de l’ITS">
      <T x={40} y={96} taille={34} couleur={LEGER}>Barème de l’ITS, par tranche de salaire</T>
      {taux.map((v, k) => {
        const h = (v / 35) * 330;
        const x = 40 + k * 104;
        const dernier = k === taux.length - 1;
        return (
          <g key={v}>
            <rect x={x} y={560 - h} width={84} height={Math.max(h, 4)} rx={5} fill={dernier ? FORT : ARGENT} />
            <T x={x + 42} y={560 - h - 16} taille={28} poids={600} ancre="middle" couleur={dernier ? FORT : TEXTE}>{`${v}\u00a0%`}</T>
          </g>
        );
      })}
    </Toile>
  );
}

const FIGURES: Record<string, () => FigureTheme> = {
  // Leçon 9, « Stratégies d'investissement à long terme ».
  'bases-finance': () => ({
    figure: <Interets />,
    legende: '25 000 FCFA placés chaque mois, à 8 % par an en moyenne, pendant 20 ans.',
    source: 'exemple de la leçon 9 du cours.',
  }),
  // Leçon 2, « Actions, obligations, fonds : les bases » (À retenir 1 et 2).
  'bourse-investissement': () => ({
    figure: (
      <Toile label="Obligation et action selon le risque">
        <line x1={60} y1={330} x2={920} y2={330} stroke={PALE} strokeWidth={4} />
        <path d="M920,314 L948,330 L920,346 Z" fill={PALE} />
        <T x={60} y={400} taille={30} couleur={ARGENT}>Risque plus faible</T>
        <T x={948} y={400} taille={30} couleur={ARGENT} ancre="end">Risque élevé</T>
        <circle cx={250} cy={330} r={20} fill={ARGENT} />
        <circle cx={760} cy={330} r={26} fill={FORT} />
        <T x={250} y={196} taille={30} couleur={ARGENT} ancre="middle">un prêt</T>
        <T x={250} y={250} taille={50} poids={700} ancre="middle">Obligation</T>
        <T x={760} y={196} taille={30} couleur={ARGENT} ancre="middle">une part d’entreprise</T>
        <T x={760} y={250} taille={50} poids={700} ancre="middle">Action</T>
        <T x={250} y={480} taille={30} couleur={TEXTE} ancre="middle">intérêts connus</T>
        <T x={250} y={522} taille={30} couleur={TEXTE} ancre="middle">à l’avance</T>
        <T x={760} y={480} taille={30} couleur={TEXTE} ancre="middle">dividendes</T>
        <T x={760} y={522} taille={30} couleur={TEXTE} ancre="middle">{'et plus\u2011value'}</T>
      </Toile>
    ),
    legende: 'Une obligation rapporte des intérêts connus à l’avance ; une action, des dividendes et une plus-value, avec un risque élevé.',
    source: 'leçon 2 du cours.',
  }),
  // Leçon 1, « PIB, croissance et récession » : INS, comptes économiques rapides 2025.
  'economie-niger': () => ({
    figure: (
      <Repartition
        titre="Le PIB du Niger en 2025"
        label="Répartition du PIB du Niger en 2025"
        total={100}
        parts={[
          { nom: 'Agriculture et élevage', valeur: '47,4\u00a0%', poids: 47.4, couleur: FORT },
          { nom: 'Services', valeur: '33,6\u00a0%', poids: 33.6, couleur: ARGENT },
          { nom: 'Industrie, mines, construction', valeur: '19\u00a0%', poids: 19, couleur: PALE },
        ]}
      />
    ),
    legende: 'La richesse produite au Niger en 2025, par grand secteur.',
    source: 'INS, comptes économiques rapides 2025.',
  }),
  // Leçon 2, « La règle 50/30/20 » : l'exemple avec 200 000 FCFA par mois.
  'budget-banque': () => ({
    figure: (
      <Repartition
        titre={`Un revenu de ${fine(200000)} FCFA par mois`}
        label="La règle 50/30/20"
        total={100}
        parts={[
          { nom: 'Besoins', valeur: `${fine(100000)} FCFA`, poids: 50, couleur: FORT },
          { nom: 'Envies', valeur: `${fine(60000)} FCFA`, poids: 30, couleur: ARGENT },
          { nom: 'Épargne', valeur: `${fine(40000)} FCFA`, poids: 20, couleur: PALE },
        ]}
      />
    ),
    legende: 'La règle 50/30/20 : la moitié pour les besoins, 30 % pour les envies, 20 % pour l’épargne.',
    source: 'exemple de la leçon 2 du cours.',
  }),
  // Leçon 1, « Le franc CFA : histoire et fonctionnement » : 1 euro = 655,957 FCFA depuis 1999.
  'devises-change': () => ({
    figure: (
      <Toile label="Parité fixe du franc CFA avec l’euro">
        <T x={40} y={96} taille={34} couleur={LEGER}>1 euro vaut</T>
        <T x={36} y={290} taille={190} poids={800}>655,957</T>
        <T x={44} y={370} taille={44} poids={600} couleur={ARGENT}>francs CFA</T>
        <line x1={40} y1={480} x2={955} y2={480} stroke={FORT} strokeWidth={6} strokeLinecap="round" />
        <circle cx={40} cy={480} r={11} fill={FORT} />
        <circle cx={955} cy={480} r={11} fill={FORT} />
        <T x={40} y={548} taille={30} couleur={ARGENT}>1999</T>
        <T x={960} y={548} taille={30} couleur={ARGENT} ancre="end">Aujourd’hui</T>
      </Toile>
    ),
    legende: 'La parité entre le franc CFA et l’euro est fixe depuis 1999.',
    source: 'leçon 1 du cours.',
  }),
  'crypto-blockchain': () => ({
    figure: <Chaine />,
    legende: 'Les six étapes d’une opération, de l’envoi à l’inscription dans la chaîne.',
    source: 'leçon 1 du cours.',
  }),
  // Leçon 1, « Les bases de l'investissement immobilier » : 4 800 000 ÷ 50 000 000 = 9,6 %.
  immobilier: () => ({
    figure: (
      <Toile label="Rendement brut d’un bien">
        <T x={40} y={96} taille={34} couleur={LEGER}>Rendement brut</T>
        <T x={34} y={330} taille={230} poids={800}>9,6 %</T>
        <T x={40} y={440} taille={36} couleur={TEXTE}>{`Loyers : ${fine(4800000)} FCFA par an`}</T>
        <T x={40} y={500} taille={36} couleur={TEXTE}>{`Prix d’achat : ${fine(50000000)} FCFA`}</T>
      </Toile>
    ),
    legende: 'Un bien acheté 50 millions de FCFA et loué 400 000 FCFA par mois.',
    source: 'exemple de la leçon 1 du cours.',
  }),
  // Leçon 2, « Les formes juridiques au Niger » : Acte uniforme OHADA révisé en 2014.
  entrepreneuriat: () => ({
    figure: (
      <Toile label="Capital minimum d’une SARL et d’une SA">
        <T x={40} y={96} taille={34} couleur={LEGER}>Capital minimum</T>
        <T x={40} y={205} taille={40} poids={700}>SARL</T>
        <rect x={40} y={230} width={92} height={64} rx={6} fill={ARGENT} />
        <T x={152} y={276} taille={36} couleur={TEXTE}>1 million FCFA</T>
        <T x={40} y={405} taille={40} poids={700}>SA</T>
        <rect x={40} y={430} width={920} height={64} rx={6} fill={FORT} />
        <T x={940} y={476} taille={36} poids={700} couleur={SUR_FORT} ancre="end">10 millions FCFA</T>
      </Toile>
    ),
    legende: 'Le capital minimum dans l’espace OHADA (pour la SARL, sauf disposition nationale contraire).',
    source: 'Acte uniforme OHADA, leçon 2 du cours.',
  }),
  'fiscalite-droit': () => ({
    figure: <BaremeIts />,
    legende: 'Chaque tranche du salaire mensuel a son taux, de 1 % à 35 %.',
    source: 'Code général des impôts 2026.',
  }),
  // Leçon 1, « Introduction à l'assurance » : dommage de 400 000, franchise de 50 000.
  'assurance-prevoyance': () => ({
    figure: (
      <Repartition
        titre={`Un dommage de ${fine(400000)} FCFA`}
        label="La franchise d’assurance"
        total={400000}
        parts={[
          { nom: 'Versé par l’assureur', valeur: `${fine(350000)} FCFA`, poids: 350000, couleur: FORT },
          { nom: 'Franchise, à votre charge', valeur: `${fine(50000)} FCFA`, poids: 50000, couleur: ARGENT },
        ]}
      />
    ),
    legende: 'Un dommage couvert de 400 000 FCFA, avec une franchise de 50 000 FCFA.',
    source: 'exemple de la leçon 1 du cours.',
  }),
};

/** La figure d'un thème, ou null : une couverture sans figure garde son icône et son titre, jamais une icône agrandie. */
export function figureDuTheme(slug: string): FigureTheme | null {
  const fabrique = FIGURES[slug];
  return fabrique ? fabrique() : null;
}

/** Les thèmes qui ont leur figure (contrôlé par les tests). */
export const THEMES_AVEC_FIGURE = Object.keys(FIGURES);
