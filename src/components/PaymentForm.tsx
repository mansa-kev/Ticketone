/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Info, CreditCard, Lock, ArrowUpRight, HelpCircle, Loader2, Sparkles } from 'lucide-react';
import { Transaction } from '../types';
import { addNewTransaction } from '../data/mockTransactions';
import { DBPaymentRequest, dbService } from '../lib/supabase';

interface PaymentFormProps {
  onPaymentSuccess: (tx: Transaction) => void;
  presetAmount?: number;
  presetRequest?: DBPaymentRequest | null;
}

export default function PaymentForm({ onPaymentSuccess, presetAmount, presetRequest }: PaymentFormProps) {
  // Main form fields
  const [clientName, setClientName] = useState('');
  const [email, setEmail] = useState('');
  const [reference, setReference] = useState('');
  const [amount, setAmount] = useState(presetAmount ? String(presetAmount) : '');
  const [currency, setCurrency] = useState('USD');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const isLocked = !!presetRequest;

  // Auto-populate when presetRequest is available
  useEffect(() => {
    if (presetRequest) {
      setClientName(presetRequest.client_name);
      setEmail(presetRequest.client_email);
      setReference(presetRequest.reference);
      setAmount(String(presetRequest.amount));
      setCurrency(presetRequest.currency);
    }
  }, [presetRequest]);

  // Payment checkout loading and api state control
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Auto-populate reference or amount for testability if needed
  useEffect(() => {
    if (presetAmount) {
      setAmount(String(presetAmount));
    }
  }, [presetAmount]);

  const CURRENCY_SYMBOLS: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    CHF: 'Fr.'
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!clientName.trim()) errors.clientName = 'Client name is required.';
    if (!email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please provide a valid email.';
    }
    if (!reference.trim()) errors.reference = 'Invoice reference is required.';
    
    const parsedAmount = parseFloat(amount);
    if (!amount) {
      errors.amount = 'Payment amount is required.';
    } else if (isNaN(parsedAmount) || parsedAmount <= 0) {
      errors.amount = 'Please enter a valid positive amount.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInitPay = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    if (validateForm()) {
      setIsRedirecting(true);
      try {
        const response = await fetch('/api/payments/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            client_name: clientName,
            client_email: email,
            amount: parseFloat(amount),
            currency,
            payment_reference: reference,
            description: presetRequest?.description || 'Confidential Advisory Retainer Fee'
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Server rejected payment initiation.');
        }

        const data = await response.json();
        if (data.success && data.checkout_url) {
          // Direct client redirection to checkout session!
          window.location.href = data.checkout_url;
        } else {
          throw new Error('No checkout URL received from server.');
        }
      } catch (err: any) {
        console.error('Payment initiation error:', err);
        setApiError(err.message);
        setIsRedirecting(false);
      }
    }
  };

  return (
    <div className="w-full relative" id="ticketone-checkout-section">
      {/* 1. UPPER SECTION: Deep Teal Brand Color */}
      <div className="w-full bg-primary-navy pt-20 pb-32 relative overflow-hidden text-center">
        {/* Subtle, elegant vector patterns or radial lights for background luxury */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(209,232,226,0.08)_0%,transparent_70%)] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-6 relative z-10 space-y-3">
          <motion.h3 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-serif text-3xl sm:text-4xl lg:text-5xl text-softivory font-light tracking-wide"
          >
            Private Advisory Payment
          </motion.h3>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-sm sm:text-base text-softivory/80 max-w-xl mx-auto font-light leading-relaxed"
          >
            Confidential, secure payment processing for advisory engagements.
          </motion.p>
        </div>

        {/* 1b. CURVED DIVIDER WITH GOLD LINE */}
        <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none z-10 translate-y-[2px]">
          <svg className="relative block w-full h-[48px] sm:h-[64px]" viewBox="0 0 1440 120" preserveAspectRatio="none">
            {/* Elegant gold accent line */}
            <path d="M0,60 Q720,120 1440,60 L1440,65 Q720,125 0,65 Z" fill="#D9B08C" opacity="0.95"></path>
            {/* Pure white fill below */}
            <path d="M0,64 Q720,124 1440,64 L1440,120 L0,120 Z" fill="#FFFFFF"></path>
          </svg>
        </div>
      </div>

      {/* 2. LOWER SECTION: Pure White */}
      <div className="w-full bg-white pt-16 pb-24 px-4 sm:px-6 relative text-charcoal-black">
        <div className="max-w-xl mx-auto">
          
          {/* THE DARK PREMIUM PAYMENT CARD */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="border border-[#D9B08C]/15 bg-charcoal-black rounded-2xl p-6 sm:p-10 shadow-[0_25px_60px_rgba(44,53,49,0.18)] relative"
          >
            {/* subtle golden border highlight top */}
            <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-[#D9B08C]/40 to-transparent" />

            <form onSubmit={handleInitPay} className="space-y-6">
              {presetRequest?.description && (
                <div className="bg-primary-navy/30 border border-[#D9B08C]/20 p-4.5 rounded-lg text-xs text-softivory/95 leading-relaxed font-light mb-2">
                  <span className="text-[10px] font-mono uppercase text-[#D9B08C] block mb-1 tracking-wider font-semibold">ADVISORY SERVICE SCOPE</span>
                  {presetRequest.description}
                </div>
              )}

              {/* Client Name */}
              <div className="space-y-1.5">
                <label htmlFor="clientName" className="block text-[11px] tracking-wider text-cool-grey uppercase font-semibold">
                  Client Legal Name
                </label>
                <input
                  id="clientName"
                  type="text"
                  value={clientName}
                  onChange={e => {
                    if (isLocked) return;
                    setClientName(e.target.value);
                    if (formErrors.clientName) {
                      setFormErrors(prev => ({ ...prev, clientName: '' }));
                    }
                  }}
                  disabled={isLocked}
                  placeholder="Lord Arthur Wellesley"
                  className={`w-full bg-[#1e2523] border ${
                    formErrors.clientName ? 'border-red-500/50 focus:border-red-500' : 'border-white/[0.08] focus:border-[#D9B08C]/50'
                  } rounded-lg px-4 py-3.5 text-sm text-softivory placeholder-cool-grey/25 focus:outline-none transition-all ${
                    isLocked ? 'opacity-75 cursor-not-allowed border-white/[0.04]' : ''
                  }`}
                />
                {formErrors.clientName && (
                  <span className="text-[11px] text-red-400 font-mono mt-1 block">{formErrors.clientName}</span>
                )}
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-[11px] tracking-wider text-cool-grey uppercase font-semibold">
                  Confidential Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => {
                    if (isLocked) return;
                    setEmail(e.target.value);
                    if (formErrors.email) {
                      setFormErrors(prev => ({ ...prev, email: '' }));
                    }
                  }}
                  disabled={isLocked}
                  placeholder="a.wellesley@paramountgp.co"
                  className={`w-full bg-[#1e2523] border ${
                    formErrors.email ? 'border-red-500/50 focus:border-red-500' : 'border-white/[0.08] focus:border-[#D9B08C]/50'
                  } rounded-lg px-4 py-3.5 text-sm text-softivory placeholder-cool-grey/25 focus:outline-none transition-all ${
                    isLocked ? 'opacity-75 cursor-not-allowed border-white/[0.04]' : ''
                  }`}
                />
                <p className="text-[10px] text-cool-grey/40 leading-relaxed">
                  Your payment receipt and secure confirmation record will be sent here.
                </p>
                {formErrors.email && (
                  <span className="text-[11px] text-red-400 font-mono mt-1 block">{formErrors.email}</span>
                )}
              </div>

              {/* Reference Number */}
              <div className="space-y-1.5">
                <label htmlFor="reference" className="block text-[11px] tracking-wider text-cool-grey uppercase font-semibold">
                  Advisory Reference / Invoice Number {isLocked && <span className="text-[#D9B08C] font-normal text-[10px] lowercase italic">(locked)</span>}
                </label>
                <input
                  id="reference"
                  type="text"
                  value={reference}
                  onChange={e => {
                    if (isLocked) return;
                    setReference(e.target.value);
                    if (formErrors.reference) {
                      setFormErrors(prev => ({ ...prev, reference: '' }));
                    }
                  }}
                  disabled={isLocked}
                  placeholder="WHL-2026-6701X"
                  className={`w-full bg-[#1e2523] border ${
                    formErrors.reference ? 'border-red-500/50 focus:border-red-500' : 'border-white/[0.08] focus:border-[#D9B08C]/50'
                  } rounded-lg px-4 py-3.5 text-sm text-softivory placeholder-cool-grey/25 focus:outline-none transition-all ${
                    isLocked ? 'opacity-75 cursor-not-allowed border-white/[0.04]' : ''
                  }`}
                />
                {formErrors.reference && (
                  <span className="text-[11px] text-red-400 font-mono mt-1 block">{formErrors.reference}</span>
                )}
              </div>

              {/* Currency and Amount Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1 space-y-1.5">
                  <label htmlFor="currency" className="block text-[11px] tracking-wider text-cool-grey uppercase font-semibold">
                    Currency
                  </label>
                  <select
                    id="currency"
                    value={currency}
                    onChange={e => {
                      if (isLocked) return;
                      setCurrency(e.target.value);
                    }}
                    disabled={isLocked}
                    className={`w-full bg-[#1e2523] border border-white/[0.08] rounded-lg px-3 py-3.5 text-sm text-softivory focus:border-[#D9B08C]/50 focus:outline-none transition-all ${
                      isLocked ? 'opacity-75 cursor-not-allowed border-white/[0.04]' : ''
                    }`}
                  >
                    <option value="USD" className="bg-[#2C3531]">USD ($)</option>
                    <option value="EUR" className="bg-[#2C3531]">EUR (€)</option>
                    <option value="GBP" className="bg-[#2C3531]">GBP (£)</option>
                    <option value="CHF" className="bg-[#2C3531]">CHF (Fr.)</option>
                  </select>
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label htmlFor="amount" className="block text-[11px] tracking-wider text-cool-grey uppercase font-semibold">
                    Advisory Retainer Fee Amount {isLocked && <span className="text-[#D9B08C] font-normal text-[10px] lowercase italic">(locked)</span>}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <span className="text-cool-grey/60 text-sm">
                        {CURRENCY_SYMBOLS[currency]}
                      </span>
                    </div>
                    <input
                      id="amount"
                      type="number"
                      value={amount}
                      onChange={e => {
                        if (isLocked) return;
                        setAmount(e.target.value);
                        if (formErrors.amount) {
                          setFormErrors(prev => ({ ...prev, amount: '' }));
                        }
                      }}
                      disabled={isLocked}
                      placeholder="25000"
                      min="1"
                      className={`w-full bg-[#1e2523] border ${
                        formErrors.amount ? 'border-red-500/50 focus:border-red-500' : 'border-white/[0.08] focus:border-[#D9B08C]/50'
                      } rounded-lg pl-8 pr-4 py-3.5 text-sm text-softivory placeholder-cool-grey/25 focus:outline-none transition-all ${
                        isLocked ? 'opacity-75 cursor-not-allowed border-white/[0.04]' : ''
                      }`}
                    />
                  </div>
                  {formErrors.amount && (
                    <span className="text-[11px] text-red-400 font-mono mt-1 block">{formErrors.amount}</span>
                  )}
                </div>
              </div>

              {apiError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-4 rounded-lg font-mono mb-4 flex items-start gap-2">
                  <span className="shrink-0">⚠️</span>
                  <div>
                    <span className="font-semibold block mb-0.5">Payment Exception</span>
                    {apiError}
                  </div>
                </div>
              )}

              {/* Pay Now Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  id="submit-pay-form-btn"
                  disabled={isRedirecting}
                  className="w-full bg-[#D9B08C] hover:bg-[#cbb27a] disabled:bg-[#D9B08C]/40 text-[#2C3531] font-semibold uppercase tracking-wider text-xs sm:text-sm py-4 px-6 rounded-lg transition-all duration-300 transform active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 hover:shadow-lg shadow-[#D9B08C]/10"
                >
                  {isRedirecting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Preparing secure checkout...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      <span>Confirm &amp; Proceed to Secure Checkout</span>
                    </>
                  )}
                </button>
              </div>

              <div className="pt-4 text-center border-t border-white/[0.04]">
                <p className="text-[11px] sm:text-xs text-cool-grey/60 leading-relaxed max-w-md mx-auto">
                  You will be redirected to our secure payment partner to complete your card payment. Ticketone does not store card details.
                </p>
              </div>
            </form>
          </motion.div>

          {/* ACCEPTED PAYMENT METHODS SECTION */}
          <div className="mt-14 text-center space-y-4">
            <h4 className="text-xs uppercase tracking-widest text-[#2C3531]/60 font-semibold">
              Accepted Payment Methods
            </h4>
            
            <div className="flex flex-wrap items-center justify-center gap-3">
              {/* AMEX */}
              <div className="bg-[#0070d3] text-white border border-[#005fb3] rounded-md px-2 py-1 h-8 w-14 flex flex-col items-center justify-center select-none shadow-sm">
                <span className="font-sans font-black text-[10px] tracking-tighter leading-none">AM</span>
                <span className="font-sans font-black text-[10px] tracking-tighter leading-none">EX</span>
              </div>

              {/* Discover */}
              <div className="bg-white border border-gray-300 rounded-md px-2 py-1 h-8 w-14 flex items-center justify-center select-none shadow-sm">
                <span className="font-sans font-extrabold text-[#3b3b3b] text-[8px] tracking-tighter">DISC<span className="text-[#f15a24] font-black">O</span>VER</span>
              </div>

              {/* Mastercard */}
              <div className="bg-[#1f1f1f] border border-[#3a3a3a] rounded-md px-2 py-1 h-8 w-14 flex items-center justify-center gap-0.5 select-none shadow-sm">
                <div className="flex -space-x-1.5">
                  <div className="w-4 h-4 rounded-full bg-[#f91c1c] opacity-95"></div>
                  <div className="w-4 h-4 rounded-full bg-[#ff9900] mix-blend-screen"></div>
                </div>
              </div>

              {/* Visa */}
              <div className="bg-[#0f172a] text-white border border-[#334155] rounded-md px-2 py-1 h-8 w-14 flex items-center justify-center select-none shadow-sm">
                <span className="font-sans font-extrabold italic text-[10px] tracking-wider text-[#f59e0b]">VISA</span>
              </div>
            </div>

            <p className="text-[11px] text-[#2C3531]/50 font-sans">
              Major cards accepted through our designated global payment partner.
            </p>
          </div>

        </div>
      </div>

      {/* SECURE DYNAMIC REDIRECTION OVERLAY */}
      <AnimatePresence>
        {isRedirecting && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-primary-navy/95 backdrop-blur-md flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-charcoal-black max-w-sm w-full border border-white/[0.08] rounded-xl p-8 text-center space-y-6 shadow-[0_25px_60px_rgba(0,0,0,0.6)]"
            >
              <div className="relative inline-block">
                <Loader2 className="h-12 w-12 text-muted-gold animate-spin mx-auto" />
                <Lock className="h-4 w-4 text-muted-gold absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>

              <div className="space-y-2">
                <h4 className="font-serif text-lg text-softivory font-light tracking-wide">
                  Preparing Secure Checkout
                </h4>
                <p className="text-xs text-cool-grey leading-relaxed">
                  Redirecting you to our secure payment partner to complete your confidential transaction...
                </p>
              </div>

              <div className="w-full h-[2px] bg-white/[0.04] rounded-full overflow-hidden relative">
                <motion.div 
                  className="h-full bg-muted-gold"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 3, ease: "easeInOut" }}
                />
              </div>

              <div className="flex items-center gap-2 justify-center py-2.5 px-3 rounded bg-white/[0.02] border border-white/[0.04] text-[10px] text-cool-grey/60 font-mono">
                <ShieldCheck className="h-3.5 w-3.5 text-success-green" />
                <span>Confidential Connection Secured</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
