import { SITE_URL } from '@/lib/config';

/**
 * Design « Cadre » des e-mails de NFI REPORT (choisi par Raouf le 23/11/2026,
 * à la place du design « Édition » du même jour).
 *
 * Aux couleurs du site : le noir ouvre et ferme le mail (bandeau avec le logo
 * argent et NFI REPORT, pied noir avec le slogan), la lecture se fait sur blanc,
 * le titre finit en gris comme « L’économie du Niger, en clair ». Aucune autre
 * couleur que le noir, les gris, l’argent et le blanc (vert et rouge pour les états).
 *
 * Ce que ce module garantit pour tous les mails :
 * - un mode sombre dessiné (Apple Mail via prefers-color-scheme, Outlook.com via
 *   [data-ogsc] et [data-ogsb]) ; si Gmail éclaircit les bandeaux noirs, le mot
 *   NFI REPORT et le slogan gardent un liseré sombre qui les laisse lisibles ;
 * - NFI REPORT et le slogan en images Playfair (Gmail ne charge pas les polices) ;
 * - des tableaux et des styles en ligne, lus par tous les clients mail ;
 * - une typographie française : espaces insécables, apostrophes courbes, mots
 *   courts soudés au mot suivant, fins de paragraphe et débuts de phrase soudés
 *   pour ne jamais laisser deux ou trois mots seuls sur une ligne.
 */

export const NB = ' ';
const SANS = "Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const TITRE = `'Inter Display',${SANS}`;
const IMG = `${SITE_URL}/email`;

const CLAIR = {
  page: '#efeff0', papier: '#ffffff', bloc: '#f5f5f6', encre: '#111111', texte: '#2b2c30', doux: '#6b6f76', gris: '#8a8e95',
  num: '#a9adb4', filet: '#e4e5e8', fort: '#111111', btn: '#0b0b0c', btnTxt: '#ffffff', past: '#111111', pastTxt: '#ffffff',
};
const SOMBRE = {
  page: '#000000', papier: '#161618', bloc: '#1f1f22', encre: '#f5f5f5', texte: '#d4d6da', doux: '#9a9ea5', gris: '#8a8e95',
  num: '#6b6f76', filet: '#2c2c30', fort: '#e6e7ea', btn: '#f5f5f5', btnTxt: '#0b0b0c', past: '#f5f5f5', pastTxt: '#0b0b0c',
};
/** Bandeaux noirs d'ouverture et de fermeture : identiques en mode clair et en mode sombre. */
const BANDE = { fond: '#0b0b0c', texte: '#8a8e95', lien: '#d4d6da', sep: '#4a4d52', mentions: '#6b6f76', fort: '#d4d6da' };
const C = CLAIR;

// ─── Typographie française ───────────────────────────────────────────────────

const PETITS =
  'à|a|y|au|aux|de|des|du|la|le|les|un|une|en|et|ou|si|ce|sa|se|ne|il|on|par|pour|dans|sur|avec|sans|entre|chez|vers|sous|' +
  'cet|cette|ces|son|ses|mon|ma|mes|votre|vos|notre|nos|leur|leurs|moins|aussi|donc|bien|doit|peut';
const RE_PETITS = new RegExp(`(^|[\\s\\u00a0(“])(${PETITS}) (?=\\S)`, 'giu');

/** Apostrophes courbes, insécables avant : ; ? ! %, mots courts soudés au mot suivant. */
export function typo(s: string): string {
  let t = s.replace(/'/g, '’');
  let avant: string;
  do {
    avant = t;
    t = t.replace(RE_PETITS, (_m, p1: string, mot: string) => `${p1}${mot}${NB}`);
  } while (t !== avant);
  return t
    .replace(/ ([:;?!%])/g, `${NB}$1`)
    .replace(/NFI REPORT/g, `NFI${NB}REPORT`)
    // Un nombre ne quitte jamais ce qu'il compte : « 12 janvier 2027 », « 3 mois », « 50 000 FCFA ».
    .replace(/(\d+(?:er)?) (janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\b/giu, `$1${NB}$2`)
    .replace(/(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre) (\d{4})/giu, `$1${NB}$2`)
    .replace(/(\d) (\d{3})\b/g, `$1${NB}$2`)
    .replace(/(\d) (FCFA|mois|an|ans|heure|heures|jours?)\b/giu, `$1${NB}$2`)
    // … et un nombre reste avec le nom qu'il compte (« 30 pays »), jamais avec un mot court (« 2026 au »).
    .replace(new RegExp(`(\\d) (?!(?:${PETITS})[\\s\\u00a0])(?=\\p{L})`, 'giu'), `$1${NB}`)
    // Un mot composé ne se coupe pas à son trait d'union : « conservez‑la », « Nigeria‑Algérie ».
    .replace(/(\p{L})-(\p{L})/gu, '$1\u2011$2')
    // Le code postal reste avec sa ville : « 8001 Niamey ».
    .replace(/(\d{4}) Niamey/g, `$1${NB}Niamey`)
    // Un libellé court cité entre guillemets ne se coupe pas : “Mot de passe oublié”.
    .replace(/“([^”]{1,24})”/gu, (_m, dedans: string) => `“${dedans.replace(/ /g, NB)}”`);
}

const mots = (toks: string[], a: number, b: number) => toks.slice(a, b + 1).join(' ').split(/[  ]/).length;
const longueur = (toks: string[], a: number, b: number) => toks.slice(a, b + 1).join(' ').length;

/**
 * Paragraphe prêt à poser : typographie, puis fin de paragraphe et débuts de
 * phrase soudés par des insécables (au moins quatre mots ensemble), pour que la
 * dernière ligne ne porte jamais deux ou trois mots seuls et qu'une phrase ne
 * commence jamais en bout de ligne.
 */
export function soude(s: string, plafond = 34): string {
  const toks = typo(s).split(' ');
  const n = toks.length;
  const total = mots(toks, 0, n - 1);
  if (total < 9) {
    // Paragraphe court : la dernière ligne garde au moins trois mots (quatre dès
    // huit mots), dans la limite d'un bloc qui tient sur une ligne de téléphone.
    const cible = total >= 8 ? 4 : 3;
    let k = n - 1;
    while (k > 0 && mots(toks, k, n - 1) < cible && longueur(toks, k - 1, n - 1) <= plafond - 4) k--;
    if (k < n - 1) return [...toks.slice(0, k), toks.slice(k).join(NB)].join(' ');
    return toks.join(' ');
  }
  let j = n - 1;
  while (j > 0 && (longueur(toks, j, n - 1) < 18 || mots(toks, j, n - 1) < 4) && longueur(toks, j - 1, n - 1) <= plafond) j--;
  const groupes = new Map<number, number>([[j, n - 1]]);
  for (let i = 1; i < j; i++) {
    if (!/[.!?]$/.test(toks[i - 1] ?? '')) continue;
    let k = i;
    while (k + 1 < n && mots(toks, i, k) < 4 && longueur(toks, i, k + 1) <= plafond) k++;
    if (k >= j - 1 && longueur(toks, i, n - 1) <= plafond) {
      for (const a of [...groupes.keys()]) if (a >= i) groupes.delete(a);
      groupes.set(i, n - 1);
      break;
    }
    k = Math.min(k, j - 1);
    if (k > i) groupes.set(i, k);
  }
  const sortie: string[] = [];
  for (let i = 0; i < n; ) {
    const b = groupes.get(i);
    if (b !== undefined) {
      sortie.push(toks.slice(i, b + 1).join(NB));
      i = b + 1;
    } else {
      sortie.push(toks[i] ?? '');
      i++;
    }
  }
  return sortie.join(' ');
}

/** Titre : typographie, et le dernier mot ne reste jamais seul. */
export function titreTypo(s: string): string {
  const t = typo(s);
  const i = t.lastIndexOf(' ');
  if (i < 0) return t;
  const dernier = t.slice(i + 1);
  return dernier.includes(NB) || dernier.length > 14 ? t : `${t.slice(0, i)}${NB}${dernier}`;
}

/** Échappe une valeur dynamique (nom, motif, message) avant de la poser dans le HTML. */
export function esc(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ─── Briques ─────────────────────────────────────────────────────────────────

export function blanc(h: number): string {
  return `<div style="height:${h}px;line-height:${h}px;font-size:0;">&nbsp;</div>`;
}

export function filet(fort = false, epaisseur = 1): string {
  const cls = fort ? 'b-fort' : 'b-filet';
  const coul = fort ? C.fort : C.filet;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td class="${cls}" style="border-top:${epaisseur}px solid ${coul};font-size:0;line-height:0;">&nbsp;</td></tr></table>`;
}

/** Ligne de contenu du mail (bandeau papier, marges latérales). */
export function rangee(contenu: string, haut = 0, bas = 0): string {
  return `<tr><td class="px f-papier" style="background:${C.papier};padding:${haut}px 48px ${bas}px;">${contenu}</td></tr>`;
}

/**
 * Fins de titre posées en gris, comme « en clair » sur la page d'accueil du site.
 * Un titre modifié dans le Cockpit qui ne finit par aucune d'elles reste tout en noir.
 */
const SUITES_GRISES = [
  'est passé en lecture gratuite', 'prend fin bientôt', 'pour votre inscription', 'votre nouvelle adresse',
  'de vérification', 'de connexion', 'sur NFI REPORT', 'est disponible', 'votre compte', 'mot de passe',
  'a pris fin', 'est activé', 'est ouvert', 'non validé', 'bien reçu', 'de contact', 'modifié',
];

/**
 * Contenu exact du titre dans le HTML (fin grise comprise). Les textes modifiables
 * du Cockpit s'en servent pour retrouver le titre et le remplacer (slots.ts).
 */
export function titreRendu(s: string): string {
  const suite = SUITES_GRISES.find((g) => s.endsWith(` ${g}`));
  if (!suite) return titreTypo(s);
  const court = suite.length <= 18;
  return `${typo(s.slice(0, s.length - suite.length - 1))} <span class="c-gris" style="color:${C.gris};${court ? 'white-space:nowrap;' : ''}">${court ? typo(suite) : titreTypo(suite)}</span>`;
}

export function titre(s: string): string {
  return `<h1 class="h1 c-encre" style="margin:0;font-family:${TITRE};font-size:32px;line-height:38px;font-weight:700;letter-spacing:-0.02em;color:${C.encre};">${titreRendu(s)}</h1>`;
}

type Role = 'encre' | 'texte' | 'doux';
interface OptionsPara { role?: Role; taille?: number; hauteur?: number; marge?: string; graisse?: number; italique?: boolean; plafond?: number }

/** Paragraphe à partir d'un texte brut (typographie appliquée). */
export function para(s: string, o: OptionsPara = {}): string {
  return paraHtml(soude(s, o.plafond), o);
}

/** Paragraphe à partir d'un HTML déjà prêt (valeurs dynamiques échappées, gras). */
export function paraHtml(html: string, o: OptionsPara = {}): string {
  const role = o.role ?? 'texte';
  const it = o.italique ? 'font-style:italic;' : '';
  return `<p class="c-${role}" style="margin:${o.marge ?? '16px 0 0'};font-family:${SANS};font-size:${o.taille ?? 16}px;line-height:${o.hauteur ?? 26}px;font-weight:${o.graisse ?? 400};color:${C[role]};${it}">${html}</p>`;
}

export function bouton(libelle: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" class="bouton-plein"><tr><td class="f-btn" bgcolor="${C.btn}" style="border-radius:6px;background:${C.btn};">`
    + `<a href="${href}" class="c-btn" style="display:inline-block;padding:15px 30px;font-family:${SANS};font-size:15px;line-height:20px;font-weight:600;color:${C.btnTxt};border-radius:6px;">${titreTypo(libelle)}</a>`
    + `</td></tr></table>`;
}

export function lienFleche(libelle: string, href: string, marge = '10px 0 0'): string {
  return `<p style="margin:${marge};font-family:${SANS};font-size:15px;line-height:22px;font-weight:600;"><a href="${href}" class="c-encre" style="color:${C.encre};text-decoration:underline;">${typo(libelle)}${NB}→</a></p>`;
}

/** Adresse de secours sous un bouton (lien copiable). */
export function adresseBrute(url: string): string {
  return `<p style="margin:6px 0 0;font-family:${SANS};font-size:13px;line-height:19px;word-break:break-all;"><a href="${url}" class="c-encre" style="color:${C.encre};text-decoration:underline;">${url}</a></p>`;
}

/**
 * Fiche de détails sur fond gris : libellé à gauche, valeur à droite (valeurs
 * déjà échappées). Une seule donnée (une adresse) se pose sous son libellé.
 */
export function fiche(lignes: Array<[string, string]>): string {
  const ouvre = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="f-bloc" bgcolor="${C.bloc}" style="background:${C.bloc};border-radius:6px;border-collapse:separate;">`;
  if (lignes.length === 1) {
    const [k, v] = lignes[0] ?? ['', ''];
    return `${ouvre}<tr><td style="padding:14px 20px 15px;">`
      + `<p class="c-doux" style="margin:0;font-family:${SANS};font-size:13px;line-height:18px;color:${C.doux};">${typo(k)}</p>`
      + `<p class="c-encre" style="margin:3px 0 0;font-family:${SANS};font-size:16px;line-height:22px;font-weight:600;color:${C.encre};overflow-wrap:anywhere;word-break:break-word;">${v}</p>`
      + `</td></tr></table>`;
  }
  const r = lignes.map(([k, v], i) => {
    const bord = i === 0 ? '' : `border-top:1px solid ${C.filet};`;
    return `<tr><td valign="top" class="fl c-doux b-filet" style="padding:13px 12px 13px 20px;${bord}font-family:${SANS};font-size:14px;line-height:21px;color:${C.doux};white-space:nowrap;">${typo(k)}</td>`
      + `<td valign="top" align="right" class="fv c-encre b-filet" style="padding:13px 20px 13px 12px;${bord}font-family:${SANS};font-size:15px;line-height:21px;font-weight:600;color:${C.encre};text-align:right;overflow-wrap:anywhere;word-break:break-word;">${v}</td></tr>`;
  }).join('');
  return `${ouvre}${r}</table>`;
}

/** Liste numérotée (numéro gris, titre, texte, lien), séparée par des filets fins. */
/**
 * Longueur maximale de la fin soudée d'un texte de liste numérotée. Les zones
 * modifiables des e-mails (slots.ts) reprennent la même valeur : sinon le texte
 * cherché dans le HTML n'est plus celui qui y est écrit.
 */
export const PLAFOND_LISTE = 28;

export function listeNumerotee(items: Array<{ titre: string; texte: string; lien?: [string, string] }>): string {
  const r = items.map((it, i) => `<tr><td style="padding:20px 0 0;">${filet()}</td></tr><tr><td style="padding:18px 0 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>`
    + `<td valign="top" width="32" class="c-num" style="width:32px;font-family:${TITRE};font-size:18px;line-height:24px;font-weight:700;color:${C.num};">${i + 1}</td>`
    + `<td valign="top"><p class="c-encre" style="margin:0;font-family:${TITRE};font-size:18px;line-height:24px;font-weight:700;letter-spacing:-0.01em;color:${C.encre};">${titreTypo(it.titre)}</p>`
    + para(it.texte, { taille: 15, hauteur: 24, marge: '6px 0 0', plafond: PLAFOND_LISTE })
    + (it.lien ? lienFleche(it.lien[0], it.lien[1]) : '')
    + `</td></tr></table></td></tr>`).join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${r}</table>`;
}

/** Encart sur fond gris (appel Premium, message). */
export function encart(contenu: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="f-bloc" bgcolor="${C.bloc}" style="background:${C.bloc};border-radius:6px;border-collapse:separate;"><tr><td style="padding:24px 26px 26px;">${contenu}</td></tr></table>`;
}

/** Citation d'un message reçu (filet vertical à gauche). */
export function citation(html: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td width="3" class="f-past" style="width:3px;background:${C.past};font-size:0;line-height:0;">&nbsp;</td>`
    + `<td class="c-texte" style="padding:2px 0 2px 18px;font-family:${SANS};font-size:15.5px;line-height:25px;color:${C.texte};">${html}</td></tr></table>`;
}

export function signature(salut?: string): string {
  return (salut ? para(salut, { marge: '30px 0 0' }) : '')
    + paraHtml(titreTypo('L’équipe NFI REPORT'), { role: 'encre', taille: 16, hauteur: 24, marge: salut ? '4px 0 0' : '32px 0 0', graisse: 600 });
}

// ─── Images (titre, slogan, logo) ────────────────────────────────────────────

function image(srcClair: string, srcSombre: string | null, largeur: number, alt: string, centre = true, couleurAlt: string = C.encre): string {
  const m = centre ? 'margin:0 auto;' : '';
  // Texte affiché à la place de l'image quand la messagerie bloque les images (Outlook par défaut).
  const altStyle = `font-family:${SANS};font-size:14px;font-weight:700;color:${couleurAlt};`;
  const img = (src: string) => `<img src="${IMG}/${src}" width="${largeur}" alt="${alt}" style="display:block;width:${largeur}px;max-width:100%;height:auto;border:0;${m}${altStyle}">`;
  if (!srcSombre) return img(srcClair);
  return img(srcClair).replace('<img ', '<img class="img-clair" ')
    + `<!--[if !mso]><!--><div class="img-sombre" style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${img(srcSombre)}</div><!--<![endif]-->`;
}

// ─── Document ────────────────────────────────────────────────────────────────

function cssSombre(): string {
  const s = SOMBRE;
  const regles: Record<string, string> = {
    '.f-page': `background:${s.page}`, '.f-papier': `background:${s.papier}`, '.f-bloc': `background:${s.bloc}`,
    '.c-encre': `color:${s.encre}`, '.c-texte': `color:${s.texte}`, '.c-doux': `color:${s.doux}`, '.c-num': `color:${s.num}`, '.c-gris': `color:${s.gris}`,
    '.b-filet': `border-color:${s.filet}`, '.b-fort': `border-color:${s.fort}`,
    '.f-btn': `background:${s.btn}`, '.c-btn': `color:${s.btnTxt}`, '.f-past': `background:${s.past}`, '.c-past': `color:${s.pastTxt}`,
  };
  const e = Object.entries(regles);
  const media = e.map(([k, v]) => `${k}{${v}!important}`).join('')
    + '.img-clair{display:none!important}.img-sombre{display:block!important;max-height:none!important;overflow:visible!important}';
  const ogsc = e.filter(([, v]) => !v.startsWith('background')).map(([k, v]) => `[data-ogsc] ${k}{${v}!important}`).join('');
  const ogsb = e.filter(([, v]) => v.startsWith('background')).map(([k, v]) => `[data-ogsb] ${k}{${v}!important}`).join('');
  return `@media (prefers-color-scheme: dark){${media}}\n${ogsc}\n${ogsb}`;
}

const ENTITES_APERCU = '&nbsp;&zwnj;'.repeat(60);

export interface DocumentEdition {
  objet: string;
  /** Ligne d'aperçu affichée dans la boîte de réception, à côté de l'objet. */
  apercu: string;
  /** Ligne de folio sous le titre : [gauche, droite]. */
  folio: [string, string];
  /** Rangées de contenu (balises <tr>). */
  corps: string;
  /** Phrase qui explique pourquoi le lecteur reçoit ce message. */
  raison?: string;
  /** Pied de reçu (mentions de la société) à la place du slogan. */
  recu?: { lignes: string[] };
  /** Liens du pied de page, à la place de nfireport.com, Confidentialité et Contact. */
  liens?: Array<[string, string]>;
}

/** Mentions de bas de mail, comme au pied du site : droits, puis adresse postale. */
const DROITS = () => typo(`© ${new Date().getFullYear()} NFI REPORT. Tous droits réservés.`);
const ADRESSE = typo('Quartier Plateau, 8001 Niamey, Niger');

/** Lien qui ouvre un message à contact@nfireport.com, avec un objet prérempli si besoin. */
export function ecrireAuContact(objet?: string): string {
  return `mailto:contact@nfireport.com${objet ? `?subject=${encodeURIComponent(objet)}` : ''}`;
}

/** Cellule du bandeau noir (en-tête ou pied), identique en mode clair et en mode sombre. */
function bande(contenu: string, style: string, centre = true): string {
  return `<tr><td${centre ? ' align="center"' : ''} class="px f-bande" bgcolor="${BANDE.fond}" style="background:${BANDE.fond};${style}">${contenu}</td></tr>`;
}

export function documentEdition(d: DocumentEdition): string {
  const sep = ` <span style="color:${BANDE.sep};">&nbsp;·&nbsp;</span> `;
  const lien = ([l, h]: [string, string]) => `<a href="${h}" style="color:${BANDE.lien};text-decoration:underline;white-space:nowrap;">${typo(l)}</a>`;
  const tous = d.liens ?? [['nfireport.com', SITE_URL], ['Confidentialité', `${SITE_URL}/confidentialite`], ['Contact', ecrireAuContact()]];
  // Un lien long (« Se désabonner de la newsletter ») prend sa propre ligne : jamais de point suspendu en bout de ligne.
  const courts = tous.filter(([l]) => l.length <= 16);
  const longs = tous.filter(([l]) => l.length > 16);
  const liens = [courts.map(lien).join(sep), ...longs.map(lien)].filter(Boolean).join('<br>');
  const texteBande = (taille: number, coul: string) => `font-family:${SANS};font-size:${taille}px;line-height:${taille >= 13 ? 20 : 19}px;color:${coul};`;
  const mentions = `<p style="margin:0;">${DROITS()}</p>` + (d.recu ? '' : `<p style="margin:0;">${ADRESSE}</p>`);

  // Le corps se termine par un blanc, puis le pied noir ferme le mail.
  const finCorps = `<tr><td class="f-papier" style="background:${C.papier};height:48px;font-size:0;line-height:0;">&nbsp;</td></tr>`;
  const pied = d.recu
    ? finCorps
      + d.recu.lignes.map((l, i) => bande(l, `padding:${i === 0 ? 34 : 6}px 48px 0;${texteBande(i === 0 ? 13 : 12, i === 0 ? BANDE.fort : BANDE.texte)}font-weight:${i === 0 ? 600 : 400};`)).join('')
      + bande(liens, `padding:16px 40px 0;${texteBande(13, BANDE.lien)}`)
      + bande(mentions, `padding:14px 40px 36px;${texteBande(12, BANDE.mentions)}`)
    : finCorps
      + bande(image('slogan-bandeau.png', null, 250, 'La connaissance, votre meilleur capital.', true, BANDE.lien), 'padding:36px 48px 0;')
      + (d.raison ? bande(soude(d.raison), `padding:22px 48px 0;${texteBande(13, BANDE.texte)}`) : '')
      + bande(liens, `padding:16px 40px 0;${texteBande(13, BANDE.lien)}`)
      + bande(mentions, `padding:16px 40px 38px;${texteBande(12, BANDE.mentions)}`);

  const tete = bande(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>`
    + `<td valign="middle" width="46" style="width:46px;">${image('logo.png', null, 46, '', false)}</td>`
    + `<td valign="middle" style="padding-left:12px;">${image('wm-bandeau.png', null, 128, 'NFI REPORT', false, '#ffffff')}</td>`
    + `<td valign="middle" align="right" class="rubrique" style="font-family:${SANS};font-size:13px;line-height:18px;color:${BANDE.texte};white-space:nowrap;">${typo(d.folio[0])}</td>`
    + `</tr></table>`, 'padding:22px 40px;', false);

  return `<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${esc(d.objet)}</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<style>
:root{color-scheme:light dark;supported-color-schemes:light dark}
body{margin:0;padding:0;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
table{border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0}
img{border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic}
a{text-decoration:none}
a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important}
@media only screen and (max-width:620px){
.w{width:100%!important}
.p0{padding:0!important}
.px{padding-left:24px!important;padding-right:24px!important}
.h1{font-size:27px!important;line-height:33px!important}
.bouton-plein,.bouton-plein td{width:100%!important}
.bouton-plein a{display:block!important;text-align:center!important}
}
@media only screen and (max-width:360px){
.fl{display:block!important;padding:12px 20px 0!important;white-space:normal!important}
.fv{display:block!important;text-align:left!important;padding:2px 20px 12px!important;border-top:0!important}
}
@media only screen and (max-width:340px){
.rubrique{display:none!important}
}
${cssSombre()}
</style>
</head>
<body class="f-page" style="margin:0;padding:0;background:${C.page};">
<!--apercu--><div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all;">${esc(d.apercu.replace(/'/g, '’'))}${ENTITES_APERCU}</div><!--/apercu-->
<table role="presentation" class="f-page" width="100%" cellpadding="0" cellspacing="0" style="background:${C.page};">
<tr><td align="center" class="p0" style="padding:32px 0 48px;">
<!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0"><tr><td><![endif]-->
<table role="presentation" class="w" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;">
${tete}
${d.corps}
${pied}
</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr>
</table>
</body>
</html>`;
}
