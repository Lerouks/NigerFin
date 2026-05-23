export default function EnterpriseDetailLoading() {
  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <div className="relative bg-[#111] text-white overflow-hidden">
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
          <div className="h-4 w-28 bg-white/10 rounded animate-pulse mb-6" />

          <div className="flex items-start gap-5">
            <div className="w-[4.5rem] h-[4.5rem] sm:w-24 sm:h-24 rounded-2xl bg-white/10 flex-shrink-0 shadow-xl animate-pulse" />

            <div className="min-w-0 flex-1">
              <div className="h-9 sm:h-12 w-2/3 bg-white/10 rounded animate-pulse" />
              <div className="h-4 w-1/2 bg-white/[0.06] rounded animate-pulse mt-3" />
              <div className="flex flex-wrap items-center gap-2 mt-4">
                <div className="h-6 w-24 bg-white/10 rounded-full animate-pulse" />
                <div className="h-6 w-28 bg-white/[0.06] rounded-full animate-pulse" />
                <div className="h-6 w-32 bg-white/[0.06] rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        </div>
        <div className="h-1.5 bg-white/[0.06]" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-xl shadow-[0_4px_40px_-12px_rgba(0,0,0,0.08)] p-6 sm:p-8">
              <div className="h-3 w-24 bg-gray-200 rounded animate-pulse mb-4" />
              <div className="space-y-3">
                {[100, 96, 98, 92, 78].map((w, i) => (
                  <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: `${w}%` }} />
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-[0_4px_40px_-12px_rgba(0,0,0,0.08)] p-6 sm:p-8">
              <div className="h-3 w-24 bg-gray-200 rounded animate-pulse mb-4" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="p-4 rounded-lg border border-black/[0.05] bg-gray-50/60">
                    <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="h-5 w-28 bg-gray-200 rounded animate-pulse" />
                <div className="flex-1 h-px bg-black/[0.06]" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="rounded-xl overflow-hidden border border-black/[0.06] bg-white">
                    <div className="h-44 bg-gray-100 animate-pulse" />
                    <div className="p-5 space-y-3">
                      <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
                      <div className="h-5 w-full bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 space-y-6">
              <div className="bg-white rounded-xl shadow-[0_4px_40px_-12px_rgba(0,0,0,0.08)] p-6">
                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse mb-3" />
                <div className="divide-y divide-black/[0.05]">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-start gap-3 py-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex-shrink-0 mt-0.5 animate-pulse" />
                      <div className="min-w-0 flex-1">
                        <div className="h-2.5 w-16 bg-gray-200 rounded animate-pulse" />
                        <div className="h-4 w-2/3 bg-gray-100 rounded animate-pulse mt-1.5" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#111] text-white rounded-xl p-6">
                <div className="h-4 w-full bg-white/10 rounded animate-pulse mb-2" />
                <div className="h-4 w-3/4 bg-white/[0.06] rounded animate-pulse mb-4" />
                <div className="h-4 w-44 bg-white/10 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
