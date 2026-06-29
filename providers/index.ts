import { PaymentProvider } from './baseProvider';
import { NOWPaymentsProvider } from './nowpaymentsProvider';

export * from './baseProvider';
export * from './nowpaymentsProvider';

export function getActiveProvider(): PaymentProvider {
  // Read active payment provider from environment, must be nowpayments
  const providerName = process.env.PAYMENT_PROVIDER;

  if (!providerName || providerName.toLowerCase().trim() !== 'nowpayments') {
    throw new Error("Ticketone is configured to use NOWPayments only. Invalid payment provider configuration.");
  }

  return new NOWPaymentsProvider();
}

