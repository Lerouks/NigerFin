import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { typographieFr } from '@/lib/typographie-fr';

export interface AutreEntreprise {
  nom: string;
  slug: string;
  ligne: string | null;
  ville: string;
  annee: number | null;
  logo: string | null;
}

/**
 * Les autres entreprises au bas d'une fiche, en liste façon cotations : logo,
 * nom, ce que fait l'entreprise, ville et année. Une colonne sur téléphone,
 * deux sur tablette, trois sur ordinateur. Les filets intérieurs sont ceux
 * de chaque ligne ; ceux qui tomberaient sur le bord du cadre sont repoussés
 * dehors (marges négatives) et coupés par lui.
 */
export function AutresEntreprises({ entreprises }: { entreprises: AutreEntreprise[] }) {
  if (entreprises.length === 0) return null;
  return (
    <div className="mt-4 overflow-hidden rounded-[10px] border border-black/8 bg-white">
      <ul className="-mb-px -mr-px grid md:grid-cols-2 lg:grid-cols-3">
        {entreprises.map((e) => (
          <li key={e.slug} className="border-b border-r border-black/[0.07]">
            <Link
              href={`/entreprises/${e.slug}`}
              className="grid min-h-[72px] grid-cols-[64px_minmax(0,1fr)_16px] items-center gap-3.5 px-4 py-3 transition-colors hover:bg-black/[0.025] focus-visible:bg-black/[0.025] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#111]"
            >
              <span className="relative block h-10 w-16">
                {e.logo ? (
                  <Image src={e.logo} alt={`Logo ${e.nom}`} fill sizes="64px" className="object-contain" />
                ) : null}
              </span>
              {/* Ville et année sous la ligne : à droite, elles serraient le texte et
                  laissaient « Les parts » seul en fin de ligne sur téléphone. */}
              <span className="min-w-0">
                <span className="block text-[16px] font-bold leading-tight text-[#111]">{e.nom}</span>
                {e.ligne ? (
                  <span className="mt-0.5 block text-[14px] leading-snug text-gray-600">{typographieFr(e.ligne)}</span>
                ) : null}
                {e.ville || e.annee ? (
                  <span className="mt-1 block text-[13px] leading-snug text-gray-500">
                    {/* Le point reste collé à la ville : une ligne ne commence jamais par « · ». */}
                    <span className="whitespace-nowrap">
                      {e.ville}
                      {e.ville && e.annee ? ' ·' : null}
                    </span>
                    {e.annee ? ` depuis ${e.annee}` : null}
                  </span>
                ) : null}
              </span>
              <ChevronRight className="h-4 w-4 text-gray-400" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
