import { NextResponse } from 'next/server';
import { dataOrchestrator } from '@/lib/services';
import * as Sentry from '@sentry/nextjs';

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
    Sentry.captureException(err, { tags: { route: '/api/countries/region' } });
    return NextResponse.json(
      { error: 'Données régionales temporairement indisponibles', fallback: true },
      { status: 503 }
    );
  }
}
