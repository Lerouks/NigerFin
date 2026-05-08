import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase';
import { downloadInvoicePdf } from '@/lib/invoices/storage';
import { isValidUUID } from '@/lib/validation';
import { serverError } from '@/lib/api-error';

interface Params {
  id: string;
}

/**
 * GET /api/invoices/:id/download
 * Streams the invoice PDF if the caller is the owner or an admin.
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<Params> }) {
  try {
    const { id } = await ctx.params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'Identifiant facture invalide' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 });
    }

    const service = createServiceClient();
    if (!service) {
      return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });
    }

    const { data: invoice, error } = await service
      .from('invoices')
      .select('user_id, invoice_number, pdf_path')
      .eq('id', id)
      .single();

    if (error || !invoice) {
      return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 });
    }

    // Authorization : owner OR admin role
    const { data: profile } = await service
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isOwner = invoice.user_id === user.id;
    const isAdmin = profile?.role === 'admin';
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    if (!invoice.pdf_path) {
      return NextResponse.json({ error: 'PDF de la facture non disponible' }, { status: 404 });
    }

    const pdfBuffer = await downloadInvoicePdf(invoice.pdf_path);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="facture-${invoice.invoice_number}.pdf"`,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });
  } catch (err) {
    return serverError(err, 'invoice-download');
  }
}
