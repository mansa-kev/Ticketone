/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Positioning from './components/Positioning';
import PaymentForm from './components/PaymentForm';
import ConfirmationView from './components/ConfirmationView';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import LegalPages from './components/LegalPages';
import Footer from './components/Footer';
import SandboxCheckout from './components/SandboxCheckout';
import { Transaction } from './types';
import { dbService, DBPaymentRequest } from './lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Calendar, SlidersHorizontal, ArrowUpRight, HelpCircle, Loader2, XCircle } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('home');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [lastCompletedTransaction, setLastCompletedTransaction] = useState<Transaction | null>(null);
  const [presetRequest, setPresetRequest] = useState<DBPaymentRequest | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // References for layout elements
  const paymentSectionRef = useRef<HTMLDivElement>(null);

  // Read admin login state safely from session storage and detect URL params / custom routing
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('ticketone_admin_logged_in');
      if (saved === 'true') {
        setIsAdminLoggedIn(true);
      }
    } catch (e) {
      console.warn("sessionStorage access denied:", e);
    }

    // Custom Path Routing Handlers
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    const refParam = params.get('ref') || params.get('txId');

    if (path === '/checkout/sandbox') {
      setCurrentView('checkout-sandbox');
      return;
    }

    if (path === '/payment/success' && refParam) {
      setCurrentView('loading-payment-status');
      fetch(`/api/payments/status/${refParam}`)
        .then(res => {
          if (!res.ok) throw new Error('Transaction status inquiry rejected by core node.');
          return res.json();
        })
        .then(data => {
          if (data.success && data.payment) {
            const mappedTx: Transaction = {
              id: data.payment.id,
              clientName: data.payment.client_name,
              email: data.payment.client_email,
              reference: data.payment.internal_reference,
              amount: data.payment.amount,
              currency: data.payment.currency,
              status: data.payment.payment_status === 'paid' ? 'paid' : data.payment.payment_status === 'failed' ? 'failed' : 'pending',
              date: data.payment.created_at,
              settlementStatus: data.payment.settlement_status === 'settled' 
                ? 'settled' 
                : data.payment.settlement_status === 'settlement_failed' 
                  ? 'unsettled' 
                  : 'processing'
            };
            setLastCompletedTransaction(mappedTx);
            setCurrentView('confirmation');
          } else {
            throw new Error('Payment record parse exception.');
          }
        })
        .catch(err => {
          console.error(err);
          setPaymentError(err.message || 'Inquiry error.');
          setCurrentView('payment-failed');
        });
      return;
    }

    if (path === '/payment/cancelled' || path === '/payment/failed') {
      setPaymentError(path === '/payment/cancelled' ? 'The security handshake session was cancelled by the client.' : 'The clearing house has declined the security handshake settlement.');
      setCurrentView('payment-failed');
      return;
    }

    // Detect payment request from URL query (?ref=...)
    try {
      if (refParam) {
        dbService.getPaymentRequests().then((requests) => {
          const found = requests.find(r => 
            r.reference.toLowerCase() === refParam.toLowerCase() || 
            r.id.toLowerCase() === refParam.toLowerCase()
          );
          if (found) {
            setPresetRequest(found);
            // Highlight the payment request layout by smooth scrolling
            setTimeout(() => {
              handlePayNowScroll();
            }, 600);
          }
        });
      }
    } catch (err) {
      console.warn("Failed to parse ref parameters from search string:", err);
    }
  }, []);

  const handleAdminLogin = () => {
    setIsAdminLoggedIn(true);
    try {
      sessionStorage.setItem('ticketone_admin_logged_in', 'true');
    } catch (e) {
      console.warn("sessionStorage write denied:", e);
    }
    setCurrentView('dashboard');
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    try {
      sessionStorage.removeItem('ticketone_admin_logged_in');
    } catch (e) {
      console.warn("sessionStorage removal denied:", e);
    }
    setCurrentView('home');
  };

  const handlePaymentSuccess = (tx: Transaction) => {
    setLastCompletedTransaction(tx);
    setCurrentView('confirmation');
  };

  const handlePayNowScroll = () => {
    try {
      if (paymentSectionRef.current && typeof paymentSectionRef.current.scrollIntoView === 'function') {
        paymentSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (e) {
      console.warn("scrollIntoView direct failed:", e);
    }

    if (!paymentSectionRef.current) {
      setCurrentView('home');
      setTimeout(() => {
        try {
          if (paymentSectionRef.current && typeof paymentSectionRef.current.scrollIntoView === 'function') {
            paymentSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        } catch (e) {
          console.warn("scrollIntoView delayed failed:", e);
        }
      }, 100);
    }
  };

  const navigateToView = (view: string) => {
    // If navigating to home or payment section
    if (view === 'home' || view === 'payment') {
      setCurrentView('home');
      if (view === 'payment') {
        setTimeout(handlePayNowScroll, 100);
      }
    } else if (['terms', 'privacy', 'payment-policy'].includes(view)) {
      setCurrentView(view);
    } else {
      setCurrentView(view);
    }
    try {
      if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (e) {
      console.warn("window.scrollTo failed in sandbox:", e);
    }
  };

  return (
    <div className="min-h-screen bg-primary-navy text-softivory flex flex-col justify-between selection:bg-muted-gold/20 selection:text-softivory">
      
      {/* Upper Navigation & Trust Framework */}
      <Header 
        currentView={currentView} 
        onNavigate={navigateToView} 
        isAdminLoggedIn={isAdminLoggedIn}
        onAdminLogout={handleAdminLogout}
      />

      {/* Main Container - Framer Motion Transition for gorgeous micro-interactions */}
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {/* 1. HOME VIEW */}
            {currentView === 'home' && (
              <div className="space-y-4">
                <Hero onPayClick={handlePayNowScroll} />
                <Positioning />
                
                {/* Embedded payment form with standard client-oriented labels */}
                <div ref={paymentSectionRef} className="pt-8">
                  <PaymentForm 
                    onPaymentSuccess={handlePaymentSuccess} 
                    presetRequest={presetRequest}
                  />
                </div>
              </div>
            )}

            {/* 2. CONFIRMATION VIEW */}
            {currentView === 'confirmation' && lastCompletedTransaction && (
              <ConfirmationView 
                transaction={lastCompletedTransaction} 
                onReset={() => navigateToView('home')} 
              />
            )}

            {/* 3. POLICY PAGES VIEW */}
            {['terms', 'privacy', 'payment-policy'].includes(currentView) && (
              <LegalPages />
            )}

            {/* 4. ADMIN LOGIN */}
            {currentView === 'admin-login' && (
              <AdminLogin onLoginSuccess={handleAdminLogin} />
            )}

            {/* 5. ADMIN DASHBOARD */}
            {currentView === 'dashboard' && isAdminLoggedIn && (
              <AdminDashboard onLogout={handleAdminLogout} />
            )}

            {/* 6. LOADING PAYMENT STATUS */}
            {currentView === 'loading-payment-status' && (
              <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="relative inline-block">
                  <Loader2 className="h-10 w-10 text-muted-gold animate-spin" />
                  <ShieldCheck className="h-4 w-4 text-muted-gold absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-sm font-mono text-cool-grey animate-pulse">
                  Querying transaction clearing house state...
                </p>
              </div>
            )}

            {/* 7. CHECKOUT SANDBOX */}
            {currentView === 'checkout-sandbox' && (
              <SandboxCheckout />
            )}

            {/* 8. PAYMENT FAILED / CANCELLED VIEW */}
            {currentView === 'payment-failed' && (
              <div className="min-h-[60vh] py-12 px-6 max-w-md mx-auto flex flex-col items-center justify-center text-center space-y-6">
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-full">
                  <XCircle className="h-12 w-12 text-red-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-serif text-2xl text-softivory font-light">
                    Transaction Terminated
                  </h3>
                  <p className="text-xs text-cool-grey leading-relaxed">
                    {paymentError || 'The secure payment handshake session was interrupted or declined.'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    window.location.href = '/';
                  }}
                  className="bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-softivory text-xs uppercase tracking-widest font-mono py-3.5 px-6 rounded transition-all"
                >
                  Return to Home Portal
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Security Seal Bar */}
      <div className="bg-[#03060a] border-t border-white/[0.04] py-3.5 px-6 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center text-[11px] font-mono text-cool-grey/50 gap-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-green opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success-green"></span>
            </span>
            <span>PRIVATE ADVISORY PORTAL ACTIVE</span>
          </div>
          <div>
            <span>SECURE 256-BIT ENCRYPTION ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Footer Branding, Links and Communications */}
      <Footer onNavigate={navigateToView} />

    </div>
  );
}
