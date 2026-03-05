interface LegalSection {
  heading: string;
  text: string;
}

interface LegalPageLayoutProps {
  title: string;
  sections: LegalSection[];
}

export function LegalPageLayout({ title, sections }: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <section className="bg-[#111] text-white py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl">{title}</h1>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl p-7 md:p-10 border border-black/[0.06]">
            <div className="space-y-10">
              {sections.map((section, index) => (
                <div key={index}>
                  <h2 className="text-xl font-bold mb-3">{section.heading}</h2>
                  <p className="text-gray-600 leading-relaxed">{section.text}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <p className="text-[12px] text-gray-400">Dernière mise à jour : 1er mars 2026</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
