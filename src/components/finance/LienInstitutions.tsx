import Link from 'next/link';
import { paragrapheFr } from '@/lib/typographie-fr';

/** Les cinq institutions de la page « Qui fait quoi », dans son ordre. */
const INSTITUTIONS = [
  { id: 'bceao', nom: 'BCEAO' },
  { id: 'uemoa', nom: 'UEMOA' },
  { id: 'brvm', nom: 'BRVM' },
  { id: 'amf-umoa', nom: 'AMF‑UMOA' },
  { id: 'umoa-titres', nom: 'UMOA‑Titres' },
];

/**
 * L'entrée de la page Finance vers « Qui fait quoi dans la finance »
 * (25/11/2026), sous les cours du jour : un titre, une phrase, et une porte
 * directe vers chaque institution de l'UEMOA.
 */
export function LienInstitutions() {
  return (
    <section aria-labelledby="institutions-titre" className="rounded-xl border border-black/10 bg-white px-4 py-5 sm:px-6 sm:py-6">
      <h2 id="institutions-titre" className="text-[18px] sm:text-[19px] font-bold tracking-tight text-[#111]">
        <Link href="/finance/institutions" className="underline-offset-4 hover:underline">
          {'Qui fait quoi dans\u00a0la\u00a0finance'}
        </Link>
      </h2>
      <p className="mt-1.5 max-w-2xl text-[15px] leading-relaxed text-gray-600">
        {paragrapheFr(
          'Découvrez ce que font la BCEAO, l’UEMOA, la BRVM, l’AMF-UMOA et UMOA-Titres, et ce que cela change pour votre argent.',
        )}
      </p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {INSTITUTIONS.map((i) => (
          <li key={i.id}>
            <Link
              href={`/finance/institutions#${i.id}`}
              className="inline-flex min-h-[44px] items-center rounded-lg border border-black/10 px-4 text-[14px] font-semibold text-[#111] hover:border-black/30"
            >
              {i.nom}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
