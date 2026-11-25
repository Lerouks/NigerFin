/**
 * Shared pagination utilities for API routes.
 */

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/** Numéro de page lu dans l'adresse : 1 par défaut, jamais moins de 1 (« abc », 0 et -1 donnent 1). */
export function numeroDePage(valeur: string | null): number {
  return Math.max(1, parseInt(valeur || '1', 10) || 1);
}

/**
 * Une page au-delà de la fin : quand le total est demandé, la base la refuse
 * (HTTP 416, code PGRST103, vérifié le 25/11/2026). C'est une page vide, pas
 * une panne : la route doit répondre une liste vide, pas une erreur 500.
 */
export function estPageAuDela(erreur: { code?: string } | null | undefined): boolean {
  return erreur?.code === 'PGRST103';
}

/** Parse page/limit from URL search params with safe defaults */
export function parsePagination(searchParams: URLSearchParams): PaginationParams {
  const page = numeroDePage(searchParams.get('page'));
  const rawLimit = parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT;
  const limit = Math.min(Math.max(1, rawLimit), MAX_LIMIT);
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/** Build a paginated response envelope */
export function paginatedResponse<T>(data: T[], total: number, params: PaginationParams): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / params.limit);
  return {
    data,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
      hasMore: params.page < totalPages,
    },
  };
}
