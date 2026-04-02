import { NextRequest, NextResponse } from 'next/server';
import { dataOrchestrator } from '@/lib/services';
import * as Sentry from '@sentry/nextjs';

export const revalidate = 1800; // 30 min

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker') || undefined;

    const result = await dataOrchestrator.getBRVMStocks(ticker);

    // Prioritize BOAN Niger at the top
    const stocks = [...result.data].sort((a, b) => {
      if (a.ticker === 'BOAN') return -1;
      if (b.ticker === 'BOAN') return 1;
      return 0;
    });

    return NextResponse.json({
      stocks,
      source: result.source,
      service: result.service,
      fetchedAt: result.fetchedAt,
    });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: '/api/markets/brvm/stocks' } });
    return NextResponse.json(
      { error: 'Données actions BRVM temporairement indisponibles', fallback: true },
      { status: 503 }
    );
  }
}
