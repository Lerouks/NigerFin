import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { logAuditEvent } from '@/lib/audit';
import type ExcelJSType from 'exceljs';

// LOW-PERF-1 : ExcelJS (~1 MB) charge dynamiquement uniquement au moment de
// l'export. Ne penalise pas le cold-start des autres routes admin partageant
// le meme container serverless.
let ExcelJSModule: typeof ExcelJSType | null = null;
async function getExcelJS(): Promise<typeof ExcelJSType> {
  if (!ExcelJSModule) {
    const mod = await import('exceljs');
    ExcelJSModule = mod.default;
  }
  return ExcelJSModule;
}

const XLSX_CONTENT_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// Limite anti-DoS memoire serverless (securite C-6).
// Au-dela, l'export est tronque et le client doit affiner les filtres ou paginer.
const EXPORT_ROW_LIMIT = 5000;

/** Create a workbook with a single styled sheet, auto-sized columns, and bold headers. */
async function createWorkbook(sheetName: string, headers: string[], rows: (string | number | boolean | null)[][]) {
  const ExcelJS = await getExcelJS();
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'NFI Report';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(sheetName);

  // Add header row
  sheet.addRow(headers);

  // Style header row: bold + dark fill
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF111111' },
  };
  headerRow.alignment = { vertical: 'middle' };

  // Add data rows
  for (const row of rows) {
    sheet.addRow(row);
  }

  // Auto-size columns based on content
  sheet.columns.forEach((column, colIdx) => {
    let maxLength = headers[colIdx]?.length ?? 10;
    rows.forEach((row) => {
      const cellValue = row[colIdx];
      const len = cellValue != null ? String(cellValue).length : 0;
      if (len > maxLength) maxLength = len;
    });
    column.width = Math.min(maxLength + 4, 60);
  });

  return workbook;
}

/** Format a date string for display in Excel. */
function fmtDate(val: unknown): string {
  if (!val) return '';
  const d = new Date(String(val));
  if (isNaN(d.getTime())) return String(val);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const { user, serviceClient } = auth;
  const type = request.nextUrl.searchParams.get('type') || 'payments';

  if (type === 'payments') {
    const { data } = await serviceClient
      .from('payment_requests')
      .select('*, user_profiles!payment_requests_user_profile_fkey(email, full_name)')
      .order('created_at', { ascending: false })
      .limit(EXPORT_ROW_LIMIT);

    if (!data) return NextResponse.json({ error: 'No data' }, { status: 404 });
    const truncated = data.length === EXPORT_ROW_LIMIT;

    const headers = ['ID', 'Utilisateur', 'Email', 'Plan', 'Cycle', 'Montant', 'Méthode', 'N° Transaction', 'Statut', 'Date', 'Vérifié le'];
    const rows = data.map((p: Record<string, unknown>) => {
      const profile = p.user_profiles as { email?: string; full_name?: string } | null;
      return [
        String(p.id),
        profile?.full_name || '',
        profile?.email || '',
        String(p.tier ?? ''),
        String(p.billing_cycle ?? ''),
        Number(p.amount) || 0,
        String(p.payment_method ?? ''),
        String(p.transaction_number ?? ''),
        String(p.status ?? ''),
        fmtDate(p.created_at),
        fmtDate(p.verified_at),
      ];
    });

    const workbook = await createWorkbook('Paiements', headers, rows);
    const buffer = await workbook.xlsx.writeBuffer();

    await logAuditEvent(user.id, 'export_xlsx', 'payments', undefined, { rowCount: data.length, truncated });

    return new NextResponse(buffer as ArrayBuffer, {
      headers: {
        'Content-Type': XLSX_CONTENT_TYPE,
        'Content-Disposition': `attachment; filename="paiements_${new Date().toISOString().slice(0, 10)}.xlsx"`,
        'X-Export-Truncated': String(truncated),
        'X-Export-Row-Count': String(data.length),
      },
    });
  }

  if (type === 'users') {
    const { data } = await serviceClient
      .from('user_profiles')
      .select('id, email, full_name, role, subscription_status, billing_cycle, blocked, created_at')
      .order('created_at', { ascending: false })
      .limit(EXPORT_ROW_LIMIT);

    if (!data) return NextResponse.json({ error: 'No data' }, { status: 404 });
    const truncated = data.length === EXPORT_ROW_LIMIT;

    const headers = ['ID', 'Nom', 'Email', 'Rôle', 'Statut Abonnement', 'Cycle', 'Bloqué', 'Inscrit le'];
    const rows = data.map((u: Record<string, unknown>) => [
      String(u.id),
      String(u.full_name || ''),
      String(u.email ?? ''),
      String(u.role ?? ''),
      String(u.subscription_status ?? ''),
      String(u.billing_cycle || ''),
      u.blocked ? 'Oui' : 'Non',
      fmtDate(u.created_at),
    ]);

    const workbook = await createWorkbook('Utilisateurs', headers, rows);
    const buffer = await workbook.xlsx.writeBuffer();

    await logAuditEvent(user.id, 'export_xlsx', 'users', undefined, { rowCount: data.length, truncated });

    return new NextResponse(buffer as ArrayBuffer, {
      headers: {
        'Content-Type': XLSX_CONTENT_TYPE,
        'Content-Disposition': `attachment; filename="utilisateurs_${new Date().toISOString().slice(0, 10)}.xlsx"`,
        'X-Export-Truncated': String(truncated),
        'X-Export-Row-Count': String(data.length),
      },
    });
  }

  if (type === 'articles') {
    const { data } = await serviceClient
      .from('articles')
      .select('id, title, slug, category, sections, status, content_type, is_featured, author_name, published_at, created_at')
      .order('created_at', { ascending: false })
      .limit(EXPORT_ROW_LIMIT);

    if (!data) return NextResponse.json({ error: 'No data' }, { status: 404 });
    const truncated = data.length === EXPORT_ROW_LIMIT;

    const headers = ['ID', 'Titre', 'Slug', 'Catégorie', 'Sections', 'Statut', 'Accès', 'À la une', 'Auteur', 'Publié le', 'Créé le'];
    const rows = data.map((a: Record<string, unknown>) => [
      String(a.id),
      String(a.title ?? ''),
      String(a.slug ?? ''),
      String(a.category ?? ''),
      Array.isArray(a.sections) ? (a.sections as string[]).join('; ') : '',
      String(a.status ?? ''),
      String(a.content_type ?? ''),
      a.is_featured ? 'Oui' : 'Non',
      String(a.author_name ?? ''),
      fmtDate(a.published_at),
      fmtDate(a.created_at),
    ]);

    const workbook = await createWorkbook('Articles', headers, rows);
    const buffer = await workbook.xlsx.writeBuffer();

    await logAuditEvent(user.id, 'export_xlsx', 'articles', undefined, { rowCount: data.length, truncated });

    return new NextResponse(buffer as ArrayBuffer, {
      headers: {
        'Content-Type': XLSX_CONTENT_TYPE,
        'Content-Disposition': `attachment; filename="articles_${new Date().toISOString().slice(0, 10)}.xlsx"`,
        'X-Export-Truncated': String(truncated),
        'X-Export-Row-Count': String(data.length),
      },
    });
  }

  if (type === 'stats') {
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data } = await serviceClient
      .from('page_views')
      .select('page_path, article_id, referrer, viewed_at')
      .gte('viewed_at', monthAgo)
      .order('viewed_at', { ascending: false })
      .limit(EXPORT_ROW_LIMIT);

    if (!data) return NextResponse.json({ error: 'No data' }, { status: 404 });
    const truncated = data.length === EXPORT_ROW_LIMIT;

    const headers = ['Page', 'Article ID', 'Referrer', 'Date'];
    const rows = data.map((v: Record<string, unknown>) => [
      String(v.page_path ?? ''),
      String(v.article_id || ''),
      String(v.referrer || ''),
      fmtDate(v.viewed_at),
    ]);

    const workbook = await createWorkbook('Statistiques', headers, rows);
    const buffer = await workbook.xlsx.writeBuffer();

    await logAuditEvent(user.id, 'export_xlsx', 'stats', undefined, { rowCount: data.length, truncated });

    return new NextResponse(buffer as ArrayBuffer, {
      headers: {
        'Content-Type': XLSX_CONTENT_TYPE,
        'Content-Disposition': `attachment; filename="statistiques_${new Date().toISOString().slice(0, 10)}.xlsx"`,
        'X-Export-Truncated': String(truncated),
        'X-Export-Row-Count': String(data.length),
      },
    });
  }

  if (type === 'messages') {
    const { data } = await serviceClient
      .from('messages_contact')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(EXPORT_ROW_LIMIT);

    if (!data) return NextResponse.json({ error: 'No data' }, { status: 404 });
    const truncated = data.length === EXPORT_ROW_LIMIT;

    const headers = ['ID', 'Nom', 'Email', 'Sujet', 'Message', 'Statut', 'IP', 'Date'];
    const rows = data.map((m: Record<string, unknown>) => [
      String(m.id ?? ''),
      String(m.full_name ?? ''),
      String(m.email ?? ''),
      String(m.subject ?? ''),
      String(m.message ?? ''),
      String(m.status ?? ''),
      String(m.ip_address ?? ''),
      fmtDate(m.created_at),
    ]);

    const workbook = await createWorkbook('Messages', headers, rows);
    const buffer = await workbook.xlsx.writeBuffer();

    await logAuditEvent(user.id, 'export_xlsx', 'messages', undefined, { rowCount: data.length, truncated });

    return new NextResponse(buffer as ArrayBuffer, {
      headers: {
        'Content-Type': XLSX_CONTENT_TYPE,
        'Content-Disposition': `attachment; filename="messages_contact_${new Date().toISOString().slice(0, 10)}.xlsx"`,
        'X-Export-Truncated': String(truncated),
        'X-Export-Row-Count': String(data.length),
      },
    });
  }

  return NextResponse.json({ error: 'Type invalide' }, { status: 400 });
}
