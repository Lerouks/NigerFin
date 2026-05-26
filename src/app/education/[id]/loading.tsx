export default function EducationCategoryLoading() {
  return (
    <div className="min-h-screen bg-background">
      <section className="bg-[#111] text-white py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-4 w-40 bg-white/10 rounded-sm animate-pulse mb-6" />

          <div className="flex items-center gap-3 mb-3">
            <div className="w-6 h-6 bg-white/10 rounded-sm animate-pulse" />
            <div className="h-3 w-20 bg-white/6 rounded-sm animate-pulse" />
          </div>
          <div className="h-9 md:h-10 w-72 bg-white/10 rounded-sm animate-pulse mb-3" />
          <div className="h-4 w-96 max-w-full bg-white/6 rounded-sm animate-pulse" />
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="h-5 w-32 bg-gray-200 rounded-sm animate-pulse mb-6" />
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-5 rounded-xl border border-black/6 bg-white"
            >
              <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/5 bg-gray-200 rounded-sm animate-pulse" />
                <div className="h-3 w-20 bg-gray-100 rounded-sm animate-pulse" />
              </div>
              <div className="h-5 w-16 bg-gray-100 rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
