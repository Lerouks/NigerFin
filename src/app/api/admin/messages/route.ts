import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { serverError } from '@/lib/api-error';
import { logAuditEvent } from '@/lib/audit';

// GET: list all contact messages (newest first)
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const { serviceClient } = auth;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const countOnly = searchParams.get('count_only');

  // Return just the unread count for badge
  if (countOnly === 'true') {
    const { count, error } = await serviceClient
      .from('messages_contact')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'unread');

    if (error) return serverError(error, 'admin-messages-count');
    return NextResponse.json({ unread: count || 0 });
  }

  let query = serviceClient
    .from('messages_contact')
    .select('*')
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) return serverError(error, 'admin-messages');
  return NextResponse.json(data || []);
}

// PUT: update message status
export async function PUT(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const { serviceClient } = auth;

  const body = await request.json();
  const { id, status } = body;

  if (!id) {
    return NextResponse.json({ error: 'ID requis' }, { status: 400 });
  }

  if (!['unread', 'read', 'replied'].includes(status)) {
    return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
  }

  const { data, error } = await serviceClient
    .from('messages_contact')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) return serverError(error, 'admin-messages-update');

  await logAuditEvent(auth.user.id, 'update_message_status', 'message', id, { status });

  return NextResponse.json(data);
}

// DELETE: remove a message
export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const { serviceClient } = auth;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID requis' }, { status: 400 });
  }

  const { error } = await serviceClient
    .from('messages_contact')
    .delete()
    .eq('id', id);

  if (error) return serverError(error, 'admin-messages-delete');

  await logAuditEvent(auth.user.id, 'delete_message', 'message', id);

  return NextResponse.json({ success: true });
}
