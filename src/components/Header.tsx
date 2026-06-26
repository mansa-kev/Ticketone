/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Lock, LayoutDashboard } from 'lucide-react';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string) => void;
  isAdminLoggedIn: boolean;
  onAdminLogout: () => void;
}

export default function Header({ currentView, onNavigate, isAdminLoggedIn, onAdminLogout }: HeaderProps) {
  return (
    <header className="relative border-b border-white/[0.06] bg-primary-navy/80 backdrop-blur-md px-6 py-5 sticky top-0 z-40 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Identity / Logo */}
        <button 
          onClick={() => onNavigate('home')} 
          id="header-brand-logo"
          className="flex flex-col items-start gap-1 group text-left cursor-pointer transition-transform duration-200 hover:opacity-95"
        >
          <span className="font-serif text-2xl tracking-[0.25em] text-softivory font-semibold uppercase leading-tight">
            TICKETONE
          </span>
          <span className="font-mono text-[9px] tracking-[0.3em] text-muted-gold uppercase">
            Private Advisory
          </span>
        </button>

        {/* Elegant Minimal Navigation */}
        <nav className="flex items-center gap-6">
          <button
            id="nav-home-btn"
            onClick={() => onNavigate('home')}
            className={`text-xs uppercase tracking-widest transition-colors duration-200 cursor-pointer ${
              currentView === 'home' || currentView === 'payment'
                ? 'text-muted-gold font-medium'
                : 'text-cool-grey hover:text-softivory'
            }`}
          >
            Advisory & Pay
          </button>
          
          <button
            id="nav-legal-btn"
            onClick={() => onNavigate('terms')}
            className={`text-xs uppercase tracking-widest transition-colors duration-200 cursor-pointer ${
              ['terms', 'privacy', 'payment-policy'].includes(currentView)
                ? 'text-muted-gold font-medium'
                : 'text-cool-grey hover:text-softivory'
            }`}
          >
            Policies
          </button>

          {isAdminLoggedIn ? (
            <div className="flex items-center gap-3 pl-3 border-l border-white/10">
              <button
                id="nav-dashboard-btn"
                onClick={() => onNavigate('dashboard')}
                className={`flex items-center gap-1.5 text-xs uppercase tracking-widest py-1 px-3.5 rounded bg-muted-gold/10 text-muted-gold border border-muted-gold/20 hover:bg-muted-gold/20 transition-all font-medium cursor-pointer ${
                  currentView === 'dashboard' ? 'ring-1 ring-muted-gold/30' : ''
                }`}
              >
                <LayoutDashboard className="h-3 w-3" />
                <span>Console</span>
              </button>
              
              <button
                id="nav-logout-btn"
                onClick={onAdminLogout}
                className="text-xs uppercase tracking-widest text-red-400 hover:text-red-350 transition-colors cursor-pointer"
              >
                Exit
              </button>
            </div>
          ) : (
            <button
              id="nav-lock-btn"
              onClick={() => onNavigate('admin-login')}
              className={`p-1.5 rounded-full border border-white/[0.05] text-cool-grey hover:text-muted-gold hover:border-muted-gold/20 hover:bg-white/[0.02] transition-all cursor-pointer ${
                currentView === 'admin-login' ? 'text-muted-gold border-muted-gold/20 bg-white/[0.02]' : ''
              }`}
              title="Secure Advisory Console Login"
            >
              <Lock className="h-3.5 w-3.5" />
            </button>
          )}
        </nav>

      </div>
    </header>
  );
}
