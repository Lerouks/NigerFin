import { createServiceClient } from '@/lib/supabase';

const BUCKET = 'factures';

/**
 * Build the canonical storage path for an invoice PDF.
 * Path convention enforces RLS: first segment must be the user_id.
 */
export function invoicePdfPath(userId: string, invoiceNumber: string): string {
  return `${userId}/${invoiceNumber}.pdf`;
}

/**
 * Upload an invoice PDF to Supabase Storage. Service role only.
 * Returns the storage path (without bucket prefix).
 */
export async function uploadInvoicePdf(
  userId: string,
  invoiceNumber: string,
  pdfBuffer: Buffer,
): Promise<string> {
  const supabase = createServiceClient();
  if (!supabase) throw new Error('Supabase service client unavailable');

  const path = invoicePdfPath(userId, invoiceNumber);
  const { error } = await supabase.storage.from(BUCKET).upload(path, pdfBuffer, {
    contentType: 'application/pdf',
    upsert: true,
  });
  if (error) throw error;
  return path;
}

/**
 * Generate a short-lived signed URL for downloading an invoice PDF.
 * The signed URL is unguessable and bound to a TTL; safe to email/share.
 */
export async function createInvoiceDownloadUrl(
  path: string,
  expiresInSec = 60 * 60,
): Promise<string> {
  const supabase = createServiceClient();
  if (!supabase) throw new Error('Supabase service client unavailable');

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresInSec);
  if (error) throw error;
  return data.signedUrl;
}

/**
 * Read an invoice PDF as Buffer. Service role only (e.g. for /download endpoint).
 */
export async function downloadInvoicePdf(path: string): Promise<Buffer> {
  const supabase = createServiceClient();
  if (!supabase) throw new Error('Supabase service client unavailable');

  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error) throw error;
  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
