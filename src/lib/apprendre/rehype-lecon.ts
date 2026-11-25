import { souderMotsOutils, typographieFr } from '@/lib/typographie-fr';
import { slugifier } from '@/lib/apprendre/lecture';

/**
 * Mise en forme d'une leçon, appliquée à l'arbre HTML produit depuis son
 * Markdown (après rehype-raw). Tourne à l'identique côté serveur et côté
 * navigateur, sans dépendance de plus.
 *
 * 1. Nettoyage par liste blanche : seules les balises et les attributs utiles
 *    à une leçon passent. Un <script>, un attribut onclick ou un lien
 *    javascript: écrits par erreur dans l'administration disparaissent.
 * 2. Hiérarchie : la leçon a son titre en H1 ; ses sections (## ou ###)
 *    deviennent des H2 avec une ancre, ses sous-sections (####) des H3.
 * 3. Le bloc « À retenir » : la section dont l'intertitre parle de retenir
 *    devient un encadré.
 * 4. « Le chiffre » : <figure data-type="chiffre"> avec des <data value="2024">
 *    devient le bandeau noir des grands chiffres.
 * 5. Typographie française sur chaque texte (insécables, apostrophes). Chaque
 *    phrase d'un paragraphe va dans un <span class="phrase"> : sur les très
 *    petits écrans, elle passe en bloc et commence toujours en début de ligne.
 *    Puis, bloc par bloc, chaque mot-outil soudé au mot qui le suit, gras compris.
 *    Les fins et débuts de phrase se règlent à l'écran (AjusteurLignes) : une
 *    soudure écrite ici ne connaît pas la largeur de la colonne.
 */

interface Texte {
  type: 'text';
  value: string;
}
interface Element {
  type: 'element';
  tagName: string;
  properties: Record<string, unknown>;
  children: Noeud[];
}
interface Autre {
  type: 'comment' | 'doctype' | 'raw';
  value?: string;
}
type Noeud = Texte | Element | Autre;
interface Racine {
  type: 'root';
  children: Noeud[];
}

const BALISES = new Set([
  'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'b', 'em', 'i', 'ul', 'ol', 'li', 'blockquote',
  'table', 'thead', 'tbody', 'tr', 'th', 'td', 'a', 'br', 'hr', 'figure', 'figcaption', 'data', 'span',
  'sup', 'sub', 'code', 'pre', 'div', 'section',
]);

/** Balises dont le contenu entier disparaît avec elles. */
const BALISES_INTERDITES = new Set(['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'textarea', 'select', 'noscript', 'template', 'svg', 'math']);

const ATTRIBUTS: Record<string, string[]> = {
  a: ['href'],
  th: ['colSpan', 'rowSpan'],
  td: ['colSpan', 'rowSpan'],
  ol: ['start'],
  figure: ['dataType', 'dataTitre', 'dataLegende', 'dataSource'],
  data: ['value'],
};

function el(tagName: string, className: string | null, children: Noeud[], properties: Record<string, unknown> = {}): Element {
  return { type: 'element', tagName, properties: className ? { ...properties, className: [className] } : properties, children };
}

function txt(value: string): Texte {
  return { type: 'text', value };
}

function texteDe(noeud: Noeud): string {
  if (noeud.type === 'text') return noeud.value;
  if (noeud.type === 'element') return noeud.children.map(texteDe).join('');
  return '';
}

function lienSur(href: unknown): string | null {
  if (typeof href !== 'string') return null;
  const h = href.trim();
  // « //autre-site.com » commence aussi par « / » mais quitte le site : refusé.
  if (/^(https?:|mailto:)/i.test(h) || (h.startsWith('/') && !/^\/[/\\]/.test(h)) || h.startsWith('#')) return h;
  return null;
}

/** Étape 1 : liste blanche, renommage des balises synonymes, liens sûrs. */
function nettoyer(enfants: Noeud[]): Noeud[] {
  const sortie: Noeud[] = [];
  for (const n of enfants) {
    if (n.type === 'text') {
      sortie.push(n);
      continue;
    }
    if (n.type !== 'element') continue; // commentaires, doctype, HTML brut
    const balise = n.tagName.toLowerCase();
    if (BALISES_INTERDITES.has(balise)) continue;
    if (!BALISES.has(balise)) {
      // Balise inconnue : on garde son texte, pas la balise.
      sortie.push(...nettoyer(n.children));
      continue;
    }
    const nom = balise === 'b' ? 'strong' : balise === 'i' ? 'em' : balise;
    const permis = ATTRIBUTS[nom] ?? [];
    const proprietes: Record<string, unknown> = {};
    for (const cle of permis) {
      if (n.properties[cle] !== undefined) proprietes[cle] = n.properties[cle];
    }
    if (nom === 'a') {
      const href = lienSur(n.properties.href);
      if (!href) {
        sortie.push(...nettoyer(n.children));
        continue;
      }
      proprietes.href = href;
      if (/^https?:/i.test(href) && !/^https?:\/\/(www\.)?nfireport\.com([/?#]|$)/i.test(href)) {
        proprietes.target = '_blank';
        proprietes.rel = 'noopener noreferrer';
      }
    }
    sortie.push({ type: 'element', tagName: nom, properties: proprietes, children: nettoyer(n.children) });
  }
  return sortie;
}

/** Étape 2 : sections en H2 avec ancre, sous-sections en H3. */
function hierarchiser(enfants: Noeud[], ancres = new Set<string>()): Noeud[] {
  return enfants.map((n) => {
    if (n.type !== 'element') return n;
    // Un intertitre rangé dans un bloc (<div>, <section>) suit la même règle.
    if (!/^h[1-6]$/.test(n.tagName)) {
      return n.tagName === 'pre' || n.tagName === 'code' ? n : { ...n, children: hierarchiser(n.children, ancres) };
    }
    const niveau = Number(n.tagName[1]);
    if (niveau >= 4) return { ...n, tagName: 'h3' };
    let ancre = slugifier(texteDe(n)) || 'section';
    while (ancres.has(ancre)) ancre += '-2';
    ancres.add(ancre);
    return { ...n, tagName: 'h2', properties: { ...n.properties, id: ancre } };
  });
}

/** Étape 3 : la section « À retenir » devient un encadré. */
function encadrerARetenir(enfants: Noeud[]): Noeud[] {
  const i = enfants.findIndex((n) => n.type === 'element' && n.tagName === 'h2' && /retenir/i.test(texteDe(n)));
  if (i === -1) return enfants;
  let fin = i + 1;
  while (fin < enfants.length) {
    const n = enfants[fin]!;
    if (n.type === 'element' && n.tagName === 'h2') break;
    fin += 1;
  }
  const contenu = enfants.slice(i + 1, fin);
  const encadre = el('aside', 'retenir', [el('p', 'retenir-titre', [txt('À retenir')]), ...contenu], { ariaLabel: 'À retenir' });
  return [...enfants.slice(0, i), encadre, ...enfants.slice(fin)];
}

/** Étape 4 : « Le chiffre », un bandeau noir de grands chiffres sourcés. */
function chiffres(enfants: Noeud[]): Noeud[] {
  return enfants.map((n) => {
    if (n.type !== 'element') return n;
    if (n.tagName === 'figure' && n.properties.dataType === 'chiffre') {
      const valeurs = n.children.filter((c): c is Element => c.type === 'element' && c.tagName === 'data');
      if (valeurs.length === 0) return txt('');
      const titre = typeof n.properties.dataTitre === 'string' ? n.properties.dataTitre : 'Le chiffre';
      const legende = typeof n.properties.dataLegende === 'string' ? n.properties.dataLegende : '';
      const source = typeof n.properties.dataSource === 'string' ? n.properties.dataSource : '';
      const colonnes = valeurs.slice(0, 3).map((v, k) =>
        el('div', 'chiffre-colonne', [
          el('p', 'chiffre-an', [txt(String(v.properties.value ?? ''))]),
          el('p', k === valeurs.length - 1 ? 'chiffre-valeur chiffre-valeur-derniere' : 'chiffre-valeur', [txt(texteDe(v).trim())]),
        ]),
      );
      const bas: Noeud[] = [];
      if (legende) bas.push(el('span', 'chiffre-legende', [txt(legende)]));
      if (source) bas.push(el('span', 'chiffre-source', [txt(source)]));
      return el('figure', 'chiffre', [
        el('p', 'chiffre-titre', [txt(titre)]),
        el('div', `chiffre-valeurs chiffre-valeurs-${Math.min(valeurs.length, 3)}`, colonnes),
        ...(bas.length ? [el('figcaption', null, bas)] : []),
      ]);
    }
    if (n.tagName === 'table') {
      // Un tableau large défile dans son cadre sur téléphone, jamais la page.
      return el('div', 'tableau', [n]);
    }
    return n;
  });
}

/** Étape 5 : typographie française sur chaque texte, sauf le code. */
function typographier(n: Noeud): Noeud {
  if (n.type === 'text') return { ...n, value: typographieFr(n.value) };
  if (n.type === 'element' && n.tagName !== 'code' && n.tagName !== 'pre') return { ...n, children: n.children.map(typographier) };
  return n;
}

const COUPURE_DE_PHRASE = /([.!?…]["»”)]?)(\s+)(?=[«“"(]?\p{Lu})/gu;
const BLOCS_ENFANTS = new Set(['p', 'ul', 'ol', 'div', 'table', 'figure', 'aside', 'blockquote', 'pre', 'section', 'h2', 'h3']);

/**
 * Étape 6 : les phrases d'un paragraphe ou d'un élément de liste, chacune dans
 * un <span class="phrase">. L'espace entre deux phrases ouvre la suivante :
 * dans le fil du texte, rien ne change ; en bloc (moins de 360 px), elle
 * disparaît en début de ligne. Une coupure à l'intérieur d'un gras ou d'un
 * lien n'est pas faite, ni après « M. », « art. », « p. » ou « n° ».
 */
function decouperPhrases(n: Noeud): void {
  if (n.type !== 'element' || n.tagName === 'pre' || n.tagName === 'code') return;
  const melange = n.children.some((c) => c.type === 'element' && BLOCS_ENFANTS.has(c.tagName));
  if ((n.tagName === 'p' || n.tagName === 'li') && !melange) {
    const groupes: Noeud[][] = [[]];
    for (const enfant of n.children) {
      if (enfant.type !== 'text') {
        groupes[groupes.length - 1]!.push(enfant);
        continue;
      }
      let debut = 0;
      COUPURE_DE_PHRASE.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = COUPURE_DE_PHRASE.exec(enfant.value))) {
        const fin = m.index + m[1]!.length;
        if (/(?:^|[\s(])(?:M|art|p|n°)\.$/i.test(enfant.value.slice(Math.max(0, fin - 6), fin))) continue;
        groupes[groupes.length - 1]!.push(txt(enfant.value.slice(debut, fin)));
        groupes.push([txt(m[2]!)]);
        debut = fin + m[2]!.length;
      }
      groupes[groupes.length - 1]!.push(txt(enfant.value.slice(debut)));
    }
    if (groupes.length > 1) {
      n.children = groupes.map((g) => el('span', 'phrase', g.filter((x) => x.type !== 'text' || x.value !== '')));
      return;
    }
  }
  n.children.forEach(decouperPhrases);
}

/** Blocs de texte soudés d'un seul tenant, gras et liens compris. */
const BLOCS_SOUDES = new Set(['p', 'li', 'h2', 'h3', 'blockquote', 'td', 'th', 'span']);

/** Les textes d'un bloc, dans l'ordre de lecture, sans descendre dans un autre bloc ni dans le code. */
function textesDuBloc(n: Element, sortie: Texte[] = []): Texte[] {
  for (const enfant of n.children) {
    if (enfant.type === 'text') sortie.push(enfant);
    else if (enfant.type === 'element' && enfant.tagName !== 'code' && !['p', 'li', 'ul', 'ol', 'table', 'figure', 'aside', 'div'].includes(enfant.tagName)) {
      textesDuBloc(enfant, sortie);
    }
  }
  return sortie;
}

/**
 * Soude chaque mot-outil au mot qui le suit sur le texte entier du bloc, même à
 * travers le gras ou un lien (« des **actions** »), puis remet chaque morceau à
 * sa place : seules des espaces deviennent insécables, la longueur ne bouge pas.
 *
 * Les fins et débuts de phrase ne se soudent pas ici : un bloc soudé de trente
 * caractères laisse un mot seul sur la ligne d'avant dans une colonne de
 * téléphone. AjusteurLignes les règle sur le rendu réel.
 */
function souderBloc(n: Element): void {
  const textes = textesDuBloc(n);
  if (textes.length === 0) return;
  const entier = textes.map((t) => t.value).join('');
  const soude = souderMotsOutils(entier);
  if (soude.length !== entier.length) return;
  let position = 0;
  for (const t of textes) {
    t.value = soude.slice(position, position + t.value.length);
    position += t.value.length;
  }
}

function souder(n: Noeud): void {
  if (n.type !== 'element' || n.tagName === 'code' || n.tagName === 'pre') return;
  if (BLOCS_SOUDES.has(n.tagName)) souderBloc(n);
  n.children.forEach(souder);
}

export function rehypeLecon() {
  return (arbre: Racine) => {
    let enfants = nettoyer(arbre.children);
    enfants = hierarchiser(enfants);
    enfants = encadrerARetenir(enfants);
    enfants = chiffres(enfants);
    arbre.children = enfants.map(typographier);
    arbre.children.forEach(decouperPhrases);
    arbre.children.forEach(souder);
  };
}
