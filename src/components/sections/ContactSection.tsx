import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import DeliveryZoneMap from '@/components/sections/DeliveryZoneMap';
import {
  BUSINESS_CONFIG,
  getPhoneCallUrl,
  getEmailMailtoUrl,
} from '@/config/business';

export default function ContactSection() {
  return (
    <section id="contact" className="py-24 bg-white border-t border-[#EAE6DE]/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-12">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="w-full lg:w-1/3 space-y-7"
          >
            <div>
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-black uppercase tracking-wider mb-3">
                Contact & Support
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
                Get in <span className="text-emerald-700">Touch</span>
              </h2>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                Have questions about our daily mess subscription, diet requirements, or special bulk orders? Our kitchen team is always ready to assist you.
              </p>
            </div>

            <div className="space-y-4">
              <Card className="border border-gray-200/80 shadow-xs bg-gray-50/70 rounded-2xl">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="bg-emerald-100 text-emerald-800 p-2.5 rounded-xl shrink-0">
                    <MapPin size={22} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1 text-sm sm:text-base">Kitchen & Delivery Hub</h4>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                      {BUSINESS_CONFIG.hubLocation}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200/80 shadow-xs bg-gray-50/70 rounded-2xl">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="bg-amber-100 text-amber-800 p-2.5 rounded-xl shrink-0">
                    <Phone size={22} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1 text-sm sm:text-base">Phone & WhatsApp</h4>
                    <a
                      href={getPhoneCallUrl()}
                      className="text-xs sm:text-sm text-emerald-800 font-bold hover:underline block font-mono"
                    >
                      {BUSINESS_CONFIG.phone}
                    </a>
                    <a
                      href={getEmailMailtoUrl()}
                      className="text-xs sm:text-sm text-gray-600 hover:underline block mt-0.5"
                    >
                      {BUSINESS_CONFIG.email}
                    </a>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200/80 shadow-xs bg-gray-50/70 rounded-2xl">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="bg-teal-100 text-teal-800 p-2.5 rounded-xl shrink-0">
                    <Clock size={22} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1 text-sm sm:text-base">Delivery Timings</h4>
                    <p className="text-xs sm:text-sm text-gray-600">Lunch: {BUSINESS_CONFIG.operatingHours.lunch}</p>
                    <p className="text-xs sm:text-sm text-gray-600">Dinner: {BUSINESS_CONFIG.operatingHours.dinner}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="w-full lg:w-2/3"
          >
            <DeliveryZoneMap showTitle />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
