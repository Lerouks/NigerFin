export const SECTION_META: Record<string, { label: string; path: string }> = {
  economie: { label: 'Économie', path: '/economie' },
  finance: { label: 'Finance', path: '/finance' },
  marches: { label: 'Marchés', path: '/marches' },
  entreprises: { label: 'Entreprises', path: '/entreprises' },
  niger: { label: 'Niger', path: '/niger' },
  education: { label: 'Éducation', path: '/education' },
};

export function getSectionLabel(slug: string): string {
  return SECTION_META[slug]?.label || slug;
}

export function getSectionPath(slug: string): string {
  return SECTION_META[slug]?.path || `/${slug}`;
}
