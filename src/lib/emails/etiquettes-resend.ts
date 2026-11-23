/**
 * Étiquettes (tags) d'un mail Resend.
 *
 * Resend ne les rend pas sous la forme où on les lui donne :
 *  - à l'envoi, l'API les prend en tableau : [{ name: 'nfi_email_type', value: 'facture' }] ;
 *  - dans ses avis (webhooks), il les renvoie en objet : { nfi_email_type: 'facture' }.
 *    Doc : https://resend.com/docs/webhooks/emails/delivered
 *
 * Le webhook lisait seulement la forme tableau : chaque vrai avis plantait (500)
 * et rien n'était noté en base. On accepte désormais les deux formes.
 */
export type EtiquettesResend =
  | Record<string, unknown>
  | ReadonlyArray<{ name?: unknown; value?: unknown } | null>
  | null
  | undefined;

/** Valeur texte de l'étiquette `nom`, ou undefined si elle manque ou n'est pas du texte. */
export function lireEtiquette(etiquettes: EtiquettesResend, nom: string): string | undefined {
  if (Array.isArray(etiquettes)) {
    const trouvee = etiquettes.find((e) => e?.name === nom);
    return typeof trouvee?.value === 'string' ? trouvee.value : undefined;
  }
  if (etiquettes && typeof etiquettes === 'object') {
    const valeur = (etiquettes as Record<string, unknown>)[nom];
    return typeof valeur === 'string' ? valeur : undefined;
  }
  return undefined;
}
