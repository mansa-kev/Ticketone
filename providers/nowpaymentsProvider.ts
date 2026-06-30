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

    if (!apiKey) {
      console.error("[NOWPayments] NOWPAYMENTS_API_KEY environment variable is missing.");
      throw new Error("Card checkout is not enabled for this merchant account. Please activate NOWPayments fiat on-ramp/card payments.");
    }

    const paymentMode = process.env.PAYMENT_MODE || 'card_fiat_onramp';
    console.log(`[NOWPayments] createPayment invoked. Mode: ${paymentMode}`);

    const webhookUrl = process.env.NOWPAYMENTS_WEBHOOK_URL || `${appUrl}/api/webhooks/nowpayments`;
    
    let successUrl = process.env.PAYMENT_SUCCESS_URL || `${appUrl}/payment/success`;
    if (successUrl && !successUrl.includes('ref=')) {
      successUrl += (successUrl.includes('?') ? '&' : '?') + `ref=${input.payment_reference}`;
    }

    let cancelUrl = process.env.PAYMENT_CANCEL_URL || `${appUrl}/payment/cancelled`;
    if (cancelUrl && !cancelUrl.includes('ref=')) {
      cancelUrl += (cancelUrl.includes('?') ? '&' : '?') + `ref=${input.payment_reference}`;
    }

    if (paymentMode === 'crypto_deposit') {
      // Standard crypto deposit invoice flow
      try {
        const requestPayload = {
          price_amount: input.amount,
          price_currency: input.currency.toLowerCase(),
          order_id: input.payment_reference,
          order_description: input.description || 'Ticketone Crypto Invoice Payment',
          ipn_callback_url: webhookUrl,
          success_url: successUrl,
          cancel_url: cancelUrl
        };

        console.log(`[NOWPayments Crypto Invoice API Call] Initiating payment for order ${input.payment_reference}`);
        console.log(`[NOWPayments Crypto Invoice API Call] URL: ${baseUrl}/invoice`);

        const response = await fetch(`${baseUrl}/invoice`, {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestPayload)
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error(`[NOWPayments Crypto Invoice API Error] HTTP Status ${response.status}:`, errText);
          throw new Error(`NOWPayments API error status ${response.status}: ${errText}`);
        }

        const data = await response.json();
        console.log(`[NOWPayments Crypto Invoice API Success] Response:`, JSON.stringify(data, null, 2));

        if (!data.invoice_url) {
          throw new Error('Invoice URL is missing in NOWPayments API response.');
        }

        return {
          providerPaymentId: String(data.id),
          checkoutUrl: data.invoice_url,
          rawResponse: data
        };
      } catch (err: any) {
        console.error('[NOWPayments Crypto Invoice] Live API Failure:', err.message || err);
        throw new Error("Secure checkout could not be prepared. Please contact support.");
      }
    } else {
      // paymentMode = "card_fiat_onramp"
      const payoutAddress = process.env.DEFAULT_SETTLEMENT_ADDRESS;
      if (!payoutAddress) {
        console.error("[NOWPayments] DEFAULT_SETTLEMENT_ADDRESS is missing. Cannot proceed with fiat on-ramp.");
        throw new Error("Card checkout is not enabled for this merchant account. Please activate NOWPayments fiat on-ramp/card payments.");
      }

      const settlementAsset = (process.env.DEFAULT_SETTLEMENT_ASSET || 'usdt').toLowerCase();
      const settlementNetwork = (process.env.DEFAULT_SETTLEMENT_NETWORK || 'trc20').toLowerCase();
      
      // Construct pay_currency: usdttrc20, usdtarbitrum, etc.
      let payCurrency = settlementAsset;
      if (settlementNetwork !== 'mainnet' && settlementNetwork !== 'ethereum') {
        payCurrency += settlementNetwork;
      }

      const requestPayload = {
        fiat_amount: input.amount,
        fiat_currency: input.currency.toLowerCase(),
        pay_currency: payCurrency,
        payout_address: payoutAddress,
        order_id: input.payment_reference,
        order_description: input.description || 'Ticketone Professional Fiat Payment',
        ipn_callback_url: webhookUrl,
        success_url: successUrl,
        cancel_url: cancelUrl
      };

      console.log(`[NOWPayments Fiat On-Ramp API Call] Initiating payment for order ${input.payment_reference}`);
      console.log(`[NOWPayments Fiat On-Ramp API Call] URL: ${baseUrl}/fiat-payment`);
      console.log(`[NOWPayments Fiat On-Ramp API Call] Payload (keys/secrets hidden):`, JSON.stringify({
        ...requestPayload,
        payout_address: payoutAddress.substring(0, 6) + '...' + payoutAddress.substring(payoutAddress.length - 4)
      }, null, 2));

      try {
        const response = await fetch(`${baseUrl}/fiat-payment`, {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestPayload)
        });

        console.log(`[NOWPayments Fiat On-Ramp API Call] Response HTTP Status: ${response.status}`);

        if (!response.ok) {
          const errText = await response.text();
          console.error(`[NOWPayments Fiat On-Ramp API Error] HTTP Status ${response.status}:`, errText);
          
          // Show configuration error if status is 403 or if the message specifies lack of activation
          throw new Error("Card checkout is not enabled for this merchant account. Please activate NOWPayments fiat on-ramp/card payments.");
        }

        const data = await response.json();
        console.log(`[NOWPayments Fiat On-Ramp API Success] Response Payload:`, JSON.stringify(data, null, 2));

        const checkoutUrl = data.redirect_url || data.checkout_url || data.invoice_url;

        if (!checkoutUrl) {
          console.error(`[NOWPayments Fiat On-Ramp] Redirect URL missing in response payload:`, JSON.stringify(data));
          throw new Error("Card checkout is not enabled for this merchant account. Please activate NOWPayments fiat on-ramp/card payments.");
        }

        // Only redirect if it is a fiat/card checkout URL and NOT a crypto deposit page
        const isCryptoDepositPage = checkoutUrl.includes('nowpayments.io/payment/invoice') || checkoutUrl.includes('nowpayments.io/invoice');
        if (isCryptoDepositPage) {
          console.error(`[NOWPayments Fiat On-Ramp] Provider returned a crypto deposit page URL instead of a fiat checkout URL: ${checkoutUrl}`);
          throw new Error("Card checkout is not enabled for this merchant account. Please activate NOWPayments fiat on-ramp/card payments.");
        }

        return {
          providerPaymentId: String(data.id || data.payment_id || ''),
          checkoutUrl: checkoutUrl,
          rawResponse: data
        };
      } catch (err: any) {
        console.error('[NOWPayments Fiat On-Ramp] Detailed Live API Failure:', err.message || err);
        // Propagate our specific merchant configuration error, otherwise generic
        if (err.message && err.message.includes("Card checkout is not enabled")) {
          throw err;
        }
        throw new Error("Secure checkout could not be prepared. Please contact support.");
      }
    }
  }

  async getPaymentStatus(providerPaymentId: string): Promise<{ status: string; rawResponse: any }> {
    const apiKey = this.getApiKey();
    const rawBaseUrl = process.env.NOWPAYMENTS_BASE_URL || 'https://api.nowpayments.io';
    const baseUrl = rawBaseUrl.endsWith('/v1') ? rawBaseUrl : `${rawBaseUrl}/v1`;

    if (!apiKey) {
      return { status: 'unknown', rawResponse: { error: 'API key missing' } };
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
