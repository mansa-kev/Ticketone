import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Info, CreditCard, Lock, ArrowUpRight, CheckCircle, XCircle, AlertCircle, RefreshCw, QrCode } from 'lucide-react';

interface SandboxPaymentDetails {
  id: string;
  client_name: string;
  client_email: string;
  amount: number;
  currency: string;
  description: string;
  internal_reference: string;
}

export default function SandboxCheckout() {
  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState<SandboxPaymentDetails | null>(null);
  const [provider, setProvider] = useState<string>('nowpayments');
  const [selectedCrypto, setSelectedCrypto] = useState<string>('USDT-TRC20');
  const [simulating, setSimulating] = useState<boolean>(false);
  const [simulationStatus, setSimulationStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref') || params.get('txId');
    const prov = params.get('provider') || 'nowpayments';
    setProvider(prov.toLowerCase());

    if (!ref) {
      setError('Missing payment reference parameter (?ref=).');
      setLoading(false);
      return;
    }

    // Fetch the payment details from backend
    fetch(`/api/payments/status/${ref}`)
      .then((res) => {
        if (!res.ok) throw new Error('Payment reference not found on server.');
        return res.json();
      })
      .then((data) => {
        if (data.success && data.payment) {
          setPayment({
            id: data.payment.id,
            client_name: data.payment.client_name,
            client_email: data.payment.client_email,
            amount: data.payment.amount,
            currency: data.payment.currency,
            description: data.payment.description,
            internal_reference: data.payment.internal_reference,
          });
        } else {
          throw new Error('Could not parse payment record.');
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const triggerWebhookSimulation = async (status: 'success' | 'failed' | 'cancelled') => {
    if (!payment) return;
    setSimulating(true);
    setSimulationStatus('Establishing secure enclave connection...');

    let webhookPayload: any = {};
    const ref = payment.internal_reference;
    const amount = payment.amount;
    const currency = payment.currency;

    // Build correct payloads for each mock adapter to parse
    if (provider === 'nowpayments') {
      webhookPayload = {
        payment_id: `now_sb_${Math.floor(100000 + Math.random() * 900000)}`,
        order_id: ref,
        payment_status: status === 'success' ? 'finished' : status === 'failed' ? 'failed' : 'expired',
        price_amount: amount,
        price_currency: currency.toLowerCase(),
      };
    } else if (provider === 'binancepay') {
      webhookPayload = {
        status: status === 'success' ? 'SUCCESS' : 'FAILED',
        data: {
          prepayId: `bin_sb_${Math.floor(100000 + Math.random() * 900000)}`,
          merchantTradeNo: ref,
          status: status === 'success' ? 'PAID' : status === 'failed' ? 'FAILED' : 'CANCELED',
          orderAmount: amount.toFixed(2),
          currency: currency.toUpperCase(),
        },
      };
    } else if (provider === 'stripe') {
      webhookPayload = {
        type: status === 'success' 
          ? 'checkout.session.completed' 
          : status === 'failed' 
            ? 'checkout.session.async_payment_failed' 
            : 'checkout.session.expired',
        data: {
          object: {
            id: `str_sb_${Math.floor(100000 + Math.random() * 900000)}`,
            client_reference_id: ref,
            payment_status: status === 'success' ? 'paid' : 'unpaid',
            amount_total: amount * 100,
            currency: currency.toLowerCase(),
          },
        },
      };
    } else if (provider === 'paypal') {
      webhookPayload = {
        event_type: status === 'success' ? 'PAYMENT.CAPTURE.COMPLETED' : 'PAYMENT.CAPTURE.DENIED',
        id: `pay_sb_${Math.floor(100000 + Math.random() * 900000)}`,
        resource: {
          id: `pay_sb_res_${Math.floor(100000 + Math.random() * 900000)}`,
          status: status === 'success' ? 'COMPLETED' : 'DENIED',
          purchase_units: [
            {
              reference_id: ref,
              amount: {
                value: amount.toFixed(2),
                currency_code: currency.toUpperCase(),
              },
            },
          ],
        },
      };
    }

    setTimeout(async () => {
      setSimulationStatus('Encrypting settlement ledger packet...');
      setTimeout(async () => {
        setSimulationStatus('Transmitting secure webhook callback...');
        try {
          // Invoke actual server webhook receiver!
          const response = await fetch('/api/webhooks/payment-provider', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-sandbox-signature': 'ticketone-secure-sandbox',
            },
            body: JSON.stringify(webhookPayload),
          });

          if (!response.ok) {
            throw new Error(`Server returned webhook status error ${response.status}`);
          }

          setSimulationStatus('Relocating client browser session...');
          setTimeout(() => {
            if (status === 'success') {
              window.location.href = `/payment/success?ref=${ref}`;
            } else if (status === 'cancelled') {
              window.location.href = `/payment/cancelled?ref=${ref}`;
            } else {
              window.location.href = `/payment/failed?ref=${ref}`;
            }
          }, 800);
        } catch (err: any) {
          console.error(err);
          setSimulationStatus(`Simulation failed: ${err.message}`);
          setSimulating(false);
        }
      }, 1000);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <RefreshCw className="h-10 w-10 text-muted-gold animate-spin mb-4" />
        <p className="text-sm font-mono text-cool-grey">Handshaking to secure Sandbox enclave...</p>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <AlertCircle className="h-12 w-12 text-error-red mb-4" />
        <h3 className="font-serif text-xl text-softivory mb-2">Simulation Handler Error</h3>
        <p className="text-sm text-cool-grey mb-6">{error || 'Unknown gateway exception'}</p>
        <button
          onClick={() => (window.location.href = '/')}
          className="border border-white/20 hover:border-white/40 px-6 py-2.5 rounded text-xs font-mono tracking-wider transition-all"
        >
          RETURN TO PLATFORM PORTAL
        </button>
      </div>
    );
  }

  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: payment.currency,
  }).format(payment.amount);

  return (
    <div className="py-12 px-6 max-w-4xl mx-auto" id="sandbox-payment-simulation-stage">
      
      {/* Dev Environment Header */}
      <div className="mb-8 border border-muted-gold/20 bg-muted-gold/5 rounded-lg p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-muted-gold opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-muted-gold"></span>
          </span>
          <div>
            <h4 className="font-mono text-xs font-semibold text-muted-gold tracking-wider uppercase">
              TICKETONE WEBHOOK & SANDBOX CONSOLE
            </h4>
            <p className="text-[11px] text-cool-grey/80 font-sans mt-0.5">
              Testing the complete backend payment provider webhook loop without actual funding.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            disabled={simulating}
            onClick={() => triggerWebhookSimulation('success')}
            className="bg-success-green hover:bg-success-green/90 text-black px-4 py-1.5 rounded text-xs font-mono font-semibold transition-all"
          >
            FORCE WEBHOOK CONFIRMATION
          </button>
          <button
            disabled={simulating}
            onClick={() => triggerWebhookSimulation('failed')}
            className="bg-error-red/10 border border-error-red/30 hover:bg-error-red/20 text-error-red px-3 py-1.5 rounded text-xs font-mono transition-all"
          >
            FORCE FAILURE
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Hand: Billfold overview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#0b0f17] border border-white/[0.04] p-6 rounded-xl space-y-4">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-cool-grey/60">TICKETONE INTENT</p>
              <h3 className="font-serif text-xl font-light text-softivory mt-1">Sovereign Advisory Settlement</h3>
            </div>
            
            <div className="border-t border-white/[0.04] pt-4 space-y-3 text-xs font-sans text-cool-grey">
              <div className="flex justify-between">
                <span>Client Name:</span>
                <span className="text-softivory font-medium">{payment.client_name}</span>
              </div>
              <div className="flex justify-between">
                <span>Client Email:</span>
                <span className="text-softivory font-mono">{payment.client_email}</span>
              </div>
              <div className="flex justify-between">
                <span>Invoice Ref:</span>
                <span className="text-softivory font-mono">{payment.internal_reference}</span>
              </div>
              <div className="flex justify-between">
                <span>Description:</span>
                <span className="text-softivory text-right max-w-[180px] line-clamp-2">{payment.description}</span>
              </div>
            </div>

            <div className="border-t border-white/[0.04] pt-4 flex justify-between items-baseline">
              <span className="text-xs text-cool-grey">Settlement Value:</span>
              <span className="text-2xl font-serif text-muted-gold">{formattedAmount}</span>
            </div>
          </div>

          <div className="p-4 bg-white/[0.01] border border-white/[0.03] rounded-lg text-center text-[10px] text-cool-grey/40 font-mono">
            SECURE SANDBOX TRANSACTION GATEWAY v3.12 <br />
            NO RECURRENT CHARGES OR RE-ROUTE LEAKS
          </div>
        </div>

        {/* Right Hand: Customized Provider Mock Checkout Frame */}
        <div className="lg:col-span-7">
          <div className="border border-white/[0.06] bg-[#0c101b] rounded-xl overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.6)]">
            
            {/* Provider Brand Tab Header */}
            <div className="px-6 py-4 border-b border-white/[0.04] bg-black/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-serif text-sm font-bold tracking-widest text-softivory">
                  {provider === 'nowpayments' && 'NOWPayments Crypto'}
                  {provider === 'binancepay' && 'Binance Pay'}
                  {provider === 'stripe' && 'Stripe Checkout'}
                  {provider === 'paypal' && 'PayPal Express'}
                </span>
                <span className="text-[10px] font-mono tracking-widest bg-white/5 px-2 py-0.5 rounded text-cool-grey">
                  SANDBOX STAGE
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-success-green">
                <ShieldCheck className="h-4 w-4" />
                <span className="font-mono text-[10px] tracking-wider uppercase">SSL Secure Session</span>
              </div>
            </div>

            {/* Simulated Checkout Box */}
            <div className="p-8">
              {simulating ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <RefreshCw className="h-10 w-10 text-muted-gold animate-spin mb-4" />
                  <p className="text-sm font-mono text-softivory font-medium mb-1">{simulationStatus}</p>
                  <p className="text-xs text-cool-grey/60">Executing cryptographic state transitions on backend...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* --- 1. NOWPAYMENTS VIEW --- */}
                  {provider === 'nowpayments' && (
                    <div className="space-y-4">
                      <div className="p-4 bg-primary-navy/40 border border-white/[0.04] rounded-lg">
                        <p className="text-xs font-sans text-cool-grey leading-relaxed">
                          Please select your preferred digital settlement asset. NOWPayments will monitor the specified blockchain ledger for the corresponding token deposit.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        {[
                          { name: 'USDT (TRC20)', asset: 'USDT-TRC20' },
                          { name: 'USDT (ERC20)', asset: 'USDT-ERC20' },
                          { name: 'Bitcoin (BTC)', asset: 'BTC' },
                          { name: 'Ethereum (ETH)', asset: 'ETH' },
                        ].map((item) => (
                          <button
                            key={item.asset}
                            onClick={() => setSelectedCrypto(item.asset)}
                            className={`p-3 rounded border text-left font-mono font-medium transition-all ${
                              selectedCrypto === item.asset
                                ? 'border-muted-gold bg-muted-gold/10 text-muted-gold'
                                : 'border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.03] text-cool-grey'
                            }`}
                          >
                            {item.name}
                          </button>
                        ))}
                      </div>

                      <div className="p-4 border border-dashed border-white/[0.08] rounded-lg text-center space-y-3">
                        <div className="inline-block p-2 bg-white rounded-md mb-1">
                          <QrCode className="h-28 w-28 text-black" />
                        </div>
                        <div className="text-center font-mono">
                          <p className="text-[10px] text-cool-grey uppercase">Deposit Address</p>
                          <p className="text-xs text-softivory font-semibold mt-1 select-all break-all">
                            T9yD14Nj9yD14Nj9yD14Nj9yD14Nj9yD14N
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => triggerWebhookSimulation('success')}
                        className="w-full bg-muted-gold hover:bg-muted-gold/90 text-black py-3 rounded text-xs font-mono tracking-widest font-semibold transition-all mt-4"
                      >
                        SIMULATE BLOCKCHAIN TX DEPOSIT
                      </button>
                    </div>
                  )}

                  {/* --- 2. BINANCE PAY VIEW --- */}
                  {provider === 'binancepay' && (
                    <div className="space-y-6">
                      <div className="text-center space-y-3">
                        <div className="bg-yellow-400 text-black inline-block p-4 rounded-full font-serif font-black tracking-tighter text-2xl">
                          B!
                        </div>
                        <h4 className="font-serif text-lg text-softivory font-light">Scan QR Code with Binance App</h4>
                        <p className="text-xs text-cool-grey max-w-sm mx-auto leading-relaxed">
                          Scan the dynamic code using your secure Binance Wallet. Handshake tokenization secures client details completely.
                        </p>
                      </div>

                      <div className="flex justify-center">
                        <div className="border-4 border-yellow-400 p-3 bg-white rounded-xl">
                          <QrCode className="h-32 w-32 text-black" />
                        </div>
                      </div>

                      <div className="text-center text-[10px] font-mono text-cool-grey/60 uppercase tracking-wider">
                        PREPAY_ID: {payment.id} • EXPIRES IN 14M 59S
                      </div>

                      <button
                        onClick={() => triggerWebhookSimulation('success')}
                        className="w-full bg-yellow-400 hover:bg-yellow-400/90 text-black py-3 rounded text-xs font-mono tracking-widest font-bold transition-all"
                      >
                        AUTHORIZE BINANCE APP PAY OUT
                      </button>
                    </div>
                  )}

                  {/* --- 3. STRIPE VIEW --- */}
                  {provider === 'stripe' && (
                    <div className="space-y-4 font-sans text-cool-grey">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-softivory">Email Address</label>
                        <input
                          type="text"
                          readOnly
                          value={payment.client_email}
                          className="w-full bg-white/[0.03] border border-white/[0.08] rounded p-2.5 text-xs text-cool-grey/80 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-softivory">Card Credentials</label>
                        <div className="w-full bg-white/[0.03] border border-white/[0.08] rounded p-2.5 flex justify-between items-center">
                          <span className="font-mono text-xs text-softivory">•••• •••• •••• 4242</span>
                          <span className="font-mono text-[10px] tracking-wider bg-white/5 px-1.5 py-0.5 rounded text-cool-grey">
                            09 / 28
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-softivory">Client Name</label>
                          <input
                            type="text"
                            readOnly
                            value={payment.client_name}
                            className="w-full bg-white/[0.03] border border-white/[0.08] rounded p-2.5 text-xs text-cool-grey/80 focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-softivory">Country/Region</label>
                          <input
                            type="text"
                            readOnly
                            value="Switzerland"
                            className="w-full bg-white/[0.03] border border-white/[0.08] rounded p-2.5 text-xs text-cool-grey/80 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="p-3 bg-white/[0.02] border border-white/[0.04] rounded flex items-start gap-2 text-[10px] leading-normal text-cool-grey/60 mt-2">
                        <Info className="h-4 w-4 text-muted-gold flex-shrink-0 mt-0.5" />
                        <span>
                          Simulating payment vault execution. In live modes, card hold reservation operates directly on banking ledger boundaries.
                        </span>
                      </div>

                      <button
                        onClick={() => triggerWebhookSimulation('success')}
                        className="w-full bg-[#635bff] hover:bg-[#635bff]/90 text-white py-3 rounded text-xs font-mono tracking-widest font-semibold transition-all mt-4"
                      >
                        SIMULATE SUCCESSFUL STRIPE SETTLEMENT
                      </button>
                    </div>
                  )}

                  {/* --- 4. PAYPAL VIEW --- */}
                  {provider === 'paypal' && (
                    <div className="space-y-6 text-center">
                      <div className="p-6 bg-blue-900/10 border border-blue-500/10 rounded-xl space-y-3">
                        <span className="font-serif italic font-black text-2xl text-[#003087]">
                          Pay<span className="text-[#0079c1]">Pal</span>
                        </span>
                        <h4 className="font-sans text-sm font-semibold text-softivory">Express Ledger Payout</h4>
                        <p className="text-xs text-cool-grey leading-relaxed">
                          Logged in securely as <span className="font-semibold text-softivory">{payment.client_email}</span>. Click authorize below to issue transactional settlement.
                        </p>
                      </div>

                      <div className="p-4 border border-white/[0.04] bg-white/[0.01] rounded text-xs text-left space-y-1.5 text-cool-grey">
                        <div className="flex justify-between">
                          <span>Payment Method:</span>
                          <span className="font-medium text-softivory">PayPal Verified Wallet Hold</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Recipient:</span>
                          <span className="font-mono text-softivory">Ticketone Private Advisory Ltd.</span>
                        </div>
                      </div>

                      <button
                        onClick={() => triggerWebhookSimulation('success')}
                        className="w-full bg-[#ffc439] hover:bg-[#ffc439]/90 text-black py-3 rounded-full text-xs font-mono font-bold tracking-widest transition-all shadow-[0_4px_15px_rgba(255,196,57,0.15)]"
                      >
                        AUTHORIZE PAYPAL CAPTURE
                      </button>
                    </div>
                  )}

                  {/* Common Cancellation link */}
                  <div className="text-center pt-2">
                    <button
                      onClick={() => triggerWebhookSimulation('cancelled')}
                      className="text-xs text-cool-grey/50 hover:text-cool-grey font-mono underline transition-all"
                    >
                      Cancel transaction and return to portal
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
