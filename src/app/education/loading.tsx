export default function EducationLoading() {
  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <div className="bg-[#0d0d0d] py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-3 w-20 bg-white/10 rounded animate-pulse mb-4" />
          <div className="h-10 w-48 bg-white/10 rounded animate-pulse mb-3" />
          <div className="h-4 w-80 bg-white/[0.06] rounded animate-pulse" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="rounded-xl p-5 h-[160px] md:h-[180px] bg-[#1a1a1a] border border-white/[0.04]">
              <div className="w-7 h-7 bg-white/10 rounded animate-pulse mb-auto" />
              <div className="mt-auto">
                <div className="h-4 w-3/4 bg-white/10 rounded animate-pulse mb-2" />
                <div className="h-3 w-12 bg-white/[0.06] rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
