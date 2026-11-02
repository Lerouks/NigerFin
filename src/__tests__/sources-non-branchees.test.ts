import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase', () => ({
  createServerSupabaseClient: vi.fn(async () => null),
  createServiceClient: vi.fn(() => null),
}));

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

import * as Sentry from '@sentry/nextjs';
import { createServiceClient } from '@/lib/supabase';
import { BRVMScraperService, RAISON_BRVM_NON_BRANCHEE } from '@/lib/services/brvm-scraper-service';
import { SourceNonBranchee, estSourceNonBranchee } from '@/lib/services/source-non-branchee';
import { resumerSante, type EtatSource } from '@/lib/services/resume-sante';
import { construireMisesAJourMarche } from '@/lib/services/market-updates';
import { dataOrchestrator } from '@/lib/services/data-orchestrator';
import { GET as getHealth } from '@/app/api/health/route';

/**
 * SOURCES NON BRANCHÉES
 *
 * La BRVM ne répond plus depuis le 20 juillet 2026 (brvm.org/api/quotes : 404).
 * Jusqu'ici, la supervision la comptait comme une panne plusieurs fois par jour :
 * le site passait « dégradé » en permanence pour une cause connue, et l'alerte ne
 * voulait plus rien dire. Une source non branchée n'est désormais ni appelée,
 * ni comptée comme un échec, et ne produit toujours aucune valeur.
 */

const ok: EtatSource = { status: 'ok', responseTime: 120 };
const panne: EtatSource = { status: 'error', responseTime: 15000, error: 'timeout' };
const nonBranchee: EtatSource = { status: 'not_connected', responseTime: 0, reason: 'source morte' };

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Une source non branchée n\'est jamais appelée', () => {
  it('BRVM : indices et actions échouent sans réseau, sans cache, sans journal, sans Sentry', async () => {
    const reseau = vi.fn();
    vi.stubGlobal('fetch', reseau);
    const service = new BRVMScraperService();

    await expect(service.getIndices()).rejects.toBeInstanceOf(SourceNonBranchee);
    await expect(service.getStocks('BOAN')).rejects.toBeInstanceOf(SourceNonBranchee);

    expect(reseau).not.toHaveBeenCalled();
    // Aucun client Supabase créé : ni lecture du cache, ni ligne dans api_health_log.
    expect(createServiceClient).not.toHaveBeenCalled();
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it('l\'erreur porte la raison en clair, et se reconnaît même sans instanceof', async () => {
    const erreur = await new BRVMScraperService().getIndices().catch((e: unknown) => e);

    expect(estSourceNonBranchee(erreur)).toBe(true);
    expect((erreur as SourceNonBranchee).raison).toBe(RAISON_BRVM_NON_BRANCHEE);
    expect(RAISON_BRVM_NON_BRANCHEE).toMatch(/404/);

    const copie = Object.assign(new Error('copie'), { name: 'SourceNonBranchee', raison: 'x' });
    expect(estSourceNonBranchee(copie)).toBe(true);
    expect(estSourceNonBranchee(new Error('panne ordinaire'))).toBe(false);
  });
});

describe('Résumé de santé : une source non branchée est hors du compte', () => {
  it('« healthy » quand toutes les sources branchées répondent', () => {
    const resume = resumerSante({ frankfurter: ok, crypto: ok, brvm: nonBranchee });

    expect(resume).toEqual({ status: 'healthy', healthy: 2, total: 2, notConnected: 1, failed: [] });
  });

  it('« degraded » sur une vraie panne, et seulement elle est nommée', () => {
    const resume = resumerSante({ frankfurter: ok, crypto: panne, brvm: nonBranchee });

    expect(resume.status).toBe('degraded');
    expect(resume.failed).toEqual(['crypto']);
  });

  it('« down » quand plus aucune source branchée ne répond', () => {
    expect(resumerSante({ frankfurter: panne, brvm: nonBranchee }).status).toBe('down');
  });
});

describe('Contrôle de santé', () => {
  it('rend la BRVM « not_connected » avec sa raison, jamais « error »', async () => {
    // Réseau coupé pour toutes les sources : les sources branchées doivent
    // échouer pour de vrai, la BRVM ne doit même pas être tentée.
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('réseau coupé (test)')));

    const etats = await dataOrchestrator.healthCheck();

    expect(etats.brvm).toEqual({ status: 'not_connected', responseTime: 0, reason: RAISON_BRVM_NON_BRANCHEE });
    expect(etats.frankfurter?.status).toBe('error');
    expect(resumerSante(etats).failed).not.toContain('brvm');
  });
});

describe('/api/health', () => {
  const appel = (entetes?: Record<string, string>) =>
    getHealth(new NextRequest(new Request('http://localhost/api/health', { headers: entetes })));

  it('répond « healthy » au visiteur quand seules des sources non branchées manquent', async () => {
    vi.spyOn(dataOrchestrator, 'healthCheck').mockResolvedValue({ frankfurter: ok, brvm: nonBranchee });

    const corps = await (await appel()).json();

    expect(corps.status).toBe('healthy');
    expect(Sentry.captureMessage).not.toHaveBeenCalled();
  });

  it('répond « degraded » sur une vraie panne, et l\'alerte ne nomme qu\'elle', async () => {
    vi.stubEnv('CRON_SECRET', 'secret-de-test');
    vi.spyOn(dataOrchestrator, 'healthCheck').mockResolvedValue({ frankfurter: panne, crypto: ok, brvm: nonBranchee });

    const corps = await (await appel({ authorization: 'Bearer secret-de-test' })).json();

    expect(corps.status).toBe('degraded');
    expect(corps.summary).toMatchObject({ healthy: 1, total: 2, notConnected: 1 });
    expect(corps.services.brvm).toMatchObject({ status: 'not_connected', reason: 'source morte' });
    expect(Sentry.captureMessage).toHaveBeenCalledWith('API health degraded: frankfurter', 'warning');
    vi.unstubAllEnvs();
  });
});

describe('Mise à jour du marché', () => {
  it('BRVMC est laissé tel quel, ignoré et non compté en échec, sans alerte Sentry', () => {
    const vide = <T,>(data: T) => ({ status: 'fulfilled' as const, value: { data, source: 'api' as const } });

    const { updates, echecs, nonBranches } = construireMisesAJourMarche(
      {
        forex: vide({ rates: [] }),
        commodities: vide({ commodities: [], date: '' }),
        indices: vide({ quotes: [] }),
        crypto: vide({ prices: [] }),
        brvm: { status: 'rejected', reason: new SourceNonBranchee('brvm', RAISON_BRVM_NON_BRANCHEE) },
      } as never,
      'cron',
    );

    expect(updates).toEqual({});
    expect(echecs).toEqual([]);
    expect(nonBranches).toEqual([{ symbol: 'BRVMC', raison: RAISON_BRVM_NON_BRANCHEE }]);
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });
});
