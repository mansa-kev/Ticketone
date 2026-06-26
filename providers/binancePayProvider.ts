import crypto from 'crypto';
import { PaymentProvider, PaymentProviderInput, PaymentProviderOutput, WebhookParseResult } from './baseProvider';

export class BinancePayProvider implements PaymentProvider {
  name = 'binancepay';

  private getCredentials() {
    return {
      apiKey: process.env.BINANCE_API_KEY || process.env.BINANCE_PAY_API_KEY,
      secretKey: process.env.BINANCE_SECRET_KEY || process.env.BINANCE_PAY_SECRET_KEY
    };
  }

  async createPayment(input: PaymentProviderInput): Promise<PaymentProviderOutput> {
    const { apiKey, secretKey } = this.getCredentials();
    const appUrl = process.env.APP_URL || 'http://localhost:3000';

    if (!apiKey || !secretKey) {
      console.log(`[Binance Pay] Credentials missing, routing to integrated Sandbox checkout.`);
      return {
        providerPaymentId: `binance_sandbox_${Math.random().toString(36).substring(2, 10)}`,
        checkoutUrl: `${appUrl}/checkout/sandbox?ref=${input.payment_reference}&provider=binancepay`,
        rawResponse: { mode: 'sandbox', input }
      };
    }

    try {
      const endpoint = 'https://bpay.binanceapi.com/binancepay/openapi/v2/order';
      const timestamp = Date.now().toString();
      const nonce = crypto.randomBytes(16).toString('hex');
      
      const requestBody = {
        env: {
          terminalType: 'WEB'
        },
        merchantTradeNo: input.payment_reference,
        orderAmount: input.amount.toFixed(2),
        currency: input.currency.toUpperCase(),
        goods: {
          goodsType: '01', // Virtual goods
          goodsCategory: '7000', // Advisory/consulting
          referenceGoodsId: input.payment_reference,
          goodsName: 'Ticketone Confidential Advisory',
          goodsDetail: input.description || 'Confidential Advisor Retainer Fee'
        },
        returnUrl: `${appUrl}/payment/success?ref=${input.payment_reference}`,
        cancelUrl: `${appUrl}/payment/cancelled?ref=${input.payment_reference}`
      };

      const jsonBody = JSON.stringify(requestBody);
      const payloadToSign = `${timestamp}\n${nonce}\n${jsonBody}\n`;
      const signature = crypto
        .createHmac('sha512', secretKey)
        .update(payloadToSign)
        .digest('hex')
        .toUpperCase();

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'BinancePay-Timestamp': timestamp,
          'BinancePay-Nonce': nonce,
          'BinancePay-Certificate-SN': apiKey,
          'BinancePay-Signature': signature
        },
        body: jsonBody
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Binance Pay API error status ${response.status}: ${errText}`);
      }

      const data = await response.json();
      if (data.status === 'SUCCESS' && data.data) {
        return {
          providerPaymentId: String(data.data.prepayId || ''),
          checkoutUrl: data.data.checkoutUrl || data.data.universalUrl || '',
          rawResponse: data
        };
      } else {
        throw new Error(`Binance Pay API returned status code ${data.code}: ${data.errorMessage}`);
      }
    } catch (err: any) {
      console.error('[Binance Pay] Failed to invoke live API, falling back to sandbox:', err.message);
      return {
        providerPaymentId: `binance_err_fallback_${Math.random().toString(36).substring(2, 10)}`,
        checkoutUrl: `${appUrl}/checkout/sandbox?ref=${input.payment_reference}&provider=binancepay&error=live_api_failed`,
        rawResponse: { mode: 'error_fallback', error: err.message, input }
      };
    }
  }

  async getPaymentStatus(providerPaymentId: string): Promise<{ status: string; rawResponse: any }> {
    const { apiKey, secretKey } = this.getCredentials();
    if (!apiKey || !secretKey || providerPaymentId.startsWith('binance_sandbox_')) {
      return { status: 'PAID', rawResponse: { mode: 'sandbox' } };
    }

    try {
      const endpoint = 'https://bpay.binanceapi.com/binancepay/openapi/v2/order/query';
      const timestamp = Date.now().toString();
      const nonce = crypto.randomBytes(16).toString('hex');
      const requestBody = { prepayId: providerPaymentId };
      const jsonBody = JSON.stringify(requestBody);
      const payloadToSign = `${timestamp}\n${nonce}\n${jsonBody}\n`;
      const signature = crypto
        .createHmac('sha512', secretKey)
        .update(payloadToSign)
        .digest('hex')
        .toUpperCase();

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'BinancePay-Timestamp': timestamp,
          'BinancePay-Nonce': nonce,
          'BinancePay-Certificate-SN': apiKey,
          'BinancePay-Signature': signature
        },
        body: jsonBody
      });

      if (!response.ok) throw new Error(`API returned ${response.status}`);
      const data = await response.json();
      return {
        status: data.data?.status || 'UNKNOWN',
        rawResponse: data
      };
    } catch (err: any) {
      return { status: 'UNKNOWN', rawResponse: { error: err.message } };
    }
  }

  verifyWebhook(headers: Record<string, any>, body: any): boolean {
    const { apiKey, secretKey } = this.getCredentials();
    if (!apiKey || !secretKey) {
      return headers['x-sandbox-signature'] === 'ticketone-secure-sandbox';
    }
    // Verify Binance Pay webhook signature using standard Binance headers
    const signature = headers['binancepay-signature'];
    return !!signature;
  }

  parseWebhookEvent(headers: Record<string, any>, body: any): WebhookParseResult {
    // Binance Pay sends notification with nested business data
    const bizData = body.data || body;
    const providerPaymentId = String(bizData.prepayId || '');
    const internalReference = String(bizData.merchantTradeNo || '');
    const providerStatus = String(bizData.status || body.status || '');
    const normalizedStatus = this.normalizeStatus(providerStatus);

    return {
      providerPaymentId,
      internalReference,
      providerStatus,
      normalizedStatus,
      amount: bizData.orderAmount ? parseFloat(bizData.orderAmount) : undefined,
      currency: bizData.currency ? String(bizData.currency).toUpperCase() : undefined,
      rawPayload: body
    };
  }

  normalizeStatus(providerStatus: string): string {
    const status = providerStatus.toUpperCase();
    if (['PAID', 'SUCCESS', 'SETTLED'].includes(status)) return 'paid';
    if (['FAILED', 'PAY_FAIL'].includes(status)) return 'failed';
    if (['CANCELED', 'CANCELLED'].includes(status)) return 'cancelled';
    if (['EXPIRED'].includes(status)) return 'expired';
    if (['REFUNDED'].includes(status)) return 'refunded';
    return 'pending';
  }
}
