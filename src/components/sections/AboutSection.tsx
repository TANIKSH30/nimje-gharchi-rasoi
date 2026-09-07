import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ShieldCheck, Heart, Award } from 'lucide-react';

export default function AboutSection() {
  const points = [
    'Strict hygiene & daily sanitization in our home kitchen',
    'Fresh local vegetables & whole wheat grains sourced daily',
    'No artificial colors, MSG, or harmful preservatives',
    'Authentic Maharashtrian & Vidarbha family recipes',
    'Food-grade leak-proof hot tiffin packaging',
  ];

  return (
    <section id="about" className="py-20 bg-[#FCFBF8] overflow-hidden w-full max-w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="w-full lg:w-1/2 relative overflow-hidden p-2"
          >
            <div className="grid grid-cols-2 gap-4">
              <img
                src="https://images.unsplash.com/photo-1585937421612-70a008356fbe?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
                alt="Cooking fresh homemade meal"
                className="w-full h-56 sm:h-64 object-cover rounded-3xl rounded-tr-none shadow-lg mt-6 sm:mt-8 border-2 border-white"
              />
              <img
                src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
                alt="Fresh wholesome food spread"
                className="w-full h-56 sm:h-64 object-cover rounded-3xl rounded-bl-none shadow-lg border-2 border-white"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="w-full lg:w-1/2 space-y-6"
          >
            <div>
              <p className="text-secondary font-bold tracking-wider uppercase text-xs sm:text-sm mb-2">
                Our 20+ Year Legacy
              </p>
              <h2 className="text-3xl md:text-5xl font-extrabold text-foreground leading-tight">
                Crafting <span className="text-primary">Memories</span> Through Pure Homestyle Cooking
              </h2>
            </div>

            <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
              For over two decades in Nagpur, <strong className="text-foreground">Nimje Gharchi Rasoi</strong> has been the reliable meal partner for thousands of students, working professionals, and families.
            </p>

            <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
              We understand the longing for mother's homemade food away from home. Every dish is cooked fresh daily with mild spices, digestive herbs, pure oils, and unconditional care.
            </p>

            <div className="space-y-3 pt-2">
              {points.map((point, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-foreground font-medium text-sm sm:text-base">{point}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
