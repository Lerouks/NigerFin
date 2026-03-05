import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] bg-[#fafaf9] flex items-center justify-center">
      <div className="text-center px-4">
        <div className="mb-8">
          <span className="text-[120px] md:text-[160px] font-bold text-black/[0.04] leading-none block">
            404
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-4 -mt-16">Page introuvable</h1>
        <p className="text-gray-500 text-[15px] mb-8 max-w-md mx-auto leading-relaxed">
          La page que vous recherchez n&apos;existe pas ou a été déplacée. Retournez à
          l&apos;accueil pour continuer votre lecture.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-[#111] text-white px-7 py-3 rounded-full hover:bg-[#333] transition-colors text-[14px]"
          >
            Retour à l&apos;accueil
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 border border-black/[0.1] px-7 py-3 rounded-full hover:bg-black/5 transition-colors text-[14px]"
          >
            Nous contacter
          </Link>
        </div>
      </div>
    </div>
  );
}
