'use client';

import { Fragment, useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent as ClavierReact } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { ArticleCard } from '@/components/ArticleCard';
import type { Article } from '@/types';
import {
  CHOIX_PAR_DEFAUT,
  choixProposes,
  filtrerArticles,
  libelleAfficher,
  libelleNombre,
  morceauxDuResume,
  nombreDeChoixActifs,
  type ChoixArticles,
  type Facette,
  type OptionChoix,
} from '@/lib/filtres-articles';

/**
 * Liste des articles d'une rubrique, avec sa barre « Trier et filtrer ».
 *
 * Refaite le 25/11/2026 (maquette B « Un seul bouton », choisie par Raouf parmi
 * trois) : l'ancien panneau de filtres collé à gauche, avec ses intitulés en
 * capitales espacées et une icône par choix, laisse la place à une ligne
 * discrète. Le nombre d'articles à gauche, un bouton à droite qui ouvre un
 * panneau : une fenêtre posée en bas de l'écran sur téléphone, un panneau sous
 * le bouton à partir de la tablette. Même contenu sur tous les écrans.
 *
 * Le panneau ne propose que les choix qui changent vraiment la liste
 * (`choixProposes`) : sans article Premium dans la rubrique, pas de « Premium »,
 * et ainsi de suite. Quand il ne reste que le tri, le bouton s'appelle « Trier ».
 */

const PER_PAGE = 18;
const AUCUNE_FACETTE: Facette[] = [];
const AUCUN_CLASSEMENT: string[] = [];
const TELEPHONE = '(max-width: 639px)';
const NBSP = '\u00a0';

/**
 * Facette thématique optionnelle : restreint la liste aux articles portant une
 * clé de section donnée. Sert à accueillir dans Finance les articles de
 * l'ancienne rubrique Marchés sans les y noyer. Passée en DONNÉES et non en
 * fonction, pour rester sérialisable depuis un composant serveur.
 */
export type SectionFacet = Facette;

interface SectionArticlesFilteredProps {
  articles: Article[];
  total: number;
  sectionLabel: string;
  sectionPath: string;
  /** Article IDs ordered by view count (most viewed first). Never exposed to user. */
  viewRanking?: string[];
  /** Facettes thématiques proposées en plus des choix habituels. */
  facets?: SectionFacet[];
}

/** Un groupe de choix exclusifs, en segments (flèches du clavier pour passer d'un choix à l'autre). */
function GroupeDeChoix<T extends string | null>({
  titre,
  options,
  valeur,
  onChoix,
  colonnes,
}: {
  titre: string;
  options: OptionChoix<T>[];
  valeur: T;
  onChoix: (v: T) => void;
  colonnes: string;
}) {
  const id = useId();
  const boutons = useRef<(HTMLButtonElement | null)[]>([]);
  const coche = Math.max(0, options.findIndex((o) => o.valeur === valeur));

  const deplacer = (e: ClavierReact<HTMLButtonElement>, i: number) => {
    let j = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % options.length;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + options.length) % options.length;
    if (e.key === 'Home') j = 0;
    if (e.key === 'End') j = options.length - 1;
    const cible = options[j];
    if (!cible) return;
    e.preventDefault();
    onChoix(cible.valeur);
    boutons.current[j]?.focus();
  };

  return (
    <div>
      <p id={id} className="mb-2 text-[13px] font-medium text-gray-500">
        {titre}
      </p>
      <div role="radiogroup" aria-labelledby={id} className={`grid ${colonnes} gap-1 rounded-lg bg-black/[0.045] p-1`}>
        {options.map((o, i) => {
          const actif = i === coche;
          return (
            <button
              key={String(o.valeur)}
              ref={(el) => {
                boutons.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={actif}
              tabIndex={actif ? 0 : -1}
              onClick={() => onChoix(o.valeur)}
              onKeyDown={(e) => deplacer(e, i)}
              className={`min-h-11 rounded-md px-2 text-[13px] leading-tight transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#111] ${
                actif
                  ? 'bg-white font-semibold text-[#111] shadow-[0_1px_3px_rgba(0,0,0,0.12)]'
                  : 'font-medium text-gray-600 hover:text-[#111]'
              }`}
            >
              {o.libelle}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SectionArticlesFiltered({
  articles,
  total: _total,
  sectionLabel: _sectionLabel,
  viewRanking = AUCUN_CLASSEMENT,
  facets = AUCUNE_FACETTE,
}: SectionArticlesFilteredProps) {
  const [choix, setChoix] = useState<ChoixArticles>(CHOIX_PAR_DEFAUT);
  const [currentPage, setCurrentPage] = useState(1);
  const [ouvert, setOuvert] = useState(false);
  const racine = useRef<HTMLDivElement>(null);
  const bouton = useRef<HTMLButtonElement>(null);
  const panneau = useRef<HTMLDivElement>(null);
  const idPanneau = useId();

  const proposes = useMemo(() => choixProposes(articles, facets, viewRanking), [articles, facets, viewRanking]);
  const filtered = useMemo(() => filtrerArticles(articles, choix, viewRanking), [articles, choix, viewRanking]);
  const actifs = nombreDeChoixActifs(choix);
  const filtre = actifs > 0;
  const resume = morceauxDuResume(choix, facets);
  const seulementTri = proposes.themes.length === 0 && proposes.acces.length === 0 && proposes.durees.length === 0;
  const aDesChoix = proposes.tris.length > 0 || !seulementTri;
  const titre = seulementTri ? 'Trier' : 'Trier et filtrer';

  const changer = <K extends keyof ChoixArticles>(cle: K, valeur: ChoixArticles[K]) => {
    setChoix((c) => ({ ...c, [cle]: valeur }));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setChoix(CHOIX_PAR_DEFAUT);
    setCurrentPage(1);
  };

  const fermer = useCallback((rendreLaMain = true) => {
    setOuvert(false);
    if (rendreLaMain) bouton.current?.focus();
  }, []);

  // Échap ferme ; un clic hors du panneau le ferme à partir de la tablette ;
  // sur téléphone, la page ne défile plus sous la fenêtre.
  useEffect(() => {
    if (!ouvert) return;
    const telephone = window.matchMedia(TELEPHONE).matches;
    const echap = (e: KeyboardEvent) => {
      if (e.key === 'Escape') fermer();
    };
    const dehors = (e: PointerEvent) => {
      if (!window.matchMedia(TELEPHONE).matches && !racine.current?.contains(e.target as Node)) fermer(false);
    };
    document.addEventListener('keydown', echap);
    document.addEventListener('pointerdown', dehors);
    panneau.current?.focus({ preventScroll: true });
    const defilementAvant = document.documentElement.style.overflow;
    if (telephone) document.documentElement.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', echap);
      document.removeEventListener('pointerdown', dehors);
      if (telephone) document.documentElement.style.overflow = defilementAvant;
    };
  }, [ouvert, fermer]);

  // Sur téléphone, la fenêtre est modale : la touche Tab y reste.
  const garderLeFocus = (e: ClavierReact<HTMLDivElement>) => {
    if (e.key !== 'Tab' || !window.matchMedia(TELEPHONE).matches) return;
    const elements = Array.from(
      panneau.current?.querySelectorAll<HTMLElement>('button:not([disabled]):not([tabindex="-1"])') ?? [],
    );
    const premier = elements[0];
    const dernier = elements[elements.length - 1];
    if (!premier || !dernier) return;
    const ici = document.activeElement;
    if (e.shiftKey && (ici === premier || ici === panneau.current)) {
      e.preventDefault();
      dernier.focus();
    } else if (!e.shiftKey && ici === dernier) {
      e.preventDefault();
      premier.focus();
    }
  };

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const safePage = Math.min(currentPage, Math.max(1, totalPages));
  const paginatedArticles = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPageNumbers = (): (number | 'ellipsis')[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | 'ellipsis')[] = [1];
    if (safePage > 3) pages.push('ellipsis');
    const start = Math.max(2, safePage - 1);
    const end = Math.min(totalPages - 1, safePage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (safePage < totalPages - 2) pages.push('ellipsis');
    pages.push(totalPages);
    return pages;
  };

  if (articles.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 text-lg mb-2">Aucun article dans cette rubrique pour l’instant.</p>
        <p className="text-gray-500 text-sm">De nouveaux contenus arrivent bientôt.</p>
      </div>
    );
  }

  return (
    <div>
      <div ref={racine} className="relative border-b border-black/10 pb-4">
        <div className="flex items-center justify-between gap-4">
          <p className="min-w-0 text-[14px] font-semibold text-[#111]" aria-live="polite">
            {libelleNombre(filtered.length, articles.length)}
          </p>

          {aDesChoix && (
            <button
              ref={bouton}
              type="button"
              aria-haspopup="dialog"
              aria-expanded={ouvert}
              aria-controls={ouvert ? idPanneau : undefined}
              onClick={() => (ouvert ? fermer() : setOuvert(true))}
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-lg border border-black/12 bg-white px-4 text-[14px] font-semibold text-[#111] transition-colors hover:border-black/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111]"
            >
              {titre}
              {filtre ? `${NBSP}(${actifs})` : ''}
              <ChevronDown
                className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${ouvert ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>
          )}
        </div>

        {/* Ce qui est appliqué, sur sa propre ligne : les deux derniers choix restent ensemble. */}
        {resume.length > 0 && (
          <p className="mt-1 text-[14px] text-gray-500">
            {resume.slice(0, -2).map((m) => (
              <Fragment key={m}>
                <span className="whitespace-nowrap">{m},</span>{' '}
              </Fragment>
            ))}
            <span className="whitespace-nowrap">{resume.slice(-2).join(', ')}</span>
          </p>
        )}

        {ouvert && (
          <>
            {/* Fond assombri, sur téléphone seulement : le toucher ferme la fenêtre. */}
            <button
              type="button"
              aria-label="Fermer"
              tabIndex={-1}
              onClick={() => fermer()}
              className="fixed inset-0 z-50 cursor-default bg-black/35 sm:hidden"
            />
            <div
              ref={panneau}
              id={idPanneau}
              role="dialog"
              aria-label={titre}
              tabIndex={-1}
              onKeyDown={garderLeFocus}
              className="fixed inset-x-0 bottom-0 z-50 max-h-[88vh] overflow-y-auto overscroll-contain rounded-t-2xl bg-white shadow-[0_-12px_40px_rgba(0,0,0,0.14)] animate-slide-up focus:outline-none sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-full sm:z-[46] sm:mt-2 sm:w-[25rem] sm:max-h-none sm:overflow-visible sm:rounded-xl sm:border sm:border-black/6 sm:shadow-[0_18px_40px_rgba(0,0,0,0.08)] sm:animate-[fadeIn_120ms_ease-out]"
            >
              <div className="flex items-center justify-between border-b border-black/6 py-1.5 pl-5 pr-2">
                <p className="text-[16px] font-semibold text-[#111]">{titre}</p>
                <div className="flex items-center">
                  {filtre && (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="h-11 px-3 text-[13px] font-semibold text-gray-600 transition-colors hover:text-[#111]"
                    >
                      Tout effacer
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label="Fermer"
                    onClick={() => fermer()}
                    className="flex h-11 w-11 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-black/[0.04] hover:text-[#111]"
                  >
                    <X className="w-[18px] h-[18px]" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="space-y-5 px-5 py-5">
                {proposes.themes.length > 0 && (
                  <GroupeDeChoix
                    titre="Thème"
                    options={proposes.themes}
                    valeur={choix.theme}
                    onChoix={(v) => changer('theme', v)}
                    colonnes="grid-cols-2"
                  />
                )}
                {proposes.tris.length > 0 && (
                  <GroupeDeChoix
                    titre="Trier par"
                    options={proposes.tris}
                    valeur={choix.tri}
                    onChoix={(v) => changer('tri', v)}
                    colonnes={proposes.tris.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}
                  />
                )}
                {proposes.acces.length > 0 && (
                  <GroupeDeChoix
                    titre="Type d’article"
                    options={proposes.acces}
                    valeur={choix.acces}
                    onChoix={(v) => changer('acces', v)}
                    colonnes="grid-cols-3"
                  />
                )}
                {proposes.durees.length > 0 && (
                  <GroupeDeChoix
                    titre="Durée de lecture"
                    options={proposes.durees}
                    valeur={choix.duree}
                    onChoix={(v) => changer('duree', v)}
                    colonnes="grid-cols-2"
                  />
                )}
              </div>

              <div className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                <button
                  type="button"
                  disabled={filtered.length === 0}
                  onClick={() => fermer()}
                  className="h-12 w-full rounded-lg bg-[#111] text-[15px] font-semibold text-white transition-colors hover:bg-[#333] disabled:bg-black/20"
                >
                  {libelleAfficher(filtered.length)}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="mt-8 md:mt-10">
        {filtered.length === 0 ? (
          <div className="py-16">
            <p className="text-[17px] font-semibold text-[#111]">Aucun article ne correspond à ces choix.</p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-2 min-h-11 text-[14px] font-semibold text-gray-600 underline decoration-black/25 underline-offset-4 transition-colors hover:text-[#111] hover:decoration-black"
            >
              Revenir à tous les articles
            </button>
          </div>
        ) : (
          <div
            className={`grid gap-6 stagger-grid ${
              paginatedArticles.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            }`}
          >
            {paginatedArticles.map((article) => (
              <ArticleCard key={article._id} article={article} featured={paginatedArticles.length === 1} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <nav className="mt-10 flex items-center justify-center" aria-label="Pagination">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => goToPage(safePage - 1)}
                disabled={safePage <= 1}
                aria-label="Page précédente"
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-[13px] font-medium text-gray-500 hover:bg-[#111] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-500 transition-all min-w-[44px] min-h-[44px] justify-center"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Précédent</span>
              </button>

              {getPageNumbers().map((page, i) =>
                page === 'ellipsis' ? (
                  <span key={`ellipsis-${i}`} className="px-2 text-gray-500 text-[13px]">
                    …
                  </span>
                ) : (
                  <button
                    type="button"
                    key={page}
                    onClick={() => goToPage(page)}
                    aria-label={`Page ${page}`}
                    aria-current={page === safePage ? 'page' : undefined}
                    className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-[13px] font-medium transition-all ${
                      page === safePage ? 'bg-[#111] text-white' : 'text-gray-500 hover:bg-secondary hover:text-gray-700'
                    }`}
                  >
                    {page}
                  </button>
                ),
              )}

              <button
                type="button"
                onClick={() => goToPage(safePage + 1)}
                disabled={safePage >= totalPages}
                aria-label="Page suivante"
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-[13px] font-medium text-gray-500 hover:bg-[#111] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-500 transition-all min-w-[44px] min-h-[44px] justify-center"
              >
                <span className="hidden sm:inline">Suivant</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}
