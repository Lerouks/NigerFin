import Image from 'next/image';
import Link from 'next/link';
import { typographieFr } from '@/lib/typographie-fr';

export interface EntrepriseDuMur {
  nom: string;
  slug: string;
  secteur: string;
  ville: string;
  annee: number | null;
  ligne: string | null;
  logo: string | null;
}

/**
 * Le mur de logos de la page Niger (maquette B, 24/11/2026) : un grand logo,
 * ce que fait l'entreprise en une ligne, son secteur, sa ville et son année.
 * Chaque carte mène à la fiche. Deux colonnes sur téléphone, trois sur
 * tablette, quatre sur ordinateur.
 */
export function MurEntreprises({ entreprises }: { entreprises: EntrepriseDuMur[] }) {
  return (
    <ul className="mt-7 grid grid-cols-2 gap-2.5 sm:gap-3.5 md:grid-cols-3 lg:grid-cols-4">
      {entreprises.map((e) => (
        <li key={e.slug}>
          <Link
            href={`/entreprises/${e.slug}`}
            className="flex h-full flex-col overflow-hidden rounded-[14px] border border-black/[0.07] bg-white transition-[border-color,transform] duration-150 hover:-translate-y-0.5 hover:border-black/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111]"
          >
            <span className="flex h-[104px] items-center justify-center border-b border-black/[0.06] px-4 sm:h-[150px] sm:px-7">
              {e.logo ? (
                <span className="relative block h-[54px] w-[78%] sm:h-[78px] sm:w-[72%]">
                  <Image
                    src={e.logo}
                    alt={`Logo ${e.nom}`}
                    fill
                    sizes="(max-width: 640px) 40vw, 260px"
                    className="object-contain"
                  />
                </span>
              ) : (
                <span aria-hidden="true" className="text-[22px] font-bold text-gray-300">
                  {e.nom}
                </span>
              )}
            </span>
            <span className="flex flex-1 flex-col gap-1 px-3.5 pb-3.5 pt-3 sm:px-[18px] sm:pb-[18px] sm:pt-4">
              <span className="text-[15px] font-bold leading-tight tracking-[-0.01em] sm:text-[16px]">{e.nom}</span>
              {e.ligne ? (
                <span className="text-[13px] leading-snug text-gray-700 sm:text-[14px]">
                  {/* Ligne courte dans une carte étroite : seuls les petits mots sont
                      soudés, sinon la ligne entière déborde sur téléphone. */}
                  {typographieFr(e.ligne)}
                </span>
              ) : null}
              <span className="mt-auto flex flex-col gap-0.5 pt-3 text-[12px] text-gray-500 sm:flex-row sm:justify-between sm:text-[12.5px]">
                <span>
                  {/* Le point reste collé au secteur : une ligne ne commence jamais par « · ». */}
                  <span className="whitespace-nowrap">
                    {e.secteur}
                    {e.secteur && e.ville ? ' ·' : null}
                  </span>
                  {e.ville ? (
                    <>
                      {' '}
                      <b className="font-semibold text-[#111]">{e.ville}</b>
                    </>
                  ) : null}
                </span>
                {e.annee ? <span>depuis {e.annee}</span> : null}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
