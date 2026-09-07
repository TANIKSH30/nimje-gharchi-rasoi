import React, { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import WhatsAppButton from '@/components/layout/WhatsAppButton';
import SEOHead from '@/components/seo/SEOHead';
import { Phone, Mail, MapPin, Clock, MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import DeliveryZoneMap from '@/components/sections/DeliveryZoneMap';
import { checkRateLimit } from '@/lib/rateLimit';
import {
  BUSINESS_CONFIG,
  getPhoneCallUrl,
  getEmailMailtoUrl,
  getWhatsAppUrl,
} from '@/config/business';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRateLimitError(null);

    const rl = checkRateLimit('contact_form_submit', 3, 180000); // 3 submissions per 3 minutes
    if (!rl.allowed) {
      setRateLimitError(`Too many requests. Please wait ${rl.retryAfterSeconds}s before sending another message.`);
      return;
    }

    setSubmitted(true);
  };

  const whatsappInquiryUrl = getWhatsAppUrl(
    'Hi Nimje Gharchi Rasoi, I would like to inquire about your tiffin meal subscriptions in Nagpur.'
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#FCFBF8] w-full max-w-full overflow-x-hidden">
      <SEOHead
        title="Contact & Delivery Areas in Nagpur | Nimje Gharchi Rasoi"
        description="Get in touch with Nimje Gharchi Rasoi. Call, WhatsApp, or view our delivery zones across Nagpur including Nandanvan, Reshimbagh, Medical Square, Civil Lines, and Dharampeth."
        canonicalPath="/contact"
      />
      <Navbar />

      <main className="flex-grow pt-28 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center mb-12 space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-800 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-100">
              We're Here to Help
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight">
              Get in Touch with Nimje Gharchi Rasoi
            </h1>
            <p className="text-gray-600 mt-2 text-sm sm:text-base max-w-xl mx-auto">
              Have questions about meal plans, delivery areas, or special dietary requirements? Call or WhatsApp our kitchen anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Contact Details Card */}
            <div className="lg:col-span-5 space-y-6">
              <Card className="rounded-3xl p-8 bg-gradient-to-br from-emerald-800 via-emerald-900 to-teal-950 text-white shadow-xl">
                <h2 className="text-2xl font-black mb-3">Direct Contact</h2>
                <p className="text-emerald-100/90 text-sm mb-7 leading-relaxed">
                  Call or WhatsApp our kitchen team directly for instant subscription assistance, delivery timing inquiries, or trial orders.
                </p>

                <div className="space-y-5 text-sm">
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-md">
                      <Phone size={18} />
                    </div>
                    <div>
                      <p className="text-emerald-200 text-xs font-bold uppercase tracking-wider">Phone & WhatsApp</p>
                      <a href={getPhoneCallUrl()} className="text-base font-black hover:underline text-white font-mono">
                        {BUSINESS_CONFIG.phone}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-md">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <p className="text-emerald-200 text-xs font-bold uppercase tracking-wider">Kitchen Location</p>
                      <p className="text-sm font-semibold text-white leading-snug">
                        {BUSINESS_CONFIG.hubLocation}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-md">
                      <Clock size={18} />
                    </div>
                    <div>
                      <p className="text-emerald-200 text-xs font-bold uppercase tracking-wider">Operating Hours</p>
                      <p className="text-sm font-semibold text-white">Lunch: {BUSINESS_CONFIG.operatingHours.lunch}</p>
                      <p className="text-sm font-semibold text-white">Dinner: {BUSINESS_CONFIG.operatingHours.dinner}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-md">
                      <Mail size={18} />
                    </div>
                    <div>
                      <p className="text-emerald-200 text-xs font-bold uppercase tracking-wider">Email Inquiry</p>
                      <a href={getEmailMailtoUrl()} className="text-sm font-semibold text-white hover:underline">
                        {BUSINESS_CONFIG.email}
                      </a>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/20 space-y-3">
                  <a
                    href={whatsappInquiryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-full py-3 rounded-2xl bg-white text-emerald-900 font-black text-sm hover:bg-emerald-50 shadow-md transition-all cursor-pointer gap-2"
                  >
                    <MessageSquare size={16} /> Chat on WhatsApp
                  </a>

                  <a
                    href={BUSINESS_CONFIG.googleReviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-full py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs shadow-md transition-all cursor-pointer gap-2"
                  >
                    <span>★★★★★</span>
                    <span>Rate Us 5-Stars on Google</span>
                  </a>
                </div>
              </Card>
            </div>

            {/* Inquiry Form */}
            <div className="lg:col-span-7">
              <Card className="rounded-3xl p-8 border border-gray-200/80 shadow-xs bg-white h-full flex flex-col justify-between">
                {submitted ? (
                  <div className="text-center py-12 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                      <CheckCircle2 size={32} />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900">Message Received!</h3>
                    <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
                      Thank you for contacting Nimje Gharchi Rasoi. Our team will get back to you shortly on your phone or email.
                    </p>
                    <Button onClick={() => setSubmitted(false)} variant="outline" className="rounded-xl mt-4">
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <h2 className="text-2xl font-black text-gray-900">Send an Inquiry</h2>
                      <p className="text-xs text-gray-500 mt-1">Fill out the form below and we'll reach out to you promptly.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-gray-700 mb-1 block">Full Name *</label>
                        <Input
                          required
                          placeholder="e.g. Anand Sharma"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-700 mb-1 block">Phone / Mobile *</label>
                        <Input
                          required
                          type="tel"
                          placeholder="+91 98765 43210"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-700 mb-1 block">Email Address (Optional)</label>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-700 mb-1 block">Your Message / Requirements *</label>
                      <textarea
                        required
                        rows={4}
                        placeholder="Tell us about your tiffin requirements (monthly/daily, lunch/dinner, delivery area)..."
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 text-foreground"
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      />
                    </div>

                    {rateLimitError && (
                      <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                        {rateLimitError}
                      </div>
                    )}

                    <Button type="submit" size="lg" className="w-full rounded-xl font-black bg-emerald-700 hover:bg-emerald-800 text-white">
                      <Send size={16} className="mr-2" /> Send Inquiry
                    </Button>
                  </form>
                )}
              </Card>
            </div>
          </div>

          {/* Interactive Delivery Zone Map */}
          <div className="pt-4">
            <DeliveryZoneMap showTitle />
          </div>
        </div>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
