import crypto from 'crypto';
import { PaymentProvider, PaymentProviderInput, PaymentProviderOutput, WebhookParseResult } from './baseProvider';

export class NOWPaymentsProvider implements PaymentProvider {
  name = 'nowpayments';

  private getApiKey(): string | undefined {
    return process.env.NOWPAYMENTS_API_KEY;
  }

  async createPayment(input: PaymentProviderInput): Promise<PaymentProviderOutput> {
    const apiKey = this.getApiKey();
    const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://pay.owlenix.com';
    const rawBaseUrl = process.env.NOWPAYMENTS_BASE_URL || 'https://api.nowpayments.io';
    // Clean base URL to support both with and without /v1
    const baseUrl = rawBaseUrl.endsWith('/v1') ? rawBaseUrl : `${rawBaseUrl}/v1`;

    const isProduction = process.env.NODE_ENV === 'production' || 
                        process.env.VERCEL === '1' || 
                        (process.env.APP_URL && !process.env.APP_URL.includes('localhost')) ||
                        (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes('localhost'));
    const isSandboxMode = process.env.NOWPAYMENTS_SANDBOX_MODE !== 'false';
    const isLiveOnly = !isSandboxMode || isProduction;

    if (!apiKey) {
      console.warn(`[NOWPayments] API Key missing. Live Only Mode: ${isLiveOnly}`);
      if (isLiveOnly) {
        throw new Error("Secure checkout could not be prepared. Please contact support.");
      }
      console.log(`[NOWPayments] Routing to integrated Sandbox checkout.`);
      return {
        providerPaymentId: `now_sandbox_${Math.random().toString(36).substring(2, 10)}`,
        checkoutUrl: `${appUrl}/checkout/sandbox?ref=${input.payment_reference}&provider=nowpayments`,
        rawResponse: { mode: 'sandbox', input }
      };
    }

    try {
      const webhookUrl = process.env.NOWPAYMENTS_WEBHOOK_URL || `${appUrl}/api/webhooks/nowpayments`;
      
      let successUrl = process.env.PAYMENT_SUCCESS_URL || `${appUrl}/payment/success`;
      if (successUrl && !successUrl.includes('ref=')) {
        successUrl += (successUrl.includes('?') ? '&' : '?') + `ref=${input.payment_reference}`;
      }

      let cancelUrl = process.env.PAYMENT_CANCEL_URL || `${appUrl}/payment/cancelled`;
      if (cancelUrl && !cancelUrl.includes('ref=')) {
        cancelUrl += (cancelUrl.includes('?') ? '&' : '?') + `ref=${input.payment_reference}`;
      }

      const requestPayload = {
        price_amount: input.amount,
        price_currency: input.currency.toLowerCase(),
        order_id: input.payment_reference,
        order_description: input.description || 'Confidential Advisory Retainer Fee',
        ipn_callback_url: webhookUrl,
        success_url: successUrl,
        cancel_url: cancelUrl
      };

      // Detailed server-side logging for the request (hiding keys/secrets)
      console.log(`[NOWPayments Live API Call] Initiating payment for order ${input.payment_reference}`);
      console.log(`[NOWPayments Live API Call] URL: ${baseUrl}/invoice`);
      console.log(`[NOWPayments Live API Call] Payload:`, JSON.stringify(requestPayload, null, 2));

      const response = await fetch(`${baseUrl}/invoice`, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestPayload)
      });

      console.log(`[NOWPayments Live API Call] Response HTTP Status: ${response.status}`);

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[NOWPayments Live API Error] HTTP Status ${response.status}:`, errText);
        throw new Error(`NOWPayments API error status ${response.status}: ${errText}`);
      }

      const data = await response.json();
      console.log(`[NOWPayments Live API Success] Response Payload:`, JSON.stringify(data, null, 2));

      if (!data.invoice_url) {
        console.error(`[NOWPayments Live API Error] invoice_url missing in response:`, JSON.stringify(data));
        throw new Error('Invoice URL is missing in NOWPayments API response.');
      }

      return {
        providerPaymentId: String(data.id),
        checkoutUrl: data.invoice_url,
        rawResponse: data
      };
    } catch (err: any) {
      console.error('[NOWPayments] Detailed Live API Failure:', err.message || err);
      if (isLiveOnly) {
        throw new Error("Secure checkout could not be prepared. Please contact support.");
      }
      return {
        providerPaymentId: `now_err_fallback_${Math.random().toString(36).substring(2, 10)}`,
        checkoutUrl: `${appUrl}/checkout/sandbox?ref=${input.payment_reference}&provider=nowpayments&error=live_api_failed`,
        rawResponse: { mode: 'error_fallback', error: err.message, input }
      };
    }
  }

  async getPaymentStatus(providerPaymentId: string): Promise<{ status: string; rawResponse: any }> {
    const apiKey = this.getApiKey();
    const rawBaseUrl = process.env.NOWPAYMENTS_BASE_URL || 'https://api.nowpayments.io';
    const baseUrl = rawBaseUrl.endsWith('/v1') ? rawBaseUrl : `${rawBaseUrl}/v1`;

    if (!apiKey || providerPaymentId.startsWith('now_sandbox_')) {
      return { status: 'paid', rawResponse: { mode: 'sandbox' } };
    }

    try {
      const response = await fetch(`${baseUrl}/payment/${providerPaymentId}`, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
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
    const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET;
    const signature = headers['x-nowpayments-sig'] || headers['X-Nowpayments-Sig'];

    // If sandbox / local simulation (no secret is configured), fallback safely to mock header
    if (!ipnSecret) {
      console.warn('[NOWPayments] NOWPAYMENTS_IPN_SECRET environment variable is missing. Allowing sandbox fallback signatures.');
      return headers['x-sandbox-signature'] === 'ticketone-secure-sandbox' || !!signature;
    }

    if (!signature) {
      console.warn('[NOWPayments] x-nowpayments-sig header is missing from webhook request.');
      return false;
    }

    try {
      // Sort keys alphabetically as specified by NOWPayments
      const sortedData: Record<string, any> = {};
      Object.keys(body).sort().forEach(key => {
        sortedData[key] = body[key];
      });

      // Construct HMAC-SHA512
      const hmac = crypto.createHmac('sha512', ipnSecret);
      hmac.update(JSON.stringify(sortedData));
      const calculatedSignature = hmac.digest('hex');

      const isMatch = calculatedSignature === signature;
      if (!isMatch) {
        console.warn(`[NOWPayments] Webhook signature mismatch! Calculated: ${calculatedSignature}, Header: ${signature}`);
      }
      return isMatch;
    } catch (err: any) {
      console.error('[NOWPayments] Error calculating webhook signature:', err.message);
      return false;
    }
  }

  parseWebhookEvent(headers: Record<string, any>, body: any): WebhookParseResult {
    const providerPaymentId = String(body.payment_id || body.id || '');
    const internalReference = String(body.order_id || '');
    const providerStatus = String(body.payment_status || body.status || '');
    const normalizedStatus = this.normalizeStatus(providerStatus);

    return {
      providerPaymentId,
      internalReference,
      providerStatus,
      normalizedStatus,
      amount: body.price_amount ? parseFloat(body.price_amount) : undefined,
      currency: body.price_currency ? String(body.price_currency).toUpperCase() : undefined,
      rawPayload: body
    };
  }

  normalizeStatus(providerStatus: string): string {
    const status = providerStatus.toLowerCase();
    if (['finished', 'sending', 'confirmed', 'success'].includes(status)) return 'paid';
    if (['failed'].includes(status)) return 'failed';
    if (['expired'].includes(status)) return 'expired';
    if (['refunded'].includes(status)) return 'refunded';
    if (['waiting', 'confirming', 'pending'].includes(status)) return 'pending';
    return 'pending';
  }
}
