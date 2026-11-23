import { typographier } from '@/lib/typographie';

/** Adresses web et courriels : jamais coupés en fin de ligne (Chrome coupait « nfireport.-com »). */
const ADRESSE = /((?:https?:\/\/)?[\w.+-]+@[\w-]+(?:\.[\w-]+)+|(?:https?:\/\/)?(?:www\.)?[\w-]+(?:\.[\w-]+)*\.(?:com|ne|org|net|fr|int|gov)(?:\/[^\s,;)]*)?)/g;

/**
 * Texte d'une page légale, justifié sur tous les écrans : ponctuation et
 * guillemets à la française, « n° » collé à son numéro, numéros de texte
 * (« 2017-28 ») insécables, adresses web et courriels jamais coupés.
 */
export function texteJustifie(texte: string) {
  const propre = typographier(texte)
    .replace(/\bn°[ \u00a0]*/g, 'n°\u00a0')
    .replace(/(\d)-(?=\d)/g, '$1\u2011');
  return propre.split(ADRESSE).map((morceau, rang) =>
    rang % 2 === 1 ? (
      <span key={rang} className="whitespace-nowrap [hyphens:none]">{morceau}</span>
    ) : (
      morceau
    ),
  );
}
