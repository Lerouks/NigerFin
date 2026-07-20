interface CategoryHeroProps {
  title: string;
  description: string;
}

/**
 * En-tete editorial d'une rubrique.
 *
 * Refondu sur FOND CLAIR : le noir est reserve aux chiffres, or ce hero etait un
 * grand bloc noir (bg-[#0d0d0d]) present en tete de six rubriques, avec trois
 * tics visuels cumules qui sont tous bannis :
 *   - un filigrane de grille (hero-grid-pattern),
 *   - un filet en degrade or (divider decoratif),
 *   - un halo flou (blur-3xl).
 * L'eyebrow « Rubrique » / « Découvrir » a aussi ete retire : dire au lecteur
 * qu'une rubrique est une rubrique n'apporte rien. Reste l'essentiel, un titre
 * et une phrase, poses par un simple filet bas de 1 px.
 */
export function CategoryHero({ title, description }: CategoryHeroProps) {
  return (
    <section className="bg-background border-b border-black/8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight text-[#111] wrap-break-word">
          {title}
        </h1>
        <p className="text-gray-600 text-[15px] md:text-[16px] mt-3 max-w-2xl leading-relaxed">
          {description}
        </p>
      </div>
    </section>
  );
}
