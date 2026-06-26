import { PaymentProvider } from './baseProvider';
import { NOWPaymentsProvider } from './nowpaymentsProvider';
import { BinancePayProvider } from './binancePayProvider';
import { StripeProvider } from './stripeProvider';
import { PayPalProvider } from './paypalProvider';

export * from './baseProvider';
export * from './nowpaymentsProvider';
export * from './binancePayProvider';
export * from './stripeProvider';
export * from './paypalProvider';

export function getActiveProvider(): PaymentProvider {
  // Read active payment provider from environment, default to nowpayments
  const providerName = (process.env.PAYMENT_PROVIDER || 'nowpayments').toLowerCase().trim();

  switch (providerName) {
    case 'binance':
    case 'binancepay':
      return new BinancePayProvider();
    case 'stripe':
      return new StripeProvider();
    case 'paypal':
      return new PayPalProvider();
    case 'nowpayments':
    default:
      return new NOWPaymentsProvider();
  }
}
