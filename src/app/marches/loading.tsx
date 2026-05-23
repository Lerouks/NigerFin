export default function MarchesLoading() {
  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="h-8 w-40 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="h-4 w-80 bg-gray-100 rounded animate-pulse mb-10" />
        <div className="bg-white rounded-xl border border-black/[0.06] overflow-hidden">
          <div className="grid grid-cols-5 gap-4 p-4 border-b border-black/[0.06]">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="grid grid-cols-5 gap-4 p-4 border-b border-black/[0.03]">
              {[...Array(5)].map((_, j) => (
                <div key={j} className="h-4 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
