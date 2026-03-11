export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <div className="w-full h-[400px] bg-gray-100 animate-pulse" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8">
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-xl overflow-hidden border border-black/[0.06]">
                  <div className="h-48 bg-gray-100 animate-pulse" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                    <div className="h-5 w-full bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <aside className="lg:col-span-4">
            <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
          </aside>
        </div>
      </div>
    </div>
  );
}
