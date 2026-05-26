export default function EntreprisesListLoading() {
  return (
    <div className="min-h-screen bg-background">
      <section className="bg-[#0d0d0d] text-white py-16 md:py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="inline-flex items-center gap-2.5 mb-4">
            <div className="h-px w-6 bg-white/10" />
            <div className="h-3 w-20 bg-white/10 rounded-sm animate-pulse" />
          </div>
          <div className="h-9 sm:h-11 md:h-12 w-64 bg-white/10 rounded-sm animate-pulse" />
          <div className="h-4 w-full max-w-md bg-white/6 rounded-sm animate-pulse mt-4" />
          <div className="h-4 w-2/3 max-w-sm bg-white/6 rounded-sm animate-pulse mt-2" />
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <section>
          <div className="animate-pulse space-y-6">
            <div className="flex items-end justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="h-px w-6 bg-black/6" />
                  <div className="h-3 w-32 bg-black/4 rounded-sm" />
                </div>
                <div className="h-8 w-72 bg-black/4 rounded-lg" />
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-9 w-28 bg-black/4 rounded-full" />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="h-44 bg-black/4 rounded-xl" />
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14 md:pb-20">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-6 w-32 bg-black/6 rounded-sm animate-pulse" />
          <div className="flex-1 h-px bg-black/6" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl overflow-hidden border border-black/6 bg-white">
              <div className="h-44 bg-gray-100 animate-pulse" />
              <div className="p-5 space-y-3">
                <div className="h-3 w-20 bg-gray-200 rounded-sm animate-pulse" />
                <div className="h-5 w-full bg-gray-200 rounded-sm animate-pulse" />
                <div className="h-4 w-3/4 bg-gray-100 rounded-sm animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
