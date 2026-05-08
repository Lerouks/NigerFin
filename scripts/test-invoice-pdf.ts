/**
 * Local smoke test for the invoice PDF generator.
 * Usage : `npx tsx scripts/test-invoice-pdf.ts`
 * Output : ~/AUDIT EMAILS NFI/_mockups/test-facture.pdf
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

import { renderInvoicePdf } from '@/lib/invoices/generate-pdf';
import { NFI_GROUP_ISSUER, type Invoice } from '@/types/invoice';

const OUT = join(homedir(), 'AUDIT EMAILS NFI', '_mockups');

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
      description: 'Premium annuel, accès illimité aux articles, analyses, simulateurs et briefings exclusifs (8 mai 2026 au 8 mai 2027).',
      qty: 1,
      unitPriceXof: 35000,
      totalXof: 35000,
    },
  ],
  customer: {
    name: 'Mansour Djermakoye',
    email: 'mansour.djermakoye@example.com',
    phone: '+227 90 00 00 00',
    city: 'Niamey',
    country: 'Niger',
  },
  issuer: NFI_GROUP_ISSUER,
  paymentMethod: 'iPayMoney',
  paymentReference: 'IPM-2026-A8B9-C7D6',
  billingCycle: 'annual',
  periodStart: '2026-05-08T00:00:00.000Z',
  periodEnd: '2027-05-08T00:00:00.000Z',
  paidAt: '2026-05-08T18:55:52.145Z',
  createdAt: '2026-05-08T18:55:52.145Z',
};

async function main(): Promise<void> {
  await mkdir(OUT, { recursive: true });
  const buffer = await renderInvoicePdf(sampleInvoice);
  const outPath = join(OUT, 'test-facture.pdf');
  await writeFile(outPath, buffer);
  process.stdout.write(`PDF généré : ${outPath} (${buffer.length} octets)\n`);
}

main().catch((err: unknown) => {
  process.stderr.write(`Test failed: ${err instanceof Error ? err.stack ?? err.message : String(err)}\n`);
  process.exit(1);
});
