import { MethodologyDrawer } from './MethodologyDrawer';

interface HeroAtlasProps {
  eyebrow: string;
  title: string;
  lead: string;
}

/**
 * Hero plein largeur de l'atlas /entreprises.
 * Image hero en duotone noir/or via overlay CSS (background-image + mix-blend).
 * H1 Inter Black tres large, lead 1 phrase editorial, lien methodologie discret.
 * Contraste WCAG AAA garanti par overlay noir 65%.
 */
export function HeroAtlas({ eyebrow, title, lead }: HeroAtlasProps) {
  return (
    <section className="relative isolate overflow-hidden bg-[#0a0a0a]">
      {/* Image hero en background. On utilise background-image plutot que <Image>
          car on combine 3 layers (image + voile gold + degrade texte) et CSS suffit. */}
      {/* Couche duotone : grayscale par filter + teinte gold via overlay multiply leger */}
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
      {/* Overlay degrade pour lisibilite texte (WCAG AAA), preserve l'image visible */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to right, rgba(10,10,10,0.85) 0%, rgba(10,10,10,0.55) 55%, rgba(10,10,10,0.35) 100%)',
        }}
      />
      {/* Contenu */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 lg:py-32">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3 mb-5">
            <span className="h-px w-8 bg-gold" />
            <span className="text-[11px] font-semibold tracking-[0.22em] uppercase text-gold">
              {eyebrow}
            </span>
          </div>
          <h1 className="text-white font-black tracking-tight leading-[1.05] text-[clamp(2.5rem,7vw,4.5rem)]">
            {title}
          </h1>
          <p className="mt-6 text-[clamp(1rem,1.6vw,1.25rem)] font-normal leading-relaxed text-white/85 max-w-2xl">
            {lead}
          </p>
          <div className="mt-8">
            <MethodologyDrawer
              triggerClassName="inline-flex items-center gap-2 text-[13px] font-medium text-gold hover:text-white transition-colors border-b border-gold/40 hover:border-white/80 pb-0.5"
            />
          </div>
        </div>
      </div>
      {/* Credit image discret en bas droite */}
      <p className="absolute bottom-3 right-4 text-[10px] uppercase tracking-wider text-white/35">
        Photo : Jean Rebiffe &middot; Wikimedia Commons (CC BY-SA 3.0)
      </p>
    </section>
  );
}
