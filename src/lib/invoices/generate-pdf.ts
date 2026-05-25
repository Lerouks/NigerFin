import * as React from 'react';
import type { DocumentProps } from '@react-pdf/renderer';
import type { Invoice } from '@/types/invoice';

/**
 * Render an invoice React component into a PDF Buffer.
 * Server-side only (uses Node Buffer); never call from a client component.
 *
 * Perf H-4 : @react-pdf/renderer (~500 KB) et InvoicePdf sont importes
 * dynamiquement, uniquement au moment du rendu. Avant : top-level import =>
 * cold start serverless penalise pour toutes les routes serveur, meme celles
 * qui ne generent pas de facture.
 *
 * The cast is unfortunately required: `renderToBuffer` is typed for
 * `ReactElement<DocumentProps>` but accepts any element whose root is a
 * `<Document>` (which `InvoicePdf` is). Common pattern in @react-pdf/renderer.
 */
export async function renderInvoicePdf(invoice: Invoice): Promise<Buffer> {
  const [{ renderToBuffer }, { InvoicePdf }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('@/emails/InvoicePdf'),
  ]);
  const element = React.createElement(InvoicePdf, { invoice }) as unknown as React.ReactElement<DocumentProps>;
  return renderToBuffer(element);
}
