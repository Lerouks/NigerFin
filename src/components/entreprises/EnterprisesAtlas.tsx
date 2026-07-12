import {
  AGGREGATED_STATS,
  AGGREGATED_STATS_LAST_UPDATED,
  groupEnterprisesBySector,
  getSectorList,
  type StrategicEnterprise,
} from '@/lib/strategic-enterprises';
import { HeroAtlas } from './HeroAtlas';
import { StatsBand } from './StatsBand';
import { SectorTOC } from './SectorTOC';
import { FeaturedEnterprise } from './FeaturedEnterprise';
import { EnterpriseSectorBlock } from './EnterpriseSectorBlock';

interface EnterprisesAtlasProps {
  enterprises: StrategicEnterprise[];
  featured: StrategicEnterprise | null;
}

/**
 * Orchestrateur server-side de l'atlas /entreprises.
 * Compose hero + bandeau stats + sommaire sectoriel + vedette + sections par secteur.
 * Aucune logique cliente, tout est rendu server-side pour CLS=0 et SEO maximal.
 */
export function EnterprisesAtlas({ enterprises, featured }: EnterprisesAtlasProps) {
  // Les non-vedettes (les autres entreprises de l'atlas)
  const others = featured
    ? enterprises.filter((e) => e.id !== featured.id)
    : enterprises;

  // Sommaire = tous les secteurs presents dans others (la vedette a son propre bloc)
  const sectors = getSectorList(others);
  const grouped = groupEnterprisesBySector(others);

  // Calcul des rangs : vedette = 1, autres = 2..N selon ordre d'apparition
  let runningRank = 2;

  return (
    <div className="min-h-screen bg-background">
      <HeroAtlas
        eyebrow="Atlas économique du Niger"
        title="Les piliers de l'économie nigérienne"
        lead="Cartographie éditoriale des entreprises stratégiques qui structurent l'économie du Niger : mines, énergie, télécommunications, banque, agriculture. Données publiques, actualisées, sourcées."
      />

      <StatsBand
        stats={AGGREGATED_STATS}
        lastUpdated={AGGREGATED_STATS_LAST_UPDATED}
      />

      <SectorTOC sectors={sectors} />

      {/* Vedette */}
      {featured ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          <FeaturedEnterprise
            enterprise={featured}
            rank={1}
            sectorIndex={sectors.indexOf(featured.sector || 'Autres')}
          />
        </div>
      ) : null}

      {/* Sections par secteur */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14 md:pb-20">
        {grouped.map((group) => {
          const block = (
            <EnterpriseSectorBlock
              key={group.sector}
              sector={group.sector}
              enterprises={group.enterprises}
              startRank={runningRank}
            />
          );
          runningRank += group.enterprises.length;
          return block;
        })}
      </div>
    </div>
  );
}
