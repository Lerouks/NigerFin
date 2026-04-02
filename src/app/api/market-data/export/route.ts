import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase';
import ExcelJS from 'exceljs';

export const dynamic = 'force-dynamic';

const XLSX_CONTENT_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const TYPE_LABELS: Record<string, string> = {
  currency: 'Devise',
  commodity: 'Matière première',
  index: 'Indice',
  crypto: 'Crypto',
};

export async function GET() {
  // Authenticate user
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  // Check for premium or admin role
  const serviceClient = createServiceClient();
  if (!serviceClient) {
    return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });
  }

  const { data: profile } = await serviceClient
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || (profile.role !== 'premium' && profile.role !== 'admin')) {
    return NextResponse.json({ error: 'Accès réservé aux abonnés premium' }, { status: 403 });
  }

  // Fetch market data
  const { data, error } = await serviceClient
    .from('market_data')
    .select('*')
    .order('type')
    .order('name');

  if (error || !data || data.length === 0) {
    return NextResponse.json({ error: 'Aucune donnée disponible' }, { status: 404 });
  }

  // Build XLSX workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'NFI Report';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Données de marché');

  const headers = ['Nom', 'Symbole', 'Type', 'Valeur', 'Variation', 'Variation %', 'Unité', 'Source', 'Mis à jour le', 'Description'];
  sheet.addRow(headers);

  // Style header row
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF111111' },
  };
  headerRow.alignment = { vertical: 'middle' };

  // Add data rows
  for (const item of data) {
    const updatedAt = item.updated_at
      ? new Date(item.updated_at).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '';

    sheet.addRow([
      item.name,
      item.symbol || '',
      TYPE_LABELS[item.type] || item.type,
      Number(item.value),
      Number(item.change),
      Number(item.change_percent),
      item.unit || '',
      item.source || '',
      updatedAt,
      item.description || '',
    ]);
  }

  // Auto-size columns
  sheet.columns.forEach((column, colIdx) => {
    let maxLength = headers[colIdx]?.length ?? 10;
    data.forEach((item, rowIdx) => {
      const cell = sheet.getRow(rowIdx + 2).getCell(colIdx + 1);
      const len = cell.value != null ? String(cell.value).length : 0;
      if (len > maxLength) maxLength = len;
    });
    column.width = Math.min(maxLength + 4, 50);
  });

  // Format numeric columns (Valeur, Variation, Variation %)
  for (let rowIdx = 2; rowIdx <= data.length + 1; rowIdx++) {
    sheet.getRow(rowIdx).getCell(4).numFmt = '#,##0.00';
    sheet.getRow(rowIdx).getCell(5).numFmt = '#,##0.00';
    sheet.getRow(rowIdx).getCell(6).numFmt = '0.00"%"';
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const dateStr = new Date().toISOString().slice(0, 10);

  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      'Content-Type': XLSX_CONTENT_TYPE,
      'Content-Disposition': `attachment; filename="donnees_marche_${dateStr}.xlsx"`,
    },
  });
}
