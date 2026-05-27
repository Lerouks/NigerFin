/**
 * Pure utility : nom de secteur -> slug d'ancre stable.
 * Vit dans un fichier separe (sans aucun import server-only) pour pouvoir
 * etre importe a la fois par SectorTOC ('use client') et EnterpriseSectorBlock
 * (Server Component).
 */
export function getSectorAnchor(sector: string): string {
  return `sector-${sector
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}`;
}
