import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Phone, MessageSquare } from 'lucide-react';
import { BUSINESS_CONFIG, getPhoneCallUrl, getWhatsAppUrl } from '@/config/business';

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Which areas in Nagpur do you deliver tiffins to?',
      a: 'We deliver across major areas in Nagpur including Nandanvan, Reshimbagh, Medical Square, Civil Lines, Dharampeth, Sadar, Dhantoli, Ramdaspeth, Sitabuldi, Manewada, Ayodhya Nagar, Sakkardara, and surrounding locations.',
    },
    {
      q: 'What are your lunch and dinner delivery timings?',
      a: `Lunch is freshly delivered between ${BUSINESS_CONFIG.operatingHours.lunch}, and dinner is delivered between ${BUSINESS_CONFIG.operatingHours.dinner}. Meals are dispatched in food-grade hot containers right after cooking.`,
    },
    {
      q: 'Can I pause or skip my tiffin subscription when I travel?',
      a: 'Yes, 100%! You can easily pause and resume your subscription from your Customer Dashboard. If you notify us before kitchen preparation cutoff (by 9:00 AM for lunch, or 5:00 PM for dinner), your skipped meals are credited back and your subscription validity is extended accordingly.',
    },
    {
      q: 'Can I try a 1-Day Trial Meal before taking a monthly subscription?',
      a: 'Absolutely. We offer a Daily Trial meal option on our plans page so you can experience our genuine homestyle cooking quality, hygiene, and timely delivery before committing to a weekly or monthly subscription.',
    },
    {
      q: 'Is the food 100% pure vegetarian and cooked without harmful additives?',
      a: 'Yes. Our kitchen is 100% pure vegetarian. We strictly use pure sunflower/soybean oil, whole wheat MP Sharbati atta, fresh vegetables sourced daily, and freshly ground Vidarbha spices. We never use artificial food colors, tasting soda, or chemical preservatives.',
    },
    {
      q: 'How do I pay for my tiffin subscription?',
      a: 'We support hassle-free instant UPI payments (Google Pay, PhonePe, Paytm, BHIM). Once you select your plan and address at checkout, scan the UPI QR code or enter our UPI ID, complete the payment, and submit the UTR reference number for swift activation.',
    },
  ];

  const toggleFaq = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="py-20 bg-[#F8F6F1] border-t border-[#EAE6DE]/70 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-black uppercase tracking-wider">
            <HelpCircle size={14} />
            <span>Frequently Asked Questions</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
            Got Questions? We've Got Answers
          </h2>
          <p className="text-sm sm:text-base text-gray-600 font-medium max-w-xl mx-auto">
            Everything you need to know about our homemade tiffin and mess service in Nagpur.
          </p>
        </div>

        <div className="space-y-3.5">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-[#E7E2D7] bg-white overflow-hidden transition-all duration-200 shadow-xs"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full text-left px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-4 font-extrabold text-sm sm:text-base text-gray-900 hover:text-emerald-800 focus:outline-none focus:bg-emerald-50/40 cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    size={18}
                    className={`text-emerald-700 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 sm:px-6 pb-5 pt-1 text-xs sm:text-sm text-gray-600 leading-relaxed border-t border-gray-100 animate-in fade-in duration-150">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Support Callout Box */}
        <div className="mt-12 p-6 rounded-3xl bg-white border border-[#E5DFD3] flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left shadow-xs">
          <div>
            <h3 className="font-black text-sm sm:text-base text-gray-900">
              Have a custom dietary request or special query?
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Call or message our kitchen team directly for instant support.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <a
              href={getPhoneCallUrl()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-colors"
            >
              <Phone size={14} className="text-emerald-700" />
              <span>Call Us</span>
            </a>
            <a
              href={getWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors shadow-xs"
            >
              <MessageSquare size={14} />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
