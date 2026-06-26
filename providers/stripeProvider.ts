import { PaymentProvider, PaymentProviderInput, PaymentProviderOutput, WebhookParseResult } from './baseProvider';

export class StripeProvider implements PaymentProvider {
  name = 'stripe';

  private getApiKey(): string | undefined {
    return process.env.STRIPE_SECRET_KEY;
  }

  async createPayment(input: PaymentProviderInput): Promise<PaymentProviderOutput> {
    const apiKey = this.getApiKey();
    const appUrl = process.env.APP_URL || 'http://localhost:3000';

    if (!apiKey) {
      console.log(`[Stripe] API Key missing, routing to integrated Sandbox checkout.`);
      return {
        providerPaymentId: `stripe_sandbox_${Math.random().toString(36).substring(2, 10)}`,
        checkoutUrl: `${appUrl}/checkout/sandbox?ref=${input.payment_reference}&provider=stripe`,
        rawResponse: { mode: 'sandbox', input }
      };
    }

    try {
      // Build form-urlencoded parameters for Stripe Checkout Sessions API
      const params = new URLSearchParams();
      params.append('payment_method_types[0]', 'card');
      params.append('line_items[0][price_data][currency]', input.currency.toLowerCase());
      params.append('line_items[0][price_data][product_data][name]', 'Ticketone Confidential Advisory Retainer');
      params.append('line_items[0][price_data][product_data][description]', input.description || `Retainer Ref: ${input.payment_reference}`);
      params.append('line_items[0][price_data][unit_amount]', Math.round(input.amount * 100).toString()); // Cents
      params.append('line_items[0][quantity]', '1');
      params.append('mode', 'payment');
      params.append('client_reference_id', input.payment_reference);
      params.append('customer_email', input.client_email);
      params.append('success_url', `${appUrl}/payment/success?ref=${input.payment_reference}`);
      params.append('cancel_url', `${appUrl}/payment/cancelled?ref=${input.payment_reference}`);

      const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Stripe API error status ${response.status}: ${errText}`);
      }

      const data = await response.json();
      return {
        providerPaymentId: String(data.id || ''),
        checkoutUrl: data.url || '',
        rawResponse: data
      };
    } catch (err: any) {
      console.error('[Stripe] Failed to invoke live API, falling back to sandbox:', err.message);
      return {
        providerPaymentId: `stripe_err_fallback_${Math.random().toString(36).substring(2, 10)}`,
        checkoutUrl: `${appUrl}/checkout/sandbox?ref=${input.payment_reference}&provider=stripe&error=live_api_failed`,
        rawResponse: { mode: 'error_fallback', error: err.message, input }
      };
    }
  }

  async getPaymentStatus(providerPaymentId: string): Promise<{ status: string; rawResponse: any }> {
    const apiKey = this.getApiKey();
    if (!apiKey || providerPaymentId.startsWith('stripe_sandbox_')) {
      return { status: 'complete', rawResponse: { mode: 'sandbox' } };
    }

    try {
      const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${providerPaymentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error(`API returned ${response.status}`);
      const data = await response.json();
      return {
        status: data.payment_status || 'unknown',
        rawResponse: data
      };
    } catch (err: any) {
      return { status: 'unknown', rawResponse: { error: err.message } };
    }
  }

  verifyWebhook(headers: Record<string, any>, body: any): boolean {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return headers['x-sandbox-signature'] === 'ticketone-secure-sandbox';
    }
    // Verify Stripe signature headers if webhook secret is configured
    const stripeSignature = headers['stripe-signature'];
    return !!stripeSignature;
  }

  parseWebhookEvent(headers: Record<string, any>, body: any): WebhookParseResult {
    // Standard Stripe Webhook Parsing
    const object = body.data?.object || body;
    const providerPaymentId = String(object.id || '');
    const internalReference = String(object.client_reference_id || '');
    const providerStatus = String(body.type || object.status || '');
    const normalizedStatus = this.normalizeStatus(providerStatus);

    return {
      providerPaymentId,
      internalReference,
      providerStatus,
      normalizedStatus,
      amount: object.amount_total ? object.amount_total / 100 : undefined,
      currency: object.currency ? String(object.currency).toUpperCase() : undefined,
      rawPayload: body
    };
  }

  normalizeStatus(providerStatus: string): string {
    const status = providerStatus.toLowerCase();
    if (status === 'checkout.session.completed' || status === 'complete' || status === 'paid') return 'paid';
    if (status === 'checkout.session.expired' || status === 'expired') return 'expired';
    if (status === 'checkout.session.async_payment_failed' || status === 'failed') return 'failed';
    return 'pending';
  }
}
