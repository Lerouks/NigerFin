export default function EducationLoading() {
  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Hero skeleton */}
      <div className="bg-[#0d0d0d] py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-3 w-20 bg-white/10 rounded animate-pulse mb-4" />
          <div className="h-10 w-48 bg-white/10 rounded animate-pulse mb-3" />
          <div className="h-4 w-80 bg-white/[0.06] rounded animate-pulse" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        {/* Stats skeleton */}
        <div className="flex gap-6 mb-12">
          <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-36 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
        </div>

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-black/[0.06] p-6 bg-white">
              <div className="w-11 h-11 bg-gray-100 rounded-xl animate-pulse mb-4" />
              <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-4 w-full bg-gray-100 rounded animate-pulse mb-1" />
              <div className="h-4 w-2/3 bg-gray-100 rounded animate-pulse mb-5" />
              <div className="pt-4 border-t border-black/[0.04] flex justify-between">
                <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
