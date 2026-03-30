// ────────────────────────────────────────────────────────────────────────────
// Moov Money Provider — Stub
//
// TODO: Implement with real Moov Money API when credentials are available.
//
// Required environment variables:
//   MOOV_MONEY_API_URL        — API base URL
//   MOOV_MONEY_API_KEY        — API key / merchant ID
//   MOOV_MONEY_API_SECRET     — API secret
//   MOOV_MONEY_WEBHOOK_SECRET — Secret for verifying webhook signatures
// ────────────────────────────────────────────────────────────────────────────

import type {
  MobileMoneyProvider,
  InitiatePaymentRequest,
  InitiatePaymentResponse,
  CheckPaymentStatusRequest,
  CheckPaymentStatusResponse,
  WebhookPayload,
  WebhookResult,
} from '@/lib/payment-providers';

export class MoovMoneyProvider implements MobileMoneyProvider {
  id = 'moov_money' as const;
  name = 'Moov Money';

  private get apiUrl() { return process.env.MOOV_MONEY_API_URL || ''; }
  private get apiKey() { return process.env.MOOV_MONEY_API_KEY || ''; }
  private get apiSecret() { return process.env.MOOV_MONEY_API_SECRET || ''; }

  isConfigured(): boolean {
    return !!(this.apiUrl && this.apiKey && this.apiSecret);
  }

  async initiatePayment(_req: InitiatePaymentRequest): Promise<InitiatePaymentResponse> {
    // TODO: Replace with actual Moov Money API call
    throw new Error('Moov Money API non configurée. Implémentation à venir.');
  }

  async checkPaymentStatus(_req: CheckPaymentStatusRequest): Promise<CheckPaymentStatusResponse> {
    // TODO: Replace with actual Moov Money status check API call
    throw new Error('Moov Money API non configurée. Implémentation à venir.');
  }

  async processWebhook(_payload: WebhookPayload): Promise<WebhookResult> {
    // TODO: Replace with actual webhook processing
    throw new Error('Moov Money webhook non configuré. Implémentation à venir.');
  }
}
