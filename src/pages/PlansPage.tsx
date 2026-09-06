import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PricingSection from '@/components/sections/PricingSection';

export default function PlansPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FCFBF8]">
      <Navbar />
      <main className="flex-grow pt-20">
        <div className="bg-primary/5 py-12 border-b border-gray-200/80 text-center px-4">
          <h1 className="text-3xl sm:text-5xl font-black text-foreground">
            Meal Subscription Plans
          </h1>
          <p className="text-gray-600 mt-2 max-w-xl mx-auto text-sm sm:text-base">
            Choose the plan that matches your schedule. 100% homestyle nutrition, no preservatives, prepared with fresh ingredients daily.
          </p>
        </div>
        <PricingSection />
      </main>
      <Footer />
    </div>
  );
}
