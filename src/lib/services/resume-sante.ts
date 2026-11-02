/**
 * État des sources externes, tel que le rendent le contrôle de santé
 * (dataOrchestrator.healthCheck) et la route /api/health.
 *
 *   'ok'             la source a répondu
 *   'error'          la source est branchée et elle a échoué : une vraie panne
 *   'not_connected'  la source n'est pas branchée (voir source-non-branchee.ts) :
 *                    ni saine ni en panne, hors du compte
 */
export type StatutSource = 'ok' | 'error' | 'not_connected';

export interface EtatSource {
  status: StatutSource;
  responseTime: number;
  /** Message d'échec, pour 'error' seulement. */
  error?: string;
  /** Pourquoi la source n'est pas branchée, pour 'not_connected' seulement. */
  reason?: string;
}

export interface ResumeSante {
  /** 'healthy' quand toutes les sources BRANCHÉES répondent. */
  status: 'healthy' | 'degraded' | 'down';
  /** Sources branchées qui répondent. */
  healthy: number;
  /** Sources branchées. */
  total: number;
  /** Sources non branchées, exclues de healthy et de total. */
  notConnected: number;
  /** Noms des sources branchées en échec. */
  failed: string[];
}

/**
 * Résume l'état des sources.
 *
 * Avant, chaque source absente comptait comme une panne : la BRVM, morte depuis
 * le 20 juillet 2026, et la CEDEAO, morte depuis juin, faisaient passer le site
 * en « dégradé » à chaque contrôle. Une alerte qui sonne tous les jours pour une
 * cause connue n'alerte plus personne, et elle aurait couvert une vraie panne.
 * Désormais : « healthy » quand toutes les sources branchées répondent,
 * « degraded » ou « down » seulement sur une vraie panne.
 */
export function resumerSante(etats: Record<string, EtatSource>): ResumeSante {
  const liste = Object.entries(etats);
  const branchees = liste.filter(([, etat]) => etat.status !== 'not_connected');
  const healthy = branchees.filter(([, etat]) => etat.status === 'ok').length;
  const total = branchees.length;

  return {
    status: healthy === total ? 'healthy' : healthy > 0 ? 'degraded' : 'down',
    healthy,
    total,
    notConnected: liste.length - total,
    failed: branchees.filter(([, etat]) => etat.status === 'error').map(([nom]) => nom),
  };
}
