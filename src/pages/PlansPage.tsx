import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import WhatsAppButton from '@/components/layout/WhatsAppButton';
import PricingSection from '@/components/sections/PricingSection';
import SEOHead from '@/components/seo/SEOHead';
import { UtensilsCrossed, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';

export default function PlansPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FCFBF8] w-full max-w-full overflow-x-hidden">
      <SEOHead
        title="Tiffin Subscription Plans & Monthly Mess Rates in Nagpur"
        description="Explore affordable monthly, weekly, and daily meal plans from Nimje Gharchi Rasoi Nagpur. 100% pure veg homemade meals with door-to-door delivery."
        canonicalPath="/plans"
      />
      <Navbar />

      <main className="flex-grow pt-24">
        {/* Page Banner */}
        <section className="bg-gradient-to-b from-[#FAF7F0] to-[#F6F3EC] py-12 sm:py-16 border-b border-[#EAE6DE] px-4">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-black uppercase tracking-wider">
              <UtensilsCrossed size={14} />
              <span>Nagpur Mess & Tiffin Subscriptions</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight">
              Honest Homemade Meal Plans
            </h1>

            <p className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
              Wholesome, home-style meals prepared twice daily with authentic Vidarbha spices, whole wheat rotis, and fresh vegetables. Pause, skip, or resume meals anytime with zero hassle.
            </p>

            {/* Quick Benefits Bar */}
            <div className="pt-3 flex flex-wrap justify-center gap-4 text-xs font-bold text-gray-700">
              <div className="flex items-center gap-1.5 bg-white px-3.5 py-1.5 rounded-full border border-gray-200/80 shadow-xs">
                <CheckCircle2 size={14} className="text-emerald-600" />
                <span>Zero Soda & Chemicals</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white px-3.5 py-1.5 rounded-full border border-gray-200/80 shadow-xs">
                <Clock size={14} className="text-amber-600" />
                <span>Flexible Meal Pausing</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white px-3.5 py-1.5 rounded-full border border-gray-200/80 shadow-xs">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span>100% Pure Veg Kitchen</span>
              </div>
            </div>
          </div>
        </section>

        {/* Dynamic Pricing Grid */}
        <PricingSection />
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
