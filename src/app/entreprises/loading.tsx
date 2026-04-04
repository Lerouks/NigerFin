export default function Loading() {
  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Hero skeleton */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#1a1510]">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-[#d4a843]/10 to-transparent blur-[100px]" />
          <div className="absolute top-20 right-0 w-[400px] h-[400px] rounded-full bg-gradient-to-bl from-amber-500/5 to-transparent blur-[80px]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
            <div className="max-w-2xl">
              <div className="h-3 w-20 bg-white/[0.06] rounded-full animate-pulse mb-6" />
              <div className="h-12 w-72 bg-white/[0.08] rounded-xl animate-pulse mb-5" />
              <div className="h-4 w-96 bg-white/[0.05] rounded-lg animate-pulse" />
            </div>
            <div className="flex gap-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="w-40 h-16 rounded-2xl border border-white/[0.06] bg-white/[0.03] animate-pulse" />
              ))}
            </div>
          </div>
          {/* Featured article skeleton */}
          <div className="mt-14 rounded-3xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/2 h-64 md:h-72 bg-white/[0.04] animate-pulse" />
              <div className="md:w-1/2 p-6 md:p-10 space-y-4">
                <div className="h-5 w-24 bg-white/[0.06] rounded-full animate-pulse" />
                <div className="h-7 w-full bg-white/[0.08] rounded-lg animate-pulse" />
                <div className="h-4 w-3/4 bg-white/[0.05] rounded-lg animate-pulse" />
                <div className="h-4 w-1/2 bg-white/[0.04] rounded-lg animate-pulse" />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#fafaf9] to-transparent" />
      </div>

      {/* Articles skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="flex items-center gap-4 mb-10">
          <div className="h-7 w-48 bg-gray-200 rounded-lg animate-pulse" />
          <div className="flex-1 h-px bg-gray-100" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-xl overflow-hidden border border-black/[0.04] bg-white">
                  <div className="h-48 bg-gray-100 animate-pulse" />
                  <div className="p-5 space-y-3">
                    <div className="h-3 w-20 bg-gray-200/70 rounded animate-pulse" />
                    <div className="h-5 w-full bg-gray-200/70 rounded animate-pulse" />
                    <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-4">
            <div className="h-80 rounded-2xl bg-white border border-black/[0.04] animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
