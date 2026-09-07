import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import SEOHead from '@/components/seo/SEOHead';
import { BUSINESS_CONFIG } from '@/config/business';

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FCFBF8]">
      <SEOHead
        title="Terms of Service | Nimje Gharchi Rasoi"
        description="Terms and conditions for tiffin subscriptions and homemade meal deliveries by Nimje Gharchi Rasoi in Nagpur."
        canonicalPath="/terms"
      />
      <Navbar />

      <main className="flex-grow pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-gray-200/80 p-8 sm:p-12 shadow-xs space-y-6 text-gray-700 leading-relaxed">
          <div className="border-b border-gray-200 pb-6">
            <span className="text-xs font-black uppercase text-emerald-800 tracking-wider">
              Patron Agreement
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mt-1">
              Terms of Service
            </h1>
            <p className="text-xs text-gray-500 mt-2">
              Effective Date: September 2026 • {BUSINESS_CONFIG.name}, Nagpur
            </p>
          </div>

          <section className="space-y-3 text-sm">
            <h2 className="text-lg font-bold text-gray-900">1. Subscription & Meal Deliveries</h2>
            <p>
              By subscribing to meal plans from {BUSINESS_CONFIG.name}, you agree to receive fresh, homestyle vegetarian tiffin meals at your designated Nagpur address according to your chosen plan duration (Daily, Weekly, or Monthly) and meal slots (Lunch / Dinner / Both).
            </p>
          </section>

          <section className="space-y-3 text-sm">
            <h2 className="text-lg font-bold text-gray-900">2. Delivery Schedule & Cutoff Timings</h2>
            <p>
              Daily delivery windows are:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Lunch Delivery:</strong> {BUSINESS_CONFIG.operatingHours.lunch}</li>
              <li><strong>Dinner Delivery:</strong> {BUSINESS_CONFIG.operatingHours.dinner}</li>
            </ul>
            <p>
              Delivery times may experience minor variations during severe weather, heavy traffic, or public holidays in Nagpur. Customers will be notified in advance of any operational schedule changes.
            </p>
          </section>

          <section className="space-y-3 text-sm">
            <h2 className="text-lg font-bold text-gray-900">3. Pausing & Skipping Meals</h2>
            <p>
              Subscribers can pause or skip upcoming meals directly via the Customer Dashboard. To ensure fresh cooking without food waste, notification cutoff times are:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>For Lunch Pause:</strong> Before 9:00 AM on the day of delivery.</li>
              <li><strong>For Dinner Pause:</strong> Before 5:00 PM on the day of delivery.</li>
            </ul>
            <p>
              Eligible skipped meals are credited back by extending your subscription validity period.
            </p>
          </section>

          <section className="space-y-3 text-sm">
            <h2 className="text-lg font-bold text-gray-900">4. Payment & Verification</h2>
            <p>
              All orders and subscriptions must be prepaid via verified UPI payment channels. Orders are marked confirmed once the transaction UTR number is verified against bank credits.
            </p>
          </section>

          <section className="space-y-3 text-sm">
            <h2 className="text-lg font-bold text-gray-900">5. Food Safety & Consumption</h2>
            <p>
              Our meals are freshly cooked without chemical preservatives or tasting soda. For maximum safety and optimal taste, meals should be consumed within 3 hours of delivery.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
