import {
  PROFESSIONS,
  TRANCHES_AGE,
  estCivilite,
  estTrancheAge,
  professionConnue,
} from '@/lib/regles-du-compte';

/** Une ligne de user_profiles, réduite à ce que compte le bloc « Qui nous lit ». */
export interface ProfilLu {
  civility: string | null;
  age_range: string | null;
  profession: string | null;
}

export interface Repartition {
  libelle: string;
  nombre: number;
}

export interface ProfilLecteurs {
  /** Comptes de lecteurs comptés. */
  lecteurs: number;
  /** Comptes de l'équipe (rôle admin), laissés de côté pour ne pas fausser les parts. */
  equipe: number;
  civilite: { femmes: number; hommes: number; sansReponse: number };
  /** Les sept tranches, dans l'ordre des âges, même vides. */
  ages: { tranches: Repartition[]; sansReponse: number };
  /** Les professions citées au moins une fois, de la plus fréquente à la moins fréquente. */
  professions: { liste: Repartition[]; sansReponse: number };
}

/**
 * Compte les réponses des lecteurs. Une valeur hors des listes du site (saisie
 * ancienne ou abîmée) compte comme une absence de réponse, comme dans « Mon compte ».
 */
export function agregerProfils(profils: ProfilLu[], equipe: number): ProfilLecteurs {
  let femmes = 0;
  let hommes = 0;
  const parTranche = new Map<string, number>();
  const parProfession = new Map<string, number>();

  for (const profil of profils) {
    if (estCivilite(profil.civility)) {
      if (profil.civility === 'Mme') femmes += 1;
      else hommes += 1;
    }
    if (estTrancheAge(profil.age_range)) {
      parTranche.set(profil.age_range, (parTranche.get(profil.age_range) ?? 0) + 1);
    }
    const metier = professionConnue(profil.profession);
    if (metier) parProfession.set(metier, (parProfession.get(metier) ?? 0) + 1);
  }

  const tranches = TRANCHES_AGE.map((t) => ({ libelle: t.libelle, nombre: parTranche.get(t.valeur) ?? 0 }));
  // Le tri est stable : à égalité, l'ordre de la liste du site est gardé.
  const liste = PROFESSIONS.map((m) => ({ libelle: m as string, nombre: parProfession.get(m) ?? 0 }))
    .filter((r) => r.nombre > 0)
    .sort((a, b) => b.nombre - a.nombre);

  const total = profils.length;
  return {
    lecteurs: total,
    equipe,
    civilite: { femmes, hommes, sansReponse: total - femmes - hommes },
    ages: { tranches, sansReponse: total - somme(tranches) },
    professions: { liste, sansReponse: total - somme(liste) },
  };
}

export function somme(lignes: Repartition[]): number {
  return lignes.reduce((total, ligne) => total + ligne.nombre, 0);
}

/** Part d'un nombre dans un total, en pour cent arrondi ; null quand le total est nul. */
export function part(nombre: number, total: number): number | null {
  return total > 0 ? Math.round((nombre / total) * 100) : null;
}
