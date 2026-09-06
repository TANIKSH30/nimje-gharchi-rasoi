import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';

import DeliveryZoneMap from '@/components/sections/DeliveryZoneMap';

export default function ContactSection() {
  return (
    <section id="contact" className="py-24 bg-white">
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
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-3">
                Contact & Support
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold text-foreground mb-4">
                Get in <span className="text-primary">Touch</span>
              </h2>
              <p className="text-gray-600 text-base">
                Have questions about our mess subscription, diet requirements, or special bulk events? We are here to help you.
              </p>
            </div>

            <div className="space-y-4">
              <Card className="border border-gray-200 shadow-sm bg-gray-50/70 rounded-2xl">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="bg-primary/15 p-2.5 rounded-xl text-primary shrink-0">
                    <MapPin size={22} />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground mb-1 text-sm sm:text-base">Kitchen & Delivery Hub</h4>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                      Nandanvan & Surrounding Belts, <br />
                      Nagpur, Maharashtra 440009
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200 shadow-sm bg-gray-50/70 rounded-2xl">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="bg-secondary/15 p-2.5 rounded-xl text-secondary shrink-0">
                    <Phone size={22} />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground mb-1 text-sm sm:text-base">Phone & WhatsApp</h4>
                    <p className="text-xs sm:text-sm text-gray-600 font-semibold">+91 78230 98970</p>
                    <p className="text-xs sm:text-sm text-gray-600">contact@nimjegharchirasoi.com</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200 shadow-sm bg-gray-50/70 rounded-2xl">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="bg-primary/15 p-2.5 rounded-xl text-primary shrink-0">
                    <Clock size={22} />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground mb-1 text-sm sm:text-base">Delivery Timings</h4>
                    <p className="text-xs sm:text-sm text-gray-600">Lunch: 11:30 AM – 2:00 PM</p>
                    <p className="text-xs sm:text-sm text-gray-600">Dinner: 7:30 PM – 10:00 PM</p>
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
