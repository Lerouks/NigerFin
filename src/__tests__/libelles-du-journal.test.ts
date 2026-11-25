import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ACTIONS_DU_JOURNAL, TYPES_DU_JOURNAL, actionDuJournal, ajouterLaSuite, typeDuJournal } from '@/app/admin/lib/libelles-du-journal';
import { TABLES_CORBEILLE } from '@/lib/corbeille/libelles';

/**
 * Le journal du cockpit affiche chaque action sous un libellé en français. Le
 * 25/11/2026, cinq actions s'affichaient encore sous leur nom technique
 * (« email.transactional_edit »). Ce test lit tout le code et vérifie que chaque
 * action écrite dans le journal a son libellé.
 */

const SRC = fileURLToPath(new URL('..', import.meta.url));

/** Les actions et les types écrits en clair : logAuditEvent(qui, 'action', 'type', …), journaliser(…), et les insertions directes. */
function ecritParLeCode(): { actions: Map<string, string>; types: Map<string, string> } {
  const actions = new Map<string, string>();
  const types = new Map<string, string>();
  const fichiers = (readdirSync(SRC, { recursive: true }) as string[])
    .filter((f) => /\.tsx?$/.test(f) && !f.includes('__tests__'));
  for (const fichier of fichiers) {
    const texte = readFileSync(join(SRC, fichier), 'utf8');
    for (const m of texte.matchAll(/(?:logAuditEvent|journaliser)\(\s*[^,()]+,\s*['"]([^'"]+)['"]/g)) if (m[1]) actions.set(m[1], fichier);
    for (const m of texte.matchAll(/(?:logAuditEvent|journaliser)\(\s*[^,()]+,\s*['"][^'"]+['"],\s*['"]([^'"]+)['"]/g)) if (m[1]) types.set(m[1], fichier);
    if (texte.includes("from('audit_log').insert")) {
      for (const m of texte.matchAll(/\baction:\s*['"]([a-z_.]+)['"]/g)) if (m[1]) actions.set(m[1], fichier);
      for (const m of texte.matchAll(/\bentity_type:\s*['"]([a-z_]+)['"]/g)) if (m[1]) types.set(m[1], fichier);
    }
  }
  return { actions, types };
}

describe('libellés du journal', () => {
  const { actions, types } = ecritParLeCode();

  it('la lecture du code trouve bien les actions, y compris la tâche de nuit et la corbeille', () => {
    expect(actions.size).toBeGreaterThan(20);
    for (const connue of ['subscription_expired', 'corbeille.mise', 'email.transactional_edit', 'password_changed', 'ipaymoney_payment_verified']) {
      expect(actions.has(connue), connue).toBe(true);
    }
  });

  it('chaque action écrite par le code a un libellé en français', () => {
    const sansLibelle = [...actions].filter(([action]) => !ACTIONS_DU_JOURNAL[action]).map(([action, fichier]) => `${action} (${fichier})`);
    expect(sansLibelle).toEqual([]);
  });

  it('chaque type écrit par le code, et chaque table de la corbeille, a un nom en français', () => {
    expect(types.size).toBeGreaterThan(8);
    const attendus = [...types.keys(), ...TABLES_CORBEILLE];
    expect(attendus.filter((type) => !TYPES_DU_JOURNAL[type])).toEqual([]);
    expect(typeDuJournal('newsletter_subscribers')).toBe('Abonnés newsletter');
    expect(typeDuJournal('type_inconnu')).toBe('type_inconnu');
  });

  it('une action inconnue reste lisible sous son nom technique', () => {
    expect(actionDuJournal('action.inconnue')).toEqual({ libelle: 'action.inconnue', couleur: 'bg-gray-100 text-gray-600' });
    expect(actionDuJournal('email.transactional_edit').libelle).toBe('Mail automatique modifié');
  });
});

describe('ajouterLaSuite', () => {
  it('ajoute les actions plus anciennes après celles déjà affichées', () => {
    expect(ajouterLaSuite([{ id: 'a' }, { id: 'b' }], [{ id: 'c' }, { id: 'd' }]).map((l) => l.id)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('une action revenue parce que les pages ont glissé ne s’affiche qu’une fois', () => {
    expect(ajouterLaSuite([{ id: 'a' }, { id: 'b' }], [{ id: 'b' }, { id: 'c' }]).map((l) => l.id)).toEqual(['a', 'b', 'c']);
  });

  it('une page vide ne change rien', () => {
    expect(ajouterLaSuite([{ id: 'a' }], [])).toEqual([{ id: 'a' }]);
  });
});
