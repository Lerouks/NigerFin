import { NextResponse } from 'next/server';
import { dataOrchestrator } from '@/lib/services';
import * as Sentry from '@sentry/nextjs';
import { estSourceNonBranchee } from '@/lib/services/source-non-branchee';

export const revalidate = 604800; // 7 days

export async function GET() {
  try {
    const result = await dataOrchestrator.getRegionData();

    return NextResponse.json({
      region: result.data,
      source: result.source,
      service: result.service,
      fetchedAt: result.fetchedAt,
    });
  } catch (err) {
    if (estSourceNonBranchee(err)) {
      // État connu, pas une panne : rien à signaler à Sentry.
      return NextResponse.json(
        { error: 'Données régionales indisponibles : source non branchée', nonBranchee: true },
        { status: 503 }
      );
    }
    Sentry.captureException(err, { tags: { route: '/api/countries/region' } });
    return NextResponse.json(
      { error: 'Données régionales temporairement indisponibles', fallback: true },
      { status: 503 }
    );
  }
}
