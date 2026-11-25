/**
 * Chargement de la page Simulateurs : la même silhouette que la page (en-tête
 * clair de rubrique, puis les six carrés noirs), pour que rien ne saute à
 * l'arrivée du contenu.
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 md:pt-12 md:pb-24">
        <div className="grid grid-cols-1 min-[390px]:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3 lg:gap-3.5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="min-h-[120px] min-[390px]:min-h-[156px] sm:min-h-[208px] lg:min-h-[228px] rounded-[14px] bg-[#111]/85 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
