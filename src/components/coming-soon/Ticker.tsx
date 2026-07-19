/**
 * Bandeau défilant façon fil d'actualité financière, en bas de page.
 * Deux copies identiques + translation continue = défilement sans couture.
 * Contenu réel (rubriques + repères macro sourcés INS 2025), aucune donnée inventée.
 */
const ITEMS = [
  'Économie',
  'Marchés BRVM',
  'Croissance +6,9 % en 2025',
  'Entreprises',
  'Finance',
  'PIB 18,8 Mds USD',
  'Niger',
  "Afrique de l'Ouest",
  'Investissement',
];

function Row() {
  return (
    <ul className="flex shrink-0 items-center">
      {ITEMS.map((t, i) => (
        <li key={i} className="flex items-center">
          <span className="mx-6 inline-block h-[3px] w-[3px] rounded-full bg-gold" aria-hidden="true" />
          <span className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.2em] text-[#16130d]/50">
            {t}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function Ticker() {
  return (
    <div
      className="nfi-fade w-full overflow-hidden py-3.5"
      style={{ animationDelay: '1.7s', backgroundColor: '#efece1' }}
      aria-hidden="true"
    >
      <div className="flex w-max nfi-marquee">
        <Row />
        <Row />
      </div>
    </div>
  );
}
