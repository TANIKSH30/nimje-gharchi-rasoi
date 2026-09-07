import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import SEOHead from '@/components/seo/SEOHead';
import { BUSINESS_CONFIG } from '@/config/business';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FCFBF8]">
      <SEOHead
        title="Privacy Policy | Nimje Gharchi Rasoi"
        description="Privacy policy and personal data protection terms for Nimje Gharchi Rasoi tiffin and mess service in Nagpur."
        canonicalPath="/privacy-policy"
      />
      <Navbar />

      <main className="flex-grow pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-gray-200/80 p-8 sm:p-12 shadow-xs space-y-6 text-gray-700 leading-relaxed">
          <div className="border-b border-gray-200 pb-6">
            <span className="text-xs font-black uppercase text-emerald-800 tracking-wider">
              Legal Transparency
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mt-1">
              Privacy Policy
            </h1>
            <p className="text-xs text-gray-500 mt-2">
              Last Updated: September 2026 • {BUSINESS_CONFIG.name}, Nagpur
            </p>
          </div>

          <section className="space-y-3 text-sm">
            <h2 className="text-lg font-bold text-gray-900">1. Information We Collect</h2>
            <p>
              At {BUSINESS_CONFIG.name}, we collect only the essential personal details required to prepare and deliver your homemade meals on time across Nagpur. This includes:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Contact Information:</strong> Name, phone number, and email address.</li>
              <li><strong>Delivery Information:</strong> Street address, landmark, area, and pincode in Nagpur.</li>
              <li><strong>Order & Subscription Details:</strong> Chosen meal plan, delivery slots (lunch/dinner), dietary notes, and payment reference (UTR) information.</li>
            </ul>
          </section>

          <section className="space-y-3 text-sm">
            <h2 className="text-lg font-bold text-gray-900">2. How We Use Your Data</h2>
            <p>
              Your data is strictly utilized for the following operational purposes:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Fulfilling daily tiffin and special meal orders to your designated Nagpur address.</li>
              <li>Sending SMS, WhatsApp, or email notifications regarding subscription renewals, meal dispatches, and account alerts.</li>
              <li>Verifying UPI payments securely via transaction reference numbers (UTR).</li>
              <li>Improving kitchen operations and customer support response times.</li>
            </ul>
          </section>

          <section className="space-y-3 text-sm">
            <h2 className="text-lg font-bold text-gray-900">3. Data Protection & Zero Third-Party Sharing</h2>
            <p>
              We value your trust. We never sell, rent, or trade your personal information or phone number to any third-party marketing agencies. Access to customer contact details is restricted to verified delivery and kitchen staff members solely for order fulfillment.
            </p>
          </section>

          <section className="space-y-3 text-sm">
            <h2 className="text-lg font-bold text-gray-900">4. Account Security & Deletion</h2>
            <p>
              Your account credentials and addresses are stored securely using industry-standard encrypted databases. You can update or delete your saved delivery addresses anytime from your Customer Dashboard or contact us at <a href={`mailto:${BUSINESS_CONFIG.email}`} className="text-emerald-700 font-bold underline">{BUSINESS_CONFIG.email}</a> for account data inquiries.
            </p>
          </section>

          <section className="space-y-3 text-sm">
            <h2 className="text-lg font-bold text-gray-900">5. Contact Us</h2>
            <p>
              For any questions concerning this Privacy Policy, please contact our kitchen at:
            </p>
            <p className="font-semibold text-gray-800">
              {BUSINESS_CONFIG.name}<br />
              {BUSINESS_CONFIG.hubLocation}<br />
              Phone: {BUSINESS_CONFIG.phone} | Email: {BUSINESS_CONFIG.email}
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
