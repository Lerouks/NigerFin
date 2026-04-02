import { NextResponse } from 'next/server';
import { dataOrchestrator } from '@/lib/services';
import * as Sentry from '@sentry/nextjs';

export const revalidate = 300; // 5 min

export async function GET() {
  try {
    const result = await dataOrchestrator.getCryptoData();

    return NextResponse.json({
      prices: result.data.prices,
      date: result.data.date,
      source: result.source,
      service: result.service,
      fetchedAt: result.fetchedAt,
    });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: '/api/markets/crypto' } });
    return NextResponse.json(
      { error: 'Données crypto temporairement indisponibles', fallback: true },
      { status: 503 }
    );
  }
}
