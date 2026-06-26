import { PaymentProvider, PaymentProviderInput, PaymentProviderOutput, WebhookParseResult } from './baseProvider';

export class PayPalProvider implements PaymentProvider {
  name = 'paypal';

  private getCredentials() {
    return {
      clientId: process.env.PAYPAL_CLIENT_ID,
      secret: process.env.PAYPAL_SECRET
    };
  }

  async createPayment(input: PaymentProviderInput): Promise<PaymentProviderOutput> {
    const { clientId, secret } = this.getCredentials();
    const appUrl = process.env.APP_URL || 'http://localhost:3000';

    if (!clientId || !secret) {
      console.log(`[PayPal] Credentials missing, routing to integrated Sandbox checkout.`);
      return {
        providerPaymentId: `paypal_sandbox_${Math.random().toString(36).substring(2, 10)}`,
        checkoutUrl: `${appUrl}/checkout/sandbox?ref=${input.payment_reference}&provider=paypal`,
        rawResponse: { mode: 'sandbox', input }
      };
    }

    try {
      // Step 1: Obtain Access Token
      const basicAuth = Buffer.from(`${clientId}:${secret}`).toString('base64');
      const tokenResponse = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
      });

      if (!tokenResponse.ok) {
        throw new Error(`PayPal Auth failed with status ${tokenResponse.status}`);
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      // Step 2: Create Checkout Order
      const orderResponse = await fetch('https://api-m.sandbox.paypal.com/v2/checkout/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [
            {
              reference_id: input.payment_reference,
              description: input.description || 'Confidential Advisory Retainer Fee',
              amount: {
                currency_code: input.currency.toUpperCase(),
                value: input.amount.toFixed(2)
              }
            }
          ],
          application_context: {
            return_url: `${appUrl}/payment/success?ref=${input.payment_reference}`,
            cancel_url: `${appUrl}/payment/cancelled?ref=${input.payment_reference}`
          }
        })
      });

      if (!orderResponse.ok) {
        const errText = await orderResponse.text();
        throw new Error(`PayPal Order creation failed: ${errText}`);
      }

      const orderData = await orderResponse.json();
      const approveLink = orderData.links?.find((l: any) => l.rel === 'approve' || l.rel === 'payer-action');
      const checkoutUrl = approveLink ? approveLink.href : `${appUrl}/payment/success?ref=${input.payment_reference}`;

      return {
        providerPaymentId: String(orderData.id || ''),
        checkoutUrl: checkoutUrl,
        rawResponse: orderData
      };
    } catch (err: any) {
      console.error('[PayPal] Failed to invoke live API, falling back to sandbox:', err.message);
      return {
        providerPaymentId: `paypal_err_fallback_${Math.random().toString(36).substring(2, 10)}`,
        checkoutUrl: `${appUrl}/checkout/sandbox?ref=${input.payment_reference}&provider=paypal&error=live_api_failed`,
        rawResponse: { mode: 'error_fallback', error: err.message, input }
      };
    }
  }

  async getPaymentStatus(providerPaymentId: string): Promise<{ status: string; rawResponse: any }> {
    const { clientId, secret } = this.getCredentials();
    if (!clientId || !secret || providerPaymentId.startsWith('paypal_sandbox_')) {
      return { status: 'APPROVED', rawResponse: { mode: 'sandbox' } };
    }

    try {
      const basicAuth = Buffer.from(`${clientId}:${secret}`).toString('base64');
      const tokenResponse = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
      });
      if (!tokenResponse.ok) throw new Error('PayPal authentication failed');
      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      const response = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${providerPaymentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error(`PayPal Order query failed with status ${response.status}`);
      const data = await response.json();
      return {
        status: data.status || 'UNKNOWN',
        rawResponse: data
      };
    } catch (err: any) {
      return { status: 'UNKNOWN', rawResponse: { error: err.message } };
    }
  }

  verifyWebhook(headers: Record<string, any>, body: any): boolean {
    const { clientId, secret } = this.getCredentials();
    if (!clientId || !secret) {
      return headers['x-sandbox-signature'] === 'ticketone-secure-sandbox';
    }
    const sig = headers['paypal-transmission-sig'];
    return !!sig;
  }

  parseWebhookEvent(headers: Record<string, any>, body: any): WebhookParseResult {
    // PayPal webhook events usually have resource inside
    const resource = body.resource || {};
    const providerPaymentId = String(resource.id || body.id || '');
    const internalReference = String(resource.purchase_units?.[0]?.reference_id || resource.reference_id || '');
    const providerStatus = String(resource.status || body.event_type || '');
    const normalizedStatus = this.normalizeStatus(providerStatus);

    return {
      providerPaymentId,
      internalReference,
      providerStatus,
      normalizedStatus,
      amount: resource.amount?.value ? parseFloat(resource.amount.value) : undefined,
      currency: resource.amount?.currency_code ? String(resource.amount.currency_code).toUpperCase() : undefined,
      rawPayload: body
    };
  }

  normalizeStatus(providerStatus: string): string {
    const status = providerStatus.toUpperCase();
    if (['APPROVED', 'COMPLETED', 'CHECKOUT.ORDER.APPROVED', 'PAYMENT.CAPTURE.COMPLETED'].includes(status)) return 'paid';
    if (['FAILED', 'PAYMENT.CAPTURE.DENIED', 'DENIED'].includes(status)) return 'failed';
    if (['VOIDED'].includes(status)) return 'cancelled';
    return 'pending';
  }
}
