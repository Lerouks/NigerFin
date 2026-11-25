import type { LegalSection } from '@/lib/legal-sections';
import { LegalIntroBlock } from '@/components/LegalIntroBlock';
import { texteJustifie } from '@/components/TexteJustifie';
// Titres des sections : apostrophe typographique et insécable avant « ? », comme
// le texte (« Qu'est-ce qu'un cookie ? » s'affichait avec des apostrophes droites).
import { typographier } from '@/lib/typographie';
import { HabillagePreLancement } from '@/components/coming-soon/HabillagePreLancement';

interface FallbackSection {
  heading: string;
  text: string;
}

interface DynamicLegalPageProps {
  title: string;
  introParagraphs?: string[];
  initialSections?: LegalSection[];
  fallbackSections?: FallbackSection[];
}

export function DynamicLegalPage({ title, introParagraphs, initialSections, fallbackSections }: DynamicLegalPageProps) {
  const sections = initialSections && initialSections.length > 0 ? initialSections : null;
  const useFallback = !sections && fallbackSections && fallbackSections.length > 0;

  const bodyClass = 'texte-justifie text-gray-600 text-[15px] leading-[1.8] whitespace-pre-line';

  const lastUpdated = sections && sections.length > 0
    ? (() => {
        try {
          const timestamps = sections.map((s) => new Date(s.updated_at).getTime()).filter((t) => !isNaN(t));
          return timestamps.length > 0 ? new Date(Math.max(...timestamps)) : null;
        } catch { return null; }
      })()
    : null;

  return (
    <HabillagePreLancement>
      <div className="min-h-screen bg-background">
        {/* Fond clair, sans degrade decoratif : le noir est reserve aux chiffres. */}
        <section className="bg-background border-b border-black/8 py-14 md:py-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#111]">{title}</h1>
          </div>
        </section>

        <section className="py-16 md:py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-xl p-5 sm:p-7 md:p-10 border border-black/6">
              {introParagraphs && introParagraphs.length > 0 && (
                <LegalIntroBlock paragraphs={introParagraphs} />
              )}
              {sections ? (
                <div className="space-y-10 max-w-prose">
                  {sections.map((section) => (
                    <div key={section.id}>
                      <h2 className="text-xl font-bold mb-3">{typographier(section.heading)}</h2>
                      <div className={bodyClass}>{texteJustifie(section.text)}</div>
                    </div>
                  ))}
                </div>
              ) : useFallback && fallbackSections ? (
                <div className="space-y-10 max-w-prose">
                  {fallbackSections.map((section, index) => (
                    <div key={index}>
                      <h2 className="text-xl font-bold mb-3">{typographier(section.heading)}</h2>
                      <div className={bodyClass}>{texteJustifie(section.text)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-12">Contenu en cours de mise à jour.</p>
              )}

              {lastUpdated && (
                <div className="mt-8 text-center">
                  <p className="text-[12px] text-gray-500">
                    Dernière mise à jour : {lastUpdated.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </HabillagePreLancement>
  );
}
