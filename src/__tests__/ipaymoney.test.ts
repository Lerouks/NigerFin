import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  verifyIPayPayment,
  isIPaySucceeded,
  isIPayFailed,
  getIPayEnvironment,
} from '@/lib/ipaymoney';

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn(), captureMessage: vi.fn() }));

// Signature explicite : sans elle, vitest type les appels enregistres comme un
// tuple vide et `const [url, opts] = ...calls[0]` ne compile pas. C'est ce qui
// mettait « npm run build » et toute l'integration continue au rouge, donc ce
// qui empechait la moindre mise a jour de securite d'etre fusionnee.
type AppelFetch = [url: string, opts: {
  method?: string;
  cache?: string;
  headers: Record<string, string>;
  body?: string;
}];
const mockFetch = vi.fn<(...args: AppelFetch) => Promise<unknown>>();

/** Rend l'appel demande, ou echoue avec un message lisible plutot qu'un « undefined ». */
function appelFetch(index: number): AppelFetch {
  const appel = mockFetch.mock.calls[index];
  if (!appel) throw new Error(`fetch n'a pas ete appele une ${index + 1}e fois`);
  return appel;
}

function okJson(payload: unknown) {
  return { ok: true, status: 200, json: async () => payload };
}
function httpError(status: number) {
  return { ok: false, status, json: async () => ({}) };
}

describe('ipaymoney helpers', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
    process.env.IPAYMONEY_SECRET_KEY = 'sk_test_secret';
    process.env.NEXT_PUBLIC_IPAYMONEY_ENV = 'sandbox';
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('isIPaySucceeded / isIPayFailed', () => {
    it('reconnaît les statuts de succès', () => {
      for (const s of ['succeeded', 'success', 'completed']) expect(isIPaySucceeded(s)).toBe(true);
      for (const s of ['pending', 'failed', undefined, null, '']) expect(isIPaySucceeded(s)).toBe(false);
    });
    it('reconnaît les statuts d\'échec', () => {
      for (const s of ['failed', 'cancelled', 'canceled', 'declined', 'error']) expect(isIPayFailed(s)).toBe(true);
      for (const s of ['succeeded', 'pending', undefined, null]) expect(isIPayFailed(s)).toBe(false);
    });
  });

  describe('getIPayEnvironment', () => {
    it('défaut sandbox, live seulement si explicitement configuré', () => {
      process.env.NEXT_PUBLIC_IPAYMONEY_ENV = 'live';
      expect(getIPayEnvironment()).toBe('live');
      process.env.NEXT_PUBLIC_IPAYMONEY_ENV = 'sandbox';
      expect(getIPayEnvironment()).toBe('sandbox');
      delete process.env.NEXT_PUBLIC_IPAYMONEY_ENV;
      expect(getIPayEnvironment()).toBe('sandbox');
    });
  });

  describe('verifyIPayPayment', () => {
    it('construit correctement la requête et renvoie le statut (mobile, succès)', async () => {
      mockFetch.mockResolvedValueOnce(
        okJson({ external_reference: 'NFI-1', reference: 'abc', status: 'succeeded', msisdn: '22790000000' }),
      );
      const res = await verifyIPayPayment('abc');
      expect(res?.status).toBe('succeeded');
      expect(res?.external_reference).toBe('NFI-1');
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, opts] = appelFetch(0);
      expect(url).toBe('https://i-pay.money/api/v1/payments/abc');
      expect(opts.method).toBe('GET');
      expect(opts.headers.Authorization).toBe('Bearer sk_test_secret');
      expect(opts.headers['Ipay-Payment-Type']).toBe('mobile');
      expect(opts.headers['Ipay-Target-Environment']).toBe('sandbox');
      expect(opts.cache).toBe('no-store');
    });

    it('bascule sur card si mobile renvoie 404', async () => {
      mockFetch
        .mockResolvedValueOnce(httpError(404)) // mobile
        .mockResolvedValueOnce(okJson({ external_reference: 'NFI-1', reference: 'abc', status: 'succeeded' })); // card
      const res = await verifyIPayPayment('abc');
      expect(res?.status).toBe('succeeded');
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(appelFetch(1)[1].headers['Ipay-Payment-Type']).toBe('card');
    });

    it('renvoie null si la clé secrète est absente (sans appeler fetch)', async () => {
      delete process.env.IPAYMONEY_SECRET_KEY;
      const res = await verifyIPayPayment('abc');
      expect(res).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('renvoie null si les deux environnements répondent en erreur (5xx)', async () => {
      mockFetch.mockResolvedValue(httpError(500));
      const res = await verifyIPayPayment('abc');
      expect(res).toBeNull();
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('renvoie null si la réponse n\'est pas au format attendu', async () => {
      mockFetch.mockResolvedValue(okJson('ceci-nest-pas-un-objet'));
      const res = await verifyIPayPayment('abc');
      expect(res).toBeNull();
    });

    it('renvoie null si le réseau échoue / timeout (fetch rejette)', async () => {
      mockFetch.mockRejectedValue(new Error('timeout'));
      const res = await verifyIPayPayment('abc');
      expect(res).toBeNull();
    });

    it('renvoie null pour une reference vide', async () => {
      const res = await verifyIPayPayment('');
      expect(res).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });
});
