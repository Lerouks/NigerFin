'use client';

/**
 * Règle les fins de ligne de la page d'un article sur le rendu réel : mesure
 * chaque mot à l'écran, choisit les coupures (src/lib/article/coupures.ts),
 * puis pose un <br data-regle> à chacune. Recalculé quand la largeur change
 * ou quand le contenu change (texte Premium chargé après coup).
 *
 * Ne touche que des blocs dont React ne gère pas le texte : HTML de l'article
 * (dangerouslySetInnerHTML) et titres rendus de la même façon. Un bloc marqué
 * data-sans-reglage (ou dans un tel bloc) est laissé tel quel.
 */
import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { meilleuresCoupures, type EspaceMesure, type GenreBloc, type MotMesure } from '@/lib/article/coupures';

const SELECTEUR = 'h1, h2, h3, p, li, .ligne-reglee, span.phrase';
const SECABLES = ' \n\t\r';

interface Bloc { original: string; produit: string }
const memoire = new WeakMap<Element, Bloc>();

function textes(bloc: Element): Text[] {
  const sortie: Text[] = [];
  const marche = document.createTreeWalker(bloc, NodeFilter.SHOW_TEXT);
  let n = marche.nextNode();
  while (n) {
    sortie.push(n as Text);
    n = marche.nextNode();
  }
  return sortie;
}

function contientDesBlocs(bloc: Element): boolean {
  return [...bloc.querySelectorAll('*')].some((e) => e.tagName !== 'BR' && /^(block|flex|grid|list-item|table)$/.test(getComputedStyle(e).display));
}

/** Mots et espaces du bloc, mesurés à l'écran, avec la position de chaque espace ; null si le bloc ne se mesure pas. */
function lire(bloc: Element) {
  const mots: (MotMesure & { gauche: number; droite: number })[] = [];
  const espaces: (EspaceMesure & { noeud: Text; position: number })[] = [];
  let blanc: { car: string; noeud: Text; position: number } | null = null;
  let courant: (MotMesure & { gauche: number; droite: number }) | null = null;
  const plage = document.createRange();
  for (const noeud of textes(bloc)) {
    const re = /(\s+)|(\S+)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(noeud.data))) {
      if (m[1] !== undefined) {
        if (!blanc) blanc = { car: m[1][0]!, noeud, position: m.index };
        courant = null;
        continue;
      }
      plage.setStart(noeud, m.index);
      plage.setEnd(noeud, m.index + m[2]!.length);
      const rects = [...plage.getClientRects()].filter((r) => r.width > 0);
      if (rects.length !== 1) return null;
      const r = rects[0]!;
      if (courant) {
        if (r.left < courant.droite - 1) return null;
        courant.texte += m[2]!;
        courant.droite = r.right;
        courant.largeur = courant.droite - courant.gauche;
        continue;
      }
      if (mots.length > 0) {
        if (!blanc) return null;
        espaces[mots.length] = { largeur: Number.NaN, secable: SECABLES.includes(blanc.car), noeud: blanc.noeud, position: blanc.position };
      }
      courant = { texte: m[2]!, gauche: r.left, droite: r.right, largeur: r.width };
      mots.push(courant);
      blanc = null;
    }
  }
  if (mots.length < 2) return null;
  const mesurees: number[] = [];
  for (let j = 1; j < mots.length; j += 1) {
    const ecart = mots[j]!.gauche - mots[j - 1]!.droite;
    if (ecart > 0 && ecart < 40) {
      espaces[j]!.largeur = ecart;
      mesurees.push(ecart);
    }
  }
  const taille = parseFloat(getComputedStyle(bloc).fontSize) || 16;
  const mediane = mesurees.length ? [...mesurees].sort((a, b) => a - b)[Math.floor(mesurees.length / 2)]! : taille * 0.27;
  for (let j = 1; j < mots.length; j += 1) if (Number.isNaN(espaces[j]!.largeur)) espaces[j]!.largeur = mediane;
  return { mots, espaces };
}

function restaurer(bloc: Element) {
  const m = memoire.get(bloc);
  if (!m) return;
  if (bloc.innerHTML === m.produit) bloc.innerHTML = m.original;
  else memoire.delete(bloc); // le contenu a changé entre-temps : on repart de lui.
}

function regler(bloc: Element) {
  if (bloc.closest('[data-sans-reglage]')) return;
  const style = getComputedStyle(bloc);
  if (style.display === 'inline' || style.display === 'none' || style.whiteSpace === 'nowrap') return;
  restaurer(bloc);
  const largeur = bloc.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
  if (largeur <= 0 || contientDesBlocs(bloc)) return;
  const lu = lire(bloc);
  if (!lu) return;
  const genre: GenreBloc = /^H[1-3]$/.test(bloc.tagName) ? 'titre' : bloc.classList.contains('ligne-reglee') ? 'liste' : 'texte';
  const debuts = meilleuresCoupures(lu.mots, lu.espaces, largeur, genre);
  if (!debuts || debuts.length === 0) return;
  const original = bloc.innerHTML;
  // Du dernier au premier, pour que les positions déjà lues restent justes.
  for (const j of [...debuts].reverse()) {
    const e = lu.espaces[j]!;
    const suite = e.noeud.splitText(e.position);
    suite.data = suite.data.slice(1);
    const br = document.createElement('br');
    br.setAttribute('data-regle', '');
    e.noeud.parentNode!.insertBefore(br, suite);
  }
  // Contrôle : autant de lignes que prévu et rien qui déborde, sinon le bloc est rendu tel quel.
  const hauts: number[] = [];
  const plage = document.createRange();
  plage.selectNodeContents(bloc);
  for (const r of plage.getClientRects()) {
    if (r.width > 0 && !hauts.some((h) => Math.abs(h - r.top) < r.height / 2)) hauts.push(r.top);
  }
  if (hauts.length !== debuts.length + 1 || bloc.scrollWidth > bloc.clientWidth + 1) {
    bloc.innerHTML = original;
    memoire.delete(bloc);
    return;
  }
  memoire.set(bloc, { original, produit: bloc.innerHTML });
}

export function ReglageLignes({ children, className }: { children: ReactNode; className?: string }) {
  const cadre = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const racine = cadre.current;
    if (!racine) return;
    let attente = 0;
    let largeur = racine.clientWidth;
    let actif = false;
    let fini = false;

    const toutRegler = () => {
      if (fini) return;
      actif = true;
      observateur.disconnect();
      racine.querySelectorAll(SELECTEUR).forEach(regler);
      observateur.observe(racine, { childList: true, subtree: true, characterData: true });
      actif = false;
    };
    const plusTard = () => {
      window.clearTimeout(attente);
      attente = window.setTimeout(toutRegler, 120);
    };
    const observateur = new MutationObserver(() => {
      if (!actif) plusTard();
    });
    const redimension = new ResizeObserver(() => {
      if (Math.abs(racine.clientWidth - largeur) > 1) {
        largeur = racine.clientWidth;
        plusTard();
      }
    });

    toutRegler();
    // Les vraies polices changent la largeur des mots : on recommence une fois chargées.
    const polices = ['400 18px inter', '600 18px inter', '700 18px inter'];
    void Promise.all(polices.map((f) => document.fonts?.load(f).catch(() => null)))
      .then(() => document.fonts?.ready)
      .then(toutRegler);
    redimension.observe(racine);
    return () => {
      fini = true;
      window.clearTimeout(attente);
      observateur.disconnect();
      redimension.disconnect();
    };
  }, []);

  return (
    <div ref={cadre} className={className} data-reglage-lignes="">
      {children}
    </div>
  );
}
