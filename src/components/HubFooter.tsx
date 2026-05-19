interface HubFooterProps {
  paragraphs: string[];
  highlights?: { title: string; body: string }[];
  heading?: string;
}

/**
 * Footer SEO discret pour les pages hub. Affiché APRÈS le contenu interactif
 * (cours, articles, widgets) afin que les éléments visuels priment.
 * Server component, rendu en SSR pour que les crawlers indexent le contenu riche.
 */
export function HubFooter({
  paragraphs,
  highlights,
  heading = 'Comprendre cette rubrique',
}: HubFooterProps) {
  return (
    <section className="bg-white border-t border-black/[0.06]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-16">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-10 h-[2px] bg-gold/40" />
          <h2 className="text-[13px] tracking-[0.18em] uppercase font-semibold text-[#111]">
            {heading}
          </h2>
          <div className="flex-1 h-px bg-black/[0.06]" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          <div className="lg:col-span-2 space-y-4 text-[14px] sm:text-[15px] leading-relaxed text-gray-600">
            {paragraphs.map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
          </div>

          {highlights && highlights.length > 0 && (
            <aside className="lg:col-span-1">
              <div className="space-y-4">
                {highlights.map((h) => (
                  <div
                    key={h.title}
                    className="border-l-2 border-gold/30 pl-4 py-1"
                  >
                    <h3 className="text-[13px] font-semibold text-[#111] mb-1">
                      {h.title}
                    </h3>
                    <p className="text-[13px] leading-relaxed text-gray-500">
                      {h.body}
                    </p>
                  </div>
                ))}
              </div>
            </aside>
          )}
        </div>
      </div>
    </section>
  );
}
