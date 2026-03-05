import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { logAuditEvent } from '@/lib/audit';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const { user, serviceClient } = auth;
  const type = request.nextUrl.searchParams.get('type') || 'payments';

  if (type === 'payments') {
    const { data } = await serviceClient
      .from('payment_requests')
      .select('*, user_profiles!payment_requests_user_id_fkey(email, full_name)')
      .order('created_at', { ascending: false });

    if (!data) return NextResponse.json({ error: 'No data' }, { status: 404 });

    const header = 'ID,Utilisateur,Email,Plan,Cycle,Montant,Méthode,N° Transaction,Statut,Date,Vérifié le\n';
    const rows = data.map((p: Record<string, unknown>) => {
      const profile = p.user_profiles as { email?: string; full_name?: string } | null;
      return [
        p.id,
        profile?.full_name || '',
        profile?.email || '',
        p.tier,
        p.billing_cycle,
        p.amount,
        p.payment_method,
        p.transaction_number,
        p.status,
        p.created_at,
        p.verified_at || '',
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',');
    }).join('\n');

    await logAuditEvent(user.id, 'export_csv', 'payments', undefined, { rowCount: data.length });

    return new NextResponse(header + rows, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="paiements_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  if (type === 'users') {
    const { data } = await serviceClient
      .from('user_profiles')
      .select('id, email, full_name, role, subscription_status, billing_cycle, blocked, created_at')
      .order('created_at', { ascending: false });

    if (!data) return NextResponse.json({ error: 'No data' }, { status: 404 });

    const header = 'ID,Nom,Email,Rôle,Statut Abonnement,Cycle,Bloqué,Inscrit le\n';
    const rows = data.map((u: Record<string, unknown>) =>
      [u.id, u.full_name || '', u.email, u.role, u.subscription_status, u.billing_cycle || '', u.blocked ? 'Oui' : 'Non', u.created_at]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    await logAuditEvent(user.id, 'export_csv', 'users', undefined, { rowCount: data.length });

    return new NextResponse(header + rows, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="utilisateurs_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  return NextResponse.json({ error: 'Type invalide' }, { status: 400 });
}
