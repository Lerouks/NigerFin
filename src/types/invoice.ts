/**
 * Types for NFI Report invoices.
 * Mirrors the JSONB columns of the `invoices` Supabase table.
 */

export interface InvoiceLineItem {
  description: string;
  qty: number;
  unitPriceXof: number;
  totalXof: number;
}

export interface InvoiceCustomer {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  /** Numéro d'identification fiscale du client (entreprise B2B). */
  niu?: string;
  /** Numéro RCCM du client (entreprise B2B). */
  rccm?: string;
}

export interface InvoiceIssuer {
  name: string;
  capitalXof: number;
  address: string;
  city: string;
  country: string;
  email: string;
  phone: string;
  /** Numéro RCCM NFI Group, complété après immatriculation. */
  rccm?: string;
  /** Numéro d'identification fiscale, complété après immatriculation. */
  niu?: string;
}

export type InvoiceStatus = 'draft' | 'paid' | 'cancelled' | 'refunded';
/**
 * Superset of the two BillingCycle conventions that coexist in the codebase
 * (pricing.ts uses quarterly/yearly, email-templates uses semi_annual/annual).
 * The DB CHECK accepts both; surface code should normalize before display.
 */
export type InvoiceBillingCycle = 'monthly' | 'quarterly' | 'yearly' | 'semi_annual' | 'annual';

/**
 * Invoice payload as stored in DB and rendered in PDF.
 * Snapshot semantics: customer + issuer + line_items are frozen at issuance.
 */
export interface Invoice {
  id: string;
  invoiceNumber: string;
  userId: string;
  amountXof: number;
  currency: string;
  status: InvoiceStatus;
  description: string;
  lineItems: InvoiceLineItem[];
  customer: InvoiceCustomer;
  issuer: InvoiceIssuer;
  paymentReference?: string;
  paymentMethod?: string;
  billingCycle?: InvoiceBillingCycle;
  periodStart?: string;
  periodEnd?: string;
  paidAt?: string;
  pdfPath?: string;
  createdAt: string;
}

export const NFI_GROUP_ISSUER: InvoiceIssuer = {
  name: 'NFI Group SARL',
  capitalXof: 1_000_000,
  address: 'Quartier Plateau',
  city: 'Niamey',
  country: 'Niger',
  email: 'contact@nfireport.com',
  phone: '+227 97 76 91 31',
  // RCCM et NIU à compléter après immatriculation officielle.
  rccm: undefined,
  niu: undefined,
};
