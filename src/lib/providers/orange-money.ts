// ────────────────────────────────────────────────────────────────────────────
// Orange Money Provider — Stub
//
// TODO: Implement with real Orange Money API when credentials are available.
//
// Required environment variables:
//   ORANGE_MONEY_API_URL      — API base URL
//   ORANGE_MONEY_API_KEY      — API key / merchant ID
//   ORANGE_MONEY_API_SECRET   — API secret
//   ORANGE_MONEY_WEBHOOK_SECRET — Secret for verifying webhook signatures
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

export class OrangeMoneyProvider implements MobileMoneyProvider {
  id = 'orange_money' as const;
  name = 'Orange Money';

  private get apiUrl() { return process.env.ORANGE_MONEY_API_URL || ''; }
  private get apiKey() { return process.env.ORANGE_MONEY_API_KEY || ''; }
  private get apiSecret() { return process.env.ORANGE_MONEY_API_SECRET || ''; }

  isConfigured(): boolean {
    return !!(this.apiUrl && this.apiKey && this.apiSecret);
  }

  async initiatePayment(_req: InitiatePaymentRequest): Promise<InitiatePaymentResponse> {
    // TODO: Replace with actual Orange Money API call
    // Example flow:
    // 1. POST to Orange Money API with amount, phone number, merchant reference
    // 2. Orange Money sends USSD prompt to user's phone
    // 3. Return the provider transaction ID for tracking
    throw new Error('Orange Money API non configurée. Implémentation à venir.');
  }

  async checkPaymentStatus(_req: CheckPaymentStatusRequest): Promise<CheckPaymentStatusResponse> {
    // TODO: Replace with actual Orange Money status check API call
    // GET /transactions/{transactionId}/status
    throw new Error('Orange Money API non configurée. Implémentation à venir.');
  }

  async processWebhook(_payload: WebhookPayload): Promise<WebhookResult> {
    // TODO: Replace with actual webhook processing
    // 1. Verify webhook signature using ORANGE_MONEY_WEBHOOK_SECRET
    // 2. Extract transaction status, amount, reference
    // 3. Return structured result
    throw new Error('Orange Money webhook non configuré. Implémentation à venir.');
  }
}
