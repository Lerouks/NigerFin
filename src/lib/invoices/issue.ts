import * as Sentry from '@sentry/nextjs';
import { createServiceClient } from '@/lib/supabase';
import { sendTransactionalEmail } from '@/lib/email';
import { invoiceEmail } from '@/lib/email-templates';
import { renderInvoicePdf } from '@/lib/invoices/generate-pdf';
import { uploadInvoicePdf } from '@/lib/invoices/storage';
import {
  NFI_GROUP_ISSUER,
  type Invoice,
  type InvoiceBillingCycle,
  type InvoiceLineItem,
} from '@/types/invoice';

export interface IssueInvoiceInput {
  userId: string;
  /** Net amount to bill (FCFA). */
  amountXof: number;
  /** Bold one-liner shown in the PDF "description" zone. */
  description: string;
  /** Detailed invoice lines. Sum of totalXof should equal amountXof. */
  lineItems: InvoiceLineItem[];
  /** Optional metadata. */
  paymentMethod?: string;
  paymentReference?: string;
  billingCycle?: InvoiceBillingCycle;
  periodStart?: string;
  periodEnd?: string;
  /** If true, send the invoice email to the customer. Default: true. */
  sendEmail?: boolean;
}

export interface IssueInvoiceResult {
  invoice: Invoice;
  emailSent: boolean;
}

/**
 * End-to-end invoice issuance pipeline.
 *
 * 1. Fetch user_profiles snapshot for customer block
 * 2. INSERT row in `invoices` (trigger generates FAC-YYYY-NNNN)
 * 3. Render PDF via React-PDF
 * 4. Upload PDF to Storage bucket `factures`
 * 5. Update `invoices.pdf_path`
 * 6. Send invoice email with PDF attached (optional, default on)
 *
 * Idempotency: if `paymentReference` matches an existing invoice for the
 * same user, we return the existing invoice instead of creating a duplicate.
 */
export async function issueInvoice(input: IssueInvoiceInput): Promise<IssueInvoiceResult> {
  const supabase = createServiceClient();
  if (!supabase) throw new Error('Supabase service client unavailable');

  if (input.lineItems.length === 0) {
    throw new Error('Invoice must have at least one line item');
  }

  // ── Idempotence : same payment reference ⇒ return existing invoice
  if (input.paymentReference) {
    const { data: existing } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', input.userId)
      .eq('payment_reference', input.paymentReference)
      .maybeSingle();

    if (existing) {
      return { invoice: rowToInvoice(existing), emailSent: false };
    }
  }

  // ── 1. Snapshot customer from user_profiles
  const { data: profile, error: profileErr } = await supabase
    .from('user_profiles')
    .select('email, full_name, first_name, last_name, phone, address, city, country')
    .eq('id', input.userId)
    .single();

  if (profileErr || !profile) {
    throw new Error(`User profile not found for ${input.userId}`);
  }

  const fullName =
    profile.full_name ||
    [profile.first_name, profile.last_name].filter(Boolean).join(' ') ||
    'Client NFI Report';

  const customer = {
    name: fullName,
    email: profile.email,
    phone: profile.phone ?? undefined,
    address: profile.address ?? undefined,
    city: profile.city ?? undefined,
    country: profile.country ?? undefined,
  };

  const issuer = NFI_GROUP_ISSUER;
  const now = new Date().toISOString();

  // ── 2. INSERT row (trigger fills invoice_number atomically)
  const { data: inserted, error: insertErr } = await supabase
    .from('invoices')
    .insert({
      user_id: input.userId,
      amount_xof: input.amountXof,
      currency: 'XOF',
      status: 'paid',
      description: input.description,
      line_items: input.lineItems as unknown as Record<string, unknown>,
      customer: customer as unknown as Record<string, unknown>,
      issuer: issuer as unknown as Record<string, unknown>,
      payment_method: input.paymentMethod ?? null,
      payment_reference: input.paymentReference ?? null,
      billing_cycle: input.billingCycle ?? null,
      period_start: input.periodStart ?? null,
      period_end: input.periodEnd ?? null,
      paid_at: now,
    })
    .select('*')
    .single();

  if (insertErr || !inserted) {
    Sentry.captureException(insertErr, { tags: { context: 'invoice-insert' } });
    throw new Error(`Failed to insert invoice: ${insertErr?.message ?? 'unknown'}`);
  }

  const invoice: Invoice = rowToInvoice(inserted);

  // ── 3. Render PDF
  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await renderInvoicePdf(invoice);
  } catch (err) {
    Sentry.captureException(err, {
      tags: { context: 'invoice-pdf-render' },
      extra: { invoiceNumber: invoice.invoiceNumber },
    });
    // Keep the row even if PDF gen fails. Operator can retry later.
    return { invoice, emailSent: false };
  }

  // ── 4. Upload to Storage
  let pdfPath: string;
  try {
    pdfPath = await uploadInvoicePdf(input.userId, invoice.invoiceNumber, pdfBuffer);
  } catch (err) {
    Sentry.captureException(err, {
      tags: { context: 'invoice-pdf-upload' },
      extra: { invoiceNumber: invoice.invoiceNumber },
    });
    return { invoice, emailSent: false };
  }

  // ── 5. Update pdf_path on the row
  const { error: updErr } = await supabase
    .from('invoices')
    .update({ pdf_path: pdfPath })
    .eq('id', invoice.id);

  if (updErr) {
    Sentry.captureException(updErr, {
      tags: { context: 'invoice-pdf-path-update' },
      extra: { invoiceNumber: invoice.invoiceNumber },
    });
  }

  invoice.pdfPath = pdfPath;

  // ── 6. Send email with PDF attached
  if (input.sendEmail !== false) {
    try {
      const downloadUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nfireport.com'}/api/invoices/${invoice.id}/download`;
      const email = invoiceEmail({
        customerName: fullName,
        invoiceNumber: invoice.invoiceNumber,
        amountXof: invoice.amountXof,
        paidAt: now,
        periodStart: invoice.periodStart,
        periodEnd: invoice.periodEnd,
        downloadUrl,
      });

      await sendTransactionalEmail({
        to: customer.email,
        subject: email.subject,
        html: email.html,
        attachments: [
          {
            filename: `facture-${invoice.invoiceNumber}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      });

      return { invoice, emailSent: true };
    } catch (err) {
      Sentry.captureException(err, {
        tags: { context: 'invoice-email-send' },
        extra: { invoiceNumber: invoice.invoiceNumber },
      });
      return { invoice, emailSent: false };
    }
  }

  return { invoice, emailSent: false };
}

interface InvoiceRow {
  id: string;
  invoice_number: string;
  user_id: string;
  amount_xof: number;
  currency: string;
  status: string;
  description: string;
  line_items: unknown;
  customer: unknown;
  issuer: unknown;
  payment_reference: string | null;
  payment_method: string | null;
  billing_cycle: string | null;
  period_start: string | null;
  period_end: string | null;
  paid_at: string | null;
  pdf_path: string | null;
  created_at: string;
}

function rowToInvoice(row: InvoiceRow): Invoice {
  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    userId: row.user_id,
    amountXof: row.amount_xof,
    currency: row.currency,
    status: row.status as Invoice['status'],
    description: row.description,
    lineItems: row.line_items as InvoiceLineItem[],
    customer: row.customer as Invoice['customer'],
    issuer: row.issuer as Invoice['issuer'],
    paymentReference: row.payment_reference ?? undefined,
    paymentMethod: row.payment_method ?? undefined,
    billingCycle: (row.billing_cycle as InvoiceBillingCycle | null) ?? undefined,
    periodStart: row.period_start ?? undefined,
    periodEnd: row.period_end ?? undefined,
    paidAt: row.paid_at ?? undefined,
    pdfPath: row.pdf_path ?? undefined,
    createdAt: row.created_at,
  };
}
