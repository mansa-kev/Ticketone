/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Landmark, ArrowUpRight, CheckCircle } from 'lucide-react';

export default function Positioning() {
  return (
    <section className="py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="relative border border-white/[0.06] bg-gradient-to-b from-charcoal-black to-primary-navy p-8 md:p-12 rounded-xl overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.3)]">
          {/* Subtle gold line on left border to establish hierarchy */}
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-muted-gold" />
          
          <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
            
            <div className="md:w-1/3">
              <span className="font-mono text-xs text-muted-gold tracking-[0.25em] h-fit uppercase block mb-3 font-semibold">
                ENGAGEMENT PHILOSOPHY
              </span>
              <h2 className="font-serif text-3xl text-softivory font-light leading-snug">
                Client Access <br />
                &amp; Integrity.
              </h2>
              <div className="mt-4 flex items-center gap-2 text-cool-grey/60 text-xs font-mono">
                <Landmark className="h-3 w-3 text-muted-gold" />
                <span>Established Framework</span>
              </div>
            </div>

            <div className="md:w-2/3 md:pl-6 border-t md:border-t-0 md:border-l border-white/[0.06] pt-6 md:pt-0">
              <p className="font-serif text-xl text-softivory/90 leading-relaxed italic font-light">
                “Ticketone works with selected clients who require professional advisory support, strategic direction, and confidential execution assistance. Engagements are handled privately and payments are processed through a secure dedicated payment portal.”
              </p>
              
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2.5">
                  <CheckCircle className="h-4 w-4 text-muted-gold shrink-0" />
                  <span className="text-xs text-cool-grey tracking-wide uppercase font-mono">Exclusive Focus</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle className="h-4 w-4 text-muted-gold shrink-0" />
                  <span className="text-xs text-cool-grey tracking-wide uppercase font-mono">End-to-End Encryption</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle className="h-4 w-4 text-muted-gold shrink-0" />
                  <span className="text-xs text-cool-grey tracking-wide uppercase font-mono">Strict Discretion</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle className="h-4 w-4 text-muted-gold shrink-0" />
                  <span className="text-xs text-cool-grey tracking-wide uppercase font-mono">Instant USDT Settlement</span>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </section>
  );
}
