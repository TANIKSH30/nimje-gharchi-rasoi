import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, MapPin, Utensils, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function HowItWorksSection() {
  const steps = [
    {
      step: '01',
      icon: CalendarCheck,
      title: 'Pick Your Plan',
      description:
        'Select a flexible Daily, Weekly, or Monthly subscription plan that suits your schedule for Lunch, Dinner, or Both.',
      highlight: 'Pause & extend anytime',
    },
    {
      step: '02',
      icon: MapPin,
      title: 'Set Nagpur Address & Slot',
      description:
        'Tell us your location (Nandanvan, Medical Square, Dharampeth, Civil Lines, etc.) and preferred delivery time.',
      highlight: 'On-time delivery guarantee',
    },
    {
      step: '03',
      icon: Utensils,
      title: 'Enjoy Hot Homemade Meals',
      description:
        'Savor fresh, pure-veg home-cooked meals prepared with authentic Vidarbha spices, zero preservatives, and mother’s care.',
      highlight: 'Hygienic hot-seal packaging',
    },
  ];

  return (
    <section className="py-20 bg-white border-y border-[#EAE6DE]/70 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-black uppercase tracking-wider">
            <span>Simple 3-Step Process</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
            How Nimje Gharchi Rasoi Works
          </h2>
          <p className="text-sm sm:text-base text-gray-600 font-medium leading-relaxed">
            Getting healthy, homemade tiffins delivered to your office, hostel, or home in Nagpur takes less than 2 minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="relative flex flex-col justify-between p-7 rounded-3xl bg-[#FAF8F5] border border-[#EBE7DF] hover:border-emerald-500/40 hover:shadow-lg transition-all duration-300 group"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-md shadow-emerald-800/20 group-hover:scale-105 transition-transform">
                      <Icon size={26} />
                    </div>
                    <span className="text-3xl font-black text-gray-300/80 font-mono">
                      {item.step}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-gray-900 mb-2">
                    {item.title}
                  </h3>

                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    {item.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-200/60 flex items-center text-xs font-bold text-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-2" />
                  <span>{item.highlight}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <Button
            asChild
            size="lg"
            className="rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-black px-8 shadow-md shadow-emerald-700/20"
          >
            <Link to="/checkout" className="inline-flex items-center gap-2">
              <span>Start Your Tiffin Subscription Today</span>
              <ArrowRight size={16} />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
