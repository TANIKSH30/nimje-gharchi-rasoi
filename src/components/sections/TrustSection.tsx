import React from 'react';
import { motion } from 'framer-motion';
import { Award, Users, CalendarHeart, ChefHat } from 'lucide-react';

export default function TrustSection() {
  const stats = [
    { id: 1, value: '20+', label: 'Years Serving Nagpur', icon: <Award className="w-7 h-7 text-primary" /> },
    { id: 2, value: '1000+', label: 'Happy Regular Patrons', icon: <Users className="w-7 h-7 text-secondary" /> },
    { id: 3, value: '365', label: 'Days Fresh Daily Cooking', icon: <CalendarHeart className="w-7 h-7 text-primary" /> },
    { id: 4, value: '100%', label: 'Pure Homestyle Taste', icon: <ChefHat className="w-7 h-7 text-secondary" /> },
  ];

  return (
    <section className="py-14 bg-white border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              className="flex flex-col items-center justify-center p-6 rounded-3xl bg-[#FCFBF8] border border-gray-200/80 shadow-xs hover:shadow-md transition-shadow"
            >
              <div className="p-3.5 bg-white rounded-2xl shadow-xs border border-gray-100 mb-3.5">
                {stat.icon}
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-foreground mb-1">{stat.value}</h3>
              <p className="text-xs sm:text-sm font-semibold text-gray-500 text-center">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
