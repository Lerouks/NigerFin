import { describe, it, expect } from 'vitest';
import { invoicePdfPath } from '@/lib/invoices/storage';
import { renderInvoicePdf } from '@/lib/invoices/generate-pdf';
import { NFI_GROUP_ISSUER, type Invoice } from '@/types/invoice';

describe('invoices · invoicePdfPath', () => {
  it('builds a path that puts the user_id as the first folder (RLS)', () => {
    const userId = '62c3161a-1799-453f-9aa7-710755eb6126';
    const invoiceNumber = 'FAC-2026-0001';
    expect(invoicePdfPath(userId, invoiceNumber)).toBe(
      `${userId}/${invoiceNumber}.pdf`,
    );
  });

  it('handles invoice numbers with multiple digits', () => {
    expect(invoicePdfPath('user-1', 'FAC-2026-9999')).toBe('user-1/FAC-2026-9999.pdf');
  });
});

describe('invoices · renderInvoicePdf', () => {
  const sampleInvoice: Invoice = {
    id: 'a9f62398-030c-4b2e-9adc-690c6d008908',
    invoiceNumber: 'FAC-2026-0001',
    userId: '62c3161a-1799-453f-9aa7-710755eb6126',
    amountXof: 35000,
    currency: 'XOF',
    status: 'paid',
    description: 'Abonnement Premium NFI Report',
    lineItems: [
      {
        description: 'Premium annuel',
        qty: 1,
        unitPriceXof: 35000,
        totalXof: 35000,
      },
    ],
    customer: {
      name: 'Test Client',
      email: 'test@example.com',
      city: 'Niamey',
      country: 'Niger',
    },
    issuer: NFI_GROUP_ISSUER,
    paymentMethod: 'iPayMoney',
    billingCycle: 'annual',
    paidAt: '2026-05-08T18:55:52.145Z',
    createdAt: '2026-05-08T18:55:52.145Z',
  };

  it('produces a non-empty PDF buffer', async () => {
    const buffer = await renderInvoicePdf(sampleInvoice);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
    // PDF magic header
    expect(buffer.subarray(0, 4).toString()).toBe('%PDF');
  }, 15000);

  it('renders the invoice number into the PDF metadata', async () => {
    const buffer = await renderInvoicePdf(sampleInvoice);
    const asString = buffer.toString('binary');
    expect(asString).toContain('FAC-2026-0001');
  }, 15000);

  it('renders cancelled and refunded status without throwing', async () => {
    for (const status of ['cancelled', 'refunded'] as const) {
      const buffer = await renderInvoicePdf({ ...sampleInvoice, status });
      expect(buffer.length).toBeGreaterThan(1000);
    }
  }, 30000);
});
