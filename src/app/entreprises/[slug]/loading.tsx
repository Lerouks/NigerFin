/**
 * Squelette de la fiche entreprise, à la forme de la page finale (bandeau
 * noir avec la carte, puis présentation et points clés) : rien ne saute
 * quand la fiche arrive.
 */
export default function EnterpriseDetailLoading() {
  return (
    <div className="min-h-screen bg-background" aria-busy="true">
      <span className="sr-only">Chargement de la fiche</span>
      <section className="bg-[#0b0b0c]">
        <div className="mx-auto grid max-w-7xl gap-7 px-4 pb-10 pt-2 sm:px-6 md:pb-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-x-14 lg:px-8 lg:pb-16 lg:pt-3">
          <div className="lg:self-end">
            <div className="mt-3 h-4 w-40 rounded-sm bg-white/10 motion-safe:animate-pulse" />
            <div className="mt-8 h-16 w-44 rounded-md bg-white/[0.07] motion-safe:animate-pulse" />
            <div className="mt-6 h-10 w-56 rounded-sm bg-white/[0.12] motion-safe:animate-pulse sm:h-14 sm:w-80" />
            <div className="mt-4 h-4 w-64 max-w-full rounded-sm bg-white/[0.07] motion-safe:animate-pulse" />
            <div className="mt-3 h-5 w-48 rounded-sm bg-white/10 motion-safe:animate-pulse" />
            <div className="mt-9 hidden grid-cols-3 gap-7 lg:grid">
              {[0, 1, 2].map((i) => (
                <div key={i} className="border-t border-white/14 pt-3">
                  <div className="h-3.5 w-16 rounded-sm bg-white/[0.07] motion-safe:animate-pulse" />
                  <div className="mt-2.5 h-7 w-20 rounded-sm bg-white/[0.12] motion-safe:animate-pulse" />
                </div>
              ))}
            </div>
          </div>
          <div className="aspect-[1000/785] w-full rounded-xl bg-white/[0.04] motion-safe:animate-pulse md:max-w-[600px] lg:max-w-none" />
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 pb-14 pt-11 sm:px-6 md:pt-16 lg:px-8">
        <div className="h-6 w-40 rounded-sm bg-gray-200 motion-safe:animate-pulse" />
        <div className="mt-4 max-w-[40em] space-y-3">
          {[100, 97, 99, 92, 64].map((largeur, i) => (
            <div key={i} className="h-4 rounded-sm bg-gray-100 motion-safe:animate-pulse" style={{ width: `${largeur}%` }} />
          ))}
        </div>
        <div className="mt-10 h-6 w-36 rounded-sm bg-gray-200 motion-safe:animate-pulse" />
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-[10px] border border-black/8 bg-white px-[18px] pb-[17px] pt-[15px]">
              <div className="h-3.5 w-16 rounded-sm bg-gray-200 motion-safe:animate-pulse" />
              <div className="mt-2.5 h-6 w-32 rounded-sm bg-gray-100 motion-safe:animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
