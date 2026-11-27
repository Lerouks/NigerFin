/**
 * Inscription à la newsletter depuis le navigateur : le formulaire de l'accueil
 * et la fenêtre qui s'ouvre sur les articles passent tous deux par ici.
 *
 * La route /api/newsletter dit si l'adresse était déjà inscrite (isNew et
 * reactivated à false) : on le dit à la personne au lieu de lui confirmer une
 * inscription qui n'a rien changé. Aucun mail ne part dans ce cas, la route
 * n'envoie le mail de bienvenue qu'à une adresse nouvelle ou revenue.
 */

export type IssueInscription =
  | 'inscrit'
  | 'deja-inscrit'
  | 'adresse-invalide'
  | 'trop-de-tentatives'
  | 'controle-robot'
  | 'erreur'
  | 'hors-ligne';

export type EchecInscription = Exclude<IssueInscription, 'inscrit' | 'deja-inscrit'>;

/** Ce qu'on affiche quand l'inscription n'a pas pu se faire. */
export const MESSAGES_ECHEC: Record<EchecInscription, string> = {
  'adresse-invalide': 'Cette adresse e-mail n’est pas valide. Vérifiez-la et réessayez.',
  'trop-de-tentatives': 'Trop de tentatives. Réessayez dans un moment.',
  'controle-robot': 'La vérification anti-robots a échoué. Rechargez la page, puis réessayez.',
  erreur: 'Un souci est survenu. Réessayez dans un instant.',
  'hors-ligne': 'Vérifiez votre connexion et réessayez.',
};

export const MESSAGE_ADRESSE_DEJA_INSCRITE = 'Cette adresse est déjà inscrite à la newsletter.';

export function estUnEchec(issue: IssueInscription): issue is EchecInscription {
  return issue !== 'inscrit' && issue !== 'deja-inscrit';
}

export async function inscrireALaNewsletter(
  email: string,
  source: string,
  /** Le jeton de Turnstile, le contrôle anti-robots, quand il est en service. */
  captchaToken?: string | null,
): Promise<IssueInscription> {
  let reponse: Response;
  try {
    reponse = await fetch('/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), source, ...(captchaToken ? { captchaToken } : {}) }),
    });
  } catch {
    return 'hors-ligne';
  }

  if (reponse.status === 400) {
    const corps = (await reponse.json().catch(() => null)) as { code?: unknown } | null;
    return corps?.code === 'captcha' ? 'controle-robot' : 'adresse-invalide';
  }
  if (reponse.status === 429) return 'trop-de-tentatives';
  if (!reponse.ok) return 'erreur';

  const corps = (await reponse.json().catch(() => null)) as
    | { isNew?: unknown; reactivated?: unknown }
    | null;
  // Seule une réponse qui dit clairement « rien de nouveau » vaut « déjà inscrite ».
  return corps?.isNew === false && corps?.reactivated === false ? 'deja-inscrit' : 'inscrit';
}
