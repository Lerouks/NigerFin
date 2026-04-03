import Link from 'next/link';
import Image from 'next/image';
import { TrendingUp, BarChart3, Shield } from 'lucide-react';

const HIGHLIGHTS = [
  { icon: TrendingUp, text: 'Analyses exclusives du marché nigérien' },
  { icon: BarChart3, text: 'Données financières en temps réel' },
  { icon: Shield, text: 'Accès sécurisé et personnalisé' },
];

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[85vh] flex bg-[#fafaf9]">
      {/* Brand Panel - hidden on mobile */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[520px] bg-[#0d0d0d] relative overflow-hidden flex-col justify-between p-12">
        {/* Grid pattern */}
        <div className="absolute inset-0 hero-grid-pattern" />
        {/* Gold accent line at top */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        {/* Subtle glow */}
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-gold/[0.04] rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-gold/[0.03] rounded-full blur-2xl" />

        <div className="relative z-10">
          <Link href="/" className="inline-block mb-16">
            <Image
              src="/logo-about.png"
              alt="NFI Report"
              width={120}
              height={85}
              className="opacity-90"
            />
          </Link>

          <h2 className="text-[1.75rem] text-white font-bold leading-[1.15] tracking-[-0.02em] mb-4">
            L&apos;information financière qui fait la différence
          </h2>
          <p className="text-white/35 text-[15px] leading-relaxed mb-12">
            Rejoignez la communauté des décideurs et investisseurs du Niger et de l&apos;Afrique de l&apos;Ouest.
          </p>

          <div className="space-y-5">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                  <Icon className="w-4.5 h-4.5 text-gold" />
                </div>
                <span className="text-[14px] text-white/50 font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 pt-8 border-t border-white/[0.06]">
          <p className="text-[12px] text-white/20">
            &copy; {new Date().getFullYear()} NFI Report. Tous droits réservés.
          </p>
        </div>
      </div>

      {/* Form Panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          {children}
        </div>
      </div>
    </div>
  );
}
