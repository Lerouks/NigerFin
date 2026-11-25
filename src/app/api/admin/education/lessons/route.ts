import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { serverError } from '@/lib/api-error';
import { mettreALaCorbeille } from '@/lib/corbeille';
import { isValidUUID } from '@/lib/validation';
import { minutesDeLecture, slugifier, slugValide } from '@/lib/apprendre/lecture';
import { QuizSchema } from '@/lib/apprendre/quiz';
import { revaliderEducation } from '@/lib/revalidation-contenus';

// GET: liste les leçons d'une catégorie.
//
// Lit avec la clé de service, comme les trois autres verbes de cette route.
// Auparavant elle lisait avec la clé du visiteur : depuis la migration 00031,
// qui a fermé la fuite du contenu payant en retirant le SELECT au niveau table
// puis en le réaccordant colonne par colonne, un select('*') avec cette clé
// échoue. L'admin recevait une erreur 500 et affichait « Aucune leçon » alors
// que la base en contient 73. Au passage, ce GET n'exigeait aucune
// authentification : le contrôle requireAdmin est désormais le même partout.
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const { serviceClient } = auth;

  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get('category_id');

  let query = serviceClient
    .from('education_lessons')
    .select('*')
    .order('sort_order');

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const { data, error } = await query;

  if (error) {
    return serverError(error, 'admin-education-lessons');
  }

  return NextResponse.json(data);
}

/** Les seuls champs qu'une écriture de l'administration peut changer. */
interface ChampsLecon {
  category_id?: string;
  title?: string;
  access_level?: 'free' | 'premium';
  sort_order?: number;
  content?: string;
  slug?: string | null;
  published_at?: string | null;
  quiz?: unknown;
  duration?: string;
}

type Validation = { ok: true; champs: ChampsLecon } | { ok: false; message: string };

/**
 * Valide et nettoie le corps d'une écriture. La durée n'est plus saisie : elle
 * se calcule sur la longueur du texte. L'adresse se déduit du titre quand elle
 * manque.
 */
function validerChamps(corps: Record<string, unknown>, creation: boolean): Validation {
  const champs: ChampsLecon = {};

  if (corps.category_id !== undefined) {
    if (!isValidUUID(corps.category_id)) return { ok: false, message: 'Catégorie invalide' };
    champs.category_id = corps.category_id;
  }
  if (corps.title !== undefined) {
    if (typeof corps.title !== 'string' || !corps.title.trim()) return { ok: false, message: 'Titre requis' };
    champs.title = corps.title.trim();
  }
  if (corps.access_level !== undefined) {
    if (corps.access_level !== 'free' && corps.access_level !== 'premium') {
      return { ok: false, message: 'Niveau d\'accès invalide' };
    }
    champs.access_level = corps.access_level;
  }
  if (corps.sort_order !== undefined) {
    const ordre = Number(corps.sort_order);
    if (!Number.isInteger(ordre) || ordre < 0 || ordre > 1000) return { ok: false, message: 'Ordre invalide' };
    champs.sort_order = ordre;
  }
  if (corps.content !== undefined) {
    if (typeof corps.content !== 'string') return { ok: false, message: 'Contenu invalide' };
    champs.content = corps.content;
    champs.duration = `${minutesDeLecture(corps.content)} min`;
  }
  if (corps.slug !== undefined && corps.slug !== null && corps.slug !== '') {
    if (typeof corps.slug !== 'string' || !slugValide(corps.slug)) {
      return { ok: false, message: 'Adresse invalide : minuscules, chiffres et tirets seulement' };
    }
    champs.slug = corps.slug;
  } else if (creation || corps.slug === '' || corps.slug === null) {
    const titre = champs.title ?? (typeof corps.title === 'string' ? corps.title : '');
    const deduit = slugifier(titre);
    // Sans adresse, une leçon disparaît des pages publiques : on refuse plutôt
    // que de la retirer en silence.
    if (!deduit) return { ok: false, message: 'Adresse vide : indiquez une adresse ou le titre de la leçon' };
    champs.slug = deduit;
  }
  if (corps.published_at !== undefined) {
    if (corps.published_at === null || corps.published_at === '') {
      champs.published_at = null;
    } else if (typeof corps.published_at !== 'string' || Number.isNaN(Date.parse(corps.published_at))) {
      return { ok: false, message: 'Date de publication invalide' };
    } else {
      champs.published_at = new Date(corps.published_at).toISOString();
    }
  }
  if (corps.quiz !== undefined) {
    if (corps.quiz === null || (Array.isArray(corps.quiz) && corps.quiz.length === 0)) {
      champs.quiz = null;
    } else {
      const quiz = QuizSchema.safeParse(corps.quiz);
      if (!quiz.success) {
        return { ok: false, message: 'Question de fin incomplète : une question, au moins deux réponses, la bonne réponse et une explication.' };
      }
      champs.quiz = quiz.data;
    }
  }
  return { ok: true, champs };
}

function erreurAdresse(message: string): boolean {
  return /education_lessons_cours_slug_unique|duplicate key/i.test(message);
}

// POST: create lesson
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const { serviceClient } = auth;

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || !body.category_id || !body.title) {
    return NextResponse.json({ error: 'Catégorie et titre requis' }, { status: 400 });
  }

  const validation = validerChamps(body, true);
  if (!validation.ok) return NextResponse.json({ error: validation.message }, { status: 400 });

  const { data, error } = await serviceClient
    .from('education_lessons')
    .insert({
      access_level: 'free',
      sort_order: 0,
      content: '',
      duration: '2 min',
      ...validation.champs,
      category_id: validation.champs.category_id!,
      title: validation.champs.title!,
    })
    .select()
    .single();

  if (error) {
    if (erreurAdresse(error.message)) {
      return NextResponse.json({ error: 'Une autre leçon de ce cours a déjà cette adresse.' }, { status: 409 });
    }
    return serverError(error, 'admin-education-lessons');
  }

  revaliderEducation();
  return NextResponse.json(data);
}

// PUT: update lesson
export async function PUT(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const { serviceClient } = auth;

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || !isValidUUID(body.id)) {
    return NextResponse.json({ error: 'ID requis' }, { status: 400 });
  }

  const validation = validerChamps(body, false);
  if (!validation.ok) return NextResponse.json({ error: validation.message }, { status: 400 });

  const { data, error } = await serviceClient
    .from('education_lessons')
    .update({ ...validation.champs, updated_at: new Date().toISOString() })
    .eq('id', body.id)
    .select()
    .single();

  if (error) {
    if (erreurAdresse(error.message)) {
      return NextResponse.json({ error: 'Une autre leçon de ce cours a déjà cette adresse.' }, { status: 409 });
    }
    return serverError(error, 'admin-education-lessons');
  }

  revaliderEducation();
  return NextResponse.json(data);
}

// DELETE: la leçon part à la corbeille, avec ses étapes de parcours et la
// progression de ses lecteurs, que la base efface avec elle. La corbeille
// rafraîchit elle-même les pages, avec la même liste qu'à la restauration.
export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const id = new URL(request.url).searchParams.get('id');
  if (!isValidUUID(id)) {
    return NextResponse.json({ error: 'Identifiant de leçon manquant ou invalide.' }, { status: 400 });
  }

  const resultat = await mettreALaCorbeille(auth.serviceClient, 'education_lessons', id, auth.user.id);
  if (!resultat.ok) return NextResponse.json({ error: resultat.motif }, { status: resultat.statut });
  return NextResponse.json({ success: true, corbeille: true, idCorbeille: resultat.idCorbeille });
}
