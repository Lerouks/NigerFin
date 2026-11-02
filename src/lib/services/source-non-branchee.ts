/**
 * Source externe NON BRANCHÉE.
 *
 * Une source non branchée n'est pas une panne. C'est un état connu : le point
 * d'accès que le code visait n'existe plus, et aucune source de remplacement
 * n'a encore été branchée. On ne l'appelle donc plus, et la supervision la
 * présente comme « non branchée », jamais comme un échec. Une alerte qui sonne
 * chaque jour pour une cause connue finit par ne plus être écoutée, et couvre
 * les vraies pannes.
 *
 * La règle d'intégrité ne change pas : une source non branchée ne produit
 * AUCUNE valeur. Ni repli, ni estimation, ni ancien cache ressorti. L'interface
 * affiche « donnée indisponible ».
 *
 * Pour déclarer une source non branchée, renseigner `nonBranchee` dans son
 * service (voir base-service.ts). Pour la rebrancher, remettre `nonBranchee` à
 * null le jour où une vraie source existe.
 */
export class SourceNonBranchee extends Error {
  readonly service: string;
  readonly raison: string;

  constructor(service: string, raison: string) {
    super(`Source non branchée (${service}) : ${raison}`);
    this.name = 'SourceNonBranchee';
    this.service = service;
    this.raison = raison;
  }
}

/**
 * Vrai si l'erreur signale une source non branchée.
 *
 * Le nom est vérifié en plus de `instanceof`, au cas où le module serait
 * chargé deux fois dans des paquets serveur distincts.
 */
export function estSourceNonBranchee(err: unknown): err is SourceNonBranchee {
  return err instanceof SourceNonBranchee
    || (err instanceof Error && err.name === 'SourceNonBranchee' && typeof (err as SourceNonBranchee).raison === 'string');
}
