/**
 * Fallback Suspense root, utilise pour TOUTES les routes qui n'ont pas
 * leur propre loading.tsx (articles, contact, mentions, etc.).
 *
 * Doit donc rester ULTRA neutre, jamais simuler la home avec son hero
 * "Actualites economiques" sinon on voit la mini-home flasher avant
 * d'arriver sur la vraie page. Juste une barre de progression gold
 * indeterminate en haut + fond ivoire identique au site.
 *
 * Les pages qui veulent un vrai skeleton riche (home, marches, economie,
 * niger, etc.) ont leur propre loading.tsx.
 */
export default function RootLoading() {
  return (
    <div
      className="fixed inset-0 bg-background z-9998 pointer-events-none"
      role="status"
      aria-live="polite"
      aria-label="Chargement de la page"
    >
      <div className="absolute top-0 left-0 right-0 h-[3px] overflow-hidden">
        <div className="loading-bar-indeterminate h-full bg-linear-to-r from-transparent via-gold to-transparent" />
      </div>
    </div>
  );
}
