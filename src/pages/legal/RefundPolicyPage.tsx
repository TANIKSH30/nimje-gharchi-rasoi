import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import SEOHead from '@/components/seo/SEOHead';
import { BUSINESS_CONFIG } from '@/config/business';

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FCFBF8]">
      <SEOHead
        title="Subscription & Refund Policy | Nimje Gharchi Rasoi"
        description="Transparent meal subscription pause, validity extension, and refund guidelines for Nimje Gharchi Rasoi in Nagpur."
        canonicalPath="/refund-policy"
      />
      <Navbar />

      <main className="flex-grow pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-gray-200/80 p-8 sm:p-12 shadow-xs space-y-6 text-gray-700 leading-relaxed">
          <div className="border-b border-gray-200 pb-6">
            <span className="text-xs font-black uppercase text-emerald-800 tracking-wider">
              Flexibility & Trust
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mt-1">
              Subscription & Refund Policy
            </h1>
            <p className="text-xs text-gray-500 mt-2">
              Effective Date: September 2026 • {BUSINESS_CONFIG.name}, Nagpur
            </p>
          </div>

          <section className="space-y-3 text-sm">
            <h2 className="text-lg font-bold text-gray-900">1. 100% Flexible Subscription Extensions</h2>
            <p>
              We understand that plans change. Rather than forfeiting meals when you travel or dine out, {BUSINESS_CONFIG.name} provides a flexible meal-carry-forward policy:
            </p>
            <p>
              Whenever you pause your subscription before the designated kitchen cutoff (9:00 AM for lunch or 5:00 PM for dinner), the unused days are automatically carried forward, extending your active subscription period without any penalty or deduction.
            </p>
          </section>

          <section className="space-y-3 text-sm">
            <h2 className="text-lg font-bold text-gray-900">2. Cancellation of Active Subscriptions</h2>
            <p>
              If a customer relocates outside our Nagpur delivery coverage or requires permanent early termination of a monthly plan, refund requests are processed based on the unutilized meal balance minus the standard non-discounted daily meal rate for meals already consumed.
            </p>
          </section>

          <section className="space-y-3 text-sm">
            <h2 className="text-lg font-bold text-gray-900">3. Special Orders Cancellation</h2>
            <p>
              For customized bulk orders or special Maharashtrian delicacy orders, cancellations must be requested at least 24 hours prior to the scheduled delivery date. Orders cancelled with less than 12 hours notice cannot be refunded due to perishable ingredient preparation.
            </p>
          </section>

          <section className="space-y-3 text-sm">
            <h2 className="text-lg font-bold text-gray-900">4. Processing Timelines</h2>
            <p>
              Approved refunds are credited directly back to the original customer bank account/UPI ID within 3–5 business days.
            </p>
          </section>

          <section className="space-y-3 text-sm">
            <h2 className="text-lg font-bold text-gray-900">5. Assistance & Claims</h2>
            <p>
              For any subscription adjustments or refund inquiries, please contact our kitchen supervisor at:
            </p>
            <p className="font-semibold text-gray-800">
              {BUSINESS_CONFIG.name}<br />
              Phone: {BUSINESS_CONFIG.phone} | Email: {BUSINESS_CONFIG.email}
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
