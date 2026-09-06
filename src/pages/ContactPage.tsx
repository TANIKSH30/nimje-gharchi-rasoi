import React, { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Phone, Mail, MapPin, Clock, MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';

import DeliveryZoneMap from '@/components/sections/DeliveryZoneMap';

import { checkRateLimit } from '@/lib/rateLimit';

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

  return (
    <div className="min-h-screen flex flex-col bg-[#FCFBF8]">
      <Navbar />

      <main className="flex-grow pt-28 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-secondary bg-secondary/10 px-3 py-1 rounded-full">
              We're Here to Help
            </span>
            <h1 className="text-4xl sm:text-5xl font-black text-foreground mt-4 tracking-tight">
              Get in Touch with Nimje Gharchi Rasoi
            </h1>
            <p className="text-gray-600 mt-3 text-base max-w-xl mx-auto">
              Have questions about meal plans, delivery areas, or special dietary requests? Call or WhatsApp us anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Contact Details */}
            <div className="lg:col-span-5 space-y-6">
              <Card className="rounded-3xl p-8 bg-gradient-to-br from-primary to-secondary text-white shadow-xl">
                <h3 className="text-2xl font-bold mb-3">Direct Contact</h3>
                <p className="text-white/90 text-sm mb-7 leading-relaxed">
                  Call or WhatsApp our kitchen directly for instant booking assistance and trial meal delivery.
                </p>

                <div className="space-y-5 text-sm">
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-md">
                      <Phone size={18} />
                    </div>
                    <div>
                      <p className="text-white/80 text-xs font-medium uppercase">Phone & WhatsApp</p>
                      <a href="tel:+917823098970" className="text-base font-bold hover:underline">
                        +91 78230 98970
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-md">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <p className="text-white/80 text-xs font-medium uppercase">Kitchen Location</p>
                      <p className="text-sm font-semibold">Nandanvan & Surrounding Belts, Nagpur, Maharashtra - 440009</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-md">
                      <Clock size={18} />
                    </div>
                    <div>
                      <p className="text-white/80 text-xs font-medium uppercase">Operating Hours</p>
                      <p className="text-sm font-semibold">Lunch Delivery: 11:30 AM – 2:00 PM</p>
                      <p className="text-sm font-semibold">Dinner Delivery: 7:30 PM – 10:00 PM</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/20 space-y-3">
                  <a
                    href="https://wa.me/917823098970?text=Hi,%20I%20want%20to%20know%20more%20about%20Nimje%20Gharchi%20Rasoi%20Tiffin%20plans"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-full py-3 rounded-2xl bg-white text-primary font-bold text-sm hover:bg-white/90 shadow-md transition-all cursor-pointer"
                  >
                    <MessageSquare size={16} className="mr-2" /> Chat on WhatsApp
                  </a>

                  <a
                    href="https://www.google.com/search?q=Nimje+Gharachi+Rasoi+Tiffin+services+Nagpur"
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

            {/* Form */}
            <div className="lg:col-span-7">
              <Card className="rounded-3xl p-8 border border-gray-200 shadow-sm bg-white h-full flex flex-col justify-between">
                {submitted ? (
                  <div className="text-center py-12 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-secondary/10 text-secondary flex items-center justify-center mx-auto">
                      <CheckCircle2 size={32} />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground">Message Received!</h3>
                    <p className="text-sm text-gray-500 max-w-md mx-auto">
                      Thank you for contacting Nimje Gharchi Rasoi. Our team will get back to you within 2 hours.
                    </p>
                    <Button onClick={() => setSubmitted(false)} variant="outline" className="rounded-xl mt-4">
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <h3 className="text-2xl font-bold text-foreground">Send an Inquiry</h3>
                      <p className="text-xs text-gray-500 mt-1">Fill out the form below and we'll reach out to you promptly.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-gray-700 mb-1 block">Full Name</label>
                        <Input
                          required
                          placeholder="e.g. Anand Sharma"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 mb-1 block">Phone / Mobile</label>
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
                      <label className="text-xs font-semibold text-gray-700 mb-1 block">Email Address</label>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-700 mb-1 block">Your Message / Requirements</label>
                      <textarea
                        required
                        rows={4}
                        placeholder="Tell us about your tiffin requirements (monthly/daily, lunch/dinner, delivery area)..."
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      />
                    </div>

                    {rateLimitError && (
                      <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                        {rateLimitError}
                      </div>
                    )}

                    <Button type="submit" size="lg" className="w-full rounded-xl font-bold">
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
    </div>
  );
}
