import { NextResponse } from 'next/server';
import { dataOrchestrator } from '@/lib/services';
import * as Sentry from '@sentry/nextjs';

export const revalidate = 900; // 15 min

export async function GET() {
  try {
    const result = await dataOrchestrator.getIndicesData();

    return NextResponse.json({
      quotes: result.data.quotes,
      date: result.data.date,
      source: result.source,
      service: result.service,
      fetchedAt: result.fetchedAt,
    });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: '/api/markets/indices' } });
    return NextResponse.json(
      { error: 'Données indices temporairement indisponibles', fallback: true },
      { status: 503 }
    );
  }
}
