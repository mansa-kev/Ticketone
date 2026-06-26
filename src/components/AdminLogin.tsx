/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Eye, EyeOff, Mail, Lock, Key } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

export default function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both your email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    // Simulate elite cryptographical advisory portal handshake delay
    setTimeout(() => {
      setIsLoading(false);
      // Valid administrator credentials:
      // Email: admin@ticketone.advisory or user's email: piermarkets.co@gmail.com
      // Password: admin or ticketone2026
      const isValidEmail = email.toLowerCase() === 'admin@ticketone.advisory' || email.toLowerCase() === 'piermarkets.co@gmail.com';
      const isValidPassword = password === 'admin' || password === 'ticketone2026';

      if (isValidEmail && isValidPassword) {
        onLoginSuccess();
      } else {
        setErrorMsg('Invalid administrative credentials. Integrity check failed.');
      }
    }, 1200);
  };

  const handleForgot = (e: React.MouseEvent) => {
    e.preventDefault();
    setForgotSent(true);
    setTimeout(() => {
      setForgotSent(false);
    }, 4000);
  };

  return (
    <section className="py-24 px-6 flex items-center justify-center min-h-[80vh]" id="ticketone-admin-login-view">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md border border-white/[0.06] bg-[#090e15] p-8 rounded-xl shadow-[0_24px_64px_rgba(0,0,0,0.6)] relative overflow-hidden"
      >
        {/* Subtle executive gold seal radial background */}
        <div className="absolute -right-24 -bottom-24 w-52 h-52 rounded-full bg-muted-gold/[0.03] blur-3xl pointer-events-none" />
        <div className="absolute -left-24 -top-24 w-52 h-52 rounded-full bg-[#0a2c3a]/[0.1] blur-3xl pointer-events-none" />

        <div className="text-center mb-8">
          {/* Branded Executive Logo Icon */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-muted-gold/10 border border-muted-gold/25 rounded-md text-[10px] font-mono uppercase tracking-widest text-muted-gold mb-3.5">
            <Key className="h-3 w-3 text-muted-gold" />
            <span>Advisory Portal</span>
          </div>
          
          <h2 className="font-serif text-3xl text-softivory font-light tracking-wide leading-tight">
            Ticketone
          </h2>
          <p className="text-[10px] text-cool-grey font-mono uppercase tracking-[0.2em] mt-1.5">
            Private Advisory Admin
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email input */}
          <div>
            <label htmlFor="admin-email" className="block text-[10px] font-mono tracking-widest text-cool-grey uppercase mb-1.5 font-medium">
              Corporate Email Address
            </label>
            <div className="relative">
              <input
                id="admin-email"
                type="email"
                required
                placeholder="admin@ticketone.advisory"
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                className={`w-full bg-[#04070b]/60 border ${
                  errorMsg ? 'border-red-500/50 focus:border-red-500' : 'border-white/[0.08] focus:border-muted-gold/40'
                } rounded px-4 py-3 pl-10 text-xs text-softivory placeholder-cool-grey/25 focus:outline-none transition-all font-mono`}
                disabled={isLoading}
              />
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Mail className="h-3.5 w-3.5 text-cool-grey/40" />
              </div>
            </div>
          </div>

          {/* Password input */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="admin-password" className="block text-[10px] font-mono tracking-widest text-cool-grey uppercase font-medium">
                Security Password
              </label>
              <a 
                href="#forgot" 
                onClick={handleForgot} 
                className="text-[10px] text-muted-gold hover:underline font-mono"
              >
                Forgot passcode?
              </a>
            </div>
            
            <div className="relative">
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                className={`w-full bg-[#04070b]/60 border ${
                  errorMsg ? 'border-red-500/50 focus:border-red-500' : 'border-white/[0.08] focus:border-muted-gold/40'
                } rounded px-4 py-3 pl-10 pr-10 text-xs text-softivory placeholder-cool-grey/25 focus:outline-none transition-all font-mono`}
                disabled={isLoading}
              />
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="h-3.5 w-3.5 text-cool-grey/40" />
              </div>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-cool-grey/40 hover:text-softivory cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
            
            {errorMsg && (
              <span className="text-[10px] text-red-400 font-mono mt-2 block">{errorMsg}</span>
            )}
            {forgotSent && (
              <span className="text-[10px] text-success-green font-mono mt-2 block">Reset instructions transmitted to your offline backup hardware.</span>
            )}
          </div>

          {/* Login button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-muted-gold hover:bg-[#cbb27a] disabled:bg-muted-gold/30 text-charcoal-black font-semibold uppercase tracking-widest text-[11px] py-3.5 px-6 rounded transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 font-mono shadow-[0_4px_16px_rgba(184,155,94,0.1)] hover:shadow-[0_6px_20px_rgba(184,155,94,0.2)]"
          >
            {isLoading ? (
              <span>Decrypting Enclave Node...</span>
            ) : (
              <span>Access Advisory Console</span>
            )}
          </button>
        </form>

        {/* Minimal security statement */}
        <div className="mt-8 pt-6 border-t border-white/[0.04] text-center">
          <p className="text-[10px] text-cool-grey/40 font-mono flex items-center justify-center gap-1.5 uppercase tracking-wide">
            <ShieldCheck className="h-3 w-3 text-cool-grey/30" />
            Restricted access. Authorized personnel only.
          </p>
        </div>

        {/* Helper Badge for validation */}
        <div className="mt-4 p-2.5 bg-muted-gold/5 border border-muted-gold/15 rounded text-[10px] font-mono text-muted-gold leading-relaxed">
          <span className="font-bold uppercase tracking-wider block mb-0.5">Test Credentials:</span>
          Email: <span className="text-softivory">admin@ticketone.advisory</span> or <span className="text-softivory">piermarkets.co@gmail.com</span><br />
          Password: <span className="text-softivory">admin</span> or <span className="text-softivory">ticketone2026</span>
        </div>

      </motion.div>
    </section>
  );
}
