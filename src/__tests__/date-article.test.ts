import { describe, it, expect } from 'vitest';
import { formatDate } from '@/lib/utils';

describe('formatDate', () => {
  it("écrit la date à l'heure de Niamey, quel que soit le fuseau du serveur", () => {
    // Publié à 23 h 30 UTC : le 18 avril à Niamey, sur le serveur comme chez le lecteur.
    expect(formatDate('2026-04-17T23:30:00Z')).toBe('18 avril 2026');
    expect(formatDate('2026-04-17T10:00:00Z')).toBe('17 avril 2026');
  });

  it('écrit « 1er » pour le premier jour du mois, et seulement pour lui', () => {
    expect(formatDate('2026-12-31T23:15:00Z')).toBe('1er janvier 2027');
    expect(formatDate('2026-11-10T12:00:00Z')).toBe('10 novembre 2026');
    expect(formatDate('2026-11-21T12:00:00Z')).toBe('21 novembre 2026');
  });
});
