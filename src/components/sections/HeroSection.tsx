import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import {
  UtensilsCrossed,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Clock,
  Flame,
  Phone,
  MessageSquare,
} from 'lucide-react';
import {
  BUSINESS_CONFIG,
  getPhoneCallUrl,
  getWhatsAppUrl,
} from '@/config/business';

export default function HeroSection() {
  const whatsappUrl = getWhatsAppUrl(
    'Hi Nimje Gharchi Rasoi, I would like to order/inquire about daily tiffin service in Nagpur.'
  );

  return (
    <section className="relative pt-28 pb-16 lg:pt-36 lg:pb-24 overflow-hidden bg-[#FBF9F5] w-full max-w-full">
      {/* Ambient background glow strictly clipped */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden max-w-full">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-full max-w-2xl h-[350px] bg-gradient-to-b from-emerald-100/40 via-amber-100/20 to-transparent blur-3xl opacity-70" />
        <div className="absolute top-40 right-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-14">
          {/* Left Column Content */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full lg:w-1/2 space-y-5 text-center lg:text-left"
          >
            {/* Live Service Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-900 text-xs sm:text-sm font-extrabold shadow-xs max-w-full">
              <span className="flex h-2 w-2 shrink-0 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              </span>
              <span className="truncate">Nagpur's Trusted Homestyle Tiffin & Mess</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-5xl font-black text-gray-900 leading-[1.12] tracking-tight">
              Ghar Jaisa Swad, <br />
              <span className="text-emerald-700 relative inline-block mt-1">
                Roz Fresh Khana
                <svg
                  className="absolute -bottom-2 left-0 w-full h-3 text-amber-500/60 pointer-events-none"
                  viewBox="0 0 100 10"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0 5 Q 50 12 100 5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-gray-600 font-medium max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Warm, nutritious, pure vegetarian meals prepared daily with genuine Vidarbha spices, MP Sharbati wheat, and mother’s care. Delivered hot to your doorstep in Nagpur.
            </p>

            {/* Quick Trust Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 text-xs text-gray-700 font-bold">
              <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-white border border-[#EAE6DE] shadow-xs">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>100% Pure Veg</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-white border border-[#EAE6DE] shadow-xs">
                <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                <span>Zero Added Soda</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-white border border-[#EAE6DE] shadow-xs col-span-2 sm:col-span-1">
                <Clock size={16} className="text-amber-600 shrink-0" />
                <span>Hot Lunch & Dinner</span>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start pt-2 w-full">
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto text-sm sm:text-base px-7 h-12 sm:h-13 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white shadow-lg shadow-emerald-700/25 hover:-translate-y-0.5 transition-all font-black"
              >
                <Link to="/checkout" className="flex items-center justify-center gap-2">
                  <span>Order Tiffin Now</span>
                  <ArrowRight size={17} />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full sm:w-auto text-sm sm:text-base px-6 h-12 sm:h-13 rounded-full border border-gray-300 hover:border-emerald-600 bg-white hover:bg-emerald-50/50 font-bold text-gray-800 transition-all"
              >
                <Link to="/plans">View Meal Plans</Link>
              </Button>
            </div>

            {/* Secondary Direct Contact CTA Bar */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-1 text-xs text-gray-600 font-bold">
              <a
                href={getPhoneCallUrl()}
                className="inline-flex items-center gap-1.5 text-emerald-800 hover:text-emerald-950 transition-colors p-1"
              >
                <Phone size={14} className="text-emerald-700 shrink-0" />
                <span>Call: {BUSINESS_CONFIG.phone}</span>
              </a>

              <span className="text-gray-300 hidden sm:inline">•</span>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-emerald-800 hover:text-emerald-950 transition-colors p-1"
              >
                <MessageSquare size={14} className="text-emerald-700 shrink-0" />
                <span>WhatsApp Kitchen</span>
              </a>
            </div>

            {/* Google Social Proof */}
            <div className="pt-2 flex items-center justify-center lg:justify-start gap-3">
              <a
                href={BUSINESS_CONFIG.googleReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs text-gray-600 hover:text-gray-900 group"
              >
                <span className="text-amber-500 text-sm shrink-0">★★★★★</span>
                <span className="font-extrabold text-gray-900">5.0 on Google Reviews</span>
                <span className="text-gray-500 hidden sm:inline">for Nagpur tiffin service</span>
              </a>
            </div>
          </motion.div>

          {/* Right Column Image Presentation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="w-full lg:w-1/2 relative px-2 sm:px-0"
          >
            <div className="relative w-full max-w-md sm:max-w-lg mx-auto aspect-4/3 sm:aspect-square">
              {/* Main Image */}
              <div className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl border-4 border-white z-10">
                <img
                  src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80"
                  alt="Authentic Homemade Nagpur Tiffin & Thali"
                  className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                {/* Bottom Overlay Info */}
                <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 text-white z-20">
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate">
                      <p className="text-[10px] sm:text-xs font-bold text-amber-300">Daily Homestyle Cooking</p>
                      <h3 className="text-sm sm:text-lg font-black leading-tight truncate">Fresh Roti, Dal, Sabji & Rice</h3>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-600/90 backdrop-blur-md text-[10px] sm:text-xs font-black shadow-xs shrink-0">
                      100% Homestyle
                    </span>
                  </div>
                </div>
              </div>

              {/* Floating Badge 1: Freshly Cooked */}
              <div className="absolute -top-2 left-2 sm:-top-3 sm:-left-3 z-20 bg-white/95 backdrop-blur-md rounded-2xl p-2 sm:p-2.5 flex items-center gap-2 shadow-xl border border-gray-100">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center font-bold shrink-0">
                  <Flame size={16} />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase">Fresh Everyday</p>
                  <p className="text-[11px] sm:text-xs font-black text-gray-900 leading-none">Twice Daily</p>
                </div>
              </div>

              {/* Floating Badge 2: Nagpur Wide Delivery */}
              <div className="absolute -bottom-2 right-2 sm:-bottom-3 sm:-right-3 z-20 bg-white/95 backdrop-blur-md rounded-2xl p-2 sm:p-2.5 flex items-center gap-2 shadow-xl border border-gray-100">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-500/15 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                  <UtensilsCrossed size={16} />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase">Nagpur Kitchen</p>
                  <p className="text-[11px] sm:text-xs font-black text-gray-900 leading-none">Doorstep Delivery</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
