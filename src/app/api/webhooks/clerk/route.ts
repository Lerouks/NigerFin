import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const eventType = payload.type;
    const supabase = createServiceClient();

    switch (eventType) {
      case 'user.created': {
        const userId = payload.data.id;
        // Create a default free subscription for new users
        await supabase.from('subscriptions').insert({
          user_id: userId,
          tier: 'lecteur',
          status: 'active',
        });
        break;
      }

      case 'user.deleted': {
        const userId = payload.data.id;
        await supabase
          .from('subscriptions')
          .update({ status: 'cancelled' })
          .eq('user_id', userId);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
  }
}
