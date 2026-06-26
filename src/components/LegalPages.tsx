/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { FileText, Shield, Sparkles, Scale, Landmark, ShieldAlert } from 'lucide-react';

export default function LegalPages() {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy' | 'payment'>('terms');

  return (
    <section className="py-12 md:py-16 px-6 max-w-4xl mx-auto" id="legal-policies-view">
      
      {/* Policy Selection Tabs */}
      <div className="flex border-b border-white/[0.06] mb-8 font-mono text-xs overflow-x-auto whitespace-nowrap">
        <button
          onClick={() => setActiveTab('terms')}
          className={`flex items-center gap-2 py-3 px-6 border-b transition-all duration-300 uppercase tracking-widest cursor-pointer ${
            activeTab === 'terms'
              ? 'border-muted-gold text-muted-gold font-medium bg-muted-gold/[0.02]'
              : 'border-transparent text-cool-grey hover:text-softivory'
          }`}
        >
          <Scale className="h-4 w-4" />
          <span>Terms of Service</span>
        </button>
        
        <button
          onClick={() => setActiveTab('privacy')}
          className={`flex items-center gap-2 py-3 px-6 border-b transition-all duration-300 uppercase tracking-widest cursor-pointer ${
            activeTab === 'privacy'
              ? 'border-muted-gold text-muted-gold font-medium bg-muted-gold/[0.02]'
              : 'border-transparent text-cool-grey hover:text-softivory'
          }`}
        >
          <Shield className="h-4 w-4" />
          <span>Privacy Policy</span>
        </button>

        <button
          onClick={() => setActiveTab('payment')}
          className={`flex items-center gap-2 py-3 px-6 border-b transition-all duration-300 uppercase tracking-widest cursor-pointer ${
            activeTab === 'payment'
              ? 'border-muted-gold text-muted-gold font-medium bg-muted-gold/[0.02]'
              : 'border-transparent text-cool-grey hover:text-softivory'
          }`}
        >
          <Landmark className="h-4 w-4" />
          <span>Payment Policy</span>
        </button>
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="border border-white/[0.06] bg-charcoal-black p-8 md:p-12 rounded-xl text-softivory/85 leading-relaxed space-y-6 font-light text-sm shadow-xl"
      >
        {activeTab === 'terms' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-white/[0.05]">
              <Scale className="h-6 w-6 text-muted-gold" />
              <div>
                <h3 className="font-serif text-2xl text-softivory font-medium tracking-wide">
                  Terms of Service
                </h3>
                <p className="text-[10px] font-mono text-cool-grey tracking-wider uppercase mt-1">
                  EFFECTIVE DATE: JUNE 23, 2026 | TICKETONE GLOBAL ADVISORY FRAMEWORK
                </p>
              </div>
            </div>

            <p className="font-serif text-lg text-softivory italic leading-normal">
              By accessing the private advisory payment portal and secure systems offered by Ticketone, you enter into a binding relationship governed by these Terms. Our engagements are defined by absolute discretion and strict operational compliance.
            </p>

            <div className="space-y-4">
              <h4 className="font-serif text-lg text-muted-gold font-medium">1. Nature of Advisory Engagements</h4>
              <p className="text-cool-grey text-xs sm:text-sm">
                Ticketone provides private advisory, consultation, strategic support, and business structures for designated, vetted clients. All actions taken or suggested represent structured insight based on general financial and operational principles and are not to be misconstrued as commercial retail products.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-serif text-lg text-muted-gold font-medium">2. Confidentiality &amp; Discretion</h4>
              <p className="text-cool-grey text-xs sm:text-sm">
                Both Ticketone and the client commit to safeguarding the existence, parameters, terms, and materials of any consultation. Under no circumstances may client details, invoice ranges, or strategic advice files be distributed, republished, or disclosed to unauthorized third parties without express, written clearance.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-serif text-lg text-muted-gold font-medium">3. Fees, billing, and Portal Compliance</h4>
              <p className="text-cool-grey text-xs sm:text-sm">
                Charges for consulting are settled in advance or based on mutually cleared milestones. Clients must utilize this secure environment to remit payments. When invoking the Checkout, you authorize the secure ingestion of card variables to fulfill settlement requirements.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-serif text-lg text-muted-gold font-medium">4. Limitation of Liability</h4>
              <p className="text-cool-grey text-xs sm:text-sm">
                Ticketone's advisory results are subject to dynamic market and regulatory variables. To the maximum extent permitted by applicable jurisdiction, Ticketone holds no liability for direct, indirect, random, or incidental commercial damages arising out of private client strategic actions.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-white/[0.05]">
              <Shield className="h-6 w-6 text-muted-gold" />
              <div>
                <h3 className="font-serif text-2xl text-softivory font-medium tracking-wide">
                  Classified Privacy Policy
                </h3>
                <p className="text-[10px] font-mono text-cool-grey tracking-wider uppercase mt-1">
                  SECURE LEDGER DATA PROTOCOLS | REGULATION REG-21T
                </p>
              </div>
            </div>

            <p className="font-serif text-lg text-softivory italic leading-normal">
              Discretion is the foundation of our advisory services. This policy documents the restricted methods we use to store, handle, and verify private client data.
            </p>

            <div className="space-y-4">
              <h4 className="font-serif text-lg text-muted-gold font-medium">1. Restricted Information Harvesting</h4>
              <p className="text-cool-grey text-xs sm:text-sm">
                We collect only essential identification variables necessary to process transactions: Client Legal Name, Secure Email, and Invoice References. No browser tracking scripts, cookies, analytics files, or third-party behavioral heatmaps are deployed inside this secure environment to ensure your interaction remains classified.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-serif text-lg text-muted-gold font-medium">2. Ultimate Financial Isolation</h4>
              <p className="text-cool-grey text-xs sm:text-sm">
                Payment card details (numbers, security codes, and expiry fields) processed through our portal are securely handled by certified banking gateways. Ticketone does not persist, inspect, or audit credit card credentials on physical servers.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-serif text-lg text-muted-gold font-medium">3. Data Retention and Sealed Files</h4>
              <p className="text-cool-grey text-xs sm:text-sm">
                Your private record index logs are held in an isolated node. Transactions settled are logged solely to facilitate executive compliance records and auditing. Client names and details are permanently hidden from any public indexing platforms.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'payment' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-white/[0.05]">
              <Landmark className="h-6 w-6 text-muted-gold" />
              <div>
                <h3 className="font-serif text-2xl text-softivory font-medium tracking-wide">
                  Retainer &amp; Settlement Policy
                </h3>
                <p className="text-[10px] font-mono text-cool-grey tracking-wider uppercase mt-1">
                  SECURE PAYMENT SETTLEMENT &amp; ROUTING PROTOCOL
                </p>
              </div>
            </div>

            <p className="font-serif text-lg text-softivory italic leading-normal">
              This policy explains the guidelines regulating payment processing, currencies supported, and our internal payment settlement mechanism.
            </p>

            <div className="space-y-4">
              <h4 className="font-serif text-lg text-muted-gold font-medium">1. Acceptable Payment Instruments</h4>
              <p className="text-cool-grey text-xs sm:text-sm">
                Ticketone accepts payments denominated in major institutional currencies: United States Dollars (USD), European Euros (EUR), British Pounds (GBP), and Swiss Francs (CHF). Settlements must be executed in full through credit cards or via prior consulting agreement wire transfers.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-serif text-lg text-muted-gold font-medium">2. Secure Settlement Processing</h4>
              <p className="text-cool-grey text-xs sm:text-sm">
                We operate a premium, secure backend where card proceeds are processed and settled directly to secure institutional vaults. This protects funds from volatility, ensuring prompt and highly fluid treasury settlement for our clients. Every transaction is processed through encrypted financial paths to preserve client discretion.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-serif text-lg text-muted-gold font-medium">3. No-Refund Advisory Rule</h4>
              <p className="text-cool-grey text-xs sm:text-sm">
                Due to the highly specialized and immediate nature of custom structural advisory work, all successfully authorized payments represent non-refundable advisory retainers once strategic execution advice has been disseminated.
              </p>
            </div>
          </div>
        )}

        {/* Footer note in policies */}
        <div className="pt-6 border-t border-white/[0.05] flex flex-col sm:flex-row justify-between items-center text-xs text-cool-grey/50 font-mono gap-4">
          <span className="flex items-center gap-1">
            <ShieldAlert className="h-3.5 w-3.5 text-muted-gold" />
            <span>Ticketone Executive Council Approved</span>
          </span>
          <span>CH-8002 Zurich / London / NY</span>
        </div>

      </motion.div>
    </section>
  );
}
