import { unstable_cache } from 'next/cache';
import { createServiceClient } from '@/lib/supabase';
import { decouperLecon, minutesDeLecture } from '@/lib/apprendre/lecture';
import { lireQuiz, type Question } from '@/lib/apprendre/quiz';
import { APPRENDRE_CACHE_TAG } from '@/lib/apprendre/cache';

/**
 * Les cours et les leçons publiés, lus en base avec la clé de service, côté
 * serveur uniquement.
 *
 * Un cours est un thème (education_categories) qui a au moins une leçon
 * publiée. Une leçon est publiée quand sa date published_at est passée : une
 * leçon sans date reste cachée, une date future la publie seule à cette date,
 * au plus une heure après (durée du cache).
 */

export { APPRENDRE_CACHE_TAG };
export const CHEMIN_APPRENDRE = '/apprendre';

/** Une leçon publiée depuis moins longtemps, au moins un jour après le début de son cours. */
const DUREE_NOUVEAUTE_MS = 14 * 24 * 3600 * 1000;

export interface LeconResume {
  id: string;
  slug: string;
  titre: string;
  /** Position dans le cours, à partir de 1. */
  numero: number;
  premium: boolean;
  minutes: number;
  publieeLe: string;
  /** Ajoutée récemment à un cours déjà ouvert. */
  nouvelle: boolean;
  href: string;
}

export interface Cours {
  id: string;
  slug: string;
  titre: string;
  description: string;
  /** Numéro du cours parmi les cours ouverts, à partir de 1. */
  numero: number;
  minutes: number;
  lecons: LeconResume[];
  href: string;
}

export interface LeconComplete extends LeconResume {
  cours: Cours;
  chapeau: string;
  /** Corps entier pour une leçon gratuite ; null pour une leçon Premium (servi à part aux abonnés). */
  corps: string | null;
  /** Début du corps d'une leçon Premium, montré à tous avant l'invitation à s'abonner. */
  apercu: string;
  quiz: Question[];
  miseAJour: string;
  precedente: LeconResume | null;
  suivante: LeconResume | null;
}

interface LigneLecon {
  id: string;
  category_id: string;
  slug: string | null;
  title: string;
  access_level: string;
  sort_order: number;
  content: string;
  published_at: string | null;
  updated_at: string;
  quiz: unknown;
}

interface LigneCours {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  sort_order: number;
}

/** Chemin d'une leçon. */
export function cheminLecon(coursSlug: string, leconSlug: string): string {
  return `${CHEMIN_APPRENDRE}/${coursSlug}/${leconSlug}`;
}

/** Le début d'une leçon Premium : son corps jusqu'au deuxième intertitre. */
export function apercuPremium(corps: string): string {
  const blocs = corps.split(/\n{2,}/);
  const sortie: string[] = [];
  let intertitres = 0;
  for (const bloc of blocs) {
    if (/^#{2,3}\s/.test(bloc.trim())) {
      intertitres += 1;
      if (intertitres > 1) break;
    }
    sortie.push(bloc);
    if (sortie.join('\n\n').length > 1200) break;
  }
  return sortie.join('\n\n').trim();
}

async function lireTout(): Promise<{ cours: LigneCours[]; lecons: LigneLecon[] }> {
  const service = createServiceClient();
  if (!service) return { cours: [], lecons: [] };
  const maintenant = new Date().toISOString();
  const [cours, lecons] = await Promise.all([
    service
      .from('education_categories')
      .select('id, slug, title, description, sort_order')
      .eq('available', true)
      .order('sort_order'),
    service
      .from('education_lessons')
      .select('id, category_id, slug, title, access_level, sort_order, content, published_at, updated_at, quiz')
      .not('published_at', 'is', null)
      .lte('published_at', maintenant)
      .not('slug', 'is', null)
      .order('sort_order'),
  ]);
  if (cours.error || lecons.error) {
    throw new Error(`apprendre : lecture impossible (${cours.error?.message ?? lecons.error?.message})`);
  }
  return { cours: (cours.data ?? []) as LigneCours[], lecons: (lecons.data ?? []) as LigneLecon[] };
}

function assembler(lignesCours: LigneCours[], lignesLecons: LigneLecon[], maintenant: number): Cours[] {
  const cours: Cours[] = [];
  for (const c of lignesCours) {
    const siennes = lignesLecons
      .filter((l) => l.category_id === c.id && l.slug)
      .sort((a, b) => a.sort_order - b.sort_order);
    if (siennes.length === 0) continue;
    const ouverture = Math.min(...siennes.map((l) => Date.parse(l.published_at!)));
    const href = `${CHEMIN_APPRENDRE}/${c.slug}`;
    const lecons: LeconResume[] = siennes.map((l, i) => {
      const publiee = Date.parse(l.published_at!);
      return {
        id: l.id,
        slug: l.slug!,
        titre: l.title,
        numero: i + 1,
        premium: l.access_level === 'premium',
        minutes: minutesDeLecture(l.content),
        publieeLe: l.published_at!,
        nouvelle: publiee - ouverture > 24 * 3600 * 1000 && maintenant - publiee < DUREE_NOUVEAUTE_MS,
        href: cheminLecon(c.slug, l.slug!),
      };
    });
    cours.push({
      id: c.id,
      slug: c.slug,
      titre: c.title,
      description: c.description ?? '',
      numero: cours.length + 1,
      minutes: lecons.reduce((t, l) => t + l.minutes, 0),
      lecons,
      href,
    });
  }
  return cours;
}

/** Tous les cours ouverts, avec leurs leçons publiées, dans l'ordre. */
export const getCours = unstable_cache(
  async (): Promise<Cours[]> => {
    const { cours, lecons } = await lireTout();
    return assembler(cours, lecons, Date.now());
  },
  ['apprendre-cours-v1'],
  { revalidate: 3600, tags: [APPRENDRE_CACHE_TAG] },
);

export async function getCoursParSlug(slug: string): Promise<Cours | null> {
  const cours = await getCours();
  return cours.find((c) => c.slug === slug) ?? null;
}

/** Une leçon publiée, avec son cours, ses voisines et son contenu (sauf le corps Premium). */
export const getLecon = unstable_cache(
  async (coursSlug: string, leconSlug: string): Promise<LeconComplete | null> => {
    const { cours: lignesCours, lecons: lignesLecons } = await lireTout();
    const tous = assembler(lignesCours, lignesLecons, Date.now());
    const cours = tous.find((c) => c.slug === coursSlug);
    if (!cours) return null;
    const index = cours.lecons.findIndex((l) => l.slug === leconSlug);
    if (index === -1) return null;
    const resume = cours.lecons[index]!;
    const ligne = lignesLecons.find((l) => l.id === resume.id)!;
    const { chapeau, corps } = decouperLecon(ligne.content, ligne.title);
    return {
      ...resume,
      cours,
      chapeau,
      corps: resume.premium ? null : corps,
      apercu: resume.premium ? apercuPremium(corps) : '',
      quiz: resume.premium ? [] : lireQuiz(ligne.quiz),
      miseAJour: ligne.updated_at,
      precedente: cours.lecons[index - 1] ?? null,
      suivante: cours.lecons[index + 1] ?? null,
    };
  },
  ['apprendre-lecon-v1'],
  { revalidate: 3600, tags: [APPRENDRE_CACHE_TAG] },
);

/**
 * Le corps et les questions d'une leçon Premium publiée, pour un abonné.
 * Jamais mis en cache : la route qui l'appelle vérifie l'abonnement à chaque fois.
 */
export async function getCorpsPremium(id: string): Promise<{ corps: string; quiz: Question[] } | null> {
  const service = createServiceClient();
  if (!service) return null;
  const { data, error } = await service
    .from('education_lessons')
    .select('title, content, quiz, published_at, access_level')
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return null;
  if (!data.published_at || Date.parse(data.published_at) > Date.now()) return null;
  return { corps: decouperLecon(data.content, data.title).corps, quiz: lireQuiz(data.quiz) };
}
