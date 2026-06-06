import crypto from 'node:crypto';

/**
 * Compare deux chaines en temps constant (anti timing-attack).
 *
 * La difference de longueur court-circuite (la longueur du secret n'est pas
 * sensible), mais le contenu est compare via crypto.timingSafeEqual pour ne pas
 * fuiter d'information par le temps de reponse. Meme pattern que les webhooks
 * iPayMoney et Resend.
 */
export function timingSafeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Verifie un header `Authorization: Bearer <secret>` en temps constant.
 *
 * Fail-closed : renvoie false si le secret attendu n'est pas configure, si le
 * header est absent, ou s'il n'est pas au format Bearer. Utilise par les routes
 * cron (CRON_SECRET) et la revalidation a la demande (REVALIDATE_SECRET).
 */
export function verifyBearerSecret(
  authHeader: string | null | undefined,
  expectedSecret: string | null | undefined,
): boolean {
  if (!expectedSecret || !authHeader) return false;
  const token = /^Bearer\s+(.+)$/i.exec(authHeader.trim())?.[1];
  if (!token) return false;
  return timingSafeEqualStr(token.trim(), expectedSecret);
}
