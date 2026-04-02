import { NextResponse } from 'next/server';
import { dataOrchestrator } from '@/lib/services';
import * as Sentry from '@sentry/nextjs';

export const revalidate = 3600; // 1h

export async function GET() {
  try {
    const result = await dataOrchestrator.getForexData();

    return NextResponse.json({
      rates: result.data.rates,
      baseCurrency: result.data.baseCurrency,
      date: result.data.date,
      source: result.source,
      service: result.service,
      fetchedAt: result.fetchedAt,
    });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: '/api/markets/forex' } });
    return NextResponse.json(
      { error: 'Données de change temporairement indisponibles', fallback: true },
      { status: 503 }
    );
  }
}
