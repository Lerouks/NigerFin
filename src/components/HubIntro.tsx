interface HubIntroProps {
  paragraphs: string[];
  highlights?: { title: string; body: string }[];
}

/**
 * Bloc d'introduction SEO pour les pages hub (rubriques principales).
 * Server component, rendu en SSR pour que les crawlers voient un contenu riche.
 */
export function HubIntro({ paragraphs, highlights }: HubIntroProps) {
  return (
    <section className="bg-white border-b border-black/[0.06]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="space-y-5 text-[15px] sm:text-[16px] leading-relaxed text-gray-700">
          {paragraphs.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
        </div>

        {highlights && highlights.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-10">
            {highlights.map((h) => (
              <div
                key={h.title}
                className="bg-[#fafaf9] border border-black/[0.06] rounded-xl p-5"
              >
                <h2 className="text-[15px] font-semibold text-[#111] mb-2">{h.title}</h2>
                <p className="text-[14px] leading-relaxed text-gray-600">{h.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
