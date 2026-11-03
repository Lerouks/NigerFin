/**
 * Niveau d'un parcours tel qu'il s'affiche au lecteur.
 *
 * La base stocke les niveaux sans accents (« Debutant », « Intermediaire »,
 * « Avance ») : on les remet en français correct à l'affichage, sans toucher
 * aux valeurs enregistrées sur lesquelles l'admin s'appuie.
 */
const DIFFICULTY_LABELS: Record<string, string> = {
  debutant: 'Débutant',
  intermediaire: 'Intermédiaire',
  avance: 'Avancé',
  expert: 'Expert',
};

export function formatDifficulty(difficulty: string): string {
  const key = difficulty
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
  return DIFFICULTY_LABELS[key] ?? difficulty;
}
