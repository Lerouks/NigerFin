export default function CompteLoading() {
  return (
    <div className="min-h-screen bg-[#f2f2f3]" aria-busy="true" aria-label="Chargement du compte">
      <div className="bg-[#111]">
        <div className="mx-auto max-w-[1200px] px-5 pb-[30px] pt-[26px] lg:px-8 lg:pb-[46px] lg:pt-11">
          <div className="h-3.5 w-24 animate-pulse rounded-sm bg-white/10 motion-reduce:animate-none" />
          <div className="mt-3 h-8 w-72 max-w-full animate-pulse rounded-sm bg-white/15 motion-reduce:animate-none lg:h-11 lg:w-[520px]" />
          <div className="mt-4 h-3.5 w-48 animate-pulse rounded-sm bg-white/10 motion-reduce:animate-none" />
        </div>
      </div>
      <div className="mx-auto max-w-[1200px] px-3.5 pt-4 lg:grid lg:grid-cols-[200px_minmax(0,860px)] lg:gap-14 lg:px-8 lg:pt-8">
        <div className="mb-4 h-[140px] rounded-md border border-[#e4e4e7] bg-white lg:h-[230px] lg:border-0 lg:bg-transparent" />
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-md border border-[#e4e4e7] bg-white p-[18px] lg:p-6">
              <div className="h-5 w-32 animate-pulse rounded-sm bg-[#ececee] motion-reduce:animate-none" />
              <div className="mt-5 h-7 w-40 animate-pulse rounded-sm bg-[#ececee] motion-reduce:animate-none" />
              <div className="mt-3 h-4 w-2/3 animate-pulse rounded-sm bg-[#f2f2f3] motion-reduce:animate-none" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
