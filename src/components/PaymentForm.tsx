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
    <section className="py-12 px-6 relative" id="ticketone-checkout-section">
      <div className="max-w-xl mx-auto">
        <div className="border border-white/[0.06] bg-charcoal-black rounded-xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.4)] relative">
          
          {/* subtle golden border highlight top */}
          <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-muted-gold/40 to-transparent" />

          <div className="mb-6 text-center">
            <h3 className="font-serif text-2xl text-softivory font-light tracking-wide">
              Dedicated Advisory Payment Portal
            </h3>
            <p className="text-xs text-cool-grey mt-2">
              Confidential, secure, 256-bit SSL encrypted connection
            </p>
          </div>

          <form onSubmit={handleInitPay} className="space-y-5">
            {presetRequest?.description && (
              <div className="bg-primary-navy/40 border border-muted-gold/15 p-4 rounded text-xs text-softivory/90 leading-relaxed font-light mb-4">
                <span className="text-[10px] font-mono uppercase text-muted-gold block mb-1 tracking-wider font-semibold">ADVISORY SERVICE SCOPE</span>
                {presetRequest.description}
              </div>
            )}

            {/* Client Name */}
            <div>
              <label htmlFor="clientName" className="block text-[11px] font-mono tracking-wider text-cool-grey uppercase mb-1.5 font-medium">
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
                className={`w-full bg-primary-navy/40 border ${
                  formErrors.clientName ? 'border-red-500/50 focus:border-red-500' : 'border-white/[0.1] focus:border-muted-gold/50'
                } rounded px-4 py-3 text-sm text-softivory placeholder-cool-grey/30 focus:outline-none transition-all ${
                  isLocked ? 'opacity-70 cursor-not-allowed border-white/[0.04]' : ''
                }`}
              />
              {formErrors.clientName && (
                <span className="text-[11px] text-red-400 font-mono mt-1 block">{formErrors.clientName}</span>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label htmlFor="email" className="block text-[11px] font-mono tracking-wider text-cool-grey uppercase mb-1.5 font-medium">
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
                className={`w-full bg-primary-navy/40 border ${
                  formErrors.email ? 'border-red-500/50 focus:border-red-500' : 'border-white/[0.1] focus:border-muted-gold/50'
                } rounded px-4 py-3 text-sm text-softivory placeholder-cool-grey/30 focus:outline-none transition-all ${
                  isLocked ? 'opacity-70 cursor-not-allowed border-white/[0.04]' : ''
                }`}
              />
              <span className="text-[10px] text-cool-grey/40 font-mono mt-1 block">
                Your payment receipt and secure confirmation record will be sent here.
              </span>
              {formErrors.email && (
                <span className="text-[11px] text-red-400 font-mono mt-1 block">{formErrors.email}</span>
              )}
            </div>

            {/* Reference Number */}
            <div>
              <label htmlFor="reference" className="block text-[11px] font-mono tracking-wider text-cool-grey uppercase mb-1.5 font-medium">
                Advisory Reference / Invoice Number {isLocked && <span className="text-muted-gold font-normal text-[10px] lowercase italic">(locked)</span>}
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
                className={`w-full bg-primary-navy/40 border ${
                  formErrors.reference ? 'border-red-500/50 focus:border-red-500' : 'border-white/[0.1] focus:border-muted-gold/50'
                } rounded px-4 py-3 text-sm text-softivory placeholder-cool-grey/30 focus:outline-none transition-all ${
                  isLocked ? 'opacity-70 cursor-not-allowed border-white/[0.04]' : ''
                }`}
              />
              {formErrors.reference && (
                <span className="text-[11px] text-red-400 font-mono mt-1 block">{formErrors.reference}</span>
              )}
            </div>

            {/* Currency and Amount Row */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1">
                <label htmlFor="currency" className="block text-[11px] font-mono tracking-wider text-cool-grey uppercase mb-1.5 font-medium">
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
                  className={`w-full bg-primary-navy/40 border border-white/[0.1] rounded px-3 py-3 text-sm text-softivory focus:border-muted-gold/50 focus:outline-none transition-all ${
                    isLocked ? 'opacity-70 cursor-not-allowed border-white/[0.04]' : ''
                  }`}
                >
                  <option value="USD" className="bg-primary-navy">USD ($)</option>
                  <option value="EUR" className="bg-primary-navy">EUR (€)</option>
                  <option value="GBP" className="bg-primary-navy">GBP (£)</option>
                  <option value="CHF" className="bg-primary-navy">CHF (Fr.)</option>
                </select>
              </div>

              <div className="col-span-2">
                <label htmlFor="amount" className="block text-[11px] font-mono tracking-wider text-cool-grey uppercase mb-1.5 font-medium">
                  Advisory Retainer Fee Amount {isLocked && <span className="text-muted-gold font-normal text-[10px] lowercase italic">(locked)</span>}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <span className="text-cool-grey/60 font-mono text-sm">
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
                    className={`w-full bg-primary-navy/40 border ${
                      formErrors.amount ? 'border-red-500/50 focus:border-red-500' : 'border-white/[0.1] focus:border-muted-gold/50'
                    } rounded pl-8 pr-4 py-3 text-sm text-softivory placeholder-cool-grey/30 focus:outline-none transition-all font-mono ${
                      isLocked ? 'opacity-70 cursor-not-allowed border-white/[0.04]' : ''
                    }`}
                  />
                </div>
                {formErrors.amount && (
                  <span className="text-[11px] text-red-400 font-mono mt-1 block">{formErrors.amount}</span>
                )}
              </div>
            </div>

            {apiError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-4 rounded font-mono mb-4 flex items-start gap-2">
                <span className="shrink-0">⚠️</span>
                <div>
                  <span className="font-semibold block mb-0.5">Secure Gateway Exception</span>
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
                className="w-full bg-muted-gold hover:bg-[#cbb27a] disabled:bg-muted-gold/40 text-charcoal-black font-semibold uppercase tracking-widest text-xs py-4 px-6 rounded transition-all duration-300 transform active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                {isRedirecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Contacting global payment node...</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    <span>Confirm &amp; Proceed to Secure checkout</span>
                  </>
                )}
              </button>
            </div>

            <div className="pt-3 flex items-center justify-between text-[11px] text-cool-grey/55 font-mono border-t border-white/[0.04]">
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-muted-gold" />
                <span>Strict Security Gateway</span>
              </span>
              <span>Global Payment Provider Node</span>
            </div>
          </form>

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
                  Establishing Handshake
                </h4>
                <p className="text-xs text-cool-grey leading-relaxed">
                  Connecting to our secure global checkout partner to initiate your confidential retainer transaction...
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
                <span>PCI-DSS Compliant Connection Shielded</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
