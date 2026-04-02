import { NextResponse } from 'next/server';
import { dataOrchestrator } from '@/lib/services';
import * as Sentry from '@sentry/nextjs';

export const revalidate = 86400; // 24h

export async function GET() {
  try {
    const result = await dataOrchestrator.getMacroData('NER');

    return NextResponse.json({
      worldBank: result.data.worldBank,
      imf: result.data.imf,
      source: result.source,
      service: result.service,
      fetchedAt: result.fetchedAt,
    });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: '/api/economy/macro' } });
    return NextResponse.json(
      { error: 'Données macroéconomiques temporairement indisponibles', fallback: true },
      { status: 503 }
    );
  }
}
