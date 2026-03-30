// ────────────────────────────────────────────────────────────────────────────
// Airtel Money Provider — Stub
//
// TODO: Implement with real Airtel Money API when credentials are available.
//
// Required environment variables:
//   AIRTEL_MONEY_API_URL        — API base URL
//   AIRTEL_MONEY_API_KEY        — API key / client ID
//   AIRTEL_MONEY_API_SECRET     — API secret / client secret
//   AIRTEL_MONEY_WEBHOOK_SECRET — Secret for verifying webhook signatures
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

export class AirtelMoneyProvider implements MobileMoneyProvider {
  id = 'airtel_money' as const;
  name = 'Airtel Money';

  private get apiUrl() { return process.env.AIRTEL_MONEY_API_URL || ''; }
  private get apiKey() { return process.env.AIRTEL_MONEY_API_KEY || ''; }
  private get apiSecret() { return process.env.AIRTEL_MONEY_API_SECRET || ''; }

  isConfigured(): boolean {
    return !!(this.apiUrl && this.apiKey && this.apiSecret);
  }

  async initiatePayment(_req: InitiatePaymentRequest): Promise<InitiatePaymentResponse> {
    // TODO: Replace with actual Airtel Money API call
    throw new Error('Airtel Money API non configurée. Implémentation à venir.');
  }

  async checkPaymentStatus(_req: CheckPaymentStatusRequest): Promise<CheckPaymentStatusResponse> {
    // TODO: Replace with actual Airtel Money status check API call
    throw new Error('Airtel Money API non configurée. Implémentation à venir.');
  }

  async processWebhook(_payload: WebhookPayload): Promise<WebhookResult> {
    // TODO: Replace with actual webhook processing
    throw new Error('Airtel Money webhook non configuré. Implémentation à venir.');
  }
}
