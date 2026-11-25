'use client';

import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { chercher, INSECABLE, noter, SECABLES, simuler, type Espace, type Mise, type MotMesure } from '@/lib/apprendre/lignes';
import styles from './lecon.module.css';

/**
 * Fins de ligne réglées sur l'écran du lecteur.
 *
 * Une soudure écrite à l'avance ne sait pas où chaque ligne se coupera : une
 * même phrase finit sur trois mots seuls à 320 px et pas à 390, et corriger
 * une ligne à la fois creuse la ligne d'à côté. Ce composant mesure donc
 * chaque mot à l'écran, puis le calcul de src/lib/apprendre/lignes.ts rejoue
 * la mise en page et choisit, pour tout le paragraphe d'un coup, les quelques
 * espaces à rendre insécables. Le résultat est vérifié sur le rendu réel et
 * annulé s'il n'est pas meilleur. Tout recommence quand la largeur change.
 *
 * Seules des espaces ordinaires deviennent insécables : le texte garde sa
 * longueur, et React peut toujours le réécrire.
 */

// span.phrase : une phrase d'un paragraphe, en bloc sur les très petits écrans
// (en ligne ailleurs, sa largeur est nulle et elle est laissée au paragraphe).
const SELECTEUR = 'p, li, h2, h3, figcaption span, [role="radio"] > span:nth-child(2), span.phrase';
const FINE = ' ';

interface Mot extends MotMesure {
  atomes: { noeud: Text; debut: number; fin: number }[];
}

interface Separateur extends Espace {
  noeud: Text;
  position: number;
}

const originaux = new WeakMap<Text, string>();

/**
 * Vrai quand `actuel` ne diffère de `origine` que par des espaces devenues
 * insécables, la seule retouche que fait ce composant. Faux quand React a
 * réécrit le texte depuis (nouvel état) : il ne faut alors pas le restaurer.
 */
export function estNotreRetouche(origine: string, actuel: string): boolean {
  if (origine.length !== actuel.length) return false;
  for (let i = 0; i < origine.length; i += 1) {
    if (origine[i] !== actuel[i] && !(SECABLES.includes(origine[i]!) && actuel[i] === INSECABLE)) return false;
  }
  return true;
}

function textes(bloc: Element): Text[] {
  const sortie: Text[] = [];
  const marche = document.createTreeWalker(bloc, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement?.closest('code') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  let n = marche.nextNode();
  while (n) {
    sortie.push(n as Text);
    n = marche.nextNode();
  }
  return sortie;
}

function restaurer(bloc: Element) {
  for (const n of textes(bloc)) {
    const o = originaux.get(n);
    if (o === undefined) continue;
    if (estNotreRetouche(o, n.data)) n.data = o;
    originaux.delete(n);
  }
}

function largeurColonne(bloc: Element): number {
  const style = getComputedStyle(bloc);
  return bloc.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
}

/** Un bloc qui contient d'autres blocs (liste imbriquée, retours voulus) ne se rejoue pas ligne à ligne. */
function contientDesBlocs(bloc: Element): boolean {
  return [...bloc.querySelectorAll('*')].some((e) => /^(block|flex|grid|list-item|table)$/.test(getComputedStyle(e).display));
}

const mediane = (valeurs: number[]): number =>
  valeurs.length ? [...valeurs].sort((a, b) => a - b)[Math.floor(valeurs.length / 2)]! : Number.NaN;

/** Les mots du bloc, les espaces qui les séparent et leurs lignes, mesurés à l'écran ; null si le bloc ne se rejoue pas. */
function lire(bloc: Element): { mots: Mot[]; seps: Separateur[]; mise: Mise } | null {
  const mots: Mot[] = [];
  const seps: Separateur[] = [];
  let blanc: { car: string; noeud: Text; position: number; longueur: number } | null = null;
  let courant: Mot | null = null;
  const plage = document.createRange();
  for (const noeud of textes(bloc)) {
    const re = /(\s+)|(\S+)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(noeud.data))) {
      if (m[1] !== undefined) {
        if (!blanc) blanc = { car: m[1][0]!, noeud, position: m.index, longueur: 0 };
        blanc.longueur += m[1].length;
        courant = null;
        continue;
      }
      const texte = m[2]!;
      plage.setStart(noeud, m.index);
      plage.setEnd(noeud, m.index + texte.length);
      const rects = plage.getClientRects();
      if (rects.length !== 1) return null;
      const r = rects[0]!;
      const atome = { noeud, debut: m.index, fin: m.index + texte.length };
      if (courant) {
        // Collé au morceau d'avant sans espace (fin d'un gras, ponctuation) : même mot, même ligne.
        if (r.left < courant.droite - 1) return null;
        courant.atomes.push(atome);
        courant.texte += texte;
        courant.droite = r.right;
        continue;
      }
      if (mots.length > 0) {
        if (!blanc) return null;
        seps[mots.length] = {
          car: blanc.longueur === 1 ? blanc.car : 'plusieurs',
          noeud: blanc.noeud,
          position: blanc.position,
          largeur: Number.NaN,
        };
      }
      courant = { texte, atomes: [atome], gauche: r.left, droite: r.right };
      mots.push(courant);
      blanc = null;
    }
  }
  if (mots.length < 2) return null;

  // Lignes réelles : un mot qui repart vers la gauche ouvre une ligne.
  const ligneDe = [0];
  for (let j = 1; j < mots.length; j += 1) {
    ligneDe.push(ligneDe[j - 1]! + (mots[j]!.gauche < mots[j - 1]!.droite - 1 ? 1 : 0));
  }
  // Largeur de chaque espace, mesurée quand ses deux mots sont sur la même ligne ;
  // sinon celle des espaces du même caractère.
  const parCar = new Map<string, number[]>();
  for (let j = 1; j < mots.length; j += 1) {
    const s = seps[j]!;
    if (ligneDe[j] === ligneDe[j - 1]) {
      s.largeur = mots[j]!.gauche - mots[j - 1]!.droite;
      parCar.set(s.car, [...(parCar.get(s.car) ?? []), s.largeur]);
    }
  }
  const taille = parseFloat(getComputedStyle(bloc).fontSize) || 16;
  const espace = mediane([...(parCar.get(' ') ?? []), ...(parCar.get(INSECABLE) ?? [])]);
  for (let j = 1; j < mots.length; j += 1) {
    const s = seps[j]!;
    if (!Number.isNaN(s.largeur)) continue;
    const connue = mediane(parCar.get(s.car) ?? []);
    if (!Number.isNaN(connue)) s.largeur = connue;
    else if (s.car === FINE) s.largeur = taille * 0.16;
    else s.largeur = Number.isNaN(espace) ? taille * 0.27 : espace;
  }
  const largeurs: number[] = [];
  let debut = 0;
  for (let j = 1; j <= mots.length; j += 1) {
    if (j === mots.length || ligneDe[j] !== ligneDe[j - 1]) {
      largeurs.push(mots[j - 1]!.droite - mots[debut]!.gauche);
      debut = j;
    }
  }
  seps[0] = { car: '', noeud: mots[0]!.atomes[0]!.noeud, position: 0, largeur: 0 };
  return { mots, seps, mise: { ligneDe, largeurs, deborde: false } };
}

const memesLignes = (a: number[], b: number[]) => a.length === b.length && a.every((l, i) => l === b[i]);

function ajusterBloc(bloc: Element) {
  // Une phrase dans le fil du texte (span.phrase en ligne) est réglée avec son
  // paragraphe : la restaurer ici déferait le travail fait sur le paragraphe.
  if (getComputedStyle(bloc).display === 'inline') return;
  restaurer(bloc);
  const largeur = largeurColonne(bloc);
  if (largeur <= 0 || contientDesBlocs(bloc)) return;
  const lu = lire(bloc);
  if (!lu) return;
  const { mots, seps, mise } = lu;
  // La dernière phrase d'un paragraphe (en bloc sur les petits écrans) porte sa dernière ligne.
  const parent = bloc.parentElement;
  const finDeParagraphe =
    bloc.matches('span.phrase') &&
    parent?.lastElementChild === bloc &&
    (parent.textContent ?? '').split(/\s+/).filter((m) => /[\p{L}\p{N}]/u.test(m)).length >= 8;
  const avant = noter(mots, mise, largeur, 0, finDeParagraphe);
  if (avant.durs === 0) return;

  // Largeur d'une espace insécable, puis la règle « tient sur la ligne » calée
  // pour retrouver exactement les lignes affichées (sinon on ne touche à rien).
  const surLaLigne = (j: number) => j > 0 && mise.ligneDe[j] === mise.ligneDe[j - 1];
  const mesurees = seps.filter((s, j) => s.car === INSECABLE && surLaLigne(j)).map((s) => s.largeur);
  const insecable = mesurees.length ? mediane(mesurees) : mediane(seps.filter((_, j) => surLaLigne(j)).map((s) => s.largeur));
  if (Number.isNaN(insecable)) return;
  // La règle la plus stricte qui retrouve les lignes affichées : une ligne
  // prévue au pixel près ne doit pas passer pour pleine si elle déborde.
  const tolerance = [-1, -0.5, 0, 0.3, 1, 2].find((t) =>
    memesLignes(simuler(mots, seps, new Set(), largeur, t, insecable).ligneDe, mise.ligneDe),
  );
  if (tolerance === undefined) return;

  const solutions = chercher(mots, seps, largeur, tolerance, insecable, 6, finDeParagraphe);
  if (solutions.length === 0) return;
  const sauvegarde = textes(bloc).map((n) => [n, n.data] as const);
  const remettre = () =>
    sauvegarde.forEach(([n, d]) => {
      if (n.data !== d) n.data = d;
    });
  const souder = (colles: number[]) => {
    for (const j of colles) {
      const s = seps[j]!;
      if (!originaux.has(s.noeud)) originaux.set(s.noeud, s.noeud.data);
      s.noeud.data = s.noeud.data.slice(0, s.position) + INSECABLE + s.noeud.data.slice(s.position + 1);
    }
  };
  // Chaque solution est essayée sur le rendu réel ; la meilleure est gardée,
  // et seulement si elle fait mieux que le paragraphe tel quel.
  let retenue: { colles: number[]; durs: number; note: number } = { colles: [], ...avant };
  for (const colles of solutions) {
    souder(colles);
    const apres = lire(bloc);
    const bilan = apres ? noter(apres.mots, apres.mise, largeur, colles.length, finDeParagraphe) : null;
    const deborde = bloc.scrollWidth > bloc.clientWidth + 1;
    remettre();
    if (bilan && !deborde && (bilan.durs < retenue.durs || (bilan.durs === retenue.durs && bilan.note < retenue.note))) {
      retenue = { colles, ...bilan };
    }
    if (retenue.durs === 0) break;
  }
  if (retenue.colles.length > 0) souder(retenue.colles);
}

export function AjusteurLignes({ children }: { children: ReactNode }) {
  const cadre = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const racine = cadre.current;
    if (!racine) return;
    let attente = 0;
    let largeur = racine.clientWidth;
    let actif = false;
    // Démonté (changement de page) : un appel tardif, polices chargées par
    // exemple, ne doit plus rien observer.
    let fini = false;

    const ajuster = () => {
      if (fini) return;
      actif = true;
      observateur.disconnect();
      racine.querySelectorAll(SELECTEUR).forEach(ajusterBloc);
      observateur.observe(racine, { childList: true, subtree: true, characterData: true });
      actif = false;
    };
    const plusTard = () => {
      window.clearTimeout(attente);
      attente = window.setTimeout(ajuster, 120);
    };
    // Le contenu change (leçon Premium chargée, réponse affichée) : on recommence.
    const observateur = new MutationObserver(() => {
      if (!actif) plusTard();
    });
    const redimension = new ResizeObserver(() => {
      if (Math.abs(racine.clientWidth - largeur) > 1) {
        largeur = racine.clientWidth;
        plusTard();
      }
    });

    ajuster();
    void document.fonts?.ready.then(ajuster);
    redimension.observe(racine);
    return () => {
      fini = true;
      window.clearTimeout(attente);
      observateur.disconnect();
      redimension.disconnect();
    };
  }, []);

  return (
    <div ref={cadre} className={styles.ajuste}>
      {children}
    </div>
  );
}
