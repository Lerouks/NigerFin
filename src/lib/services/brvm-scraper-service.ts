import { BaseDataService } from './base-service';

export interface BRVMIndex {
  name: string;
  value: number;
  change: number;
  changePercent: number;
  date: string;
  volume?: number;
}

export interface BRVMStock {
  ticker: string;
  name: string;
  sector: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  date: string;
  country?: string;
}

export interface BRVMData {
  indices: BRVMIndex[];
  stocks: BRVMStock[];
  date: string;
}

/**
 * Convertit une valeur brute d'API en nombre exploitable, ou `null`.
 *
 * Renvoyer `null` plutot que `0` est le point important : `Number(x || 0)`
 * transforme une donnee ABSENTE en une donnee AFFIRMEE (« cote a 0 »), ce qui
 * est une fabrication. Ici, l'absence reste une absence, et l'appelant decide.
 */
function toFiniteNumber(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

// Pre-seeded BRVM data with major tickers, fetched from public API
const BRVM_TICKERS = [
  { ticker: 'BOAN', name: 'BOA Niger', sector: 'Finance', country: 'Niger' },
  { ticker: 'BOAB', name: 'BOA Bénin', sector: 'Finance', country: 'Bénin' },
  { ticker: 'BOABF', name: 'BOA Burkina Faso', sector: 'Finance', country: 'Burkina Faso' },
  { ticker: 'BOAC', name: 'BOA Côte d\'Ivoire', sector: 'Finance', country: 'Côte d\'Ivoire' },
  { ticker: 'BOAM', name: 'BOA Mali', sector: 'Finance', country: 'Mali' },
  { ticker: 'BOAS', name: 'BOA Sénégal', sector: 'Finance', country: 'Sénégal' },
  { ticker: 'SGBC', name: 'Société Générale CI', sector: 'Finance', country: 'Côte d\'Ivoire' },
  { ticker: 'BICC', name: 'BICICI', sector: 'Finance', country: 'Côte d\'Ivoire' },
  { ticker: 'ECOC', name: 'Ecobank CI', sector: 'Finance', country: 'Côte d\'Ivoire' },
  { ticker: 'ETIT', name: 'Ecobank Transnational', sector: 'Finance', country: 'Togo' },
  { ticker: 'NSBC', name: 'NSIA Banque CI', sector: 'Finance', country: 'Côte d\'Ivoire' },
  { ticker: 'CBIBF', name: 'Coris Bank International', sector: 'Finance', country: 'Burkina Faso' },
  { ticker: 'SIBC', name: 'SIB', sector: 'Finance', country: 'Côte d\'Ivoire' },
  { ticker: 'ONTBF', name: 'Onatel', sector: 'Télécom', country: 'Burkina Faso' },
  { ticker: 'SNTS', name: 'Sonatel', sector: 'Télécom', country: 'Sénégal' },
  { ticker: 'ORGT', name: 'Oragroup', sector: 'Finance', country: 'Togo' },
  { ticker: 'SDCC', name: 'SODECI', sector: 'Services publics', country: 'Côte d\'Ivoire' },
  { ticker: 'CIEC', name: 'CIE', sector: 'Services publics', country: 'Côte d\'Ivoire' },
  { ticker: 'TTLC', name: 'TotalEnergies CI', sector: 'Énergie', country: 'Côte d\'Ivoire' },
  { ticker: 'TTLS', name: 'TotalEnergies Sénégal', sector: 'Énergie', country: 'Sénégal' },
  { ticker: 'SLBC', name: 'Solibra', sector: 'Industrie', country: 'Côte d\'Ivoire' },
  { ticker: 'SMBC', name: 'SMB', sector: 'Industrie', country: 'Côte d\'Ivoire' },
  { ticker: 'PALC', name: 'Palm CI', sector: 'Agriculture', country: 'Côte d\'Ivoire' },
  { ticker: 'SIVC', name: 'Air Liquide CI', sector: 'Industrie', country: 'Côte d\'Ivoire' },
  { ticker: 'CABC', name: 'Sicable', sector: 'Industrie', country: 'Côte d\'Ivoire' },
  { ticker: 'FTSC', name: 'Filtisac', sector: 'Industrie', country: 'Côte d\'Ivoire' },
  { ticker: 'NEIC', name: 'NEI-CEDA', sector: 'Édition', country: 'Côte d\'Ivoire' },
  // NOTE : une entree « SEMC » portant elle aussi le nom « SAFCA » figurait ici,
  // en doublon de la ligne SAFC ci-dessous. SAFC est le code BRVM documente de
  // SAFCA ; l'entite reelle derriere SEMC n'a pas pu etre attestee, donc la ligne
  // a ete retiree plutot que de lui inventer une raison sociale. A reintroduire
  // si la liste officielle BRVM la confirme, avec son vrai nom.
  { ticker: 'PRSC', name: 'Tractafric Motors CI', sector: 'Distribution', country: 'Côte d\'Ivoire' },
  { ticker: 'UNXC', name: 'Uniwax', sector: 'Industrie', country: 'Côte d\'Ivoire' },
  { ticker: 'NTLC', name: 'Nestlé CI', sector: 'Agroalimentaire', country: 'Côte d\'Ivoire' },
  { ticker: 'APTS', name: 'Atos Sénégal', sector: 'Technologie', country: 'Sénégal' },
  { ticker: 'SHEC', name: 'Vivo Energy CI', sector: 'Énergie', country: 'Côte d\'Ivoire' },
  { ticker: 'SAFC', name: 'SAFCA', sector: 'Finance', country: 'Côte d\'Ivoire' },
  { ticker: 'TTRC', name: 'SITAB', sector: 'Industrie', country: 'Côte d\'Ivoire' },
  { ticker: 'UNLC', name: 'Unilever CI', sector: 'Consommation', country: 'Côte d\'Ivoire' },
  { ticker: 'STBC', name: 'Setao', sector: 'BTP', country: 'Côte d\'Ivoire' },
  { ticker: 'SCRC', name: 'Sucrivoire', sector: 'Agroalimentaire', country: 'Côte d\'Ivoire' },
  { ticker: 'SOGC', name: 'Sogepie', sector: 'Immobilier', country: 'Côte d\'Ivoire' },
  { ticker: 'CFAC', name: 'CFAO Motors CI', sector: 'Distribution', country: 'Côte d\'Ivoire' },
  { ticker: 'BNBC', name: 'Bernabé CI', sector: 'Distribution', country: 'Côte d\'Ivoire' },
  { ticker: 'SVOC', name: 'Movis', sector: 'Distribution', country: 'Côte d\'Ivoire' },
  { ticker: 'ORBC', name: 'Orbcomm CI', sector: 'Télécom', country: 'Côte d\'Ivoire' },
  { ticker: 'SDSC', name: 'Bolloré Transport CI', sector: 'Transport', country: 'Côte d\'Ivoire' },
  { ticker: 'SPHC', name: 'SAPH', sector: 'Agriculture', country: 'Côte d\'Ivoire' },
];

export class BRVMScraperService extends BaseDataService {
  protected source = 'brvm';
  protected defaultTTLSeconds = 1800; // 30 min

  async fetch(): Promise<BRVMData> {
    // ATTENTION : `https://www.brvm.org/api/quotes` repond 404 depuis un moment.
    // Ce service n'a donc aujourd'hui AUCUNE source vivante. Il echoue, et c'est
    // le comportement voulu : tant qu'une vraie source BRVM n'est pas branchee,
    // NFI Report ne publie pas de cotation BRVM. Ne jamais reintroduire ici de
    // valeur de repli : un indice de la place boursiere de reference de l'UEMOA
    // invente est la pire faute que ce site puisse commettre.
    let res: Response;
    try {
      res = await fetch('https://www.brvm.org/api/quotes', {
        signal: AbortSignal.timeout(15000),
        headers: { 'Accept': 'application/json' },
      });
    } catch (err) {
      throw new Error(
        `Source BRVM injoignable (brvm.org/api/quotes) : ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    if (!res.ok) {
      throw new Error(`Source BRVM indisponible (brvm.org/api/quotes a repondu ${res.status})`);
    }

    return this.parseAPIResponse(await res.json());
  }

  private parseAPIResponse(json: unknown): BRVMData {
    const data = json as Record<string, unknown>;
    const rawStocks = (data.stocks || data.quotes || data.data || []) as Array<Record<string, unknown>>;

    // Un titre sans prix exploitable est ECARTE, jamais ramene a 0 : afficher
    // « 0 FCFA » reviendrait a affirmer une faillite totale de la societe.
    const stocks: BRVMStock[] = rawStocks.flatMap((s) => {
      const ticker = (s.ticker || s.symbol || s.code || '') as string;
      const meta = BRVM_TICKERS.find((t) => t.ticker === ticker);
      const price = toFiniteNumber(s.price ?? s.last ?? s.close);
      if (!ticker || price === null) return [];
      return [{
        ticker,
        name: (s.name || meta?.name || ticker) as string,
        sector: (s.sector || meta?.sector || 'Autre') as string,
        price,
        change: toFiniteNumber(s.change ?? s.variation) ?? 0,
        changePercent: toFiniteNumber(s.changePercent ?? s.variationPercent) ?? 0,
        volume: toFiniteNumber(s.volume) ?? 0,
        marketCap: toFiniteNumber(s.marketCap) ?? undefined,
        date: (s.date || new Date().toISOString()) as string,
        country: meta?.country,
      }];
    });

    // Meme regle pour les indices : un indice sans valeur chiffree est ecarte.
    const rawIndices = (data.indices || []) as Array<Record<string, unknown>>;
    const indices: BRVMIndex[] = rawIndices.flatMap((idx) => {
      const name = (idx.name || '') as string;
      const value = toFiniteNumber(idx.value ?? idx.close);
      if (!name || value === null) return [];
      return [{
        name,
        value,
        change: toFiniteNumber(idx.change) ?? 0,
        changePercent: toFiniteNumber(idx.changePercent) ?? 0,
        date: (idx.date || new Date().toISOString()) as string,
        volume: toFiniteNumber(idx.volume) ?? undefined,
      }];
    });

    // On ne « garantit » PAS la presence du Composite et du BRVM 30 en les
    // inventant : si la source ne les cote pas, ils sont absents, point.
    // Une reponse qui ne contient aucun indice exploitable est une panne.
    if (indices.length === 0) {
      throw new Error('Reponse BRVM sans aucun indice exploitable');
    }

    return { indices, stocks, date: new Date().toISOString() };
  }

  async getIndices() {
    return this.getOrFetch('brvm_indices', async () => {
      const data = await this.fetch();
      return data.indices;
    });
  }

  async getStocks(ticker?: string) {
    const result = await this.getOrFetch('brvm_stocks', async () => {
      const data = await this.fetch();
      return data.stocks;
    });

    if (ticker) {
      const upperTicker = ticker.toUpperCase();
      return {
        ...result,
        data: result.data.filter((s) => s.ticker === upperTicker),
      };
    }
    return result;
  }
}

export const brvmScraperService = new BRVMScraperService();
