import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Lock, RefreshCw, AlertCircle, ArrowRight } from 'lucide-react';

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
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

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
            description: data.payment.description || 'Confidential Professional Advisory Fee Retainer',
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

  const handleProceedToPayment = () => {
    if (!payment) return;
    setIsRedirecting(true);
    setCheckoutError(null);

    // Show a loading state to feel highly realistic, then display the clear support error
    setTimeout(() => {
      setCheckoutError('Secure checkout could not be prepared. Please contact support.');
      setIsRedirecting(false);
    }, 1800);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center bg-primary-navy">
        <RefreshCw className="h-10 w-10 text-muted-gold animate-spin mb-4" />
        <p className="text-sm font-sans text-cool-grey font-light">Loading secure payment review portal...</p>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <AlertCircle className="h-12 w-12 text-muted-gold mb-4 animate-pulse" />
        <h3 className="font-serif text-2xl text-softivory font-light mb-2">Review Access Exception</h3>
        <p className="text-sm text-cool-grey mb-6 leading-relaxed">{error || 'Unable to retrieve your private advisory details.'}</p>
        <button
          onClick={() => (window.location.href = '/')}
          className="border border-muted-gold/30 hover:border-muted-gold/60 px-6 py-3 rounded-lg text-xs font-sans uppercase tracking-wider text-softivory transition-all cursor-pointer"
        >
          Return to Portal
        </button>
      </div>
    );
  }

  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: payment.currency,
  }).format(payment.amount);

  return (
    <div className="w-full relative" id="ticketone-secure-checkout-portal">
      {/* 1. UPPER HEADER BANNER */}
      <div className="w-full bg-primary-navy pt-20 pb-32 relative overflow-hidden text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(209,232,226,0.06)_0%,transparent_70%)] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-6 relative z-10 space-y-3">
          <motion.h3 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-serif text-3xl sm:text-4xl lg:text-5xl text-softivory font-light tracking-wide"
          >
            Review Your Payment
          </motion.h3>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="text-sm sm:text-base text-cool-grey max-w-xl mx-auto font-light leading-relaxed"
          >
            Confirm your advisory payment details before proceeding to secure checkout.
          </motion.p>
        </div>

        {/* Dynamic Curved Cutout Divider */}
        <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none z-10 translate-y-[2px]">
          <svg className="relative block w-full h-[48px] sm:h-[64px]" viewBox="0 0 1440 120" preserveAspectRatio="none">
            <path d="M0,60 Q720,120 1440,60 L1440,65 Q720,125 0,65 Z" fill="#D9B08C" opacity="0.95"></path>
            <path d="M0,64 Q720,124 1440,64 L1440,120 L0,120 Z" fill="#FFFFFF"></path>
          </svg>
        </div>
      </div>

      {/* 2. BODY CONTENT SECTION */}
      <div className="w-full bg-white pt-16 pb-24 px-4 sm:px-6 relative text-charcoal-black">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
            
            {/* LEFT COLUMN: Payment Summary Card */}
            <div className="md:col-span-6 flex flex-col">
              <div className="border border-gray-100 bg-[#faf8f5] rounded-2xl p-6 sm:p-8 flex-grow flex flex-col justify-between shadow-[0_10px_35px_rgba(0,0,0,0.02)]">
                <div className="space-y-6">
                  {/* Branding Header */}
                  <div className="border-b border-gray-100 pb-4 flex justify-between items-center">
                    <div>
                      <h4 className="font-serif text-lg text-primary-navy tracking-wider uppercase font-semibold">
                        Ticketone
                      </h4>
                      <p className="text-[10px] uppercase tracking-widest text-cool-grey font-semibold mt-0.5">
                        Private Advisory Services
                      </p>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider font-mono bg-[#116466]/10 text-primary-navy px-2.5 py-1 rounded-full font-semibold">
                      Payment Summary
                    </span>
                  </div>

                  {/* Detail list */}
                  <div className="space-y-4 text-sm text-charcoal-black">
                    <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-gray-50">
                      <span className="text-gray-400 font-light">Client</span>
                      <span className="col-span-2 font-medium text-right sm:text-left">{payment.client_name}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-gray-50">
                      <span className="text-gray-400 font-light">Email</span>
                      <span className="col-span-2 font-light text-right sm:text-left break-all">{payment.client_email}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-gray-50">
                      <span className="text-gray-400 font-light">Reference</span>
                      <span className="col-span-2 font-mono text-xs font-semibold text-right sm:text-left text-primary-navy">{payment.internal_reference}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-gray-50">
                      <span className="text-gray-400 font-light">Description</span>
                      <span className="col-span-2 font-light text-right sm:text-left text-gray-700 leading-relaxed">{payment.description}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom value panel */}
                <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between items-baseline">
                  <span className="text-sm text-gray-400 font-light">Amount Due</span>
                  <div className="text-right">
                    <span className="text-3xl font-serif font-light text-primary-navy tracking-tight">{formattedAmount}</span>
                    <span className="text-[10px] font-mono text-cool-grey font-semibold block mt-0.5">{payment.currency}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Secure Checkout Card */}
            <div className="md:col-span-6 flex flex-col">
              <div className="border border-gray-100 bg-charcoal-black text-white rounded-2xl p-6 sm:p-8 flex-grow flex flex-col justify-between shadow-[0_15px_40px_rgba(0,0,0,0.1)]">
                <div className="space-y-6">
                  {/* Card Header */}
                  <div className="border-b border-white/[0.08] pb-4 flex items-center justify-between">
                    <h4 className="font-serif text-xl text-softivory font-light tracking-wide">
                      Secure Card Checkout
                    </h4>
                    <ShieldCheck className="h-5 w-5 text-muted-gold" />
                  </div>

                  {/* Description of payment partner */}
                  <div className="space-y-4">
                    <p className="text-sm text-cool-grey leading-relaxed font-light">
                      Continue to our secure payment partner to complete your card payment.
                    </p>

                    <div className="bg-white/[0.02] border border-white/[0.05] p-4 rounded-xl text-xs text-cool-grey/80 leading-relaxed font-light">
                      Your connection is encrypted with secure 256-bit protocols. All billing details are processed on secure institutional infrastructure.
                    </div>

                    {/* Checkout Failure State Banner */}
                    {checkoutError && (
                      <motion.div 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-xl text-xs flex items-start gap-3"
                      >
                        <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5 animate-pulse" />
                        <div>
                          <p className="font-semibold text-red-300">Checkout Unavailable</p>
                          <p className="mt-1 text-red-200/90 leading-relaxed">{checkoutError}</p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Primary Secure Action Controls */}
                <div className="mt-8 space-y-6">
                  <button
                    onClick={handleProceedToPayment}
                    disabled={isRedirecting}
                    className="w-full bg-muted-gold hover:bg-[#cbb27a] disabled:bg-muted-gold/40 text-charcoal-black font-semibold uppercase tracking-wider text-xs sm:text-sm py-4 px-6 rounded-lg transition-all duration-300 transform active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-muted-gold/5"
                  >
                    {isRedirecting ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin text-charcoal-black" />
                        <span>Preparing secure checkout...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 text-charcoal-black" />
                        <span>Continue to Secure Card Checkout</span>
                        <ArrowRight className="h-4 w-4 text-charcoal-black" />
                      </>
                    )}
                  </button>

                  <p className="text-[11px] text-center text-cool-grey/70 font-light leading-relaxed max-w-sm mx-auto">
                    Ticketone does not store card details. You will enter your card information on our secure payment partner’s checkout page.
                  </p>

                  {/* Accepted Payment Logos */}
                  <div className="border-t border-white/[0.06] pt-6 space-y-3 text-center">
                    <h5 className="text-[10px] uppercase tracking-widest text-cool-grey font-semibold">
                      We Accept
                    </h5>
                    
                    <div className="flex flex-wrap items-center justify-center gap-2.5">
                      {/* AMEX */}
                      <div className="bg-[#0070d3] text-white border border-[#005fb3] rounded-md px-2 py-0.5 h-7 w-12 flex flex-col items-center justify-center select-none shadow-sm">
                        <span className="font-sans font-black text-[9px] tracking-tighter leading-none">AM</span>
                        <span className="font-sans font-black text-[9px] tracking-tighter leading-none">EX</span>
                      </div>

                      {/* Discover */}
                      <div className="bg-white border border-gray-300 rounded-md px-2 py-0.5 h-7 w-12 flex items-center justify-center select-none shadow-sm">
                        <span className="font-sans font-extrabold text-[#3b3b3b] text-[8px] tracking-tighter">DISC<span className="text-[#f15a24] font-black">O</span>VER</span>
                      </div>

                      {/* Mastercard */}
                      <div className="bg-[#1f1f1f] border border-[#3a3a3a] rounded-md px-2 py-0.5 h-7 w-12 flex items-center justify-center gap-0.5 select-none shadow-sm">
                        <div className="flex -space-x-1.5">
                          <div className="w-3.5 h-3.5 rounded-full bg-[#f91c1c] opacity-95"></div>
                          <div className="w-3.5 h-3.5 rounded-full bg-[#ff9900] mix-blend-screen"></div>
                        </div>
                      </div>

                      {/* Visa */}
                      <div className="bg-[#0f172a] text-white border border-[#334155] rounded-md px-2 py-0.5 h-7 w-12 flex items-center justify-center select-none shadow-sm">
                        <span className="font-sans font-extrabold italic text-[9px] tracking-wider text-[#f59e0b]">VISA</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
