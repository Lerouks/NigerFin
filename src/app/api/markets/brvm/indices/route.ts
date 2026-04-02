import { NextResponse } from 'next/server';
import { dataOrchestrator } from '@/lib/services';
import * as Sentry from '@sentry/nextjs';

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
    Sentry.captureException(err, { tags: { route: '/api/markets/brvm/indices' } });
    return NextResponse.json(
      { error: 'Données BRVM temporairement indisponibles', fallback: true },
      { status: 503 }
    );
  }
}
