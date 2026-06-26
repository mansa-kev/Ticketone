/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Mail, Shield, Landmark, Scale, ShieldCheck } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="border-t border-white/[0.05] bg-[#040911] text-cool-grey py-12 px-6 relative z-10 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-center text-center md:text-left">
        
        {/* Col 1: Brand & Desc */}
        <div>
          <button 
            onClick={() => onNavigate('home')} 
            className="font-serif text-lg tracking-[0.2em] text-softivory font-semibold uppercase hover:opacity-90 cursor-pointer block mx-auto md:mx-0"
          >
            TICKETONE
          </button>
          <p className="text-[11px] font-mono uppercase text-muted-gold tracking-widest mt-1.5">
            Private Advisory Services
          </p>
          <p className="text-xs text-cool-grey/60 mt-3 font-light leading-relaxed max-w-xs mx-auto md:mx-0">
            Discreet consultation and structured guidance for high-value clients, executives, and sovereign groups.
          </p>
        </div>

        {/* Col 2: Legal and Policies links */}
        <div className="flex flex-col items-center justify-center space-y-2 text-xs font-mono">
          <span className="text-[10px] text-cool-grey/40 uppercase tracking-widest">INFORMATION</span>
          <div className="flex items-center gap-4 text-cool-grey/85">
            <button 
              id="footer-terms-btn"
              onClick={() => onNavigate('terms')} 
              className="hover:text-muted-gold transition-colors cursor-pointer"
            >
              Terms of Service
            </button>
            <span className="text-white/10">•</span>
            <button 
              id="footer-privacy-btn"
              onClick={() => onNavigate('privacy')} 
              className="hover:text-muted-gold transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <span className="text-white/10">•</span>
            <button 
              id="footer-payment-btn"
              onClick={() => onNavigate('payment-policy')} 
              className="hover:text-muted-gold transition-colors cursor-pointer"
            >
              Payment Policy
            </button>
          </div>
          
          <div className="pt-2 flex items-center gap-1 text-[10px] text-cool-grey/45">
            <ShieldCheck className="h-3.5 w-3.5 text-muted-gold/70" />
            <span>Secure Corporate Payments</span>
          </div>
        </div>

        {/* Col 3: Contact and Copyright */}
        <div className="flex flex-col items-center md:items-end justify-center space-y-2.5">
          <span className="text-[10px] font-mono text-cool-grey/40 uppercase tracking-widest">CONTACT</span>
          
          <a 
            href="mailto:advisory@ticketone.ch" 
            className="flex items-center gap-2 text-xs text-softivory hover:text-muted-gold transition-colors font-mono cursor-pointer"
          >
            <Mail className="h-3.5 w-3.5 text-muted-gold" />
            <span>advisory@ticketone.ch</span>
          </a>

          <div className="text-[11px] text-cool-grey/50 font-mono text-center md:text-right mt-2">
            <span>© 2018–2026 Ticketone. All rights reserved.</span> <br />
            <span className="text-[9px] uppercase tracking-widest opacity-60">Geneva, Switzerland</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
