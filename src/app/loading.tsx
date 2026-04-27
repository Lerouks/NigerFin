export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Hero zone : message d'accueil utile au lieu d'un placeholder gris vide */}
      <div className="w-full bg-gradient-to-br from-[#111] to-[#1a1a1a] py-20 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-gold mb-4">
            Niger Financial Insights
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Actualités économiques et financières
          </h2>
          <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
            Chargement des dernières analyses pour le Niger et l&rsquo;Afrique de l&rsquo;Ouest...
          </p>
        </div>
      </div>

      {/* Skeleton articles, plus discret */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-[#1a1a1a]">Dernières actualités</h3>
              <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-xl overflow-hidden border border-black/[0.06] bg-white">
                  <div className="h-48 bg-gradient-to-br from-gray-50 to-gray-100 animate-pulse" />
                  <div className="p-5 space-y-3">
                    <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                    <div className="h-5 w-full bg-gray-100 rounded animate-pulse" />
                    <div className="h-4 w-3/4 bg-gray-50 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <aside className="lg:col-span-4">
            <div className="rounded-xl border border-black/[0.06] bg-white p-6">
              <h4 className="text-sm font-semibold text-[#1a1a1a] mb-4">Marchés en direct</h4>
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-black/[0.04] last:border-b-0">
                    <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                    <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
