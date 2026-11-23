import { SITE_URL } from '@/lib/config';

/**
 * Design « Édition » des e-mails de NFI REPORT (choisi par Raouf le 23/11/2026).
 *
 * Journal du matin : papier blanc, titre NFI REPORT en Playfair centré sous un
 * double filet, ligne de folio, pied avec le vrai logo et le slogan.
 *
 * Ce que ce module garantit pour tous les mails :
 * - un mode sombre dessiné (Apple Mail via prefers-color-scheme, Outlook.com via
 *   [data-ogsc] et [data-ogsb]) ; Gmail impose ses couleurs, d'où le liseré
 *   blanc autour du titre et du slogan, qui les garde lisibles ;
 * - le titre et le slogan en images Playfair (Gmail ne charge pas les polices) ;
 * - des tableaux et des styles en ligne, lus par tous les clients mail ;
 * - une typographie française : espaces insécables, apostrophes courbes, mots
 *   courts soudés au mot suivant, fins de paragraphe et débuts de phrase soudés
 *   pour ne jamais laisser deux ou trois mots seuls sur une ligne.
 */

export const NB = ' ';
const SANS = "Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO = "'SF Mono',Menlo,Consolas,'Roboto Mono',monospace";
const IMG = `${SITE_URL}/email`;

const CLAIR = {
  page: '#f3f2ef', papier: '#ffffff', bloc: '#f7f6f3', encre: '#111111', texte: '#2a2a2a', doux: '#6b6b6b',
  num: '#a3a19b', filet: '#e4e3df', fort: '#111111', btn: '#111111', btnTxt: '#ffffff', past: '#111111', pastTxt: '#ffffff',
};
const SOMBRE = {
  page: '#0c0c0d', papier: '#161618', bloc: '#1d1d20', encre: '#f2f2f0', texte: '#d6d6d3', doux: '#9b9b97',
  num: '#6e6d68', filet: '#2e2e31', fort: '#e6e6e3', btn: '#f2f2f0', btnTxt: '#111111', past: '#f2f2f0', pastTxt: '#111111',
};
const C = CLAIR;

// ─── Typographie française ───────────────────────────────────────────────────

const PETITS =
  'à|a|y|au|aux|de|des|du|la|le|les|un|une|en|et|ou|ce|sa|se|ne|il|on|par|pour|dans|sur|avec|sans|entre|chez|vers|sous|' +
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
    .replace(/(\d) (FCFA|mois|an|ans|heure|heures|jours?)\b/giu, `$1${NB}$2`);
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
  if (mots(toks, 0, n - 1) < 9) {
    // Paragraphe court : les trois derniers mots restent ensemble, aucun mot seul en dernière ligne.
    if (n >= 4 && longueur(toks, n - 3, n - 1) <= 26) return [...toks.slice(0, n - 3), toks.slice(n - 3).join(NB)].join(' ');
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

function doubleFilet(): string {
  return filet(true, 3) + blanc(3) + filet(true, 1);
}

/** Ligne de contenu du mail (bandeau papier, marges latérales). */
export function rangee(contenu: string, haut = 0, bas = 0): string {
  return `<tr><td class="px f-papier" style="background:${C.papier};padding:${haut}px 40px ${bas}px;">${contenu}</td></tr>`;
}

export function titre(s: string): string {
  return `<h1 class="h1 c-encre" style="margin:0;font-family:${SANS};font-size:32px;line-height:38px;font-weight:700;letter-spacing:-0.022em;color:${C.encre};">${titreTypo(s)}</h1>`;
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
  return `<table role="presentation" cellpadding="0" cellspacing="0" class="bouton-plein"><tr><td class="f-btn" style="border-radius:2px;background:${C.btn};">`
    + `<a href="${href}" class="c-btn" style="display:inline-block;padding:15px 28px;font-family:${SANS};font-size:15px;line-height:20px;font-weight:600;color:${C.btnTxt};border-radius:2px;">${titreTypo(libelle)}</a>`
    + `</td></tr></table>`;
}

export function lienFleche(libelle: string, href: string, marge = '10px 0 0'): string {
  return `<p style="margin:${marge};font-family:${SANS};font-size:15px;line-height:22px;font-weight:600;"><a href="${href}" class="c-encre" style="color:${C.encre};text-decoration:underline;">${typo(libelle)}${NB}→</a></p>`;
}

/** Adresse de secours sous un bouton (lien copiable). */
export function adresseBrute(url: string): string {
  return `<p class="c-encre" style="margin:6px 0 0;font-family:${MONO};font-size:12.5px;line-height:19px;color:${C.encre};word-break:break-all;">${url}</p>`;
}

/** Fiche de détails : libellé à gauche, valeur à droite (valeurs déjà échappées). */
export function fiche(lignes: Array<[string, string]>): string {
  const r = lignes.map(([k, v], i) => {
    const bord = i === 0 ? '' : `border-top:1px solid ${C.filet};`;
    return `<tr><td valign="top" width="128" class="c-doux b-filet" style="width:128px;padding:13px 12px 13px 0;${bord}font-family:${SANS};font-size:14px;line-height:21px;color:${C.doux};">${typo(k)}</td>`
      + `<td valign="top" class="c-encre b-filet" style="padding:13px 0;${bord}font-family:${SANS};font-size:15px;line-height:21px;font-weight:600;color:${C.encre};overflow-wrap:anywhere;word-break:break-word;">${v}</td></tr>`;
  }).join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="b-fort" style="border-top:1px solid ${C.fort};border-bottom:1px solid ${C.fort};">${r}</table>`;
}

/** Liste numérotée façon journal (titre, texte, lien). */
export function listeNumerotee(items: Array<{ titre: string; texte: string; lien?: [string, string] }>): string {
  const r = items.map((it, i) => `<tr><td style="padding:20px 0 0;">${filet()}</td></tr><tr><td style="padding:18px 0 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>`
    + `<td valign="top" width="46" class="c-num" style="width:46px;font-family:${SANS};font-size:31px;line-height:30px;font-weight:300;color:${C.num};">${i + 1}</td>`
    + `<td valign="top"><p class="c-encre" style="margin:0;font-family:${SANS};font-size:18px;line-height:24px;font-weight:700;color:${C.encre};">${titreTypo(it.titre)}</p>`
    + para(it.texte, { taille: 15, hauteur: 24, marge: '6px 0 0', plafond: 28 })
    + (it.lien ? lienFleche(it.lien[0], it.lien[1]) : '')
    + `</td></tr></table></td></tr>`).join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${r}</table>`;
}

/** Encart encadré d'un filet noir (appel Premium, motif, message). */
export function encart(contenu: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td class="b-fort" style="border:1px solid ${C.fort};padding:24px 26px 26px;">${contenu}</td></tr></table>`;
}

/** Citation d'un message reçu (filet vertical à gauche). */
export function citation(html: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td width="3" class="f-past" style="width:3px;background:${C.past};font-size:0;line-height:0;">&nbsp;</td>`
    + `<td class="c-texte" style="padding:2px 0 2px 18px;font-family:${SANS};font-size:15.5px;line-height:25px;color:${C.texte};">${html}</td></tr></table>`;
}

export function signature(salut?: string): string {
  return (salut ? para(salut, { marge: '30px 0 0' }) : '')
    + paraHtml(titreTypo('L’équipe NFI REPORT'), { role: 'encre', taille: 15, hauteur: 22, marge: salut ? '2px 0 0' : '28px 0 0', graisse: 600 });
}

// ─── Images (titre, slogan, logo) ────────────────────────────────────────────

function image(srcClair: string, srcSombre: string | null, largeur: number, alt: string, centre = true): string {
  const m = centre ? 'margin:0 auto;' : '';
  const altStyle = `font-family:${SANS};font-size:14px;font-weight:700;color:${C.encre};`;
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
    '.c-encre': `color:${s.encre}`, '.c-texte': `color:${s.texte}`, '.c-doux': `color:${s.doux}`, '.c-num': `color:${s.num}`,
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
}

export function documentEdition(d: DocumentEdition): string {
  const sep = ` <span class="c-doux" style="color:${C.doux};">·</span> `;
  const liens = [['nfireport.com', SITE_URL], ['Confidentialité', `${SITE_URL}/confidentialite`], ['Contact', `${SITE_URL}/contact`]]
    .map(([l, h]) => `<a href="${h}" class="c-texte" style="color:${C.texte};text-decoration:underline;">${l}</a>`).join(sep);

  const pied = d.recu
    ? rangee(filet(), 40)
      + `<tr><td align="center" class="f-papier" style="background:${C.papier};padding:26px 40px 0;">${image('logo.png', null, 52, 'NFI REPORT')}</td></tr>`
      + d.recu.lignes.map((l, i) => `<tr><td align="center" class="px f-papier ${i === 0 ? 'c-encre' : 'c-doux'}" style="background:${C.papier};padding:${i === 0 ? 16 : 6}px 48px 0;font-family:${SANS};font-size:${i === 0 ? 13.5 : 12}px;line-height:19px;font-weight:${i === 0 ? 600 : 400};color:${i === 0 ? C.encre : C.doux};">${l}</td></tr>`).join('')
      + `<tr><td align="center" class="px f-papier" style="background:${C.papier};padding:12px 40px 36px;font-family:${SANS};font-size:12.5px;line-height:19px;">${liens}</td></tr>`
    : rangee(filet(), 44)
      + `<tr><td align="center" class="f-papier" style="background:${C.papier};padding:28px 40px 0;">${image('logo.png', null, 56, 'NFI REPORT')}</td></tr>`
      + `<tr><td align="center" class="f-papier" style="background:${C.papier};padding:16px 40px 0;">${image('slogan-sombre-halo.png', 'slogan-clair.png', 254, 'La connaissance, votre meilleur capital.')}</td></tr>`
      + (d.raison ? `<tr><td align="center" class="px f-papier c-doux" style="background:${C.papier};padding:18px 56px 0;font-family:${SANS};font-size:12.5px;line-height:19px;color:${C.doux};">${soude(d.raison)}</td></tr>` : '')
      + `<tr><td align="center" class="px f-papier" style="background:${C.papier};padding:12px 40px 0;font-family:${SANS};font-size:12.5px;line-height:19px;">${liens}</td></tr>`
      + `<tr><td align="center" class="px f-papier c-doux" style="background:${C.papier};padding:10px 40px 36px;font-family:${SANS};font-size:12px;line-height:18px;color:${C.doux};">${typo('NFI REPORT, Quartier Plateau, Niamey, Niger')}</td></tr>`;

  const tete = `<tr><td align="center" class="f-papier" style="background:${C.papier};padding:36px 40px 0;">${image('wm-noir-halo.png', 'wm-blanc.png', 252, 'NFI REPORT')}</td></tr>`
    + rangee(doubleFilet(), 18)
    + rangee(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>`
      + `<td class="c-texte" style="font-family:${SANS};font-size:13px;line-height:18px;color:${C.texte};">${typo(d.folio[0])}</td>`
      + `<td align="right" class="c-encre" style="font-family:${SANS};font-size:13px;line-height:18px;font-weight:600;color:${C.encre};">${typo(d.folio[1])}</td>`
      + `</tr></table>`, 10)
    + rangee(filet(true), 10);

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
.px{padding-left:22px!important;padding-right:22px!important}
.h1{font-size:26px!important;line-height:32px!important}
.bouton-plein a{display:block!important;text-align:center!important}
}
${cssSombre()}
</style>
</head>
<body class="f-page" style="margin:0;padding:0;background:${C.page};">
<!--apercu--><div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all;">${esc(d.apercu.replace(/'/g, '’'))}${ENTITES_APERCU}</div><!--/apercu-->
<table role="presentation" class="f-page" width="100%" cellpadding="0" cellspacing="0" style="background:${C.page};">
<tr><td align="center" style="padding:24px 0 40px;">
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
