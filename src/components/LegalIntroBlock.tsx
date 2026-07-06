interface LegalIntroBlockProps {
  paragraphs: string[];
}

/**
 * Bloc d'intro SEO server-rendered au-dessus du contenu DB des pages légales.
 * Garantit un volume de texte indexable même si la DB renvoie peu de sections.
 */
export function LegalIntroBlock({ paragraphs }: LegalIntroBlockProps) {
  return (
    <div className="space-y-5 text-[15px] leading-[1.8] text-gray-600 mb-12 pb-12 border-b border-black/4 text-pretty">
      {paragraphs.map((p) => (
        <p key={p.slice(0, 32)}>{p}</p>
      ))}
    </div>
  );
}
