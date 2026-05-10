import Image from 'next/image';

export function AboutHero() {
  return (
    <section className="bg-[#0d0d0d] text-white py-20 md:py-28 relative overflow-hidden">
      <div className="absolute inset-0 hero-grid-pattern" />
      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-gold/[0.03] rounded-full blur-3xl" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
        <Image
          src="/logo-about.png"
          alt="NFI Report"
          width={160}
          height={114}
          className="mb-8 mx-auto animate-fade-in"
          priority
        />
        <div className="inline-flex items-center gap-2.5 mb-4 animate-fade-in delay-100">
          <div className="h-[1px] w-8 bg-gold/50" />
          <span className="text-[11px] tracking-[0.2em] uppercase text-gold/60 font-semibold">À propos</span>
          <div className="h-[1px] w-8 bg-gold/50" />
        </div>
        <h1 className="text-4xl md:text-5xl mb-5 leading-[1.1] animate-fade-in-up delay-150">
          L&apos;information économique qui fait avancer l&apos;Afrique
        </h1>
        <p className="text-[17px] text-white/45 max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-200">
          Votre source d&apos;information économique et financière de référence pour le Niger et l&apos;Afrique.
        </p>
      </div>
    </section>
  );
}
