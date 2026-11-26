/**
 * Chargement de la page Simulateurs : la même silhouette que la page (en-tête
 * clair de rubrique, puis les deux cartes « Plan gratuit » et « Plan Premium »),
 * pour que rien ne saute à l'arrivée du contenu.
 */
export default function Loading() {
  return (
    <div className="min-h-screen bg-background" aria-busy="true">
      <div className="border-b border-black/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="h-9 md:h-12 w-56 md:w-72 bg-black/8 rounded-md animate-pulse" />
          <div className="mt-4 h-4 w-full max-w-xl bg-black/6 rounded-sm animate-pulse" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20 md:pt-14 md:pb-28">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          <div className="h-[420px] rounded-xl border border-black/6 bg-white animate-pulse" />
          <div className="h-[420px] rounded-xl bg-[#111]/85 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
