/**
 * Unified Financial Data API Route
 *
 * RULE 1: Single source — all financial data requests go through this endpoint.
 * Replaces the scattered /api/economy/commodities, /api/markets/indices,
 * /api/markets/crypto, /api/markets/forex, and /api/markets/brvm/indices routes.
 *
 * Query params:
 *   ?types=commodity,crypto  — filter by asset type (comma-separated)
 *   (no params) — returns all assets
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchFinancialData } from '@/lib/financial-data';
import type { AssetType } from '@/lib/financial-data';
import * as Sentry from '@sentry/nextjs';

// Short revalidation — real freshness is enforced by the data layer's date validation
export const revalidate = 300; // 5 min

const VALID_TYPES = new Set<AssetType>(['currency', 'commodity', 'index', 'crypto']);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const typesParam = searchParams.get('types');

    let types: AssetType[] | undefined;
    if (typesParam) {
      types = typesParam
        .split(',')
        .map((t) => t.trim() as AssetType)
        .filter((t) => VALID_TYPES.has(t));

      if (types.length === 0) {
        return NextResponse.json(
          { error: 'Invalid types parameter. Valid values: currency, commodity, index, crypto' },
          { status: 400 },
        );
      }
    }

    const result = await fetchFinancialData(types);

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 's-maxage=300, stale-while-revalidate=60',
      },
    });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: '/api/financial-data' } });
    return NextResponse.json(
      { error: 'Données financières temporairement indisponibles', quotes: [], errors: [] },
      { status: 503 },
    );
  }
}
