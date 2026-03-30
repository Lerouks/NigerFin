// ────────────────────────────────────────────────────────────────────────────
// Mobile Money Payment Provider Abstraction
//
// This module defines the interface that each mobile money provider must
// implement and a registry to look them up at runtime.
//
// HOW TO ADD A NEW PROVIDER:
// 1. Create a file in src/lib/providers/<provider-id>.ts
// 2. Implement the MobileMoneyProvider interface
// 3. Register it in PROVIDER_REGISTRY below
// 4. Set the provider's status to 'active' in config/pricing.ts
// 5. Add required env vars (see each provider file for details)
// ────────────────────────────────────────────────────────────────────────────

import type { MobileMoneyProviderId, BillingCycle } from '@/config/pricing';

// ─── Provider interface ─────────────────────────────────────────────────────

export interface InitiatePaymentRequest {
  /** Internal payment request ID (from payment_requests table) */
  paymentRequestId: string;
  /** User ID */
  userId: string;
  /** Amount in FCFA */
  amount: number;
  /** User's phone number (for mobile money debit) */
  phoneNumber: string;
  /** Billing cycle for reference */
  billingCycle: BillingCycle;
}

export interface InitiatePaymentResponse {
  /** Whether the initiation succeeded */
  success: boolean;
  /** Provider's external transaction/reference ID */
  providerTransactionId: string;
  /** Current status from the provider */
  status: 'pending' | 'processing';
  /** Optional: URL to redirect user for payment confirmation (some providers use this) */
  redirectUrl?: string;
  /** Optional: message to display to the user */
  message?: string;
}

export interface CheckPaymentStatusRequest {
  /** Provider's external transaction ID */
  providerTransactionId: string;
  /** Our internal payment request ID */
  paymentRequestId: string;
}

export interface CheckPaymentStatusResponse {
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  /** Provider's transaction ID (confirmed) */
  providerTransactionId: string;
  /** Amount actually paid (for verification) */
  amountPaid?: number;
  /** Reason if failed */
  failureReason?: string;
}

export interface WebhookPayload {
  /** Raw request headers (for signature verification) */
  headers: Record<string, string>;
  /** Parsed request body */
  body: Record<string, unknown>;
}

export interface WebhookResult {
  /** Whether the webhook was valid and processed */
  valid: boolean;
  /** Our internal payment request ID (extracted from webhook data) */
  paymentRequestId?: string;
  /** Provider's transaction ID */
  providerTransactionId?: string;
  /** Payment status from webhook */
  status?: 'completed' | 'failed' | 'cancelled';
  /** Amount paid */
  amountPaid?: number;
  /** Reason if failed */
  failureReason?: string;
}

/**
 * Interface that every mobile money provider must implement.
 */
export interface MobileMoneyProvider {
  /** Provider identifier — must match MobileMoneyProviderId */
  id: MobileMoneyProviderId;

  /** Human-readable name */
  name: string;

  /** Whether this provider is configured (has valid API credentials) */
  isConfigured(): boolean;

  /** Initiate a payment request to the provider */
  initiatePayment(req: InitiatePaymentRequest): Promise<InitiatePaymentResponse>;

  /** Check the status of an existing payment */
  checkPaymentStatus(req: CheckPaymentStatusRequest): Promise<CheckPaymentStatusResponse>;

  /** Process an incoming webhook from the provider */
  processWebhook(payload: WebhookPayload): Promise<WebhookResult>;
}

// ─── Provider registry ──────────────────────────────────────────────────────

/**
 * Registry of all mobile money providers.
 * Add new providers here as they become available.
 *
 * Example (once Orange Money API is ready):
 *   import { OrangeMoneyProvider } from '@/lib/providers/orange-money';
 *   PROVIDER_REGISTRY.set('orange_money', new OrangeMoneyProvider());
 */
const PROVIDER_REGISTRY = new Map<MobileMoneyProviderId, MobileMoneyProvider>();

// ─── Uncomment and import as providers become available ─────────────────────
// import { OrangeMoneyProvider } from '@/lib/providers/orange-money';
// import { MoovMoneyProvider } from '@/lib/providers/moov-money';
// import { AirtelMoneyProvider } from '@/lib/providers/airtel-money';
//
// PROVIDER_REGISTRY.set('orange_money', new OrangeMoneyProvider());
// PROVIDER_REGISTRY.set('moov_money', new MoovMoneyProvider());
// PROVIDER_REGISTRY.set('airtel_money', new AirtelMoneyProvider());

/** Get a registered provider by ID. Returns undefined if not registered. */
export function getProvider(id: MobileMoneyProviderId): MobileMoneyProvider | undefined {
  return PROVIDER_REGISTRY.get(id);
}

/** Get a provider and ensure it's configured. Throws if not available. */
export function getConfiguredProvider(id: MobileMoneyProviderId): MobileMoneyProvider {
  const provider = PROVIDER_REGISTRY.get(id);
  if (!provider) {
    throw new Error(`Le fournisseur de paiement "${id}" n'est pas encore disponible.`);
  }
  if (!provider.isConfigured()) {
    throw new Error(`Le fournisseur de paiement "${id}" n'est pas configuré. Contactez l'administrateur.`);
  }
  return provider;
}

/** Register a new provider at runtime */
export function registerProvider(provider: MobileMoneyProvider): void {
  PROVIDER_REGISTRY.set(provider.id, provider);
}

/** List all registered provider IDs */
export function getRegisteredProviderIds(): MobileMoneyProviderId[] {
  return Array.from(PROVIDER_REGISTRY.keys());
}
