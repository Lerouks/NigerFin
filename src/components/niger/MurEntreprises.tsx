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
 * Classes de la dernière carte quand elle reste seule sur sa ligne (7
 * entreprises : 2 colonnes sur téléphone, 3 sur tablette). Elle prend alors
 * toute la ligne et passe en largeur : le logo à gauche, exactement de la
 * largeur d'une colonne du dessus, le texte à droite, aligné sur le texte de
 * la colonne voisine. Le mur ne finit plus sur une case vide.
 *
 * Largeur du logo = une colonne, moins un pixel de bordure :
 * (largeur de la carte - (colonnes - 1) × écart) / colonnes - 1 px, la carte
 * mesurant 100 % + ses deux bordures. Écarts : 10 px sur téléphone, 14 px
 * au-delà. Retrait du texte = écart + bordure + marge habituelle (14 ou
 * 18 px). Les noms de classes sont écrits en entier pour que Tailwind les voie.
 */
function classesDerniereCarte(nombre: number) {
  const seule = { telephone: nombre % 2 === 1, tablette: nombre % 3 === 1, ordinateur: nombre % 4 === 1 };
  const ligne = [
    seule.telephone ? 'col-span-2' : '',
    seule.tablette ? 'md:col-span-3' : 'md:col-span-1',
    seule.ordinateur ? 'lg:col-span-4' : 'lg:col-span-1',
  ];
  const carte = [
    seule.telephone ? 'flex-row' : 'flex-col',
    seule.tablette ? 'md:flex-row' : 'md:flex-col',
    seule.ordinateur ? 'lg:flex-row' : 'lg:flex-col',
  ];
  const logo = [
    seule.telephone
      ? 'min-h-[104px] w-[calc(50%_-_5px)] shrink-0 border-r sm:min-h-[150px] sm:w-[calc(50%_-_7px)]'
      : 'h-[104px] border-b sm:h-[150px]',
    seule.tablette
      ? 'md:h-auto md:min-h-[150px] md:w-[calc((100%_-_26px)/3_-_1px)] md:shrink-0 md:border-b-0 md:border-r'
      : 'md:h-[150px] md:w-auto md:border-b md:border-r-0',
    seule.ordinateur
      ? 'lg:h-auto lg:min-h-[150px] lg:w-[calc(25%_-_11px)] lg:shrink-0 lg:border-b-0 lg:border-r'
      : 'lg:h-[150px] lg:w-auto lg:border-b lg:border-r-0',
  ];
  const texte = [
    seule.telephone ? 'pl-[25px] sm:pl-[33px]' : 'pl-3.5 sm:pl-[18px]',
    seule.tablette ? 'md:pl-[33px]' : 'md:pl-[18px]',
    seule.ordinateur ? 'lg:pl-[33px]' : 'lg:pl-[18px]',
  ];
  return { ligne: ligne.join(' '), carte: carte.join(' '), logo: logo.join(' '), texte: texte.join(' ') };
}

const CARTE_EN_HAUTEUR = {
  ligne: '',
  carte: 'flex-col',
  logo: 'h-[104px] border-b sm:h-[150px]',
  texte: 'pl-3.5 sm:pl-[18px]',
};

/**
 * Le mur de logos de la page Niger (maquette B, 24/11/2026) : un grand logo,
 * ce que fait l'entreprise en une ligne, son secteur, sa ville et son année.
 * Chaque carte mène à la fiche. Deux colonnes sur téléphone, trois sur
 * tablette, quatre sur ordinateur.
 */
export function MurEntreprises({ entreprises }: { entreprises: EntrepriseDuMur[] }) {
  const derniere = classesDerniereCarte(entreprises.length);
  return (
    <ul className="mt-7 grid grid-cols-2 gap-2.5 sm:gap-3.5 md:grid-cols-3 lg:grid-cols-4">
      {entreprises.map((e, i) => {
        const forme = i === entreprises.length - 1 ? derniere : CARTE_EN_HAUTEUR;
        return (
          <li key={e.slug} className={forme.ligne || undefined}>
            <Link
              href={`/entreprises/${e.slug}`}
              className={`flex h-full ${forme.carte} overflow-hidden rounded-[14px] border border-black/[0.07] bg-white transition-[border-color,transform] duration-150 hover:-translate-y-0.5 hover:border-black/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111]`}
            >
              <span
                className={`flex items-center justify-center border-black/[0.06] px-4 sm:px-7 ${forme.logo}`}
              >
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
              <span
                className={`flex min-w-0 flex-1 flex-col gap-1 pb-3.5 pr-3.5 pt-3 sm:pb-[18px] sm:pr-[18px] sm:pt-4 ${forme.texte}`}
              >
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
        );
      })}
    </ul>
  );
}
