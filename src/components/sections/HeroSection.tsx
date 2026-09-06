import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import {
  UtensilsCrossed,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Star,
  ShieldCheck,
  Heart,
  Clock,
  Flame,
} from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative pt-28 pb-16 lg:pt-40 lg:pb-28 overflow-hidden bg-[#FBF9F5]">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-b from-emerald-100/40 via-amber-100/20 to-transparent blur-3xl opacity-70" />
        <div className="absolute top-40 right-10 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-14">
          {/* Left Hero Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full lg:w-1/2 space-y-6 text-center lg:text-left"
          >
            {/* Live Nagpur Delivery Pill */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-900 text-xs sm:text-sm font-extrabold shadow-xs">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              </span>
              <span>Nagpur's #1 Authentic Homestyle Tiffin Service</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 leading-[1.1] tracking-tight">
              Ghar Jaisa Swad, <br />
              <span className="text-emerald-700 relative inline-block mt-1 sm:mt-2">
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

            <p className="text-base sm:text-lg text-gray-600 font-medium max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Warm, nutritious and delicious homemade meals prepared with pure ingredients, authentic Vidarbha spices, and mother’s love. Delivered fresh to your doorstep daily in Nagpur.
            </p>

            {/* Trust Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1 text-xs text-gray-700 font-bold">
              <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-white border border-[#EAE6DE] shadow-xs">
                <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                <span>100% Pure Veg</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-white border border-[#EAE6DE] shadow-xs">
                <ShieldCheck size={16} className="text-emerald-600 flex-shrink-0" />
                <span>No Added Soda</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-white border border-[#EAE6DE] shadow-xs col-span-2 sm:col-span-1">
                <Clock size={16} className="text-amber-600 flex-shrink-0" />
                <span>On-Time Hot Delivery</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3.5 justify-center lg:justify-start pt-2">
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto text-base px-8 h-13 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white shadow-xl shadow-emerald-700/25 hover:-translate-y-0.5 transition-all font-black"
              >
                <Link to="/checkout" className="flex items-center gap-2">
                  <span>Start Tiffin Subscription</span>
                  <ArrowRight size={18} />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full sm:w-auto text-base px-7 h-13 rounded-full border border-gray-300 hover:border-emerald-600 bg-white hover:bg-emerald-50/50 font-bold text-gray-800 transition-all"
              >
                <Link to="/plans">View Meal Plans</Link>
              </Button>
            </div>

            {/* Micro rating social proof */}
            <div className="flex items-center justify-center lg:justify-start gap-3 pt-2">
              <div className="flex -space-x-2">
                {['#F59E0B', '#10B981', '#6366F1', '#EC4899'].map((color, i) => (
                  <div
                    key={i}
                    style={{ backgroundColor: color }}
                    className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-black"
                  >
                    ★
                  </div>
                ))}
              </div>
              <div className="text-xs text-gray-600">
                <span className="font-extrabold text-gray-900">4.9/5 Rating</span> from 1,200+ happy students & professionals in Nagpur
              </div>
            </div>
          </motion.div>

          {/* Right Hero Image Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full lg:w-1/2 relative"
          >
            <div className="relative w-full max-w-lg mx-auto aspect-4/3 sm:aspect-square">
              {/* Main Image */}
              <div className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl border-4 border-white z-10">
                <img
                  src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
                  alt="Authentic Homemade Indian Thali & Tiffin"
                  className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                {/* Bottom Overlay Label */}
                <div className="absolute bottom-4 left-4 right-4 text-white z-20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-amber-300">Today's Daily Special</p>
                      <h4 className="text-lg font-black leading-tight">Nagpuri Saoji Dal & Hot Phulkas</h4>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-600/90 backdrop-blur-md text-xs font-black">
                      ₹110 / Meal
                    </span>
                  </div>
                </div>
              </div>

              {/* Floating Badge 1: Freshly Cooked */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="absolute -top-4 -left-4 sm:-left-6 z-20 bg-white/95 backdrop-blur-md rounded-2xl p-3 flex items-center gap-2.5 shadow-xl border border-gray-100"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center font-bold">
                  <Flame size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Freshly Cooked</p>
                  <p className="text-xs font-black text-gray-900">100% Desi Ghee & Fresh</p>
                </div>
              </motion.div>

              {/* Floating Badge 2: Daily Delivery */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="absolute -bottom-5 -right-4 sm:-right-6 z-20 bg-white/95 backdrop-blur-md rounded-2xl p-3 flex items-center gap-2.5 shadow-xl border border-gray-100"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-700 flex items-center justify-center font-bold">
                  <UtensilsCrossed size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Vidarbha Kitchen</p>
                  <p className="text-xs font-black text-gray-900">Lunch & Dinner Slots</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
