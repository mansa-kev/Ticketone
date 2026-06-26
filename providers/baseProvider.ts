export interface PaymentProviderInput {
  client_name: string;
  client_email: string;
  client_phone?: string;
  amount: number;
  currency: string;
  payment_reference: string;
  description?: string;
}

export interface PaymentProviderOutput {
  providerPaymentId: string;
  checkoutUrl: string;
  rawResponse: any;
}

export interface WebhookParseResult {
  providerPaymentId: string;
  internalReference: string;
  providerStatus: string;
  normalizedStatus: string; // pending, paid, failed, cancelled, expired, refunded, etc.
  amount?: number;
  currency?: string;
  rawPayload: any;
}

export interface PaymentProvider {
  name: string;

  createPayment(input: PaymentProviderInput): Promise<PaymentProviderOutput>;

  getPaymentStatus(providerPaymentId: string): Promise<{
    status: string;
    rawResponse: any;
  }>;

  verifyWebhook(headers: Record<string, any>, body: any): boolean;

  parseWebhookEvent(headers: Record<string, any>, body: any): WebhookParseResult;

  normalizeStatus(providerStatus: string): string;
}
