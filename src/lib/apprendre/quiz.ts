import { z } from 'zod';

/**
 * La question de fin d'une leçon (« Vérifiez-vous »), telle qu'elle est rangée
 * en base dans education_lessons.quiz (tableau JSON, migration 00035).
 * Validée à l'entrée par l'administration et à la sortie par le site : une
 * question mal formée ne s'affiche pas, elle ne casse jamais la page.
 */
export const QuestionSchema = z
  .object({
    question: z.string().trim().min(8).max(300),
    choix: z.array(z.string().trim().min(1).max(160)).min(2).max(4),
    /** Indice de la bonne réponse dans `choix`, à partir de 0. */
    bonne: z.number().int().min(0),
    explication: z.string().trim().min(8).max(400),
  })
  .refine((q) => q.bonne < q.choix.length, { message: 'La bonne réponse doit être l’un des choix.', path: ['bonne'] });

export const QuizSchema = z.array(QuestionSchema).max(3);

export type Question = z.infer<typeof QuestionSchema>;

/** Les questions valides d'une valeur venue de la base ; [] si rien n'est exploitable. */
export function lireQuiz(valeur: unknown): Question[] {
  const resultat = QuizSchema.safeParse(valeur);
  return resultat.success ? resultat.data : [];
}

/** Score sur 100 d'une série de réponses (indices choisis, dans l'ordre des questions). */
export function scoreQuiz(questions: Question[], reponses: number[]): number {
  if (questions.length === 0) return 0;
  const justes = questions.filter((q, i) => reponses[i] === q.bonne).length;
  return Math.round((justes / questions.length) * 100);
}
