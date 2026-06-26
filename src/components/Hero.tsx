/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Shield, Award, Landmark } from 'lucide-react';
import advisorBg from '../assets/images/advisor_background_1782221333373.jpg';

interface HeroProps {
  onPayClick: () => void;
}

export default function Hero({ onPayClick }: HeroProps) {
  const [windowWidth, setWindowWidth] = React.useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Start with a large index to allow perfect infinite left-to-right shifts without negative modulo issues
  const [centerIndex, setCenterIndex] = React.useState(3000);

  const advanceCarousel = () => {
    // Shifting index up moves the visual sequence naturally from right-to-left
    setCenterIndex(prev => prev + 1);
  };

  React.useEffect(() => {
    const interval = setInterval(() => {
      advanceCarousel();
    }, 4500); // Transitions occur every 4.5 seconds for a luxurious, calm pacing
    return () => clearInterval(interval);
  }, []);

  const getXValue = (slot: number) => {
    let multiplier = 345; // Desktop spacing
    if (windowWidth < 640) {
      multiplier = 270; // Tight mobile spacing to avoid page overflows
    } else if (windowWidth < 1024) {
      multiplier = 310; // Tablet spacing
    }

    switch (slot) {
      case 0: return -multiplier * 2;
      case 1: return -multiplier;
      case 2: return 0;
      case 3: return multiplier;
      case 4: return multiplier * 2;
      default: return 0;
    }
  };

  const getSlotStyles = (slot: number) => {
    switch (slot) {
      case 0: // Offscreen Left (Faded hidden)
        return { opacity: 0, scale: 0.82, pointerEvents: 'none' as const, zIndex: 0 };
      case 1: // Left card
        return { opacity: 0.45, scale: 0.92, pointerEvents: 'all' as const, zIndex: 10 };
      case 2: // Center (Active focus & glow)
        return { opacity: 1, scale: 1.05, pointerEvents: 'all' as const, zIndex: 30 };
      case 3: // Right card
        return { opacity: 0.45, scale: 0.92, pointerEvents: 'all' as const, zIndex: 10 };
      case 4: // Offscreen Right (Faded hidden)
        return { opacity: 0, scale: 0.82, pointerEvents: 'none' as const, zIndex: 0 };
      default:
        return { opacity: 0, scale: 0.82, pointerEvents: 'none' as const, zIndex: 0 };
    }
  };

  const cardsData = [
    {
      id: 0,
      title: "DISCRETION",
      desc: "Utmost confidentiality at every point of consultation and engagement.",
      icon: Shield
    },
    {
      id: 1,
      title: "HIGH TRUST",
      desc: "Trusted counsel to major executives, serial founders, and private wealth clients.",
      icon: Award
    },
    {
      id: 2,
      title: "SECURE ADVISORY",
      desc: "Strict end-to-end processing and settlement protocols for peace of mind.",
      icon: Landmark
    }
  ];

  return (
    <div className="relative min-h-[760px] sm:min-h-[820px] md:min-h-[880px] lg:min-h-[940px] flex flex-col justify-between overflow-hidden bg-[#2C3531]">
      {/* Background Advisor Image as requested - fully visible, no overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none">
        <img 
          src={advisorBg} 
          alt="Private Advisory Consultant" 
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-[center_12%] opacity-100"
        />
      </div>

      {/* Spacer to keep upper layout elements of her upper torso completely clear */}
      <div className="h-32 sm:h-40 md:h-48 relative z-10" />
      
      {/* CTA buttons / Action Panel - pushed lower utilizing mt-auto to completely keep her smile and face unobstructed */}
      <div className="max-w-4xl mx-auto px-6 text-center relative z-10 w-full mt-auto mb-10 flex flex-col items-center">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="flex flex-col items-center gap-4 w-full"
        >
          <button
            id="hero-pay-now-btn"
            onClick={onPayClick}
            className="group px-10 py-5 bg-[#D9B08C] text-[#2C3531] font-extrabold text-base tracking-widest uppercase rounded shadow-[0_12px_45px_rgba(0,0,0,0.7)] hover:bg-[#FFCB9A] hover:shadow-[0_16px_52px_rgba(217,176,140,0.6)] transition-all duration-300 transform active:scale-[0.98] cursor-pointer flex items-center gap-3 border-2 border-white/30"
          >
            <span>Proceed to Payment</span>
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </button>
          
          <p className="text-xs sm:text-sm text-white tracking-wide font-mono mt-2 flex items-center gap-1.5 justify-center font-bold drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] bg-[#2C3531]/95 px-4 py-2 rounded-lg border border-white/10 shadow-lg">
            <Shield className="h-4 w-4 text-[#D9B08C]" />
            Secure card payments processed through our designated global payment partner.
          </p>

          {/* Card Provider Logos (AMEX, Discover, Mastercard, Venmo, Visa) - modeled on the referenced screenshot */}
          <div className="flex items-center justify-center gap-3 mt-4 bg-black/75 backdrop-blur-md p-3.5 rounded-xl border border-white/10 shadow-xl">
            {/* AMEX */}
            <div className="bg-[#0070d3] text-white border border-[#005fb3] rounded px-1.5 py-0.5 h-7 w-12 flex flex-col items-center justify-center select-none shadow">
              <span className="font-sans font-black text-[9px] tracking-tighter leading-none">AM</span>
              <span className="font-sans font-black text-[9px] tracking-tighter leading-none">EX</span>
            </div>

            {/* Discover */}
            <div className="bg-white border border-gray-300 rounded px-1 py-0.5 h-7 w-12 flex items-center justify-center select-none shadow">
              <span className="font-sans font-extrabold text-[#3b3b3b] text-[8px] tracking-tighter">DISC<span className="text-[#f15a24] font-black">O</span>VER</span>
            </div>

            {/* Mastercard */}
            <div className="bg-[#1f1f1f] border border-[#3a3a3a] rounded px-1 py-0.5 h-7 w-12 flex items-center justify-center gap-0.5 select-none shadow">
              <div className="flex -space-x-1.5">
                <div className="w-3.5 h-3.5 rounded-full bg-[#f91c1c] opacity-95"></div>
                <div className="w-3.5 h-3.5 rounded-full bg-[#ff9900] mix-blend-screen"></div>
              </div>
            </div>

            {/* Venmo */}
            <div className="bg-[#008cff] text-white border border-[#007ae6] rounded px-1.5 py-0.5 h-7 w-12 flex items-center justify-center select-none shadow">
              <span className="font-sans font-black text-[15px] italic tracking-tighter font-extrabold">v</span>
            </div>

            {/* Visa */}
            <div className="bg-[#0f172a] text-white border border-[#334155] rounded px-1 py-0.5 h-7 w-12 flex items-center justify-center select-none shadow">
              <span className="font-sans font-extrabold italic text-[9px] tracking-wider text-[#f59e0b]">VISA</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Dynamic Animated Trust Marquee sitting at bottom-edge of the hero with rotating soft glow */}
      <div className="w-full relative z-10 px-4 pb-0 mt-8 overflow-hidden">
        <div className="max-w-7xl mx-auto relative h-[250px] sm:h-[220px] flex items-center justify-center overflow-visible">
          
          {/* Ambient Glow backdrop placed directly in the center to represent a natural, localized soft pool of premium light */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[150px] bg-gradient-to-tr from-[#116466]/15 via-[#D9B08C]/10 to-transparent blur-[45px] rounded-full pointer-events-none select-none z-0" />

          {/* Render circular offset instances [-2, -1, 0, 1, 2] corresponding to slots [0, 1, 2, 3, 4] */}
          {[-2, -1, 0, 1, 2].map((offset) => {
            const virtualIndex = centerIndex + offset;
            const card = cardsData[(virtualIndex % 3 + 3) % 3];
            const slot = offset + 2; 
            const style = getSlotStyles(slot);
            const xVal = getXValue(slot);
            const isCenter = slot === 2;
            const IconComponent = card.icon;

            return (
              <motion.div
                key={virtualIndex}
                initial={false}
                animate={{
                  x: xVal,
                  opacity: style.opacity,
                  scale: style.scale,
                }}
                transition={{ type: "spring", stiffness: 90, damping: 22, mass: 1 }}
                style={{
                  position: 'absolute',
                  zIndex: style.zIndex,
                  pointerEvents: style.pointerEvents,
                }}
                className="w-[250px] sm:w-[280px] lg:w-[325px] shrink-0"
              >
                <div 
                  className={`w-full p-5 lg:p-6 rounded-2xl border transition-all duration-700 select-none ${
                    isCenter
                      ? 'bg-[#2C3531]/85 backdrop-blur-2xl border-[#D9B08C]/45 shadow-[0_16px_50px_rgba(0,0,0,0.6),0_0_22px_rgba(217,176,140,0.22),0_0_35px_rgba(17,100,102,0.18)]'
                      : 'bg-[#2C3531]/40 backdrop-blur-md border-white/10 shadow-lg'
                  }`}
                >
                  <div className="flex flex-col items-center text-center">
                    {/* Badge Icon representing premium Advisory feel */}
                    <div className={`p-2.5 rounded-full mb-3.5 transition-colors duration-500 ${
                      isCenter 
                        ? 'bg-[#D9B08C]/15 text-[#D9B08C]' 
                        : 'bg-white/5 text-white/65'
                    }`}>
                      <IconComponent className="h-5 w-5" />
                    </div>

                    <span className={`font-mono text-xs uppercase tracking-[0.22em] mb-2 font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] transition-colors duration-500 ${
                      isCenter ? 'text-[#D9B08C]' : 'text-white/60'
                    }`}>
                      {card.title}
                    </span>
                    
                    <span className={`text-xs max-w-xs leading-relaxed font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] transition-colors duration-500 ${
                      isCenter ? 'text-white' : 'text-white/65'
                    }`}>
                      {card.desc}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
