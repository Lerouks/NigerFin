'use client';

/**
 * Appel reseau des ecrans d'administration.
 *
 * Trois raisons d'exister, toutes constatees sur le site en septembre 2026 :
 *
 * 1. QUARANTE ET UN appels ecrivaient `if (res.ok) { ... }` sans branche
 *    d'echec. Quand la reponse n'etait pas bonne, il ne se passait rien : la
 *    liste des articles affichait « Aucun article » alors que la base en
 *    contenait huit et que la route repondait une erreur 500 depuis deux mois
 *    et demi. Un ecran qui ment est pire qu'un ecran en panne.
 *
 * 2. La connexion du proprietaire coupe une quinzaine de secondes toutes les
 *    quatre-vingt-dix secondes. Un appel perdu doit etre rejoue tout seul, pas
 *    remonte comme une panne du site.
 *
 * 3. Les messages d'erreur arrivaient en anglais, ou pas du tout.
 */

export type Resultat<T> =
  | { ok: true; donnees: T }
  | {
      ok: false;
      message: string;
      horsLigne: boolean;
      statut: number;
      /**
       * Vrai seulement quand la demande n'a JAMAIS quitté la machine. Une
       * connexion qui tombe en cours de route ne le garantit pas : le serveur
       * peut très bien avoir enregistré. Les écrans s'en servent pour ne pas
       * affirmer « rien n'a été créé » quand ils n'en savent rien.
       */
      rienEnvoye?: boolean;
      /**
       * La cause seule, sans la consigne qui suit : « La connexion s'est
       * interrompue. » ou « Le serveur a mis trop de temps à répondre. » Un
       * écran qui sait ce qu'il a demandé compose une phrase plus juste que la
       * phrase générique.
       */
      cause?: string;
    };

const TENTATIVES = 3;
const ATTENTE_MS = [400, 1200];

/** Attente avant le prochain essai, croissante puis stable. */
function attenteDeLEssai(essai: number): number {
  return ATTENTE_MS[Math.min(essai, ATTENTE_MS.length - 1)] ?? 1200;
}
const DELAI_MS = 25000;

function attendre(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Traduit ce que le serveur repond en une phrase comprehensible. */
function messagePour(statut: number, corps: unknown): string {
  if (corps && typeof corps === 'object') {
    const champ = (corps as Record<string, unknown>).error ?? (corps as Record<string, unknown>).message;
    if (typeof champ === 'string' && champ.trim() && !/^[a-z_]+$/i.test(champ)) {
      // Le serveur a deja renvoye une phrase en francais : on la garde.
      if (/[éèêàçùîôû ]/i.test(champ)) return champ;
    }
  }
  switch (statut) {
    case 400: return "La demande a été refusée : une information est manquante ou mal remplie.";
    case 401: return "Votre session a expiré. Reconnectez-vous, puis recommencez.";
    case 403: return "Cette action demande des droits que votre compte n'a pas.";
    case 404: return "L'élément demandé n'existe plus.";
    case 409: return "Cet élément a été modifié entre-temps. Rechargez la page avant de réessayer.";
    case 413: return "Le fichier est trop volumineux.";
    case 429: return "Trop de demandes d'affilée. Patientez une minute.";
    case 503: return "Le service est momentanément indisponible. Réessayez dans un instant.";
    default:
      if (statut >= 500) return "Le serveur a rencontré une erreur. Rien n'a été enregistré.";
      return "La demande n'a pas abouti.";
  }
}

/**
 * Demande abandonnee par l'appelant lui-meme. Jamais affichee : celui qui
 * abandonne a deja remplace ce qu'il attendait.
 */
const RESULTAT_ABANDONNE = {
  ok: false as const,
  message: 'Demande abandonnée.',
  horsLigne: false,
  statut: 0,
};

/**
 * Fait un appel a l'API d'administration et rend TOUJOURS un resultat explicite.
 * Ne leve jamais : l'appelant traite `ok: false` au lieu d'un catch oublie.
 */
export async function appelAdmin<T = unknown>(
  url: string,
  options?: RequestInit & { tentatives?: number },
): Promise<Resultat<T>> {
  const maxi = options?.tentatives ?? TENTATIVES;
  // L'appelant peut abandonner sa propre demande : une recherche a la frappe
  // remplace la precedente, et sans ce signal l'ancienne continuait de courir,
  // rejeux compris, jusqu'a une trentaine d'appels en vol sur une connexion
  // qui coupe.
  const abandonAppelant = options?.signal ?? null;
  let derniereErreur = '';

  for (let essai = 0; essai < maxi; essai++) {
    if (abandonAppelant?.aborted) return RESULTAT_ABANDONNE;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      // Inutile de marteler le reseau : on attend qu'il revienne.
      if (essai < maxi - 1) { await attendre(attenteDeLEssai(essai)); continue; }
      return {
        ok: false,
        horsLigne: true,
        statut: 0,
        rienEnvoye: true,
        message: "Vous n'êtes pas connecté à Internet. Rien n'a été envoyé : réessayez une fois la connexion revenue.",
      };
    }

    const abandon = new AbortController();
    const minuteur = setTimeout(() => abandon.abort(), DELAI_MS);
    const relayerAbandon = () => abandon.abort();
    abandonAppelant?.addEventListener('abort', relayerAbandon);
    try {
      const reponse = await fetch(url, { ...options, signal: abandon.signal });

      let corps: unknown = null;
      const type = reponse.headers.get('content-type') || '';
      if (type.includes('application/json')) {
        try { corps = await reponse.json(); } catch { corps = null; }
      }

      if (reponse.ok) return { ok: true, donnees: corps as T };

      // Une erreur de serveur peut etre passagere : on rejoue une lecture.
      const relisible = reponse.status >= 500 && (!options?.method || options.method === 'GET');
      if (relisible && essai < maxi - 1) {
        await attendre(attenteDeLEssai(essai));
        continue;
      }

      // Une page HTML la ou du JSON etait attendu, c'est la signature d'une
      // route cassee. Le dire franchement plutot que « erreur inconnue ».
      const messageBrut = corps === null && reponse.status >= 500
        ? "Cette fonction du site est hors service. Le serveur a renvoyé une page d'erreur au lieu des données."
        : messagePour(reponse.status, corps);

      return { ok: false, message: messageBrut, horsLigne: false, statut: reponse.status };
    } catch (err) {
      // L'appelant a lache la demande : ce n'est pas une panne, on ne rejoue pas.
      if (abandonAppelant?.aborted) return RESULTAT_ABANDONNE;
      const interrompu = err instanceof Error && err.name === 'AbortError';
      derniereErreur = interrompu
        ? "Le serveur a mis trop de temps à répondre."
        : "La connexion s'est interrompue.";
      if (essai < maxi - 1) {
        await attendre(attenteDeLEssai(essai));
        continue;
      }
    } finally {
      clearTimeout(minuteur);
      abandonAppelant?.removeEventListener('abort', relayerAbandon);
    }
  }

  // Fin de boucle sans reponse. Ce qu'on peut affirmer ici est mince, et
  // l'ancienne phrase affirmait bien plus que ca : « tant que rien ne s'affiche,
  // rien n'a ete enregistre » est FAUX des que la demande est partie et que
  // seule la reponse s'est perdue. Une lecture n'ecrit rien, elle peut donc
  // inviter a reessayer ; une ecriture, non.
  const lecture = !options?.method || options.method === 'GET';
  const delaiDepasse = derniereErreur.startsWith('Le serveur a mis trop');
  return {
    ok: false,
    // Un serveur qui ne repond pas n'est PAS une connexion coupee. Le confondre
    // envoyait le proprietaire verifier son wifi pendant qu'une route etait en
    // panne, avec l'icone « Connexion perdue » a l'appui.
    horsLigne: !delaiDepasse,
    statut: 0,
    cause: derniereErreur,
    message: lecture
      ? `${derniereErreur} Réessayez.`
      : `${derniereErreur} La demande est peut-être arrivée au serveur : rechargez la page pour vérifier avant de recommencer.`,
  };
}

/** Raccourci pour les envois de données. */
export function envoiAdmin<T = unknown>(
  url: string,
  methode: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  corps?: unknown,
): Promise<Resultat<T>> {
  return appelAdmin<T>(url, {
    method: methode,
    headers: corps === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: corps === undefined ? undefined : JSON.stringify(corps),
    // Un envoi n'est jamais rejoue tout seul : rejouer une creation ou une
    // suppression risquerait de la faire deux fois.
    tentatives: 1,
  });
}
