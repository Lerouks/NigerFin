import { NextResponse } from 'next/server';
import { dataOrchestrator } from '@/lib/services';
import * as Sentry from '@sentry/nextjs';
import { estSourceNonBranchee } from '@/lib/services/source-non-branchee';

export const revalidate = 604800; // 7 days

export async function GET() {
  try {
    const result = await dataOrchestrator.getNigerCountry();

    return NextResponse.json({
      country: result.data,
      source: result.source,
      service: result.service,
      fetchedAt: result.fetchedAt,
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' },
    });
  } catch (err) {
    if (estSourceNonBranchee(err)) {
      // État connu, pas une panne : rien à signaler à Sentry. La page /niger
      // garde les faits saisis en base.
      return NextResponse.json(
        { error: 'Données pays indisponibles : source non branchée', nonBranchee: true },
        { status: 503 }
      );
    }
    Sentry.captureException(err, { tags: { route: '/api/countries/niger' } });
    return NextResponse.json(
      { error: 'Données pays temporairement indisponibles', fallback: true },
      { status: 503 }
    );
  }
}
