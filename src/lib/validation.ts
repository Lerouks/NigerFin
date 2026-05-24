/**
 * Shared input validation utilities for API routes.
 * Prevents injection attacks and ensures data integrity.
 */

import type { ZodTypeAny, z } from 'zod';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

/** Validate UUID v1-v5 format */
export function isValidUUID(value: unknown): value is string {
  return typeof value === 'string' && UUID_REGEX.test(value);
}

/** Validate email with strict regex (RFC 5322 subset) */
export function isValidEmail(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 254 && EMAIL_REGEX.test(value);
}

/** Sanitize a string for use in Supabase ilike/text filters, escapes SQL wildcards and special chars */
export function sanitizeSearchQuery(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
    .slice(0, 200);
}

/** Safely parse JSON from a Request, returning null on malformed input.
 * Note : pour les nouvelles routes, prefere parseJsonBody(req, ZodSchema)
 * qui combine parsing safe + validation typee. safeParseJSON ne fait que
 * du JSON.parse safe, sans verification de la structure.
 */
export async function safeParseJSON<T = Record<string, unknown>>(request: Request): Promise<T | null> {
  try {
    return await request.json() as T;
  } catch {
    return null;
  }
}

/**
 * Parse + validation Zod en une etape, retourne { ok: true, data } ou
 * { ok: false, error } avec un message d'erreur safe a renvoyer au client
 * (n'expose pas les details internes de la validation).
 *
 * Pattern recommande pour toutes les nouvelles routes API qui acceptent
 * un body JSON. Voir /api/tools/pdf-create pour un exemple.
 */
export async function parseJsonBody<TSchema extends ZodTypeAny>(
  request: Request,
  schema: TSchema,
): Promise<
  | { ok: true; data: z.infer<TSchema> }
  | { ok: false; status: number; error: string }
> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { ok: false, status: 400, error: 'JSON invalide' };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, status: 400, error: 'Paramètres invalides' };
  }
  return { ok: true, data: parsed.data };
}

/** Validate that a value is one of allowed options */
export function isOneOf<T extends string>(value: unknown, options: readonly T[]): value is T {
  return typeof value === 'string' && (options as readonly string[]).includes(value);
}

/**
 * Bornes un chemin de redirection post-auth aux URLs internes (securite C-1).
 *
 * Accepte uniquement les chemins absolus mono-slash (`/`, `/articles`, etc.).
 * Rejette les URLs protocol-relative (`//evil.com`), externes (`https://...`,
 * `data:...`), et les variantes Windows (`/\\evil.com`).
 *
 * Retourne `/` par defaut si l'entree est nulle/vide/dangereuse.
 */
export function safeNextPath(raw: string | null | undefined): string {
  if (!raw) return '/';
  if (typeof raw !== 'string') return '/';
  if (!raw.startsWith('/')) return '/';
  if (raw.startsWith('//')) return '/';
  if (raw.startsWith('/\\')) return '/';
  return raw;
}
