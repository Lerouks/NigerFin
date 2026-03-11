export default function ArticleLoading() {
  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="h-10 w-full bg-gray-200 rounded animate-pulse mb-4" />
        <div className="h-6 w-2/3 bg-gray-100 rounded animate-pulse mb-8" />
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
        <div className="h-[400px] bg-gray-100 rounded-xl animate-pulse mb-10" />
        <div className="space-y-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: `${85 + Math.random() * 15}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
