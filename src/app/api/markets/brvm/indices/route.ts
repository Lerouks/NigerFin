import { NextResponse } from 'next/server';
import { dataOrchestrator } from '@/lib/services';
import * as Sentry from '@sentry/nextjs';
import { estSourceNonBranchee } from '@/lib/services/source-non-branchee';

export const revalidate = 1800; // 30 min

export async function GET() {
  try {
    const result = await dataOrchestrator.getBRVMIndices();

    return NextResponse.json({
      indices: result.data,
      source: result.source,
      service: result.service,
      fetchedAt: result.fetchedAt,
    });
  } catch (err) {
    if (estSourceNonBranchee(err)) {
      // État connu, pas une panne : rien à signaler à Sentry.
      return NextResponse.json(
        { error: 'Données BRVM indisponibles : aucune source BRVM n\'est branchée', nonBranchee: true },
        { status: 503 }
      );
    }
    Sentry.captureException(err, { tags: { route: '/api/markets/brvm/indices' } });
    return NextResponse.json(
      { error: 'Données BRVM temporairement indisponibles', fallback: true },
      { status: 503 }
    );
  }
}
