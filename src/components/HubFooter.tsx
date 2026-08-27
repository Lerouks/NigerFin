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
    <section className="bg-white border-t border-black/6">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-16">
        <div className="mb-8 pb-3 border-b border-black/10">
          <h2 className="text-[13px] tracking-[0.18em] uppercase font-semibold text-[#111]">
            {heading}
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-12">
          <div className="lg:col-span-2 space-y-4 text-[14px] sm:text-[15px] leading-relaxed text-gray-600 text-pretty hyphens-auto sm:text-justify">
            {paragraphs.map((p, idx) => (
              <p key={`${idx}-${p.slice(0, 24)}`}>{p}</p>
            ))}
          </div>

          {highlights && highlights.length > 0 && (
            <aside className="lg:col-span-1">
              <dl className="space-y-6">
                {highlights.map((h, idx) => (
                  <div key={`${idx}-${h.title}`}>
                    <dt className="text-[11px] tracking-[0.14em] uppercase font-semibold text-[#111] mb-1.5">
                      {h.title}
                    </dt>
                    <dd className="text-[13px] leading-relaxed text-gray-500">
                      {h.body}
                    </dd>
                  </div>
                ))}
              </dl>
            </aside>
          )}
        </div>
      </div>
    </section>
  );
}
