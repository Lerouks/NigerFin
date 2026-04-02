import { NextResponse } from 'next/server';
import { dataOrchestrator } from '@/lib/services';
import * as Sentry from '@sentry/nextjs';

export const revalidate = 3600; // 1h

export async function GET() {
  try {
    const result = await dataOrchestrator.getCommoditiesData();

    return NextResponse.json({
      commodities: result.data.commodities,
      date: result.data.date,
      source: result.source,
      service: result.service,
      fetchedAt: result.fetchedAt,
    });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: '/api/economy/commodities' } });
    return NextResponse.json(
      { error: 'Données matières premières temporairement indisponibles', fallback: true },
      { status: 503 }
    );
  }
}
