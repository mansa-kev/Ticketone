import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, ShieldCheck, Mail, Calendar, Hash, Printer, ArrowRight, Clock, RefreshCw } from 'lucide-react';
import { Transaction } from '../types';

interface ConfirmationViewProps {
  transaction: Transaction;
  onReset: () => void;
}

export default function ConfirmationView({ transaction, onReset }: ConfirmationViewProps) {
  const [localStatus, setLocalStatus] = useState<'pending' | 'paid' | 'failed'>(
    transaction.status || 'pending'
  );
  const [checkingStatus, setCheckingStatus] = useState(false);

  const currencySymbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    CHF: 'Fr.'
  };

  const formattedDate = new Date(transaction.date).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
  });

  const handlePrintReceipt = () => {
    try {
      if (typeof window !== 'undefined' && typeof window.print === 'function') {
        window.print();
      }
    } catch (error) {
      console.warn('Printing is not supported or blocked in this browser environment:', error);
    }
  };

  const handleRefreshStatus = async () => {
    setCheckingStatus(true);
    try {
      const res = await fetch(`/api/payments/status/${transaction.reference}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.payment) {
          const status = data.payment.payment_status === 'paid' ? 'paid' : 'pending';
          setLocalStatus(status as any);
        }
      }
    } catch (err) {
      console.error('Failed to verify payment status update:', err);
    } finally {
      setTimeout(() => {
        setCheckingStatus(false);
      }, 800);
    }
  };

  const isPaid = localStatus === 'paid';

  return (
    <section className="py-12 md:py-20 px-6 max-w-2xl mx-auto" id="payment-confirmation-view">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="border border-white/[0.08] bg-charcoal-black rounded-xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.5)] print:border-black print:bg-white print:text-black print:shadow-none"
      >
        {/* Gold Ribbon for Premium Design Feel */}
        <div className="h-[4px] bg-gradient-to-r from-muted-gold/20 via-muted-gold to-muted-gold/20 print:hidden" />

        {/* Brand & Status Banner */}
        <div className="p-8 pb-4 text-center">
          {isPaid ? (
            <div className="inline-flex items-center justify-center p-3 rounded-full bg-success-green/10 border border-success-green/20 mb-4 print:hidden">
              <CheckCircle2 className="h-8 w-8 text-success-green animate-pulse" />
            </div>
          ) : (
            <div className="inline-flex items-center justify-center p-3 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4 print:hidden">
              <Clock className="h-8 w-8 text-amber-500 animate-pulse" />
            </div>
          )}
          
          <h2 className="font-serif text-3xl text-softivory font-light tracking-wide print:text-black">
            {isPaid ? 'Payment Securely Received' : 'Payment Confirmation Pending'}
          </h2>
          <p className="text-xs text-muted-gold font-mono tracking-widest uppercase mt-2">
            Ticketone Confidential Advisory Portal
          </p>
        </div>

        {/* Dynamic Context Header text */}
        <div className="px-8 py-4 text-center border-y border-white/[0.04] bg-primary-navy/20 print:bg-transparent print:border-black/10">
          <p className="text-sm text-cool-grey leading-relaxed max-w-md mx-auto print:text-black/85">
            {isPaid 
              ? 'Thank you. Your payment has been received and verified. A confirmation record has been saved and sent to your email.'
              : 'Thank you. Your secure transaction is currently awaiting confirmation from our global payment partner. Use the status control below to refresh.'
            }
          </p>
        </div>

        {/* The Receipt Billfold Details */}
        <div className="p-8 space-y-6">
          <h4 className="font-mono text-[10px] tracking-widest text-cool-grey uppercase border-b border-white/[0.05] pb-2 print:text-black/60 print:border-black/10">
            TRANSACTION METRICS
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-sm">
            {/* Client Account */}
            <div className="flex flex-col">
              <span className="text-[10px] font-mono uppercase text-cool-grey/60">Client Account</span>
              <span className="font-medium text-softivory mt-1 font-serif text-base print:text-black">{transaction.clientName}</span>
            </div>

            {/* Email */}
            <div className="flex flex-col">
              <span className="text-[10px] font-mono uppercase text-cool-grey/60">Destination Email</span>
              <span className="font-mono text-xs text-softivory mt-1 print:text-black">{transaction.email}</span>
            </div>

            {/* Invoice Reference */}
            <div className="flex flex-col">
              <span className="text-[10px] font-mono uppercase text-cool-grey/60 flex items-center gap-1">
                <Hash className="h-3 w-3 text-muted-gold" />
                <span>Reference ID</span>
              </span>
              <span className="font-mono text-xs text-softivory mt-1 font-semibold print:text-black">{transaction.reference}</span>
            </div>

            {/* Submission Date */}
            <div className="flex flex-col">
              <span className="text-[10px] font-mono uppercase text-cool-grey/60 flex items-center gap-1">
                <Calendar className="h-3 w-3 text-muted-gold" />
                <span>Submission Date</span>
              </span>
              <span className="font-mono text-[11px] text-softivory mt-1 leading-normal print:text-black">{formattedDate}</span>
            </div>

            {/* Gateway Reference ID */}
            <div className="flex flex-col">
              <span className="text-[10px] font-mono uppercase text-cool-grey/60">Gateway Reference ID</span>
              <span className="font-mono text-xs text-cool-grey mt-1 print:text-black">{transaction.id}</span>
            </div>

            {/* Secure Clearance Mode */}
            <div className="flex flex-col">
              <span className="text-[10px] font-mono uppercase text-cool-grey/60">Clearance Status</span>
              {isPaid ? (
                <span className="font-mono text-[11px] text-success-green mt-1 font-medium">Card Settlement Completed</span>
              ) : (
                <span className="font-mono text-[11px] text-amber-400 mt-1 font-medium animate-pulse">Awaiting Partner Clearance</span>
              )}
            </div>
          </div>

          {/* Amount Display */}
          <div className="mt-8 border border-white/[0.06] bg-[#0c1015] p-5 rounded-lg flex items-center justify-between print:border-black/15 print:bg-transparent">
            <div>
              <span className="text-[10px] font-mono uppercase text-cool-grey/50 block">ADVISORY FEE AMOUNT</span>
              <span className="text-xl text-softivory font-serif tracking-wide print:text-black">Professional Consulting Services</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted-gold font-mono font-semibold block uppercase">
                {isPaid ? 'SETTLED' : 'PENDING'}
              </span>
              <span className="font-mono text-2xl font-bold text-softivory tracking-tight print:text-black">
                {currencySymbols[transaction.currency]} {transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Verification Box */}
          <div className="flex items-start gap-3 p-4 bg-white/[0.01] border border-white/[0.04] rounded text-xs text-cool-grey font-light print:hidden">
            <ShieldCheck className="h-4.5 w-4.5 text-muted-gold shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-softivory">Secure Vault Verification</p>
              <p className="leading-relaxed text-[11px] text-cool-grey/70">
                This receipt acts as professional proof of payment. Your transaction is processed through secure, encrypted pathways to preserve client discretion.
              </p>
            </div>
          </div>

          {/* Refresh Action for Pending State */}
          {!isPaid && (
            <div className="pt-2 flex flex-col items-center justify-center space-y-2 print:hidden border-t border-white/[0.04]">
              <button
                onClick={handleRefreshStatus}
                disabled={checkingStatus}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-mono rounded text-softivory hover:text-white transition-all disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`h-3 w-3 text-muted-gold ${checkingStatus ? 'animate-spin' : ''}`} />
                <span>{checkingStatus ? 'Querying Clearing House...' : 'Check Clearance Status'}</span>
              </button>
              <p className="text-[10px] text-cool-grey/40 text-center leading-relaxed">
                Queries the designated gateway directly to verify your transaction status in real-time.
              </p>
            </div>
          )}

          {/* Support Line */}
          <div className="text-center pt-2 text-[11px] text-cool-grey/60 font-mono flex items-center justify-center gap-1.5 print:text-black/80">
            <Mail className="h-3.5 w-3.5 text-muted-gold" />
            <span>Support inquiry: </span>
            <a href="mailto:support@ticketone.advisory" className="text-muted-gold hover:underline font-semibold pr-1">support@ticketone.advisory</a>
          </div>

          {/* Footer controls */}
          <div className="pt-6 flex flex-col sm:flex-row gap-4 justify-between items-center print:hidden">
            <button
              onClick={handlePrintReceipt}
              className="w-full sm:w-auto px-5 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-xs font-mono uppercase tracking-widest rounded text-softivory transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Printer className="h-3.5 w-3.5 text-muted-gold" />
              <span>Print Receipt</span>
            </button>

            <button
              id="return-to-portal-btn"
              onClick={onReset}
              className="w-full sm:w-auto px-6 py-2.5 bg-muted-gold hover:bg-[#cbb27a] text-charcoal-black font-semibold text-xs font-mono uppercase tracking-widest rounded transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Return to Portal</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

        </div>
      </motion.div>
    </section>
  );
}
