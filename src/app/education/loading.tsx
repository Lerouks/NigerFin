export default function EducationLoading() {
  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="h-8 w-56 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="h-4 w-96 bg-gray-100 rounded animate-pulse mb-10" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl border border-black/[0.06] p-6 bg-white">
              <div className="w-12 h-12 bg-gray-100 rounded-lg animate-pulse mb-4" />
              <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-4 w-full bg-gray-100 rounded animate-pulse mb-1" />
              <div className="h-4 w-2/3 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
