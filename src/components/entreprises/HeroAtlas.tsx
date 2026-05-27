import { MethodologyDrawer } from './MethodologyDrawer';

interface HeroAtlasProps {
  eyebrow: string;
  title: string;
  lead: string;
}

/**
 * Hero plein largeur de l'atlas /entreprises.
 * Image hero en duotone gold/noir via overlays CSS pur (background-image +
 * mix-blend + gradient pour lisibilite texte WCAG AAA).
 *
 * Min-height 70vh desktop / 60vh mobile pour donner la presence editoriale
 * d'une couverture de magazine (style Rest of World, Bloomberg Big Read).
 */
export function HeroAtlas({ eyebrow, title, lead }: HeroAtlasProps) {
  return (
    <section className="relative isolate overflow-hidden bg-[#0a0a0a] min-h-[60vh] md:min-h-[70vh] flex flex-col">
      {/* Couche image en background, legerement desaturee */}
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center grayscale-[0.5]"
        style={{
          backgroundImage:
            "image-set(url('/hero/entreprises-strategiques.webp') type('image/webp'), url('/hero/entreprises-strategiques.jpg') type('image/jpeg'))",
        }}
      />
      {/* Voile gold tres leger pour cohesion charte */}
      <div
        aria-hidden
        className="absolute inset-0 mix-blend-overlay opacity-30"
        style={{ backgroundColor: '#d4a843' }}
      />
      {/* Overlay degrade horizontal pour le texte (gauche sombre) */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to right, rgba(10,10,10,0.85) 0%, rgba(10,10,10,0.55) 55%, rgba(10,10,10,0.30) 100%)',
        }}
      />
      {/* Overlay degrade vertical bas pour ancrer le trigger Methodologie */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-1/3"
        style={{
          background:
            'linear-gradient(to bottom, rgba(10,10,10,0) 0%, rgba(10,10,10,0.65) 100%)',
        }}
      />

      {/* Contenu : header (eyebrow+H1+lead) en haut, methodologie en bas */}
      <div className="relative flex-1 flex flex-col justify-between max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24 lg:py-28">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3 mb-6">
            <span className="h-px w-10 bg-gold" />
            <span className="text-[11px] md:text-[12px] font-semibold tracking-[0.24em] uppercase text-gold">
              {eyebrow}
            </span>
          </div>
          <h1 className="text-white font-black tracking-tight leading-[1.02] text-[clamp(2.75rem,7.5vw,5rem)]">
            {title}
          </h1>
          <p className="mt-7 text-[clamp(1.05rem,1.7vw,1.375rem)] font-normal italic leading-relaxed text-white/85 max-w-2xl">
            {lead}
          </p>
        </div>

        {/* Pied du hero : Methodologie en bouton ghost + credit photo */}
        <div className="mt-12 md:mt-16 flex items-end justify-between gap-6 flex-wrap">
          <MethodologyDrawer
            triggerClassName="inline-flex items-center gap-2 px-5 py-2.5 text-[13px] font-bold uppercase tracking-[0.16em] text-gold border border-gold/60 hover:bg-gold hover:text-[#0a0a0a] transition-colors rounded-full"
          />
          <p className="text-[10px] uppercase tracking-wider text-white/50 max-w-xs text-right">
            Photo : Jean Rebiffe &middot; Wikimedia Commons (CC BY-SA 3.0)
          </p>
        </div>
      </div>
    </section>
  );
}
