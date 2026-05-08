import * as React from 'react';
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer';
import { InvoicePdf } from '@/emails/InvoicePdf';
import type { Invoice } from '@/types/invoice';

/**
 * Render an invoice React component into a PDF Buffer.
 * Server-side only (uses Node Buffer); never call from a client component.
 *
 * The cast is unfortunately required: `renderToBuffer` is typed for
 * `ReactElement<DocumentProps>` but accepts any element whose root is a
 * `<Document>` (which `InvoicePdf` is). Common pattern in @react-pdf/renderer.
 */
export async function renderInvoicePdf(invoice: Invoice): Promise<Buffer> {
  const element = React.createElement(InvoicePdf, { invoice }) as unknown as React.ReactElement<DocumentProps>;
  return renderToBuffer(element);
}
