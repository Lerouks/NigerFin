interface CategoryHeroProps {
  label: string;
  title: string;
  description: string;
  accentGold?: boolean;
}

export function CategoryHero({ label, title, description, accentGold = false }: CategoryHeroProps) {
  return (
    <section className="bg-[#0d0d0d] text-white py-16 md:py-20 relative overflow-hidden">
      <div className="absolute inset-0 hero-grid-pattern" />
      <div className="absolute top-0 inset-x-0 h-[2px] bg-linear-to-r from-transparent via-gold/30 to-transparent" />
      <div className="absolute -top-20 -right-20 w-60 h-60 bg-gold/3 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="inline-flex items-center gap-2.5 mb-4 animate-fade-in">
          <div className="h-px w-6 bg-gold/40" />
          <span className={`text-[11px] tracking-[0.2em] uppercase font-semibold ${accentGold ? 'text-gold/60' : 'text-white/40'}`}>
            {label}
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl leading-tight animate-fade-in-up delay-75 wrap-break-word">{title}</h1>
        <p className="text-white/40 text-[15px] mt-3 max-w-xl animate-fade-in-up delay-150">
          {description}
        </p>
      </div>
    </section>
  );
}
