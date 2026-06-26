import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Lock, RefreshCw, AlertCircle, ArrowRight, CheckCircle, XCircle, Calendar, ArrowLeft } from 'lucide-react';
import { dbService } from '../lib/supabase';
import { PaymentRequest } from '../types';

interface ClientPayProps {
  token: string;
}

export default function ClientPay({ token }: ClientPayProps) {
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<PaymentRequest | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    const loadRequest = async () => {
      try {
        const requests = await dbService.getNewPaymentRequests();
        const found = requests.find(r => r.token === token);

        if (!found) {
          setError('Advisory payment link not found or invalid. Please check the URL.');
          setLoading(false);
          return;
        }

        // If request is 'sent', automatically update it to 'opened' and log timestamp
        if (found.status === 'sent') {
          const updated = await dbService.updateNewRequestStatus(found.id, 'opened', {
            openedAt: new Date().toISOString()
          });
          const updatedRequest = updated.find(r => r.id === found.id);
          if (updatedRequest) {
            setRequest(updatedRequest);
          } else {
            setRequest({ ...found, status: 'opened', openedAt: new Date().toISOString() });
          }
        } else {
          setRequest(found);
        }

        setLoading(false);
      } catch (err: any) {
        console.error('Error loading client payment request:', err);
        setError('Error retrieving private advisory payment information.');
        setLoading(false);
      }
    };

    loadRequest();
  }, [token]);

  const handleProceedToPayment = async () => {
    if (!request) return;
    setIsRedirecting(true);
    setCheckoutError(null);

    try {
      // 1. Create payment in our backend database
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_name: request.clientName,
          client_email: request.clientEmail,
          amount: request.amount,
          currency: request.currency,
          payment_reference: request.reference,
          description: request.description || 'Confidential Professional Advisory Fee Retainer'
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Server rejected payment handshake.');
      }

      const data = await response.json();
      if (data.success && data.checkout_url) {
        // Update request status to pending_payment in our mock/local storage state
        await dbService.updateNewRequestStatus(request.id, 'pending_payment');
        
        // Direct redirection to checkout session page hosted by provider (NOWPayments etc)
        window.location.href = data.checkout_url;
      } else {
        throw new Error('No secure checkout URL returned from clearing house.');
      }
    } catch (err: any) {
      console.error('Client payment checkout redirection failed:', err);
      setCheckoutError(err.message || 'Unable to prepare secure checkout. Please contact your private controller.');
      setIsRedirecting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center bg-primary-navy">
        <RefreshCw className="h-10 w-10 text-muted-gold animate-spin mb-4" />
        <p className="text-sm font-sans text-cool-grey font-light">Loading secure private payment desk...</p>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <AlertCircle className="h-12 w-12 text-muted-gold mb-4 animate-pulse" />
        <h3 className="font-serif text-2xl text-softivory font-light mb-2">Private Handshake Terminated</h3>
        <p className="text-sm text-cool-grey mb-6 leading-relaxed">{error || 'Unable to retrieve private advisory details.'}</p>
        <button
          onClick={() => (window.location.href = '/')}
          className="border border-muted-gold/30 hover:border-muted-gold/60 px-6 py-3 rounded-lg text-xs font-sans uppercase tracking-wider text-softivory transition-all cursor-pointer"
        >
          Return to Portal
        </button>
      </div>
    );
  }

  // Formatting amount
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: request.currency,
  }).format(request.amount);

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
            className="font-serif text-3xl sm:text-4xl lg:text-5xl text-softivory font-light tracking-wide animate-fade-in"
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
          
          {/* Status Exception Banners (Cancelled, Expired, Paid) */}
          <div className="mb-8">
            {request.status === 'cancelled' && (
              <div className="border border-red-200 bg-red-50 p-5 rounded-2xl flex items-start gap-4">
                <XCircle className="h-6 w-6 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-serif text-lg text-red-800 font-medium">Link Terminated</h4>
                  <p className="text-sm text-red-700/80 mt-1 font-light leading-relaxed">
                    This secure payment handshake link has been cancelled by the senior advisory advisor. Please request a new transaction reference.
                  </p>
                </div>
              </div>
            )}

            {request.status === 'expired' && (
              <div className="border border-amber-200 bg-amber-50 p-5 rounded-2xl flex items-start gap-4">
                <Calendar className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-serif text-lg text-amber-800 font-medium">Link Expired</h4>
                  <p className="text-sm text-amber-700/80 mt-1 font-light leading-relaxed">
                    This payment handshake has expired. Secure payment keys are time-restricted to maintain data confidentiality. Please contact your private controller.
                  </p>
                </div>
              </div>
            )}

            {request.status === 'paid' && (
              <div className="border border-emerald-200 bg-emerald-50 p-5 rounded-2xl flex items-start gap-4">
                <CheckCircle className="h-6 w-6 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-serif text-lg text-emerald-800 font-medium">Invoice Fully Paid &amp; Settled</h4>
                  <p className="text-sm text-emerald-700/80 mt-1 font-light leading-relaxed">
                    This advisory fee payment has been successfully cleared and credited into our private ledger.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
            
            {/* LEFT COLUMN: Payment Summary Card (LOCKED) */}
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
                      <span className="text-gray-400 font-light font-sans">Client</span>
                      <span className="col-span-2 font-medium text-right sm:text-left font-sans">{request.clientName}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-gray-50">
                      <span className="text-gray-400 font-light font-sans">Email</span>
                      <span className="col-span-2 font-light text-right sm:text-left break-all font-mono text-xs">{request.clientEmail}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-gray-50">
                      <span className="text-gray-400 font-light font-sans">Reference</span>
                      <span className="col-span-2 font-mono text-xs font-semibold text-right sm:text-left text-primary-navy">{request.reference}</span>
                    </div>

                    {request.description && (
                      <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-gray-50">
                        <span className="text-gray-400 font-light font-sans">Description</span>
                        <span className="col-span-2 font-light text-right sm:text-left text-gray-700 leading-relaxed font-sans">{request.description}</span>
                      </div>
                    )}

                    {request.expiryDate && (
                      <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-gray-50">
                        <span className="text-gray-400 font-light font-sans">Expiry</span>
                        <span className="col-span-2 font-light text-right sm:text-left text-gray-700 leading-relaxed font-mono text-xs">{new Date(request.expiryDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom value panel */}
                <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between items-baseline">
                  <span className="text-sm text-gray-400 font-light font-sans">Amount Due</span>
                  <div className="text-right">
                    <span className="text-3xl font-serif font-light text-primary-navy tracking-tight">{formattedAmount}</span>
                    <span className="text-[10px] font-mono text-cool-grey font-semibold block mt-0.5">{request.currency}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Secure Checkout Action */}
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
                  <div className="space-y-4 font-sans">
                    <p className="text-sm text-cool-grey leading-relaxed font-light">
                      {request.status === 'paid' 
                        ? 'This transaction is closed. Settlement has been successfully verified on the blockchain and cleared by our banking partners.'
                        : request.status === 'cancelled' || request.status === 'expired'
                          ? 'This payment handshake is locked and inactive. It is no longer eligible for checkout processing.'
                          : 'Continue to our secure payment partner to complete your credit/debit card payment.'}
                    </p>

                    <div className="bg-white/[0.02] border border-white/[0.05] p-4 rounded-xl text-xs text-cool-grey/80 leading-relaxed font-light">
                      Your connection is encrypted with secure 256-bit protocols. All billing details are processed on secure institutional infrastructure.
                    </div>

                    {/* Checkout Failure State Banner */}
                    {checkoutError && (
                      <motion.div 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-xl text-xs flex items-start gap-3 font-mono"
                      >
                        <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-red-300">Checkout Terminated</p>
                          <p className="mt-1 text-red-200/90 leading-relaxed">{checkoutError}</p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Primary Secure Action Controls */}
                <div className="mt-8 space-y-6">
                  {request.status !== 'paid' && request.status !== 'cancelled' && request.status !== 'expired' ? (
                    <button
                      onClick={handleProceedToPayment}
                      disabled={isRedirecting}
                      className="w-full bg-muted-gold hover:bg-[#cbb27a] disabled:bg-muted-gold/40 text-charcoal-black font-semibold uppercase tracking-wider text-xs sm:text-sm py-4 px-6 rounded-lg transition-all duration-300 transform active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-muted-gold/5 font-mono"
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
                  ) : (
                    <button
                      disabled
                      className="w-full bg-white/[0.05] border border-white/[0.05] text-white/30 font-semibold uppercase tracking-wider text-xs sm:text-sm py-4 px-6 rounded-lg font-mono flex items-center justify-center gap-2"
                    >
                      <Lock className="h-4 w-4" />
                      <span>Checkout Locked</span>
                    </button>
                  )}

                  <p className="text-[11px] text-center text-cool-grey/70 font-light leading-relaxed max-w-sm mx-auto font-sans">
                    Ticketone does not store card details. You will enter your card information on our secure payment partner’s checkout page.
                  </p>

                  {/* Accepted Payment Logos */}
                  <div className="border-t border-white/[0.06] pt-6 space-y-3 text-center">
                    <h5 className="text-[10px] uppercase tracking-widest text-cool-grey font-semibold font-mono">
                      Accepted Payment Methods
                    </h5>
                    
                    <div className="flex flex-wrap items-center justify-center gap-2.5">
                      {/* VISA */}
                      <div className="bg-[#1a1f71] text-white border border-[#1a1f71]/80 rounded-md px-2 py-0.5 h-7 w-12 flex flex-col items-center justify-center select-none shadow-sm font-sans font-black tracking-tight text-[11px] italic">
                        VISA
                      </div>

                      {/* Mastercard */}
                      <div className="bg-[#0a3056] text-white border border-[#0a3056]/80 rounded-md px-2 py-0.5 h-7 w-12 flex flex-col items-center justify-center select-none shadow-sm">
                        <span className="font-sans font-extrabold text-[9px] tracking-tighter leading-none text-amber-500">MC</span>
                      </div>

                      {/* AMEX */}
                      <div className="bg-[#0070d3] text-white border border-[#005fb3] rounded-md px-2 py-0.5 h-7 w-12 flex flex-col items-center justify-center select-none shadow-sm">
                        <span className="font-sans font-black text-[9px] tracking-tighter leading-none">AMEX</span>
                      </div>

                      {/* Apple Pay */}
                      <div className="bg-white text-black border border-gray-200 rounded-md px-2 py-0.5 h-7 w-12 flex items-center justify-center select-none shadow-sm">
                        <span className="font-sans font-semibold text-[8px] tracking-tighter"> Pay</span>
                      </div>

                      {/* Google Pay */}
                      <div className="bg-white text-black border border-gray-200 rounded-md px-2 py-0.5 h-7 w-12 flex items-center justify-center select-none shadow-sm">
                        <span className="font-sans font-semibold text-[8.5px] tracking-tighter text-blue-600">G<span className="text-red-500">P</span><span className="text-yellow-500">a</span><span className="text-green-600">y</span></span>
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
