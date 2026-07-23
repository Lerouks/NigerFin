import { createServiceClient } from '@/lib/supabase';
import { TEMPLATE_SLOTS } from '@/lib/emails/slots';
import type { TransactionalEmailKey } from '@/lib/emails/registry';

/**
 * Surcharges de textes des e-mails transactionnels.
 *
 * Principe : le rendu des templates reste INCHANGE (donc identique au byte pres
 * par defaut). Ici on applique, APRES rendu, les textes edites par l'admin, par
 * simple remplacement de la chaine par defaut (declaree dans slots.ts) par la
 * valeur editee. Sans surcharge en base : `applyOverridesTo` retourne l'objet
 * intact. Cache court (10 s) + invalidation a l'ecriture => synchro quasi
 * immediate sur les vrais envois.
 */

export interface TemplateOverride {
  subject: string | null;
  blocks: Record<string, string>;
}

interface CacheEntry { data: TemplateOverride | null; at: number }
const cache = new Map<string, CacheEntry>();
const TTL_MS = 10_000;

export function invalidateOverrides(key?: TransactionalEmailKey): void {
  if (key) cache.delete(key);
  else cache.clear();
}

export async function getOverrides(key: TransactionalEmailKey): Promise<TemplateOverride | null> {
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && now - cached.at < TTL_MS) return cached.data;

  const supabase = createServiceClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from('email_template_overrides')
    .select('subject, blocks')
    .eq('key', key)
    .maybeSingle();

  const result: TemplateOverride | null = data
    ? {
        subject: (data.subject as string | null) ?? null,
        blocks: (data.blocks as Record<string, string> | null) ?? {},
      }
    : null;

  cache.set(key, { data: result, at: now });
  return result;
}

/**
 * Fonction PURE (sans I/O) : applique une surcharge sur un e-mail rendu.
 * Sans surcharge (`override` null) : renvoie `built` tel quel (byte-identique).
 * Remplacement LITTERAL (pas de regex, pas d'interpretation de `$` dans la valeur).
 */
export function applyOverrideStrings(
  key: TransactionalEmailKey,
  built: { subject: string; html: string },
  override: TemplateOverride | null,
): { subject: string; html: string } {
  if (!override) return built;

  const slots = TEMPLATE_SLOTS[key];
  let subject = built.subject;
  let html = built.html;

  if (override.subject && slots.subject !== undefined && override.subject !== slots.subject) {
    subject = override.subject;
  }
  for (const block of slots.blocks) {
    const val = override.blocks?.[block.key];
    if (typeof val === 'string' && val.trim() !== '' && val !== block.default) {
      html = html.replace(block.default, () => val);
    }
  }
  return { subject, html };
}

/**
 * Applique les textes edites (lus en base) sur un e-mail deja rendu.
 * Sans surcharge : renvoie `built` intact.
 */
export async function applyOverridesTo(
  key: TransactionalEmailKey,
  built: { subject: string; html: string },
): Promise<{ subject: string; html: string }> {
  const ov = await getOverrides(key);
  return applyOverrideStrings(key, built, ov);
}

/** Textes effectifs (defaut + surcharge) pour l'editeur du Cockpit. */
export async function getEffectiveTexts(key: TransactionalEmailKey): Promise<{
  key: TransactionalEmailKey;
  subject: { editable: boolean; default: string | null; value: string | null };
  blocks: Array<{ key: string; label: string; default: string; value: string }>;
}> {
  const slots = TEMPLATE_SLOTS[key];
  const ov = await getOverrides(key);
  return {
    key,
    subject:
      slots.subject !== undefined
        ? { editable: true, default: slots.subject, value: ov?.subject ?? slots.subject }
        : { editable: false, default: null, value: null },
    blocks: slots.blocks.map((b) => ({
      key: b.key,
      label: b.label,
      default: b.default,
      value: ov?.blocks?.[b.key] ?? b.default,
    })),
  };
}

/** Enregistre une surcharge : ne garde que ce qui differe du defaut. */
export async function saveOverride(
  key: TransactionalEmailKey,
  input: { subject?: string | null; blocks?: Record<string, string> },
  updatedBy?: string,
): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) throw new Error('Supabase service client unavailable');
  const slots = TEMPLATE_SLOTS[key];

  const cleanBlocks: Record<string, string> = {};
  if (input.blocks) {
    for (const b of slots.blocks) {
      const v = input.blocks[b.key];
      if (typeof v === 'string' && v.trim() !== '' && v !== b.default) cleanBlocks[b.key] = v;
    }
  }
  const subject =
    slots.subject !== undefined && input.subject && input.subject !== slots.subject
      ? input.subject
      : null;

  const { error } = await supabase
    .from('email_template_overrides')
    .upsert({ key, subject, blocks: cleanBlocks, updated_by: updatedBy ?? null }, { onConflict: 'key' });
  if (error) throw new Error(`Failed to save override: ${error.message}`);

  invalidateOverrides(key);
}
