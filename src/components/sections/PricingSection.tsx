import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { CheckCircle2, Star, ArrowRight, UtensilsCrossed, Sparkles, Clock, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { Plan } from '@/types/database';
import { fetchPublicPlans } from '@/services/planService';

export default function PricingSection() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCycle, setSelectedCycle] = useState<'all' | 'monthly' | 'weekly' | 'daily'>('all');

  useEffect(() => {
    async function loadPlans() {
      try {
        setLoading(true);
        const data = await fetchPublicPlans();
        setPlans(data);
      } catch (err) {
        console.error('Error loading public plans:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPlans();
  }, []);

  const filteredPlans = plans.filter((p) => {
    if (selectedCycle === 'all') return true;
    return p.plan_type === selectedCycle;
  });

  return (
    <section id="plans" className="py-20 bg-[#F6F3EC] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#EAE4D8] text-[#226D3B] text-xs font-black uppercase tracking-wider">
            <UtensilsCrossed size={14} />
            <span>Honest Homemade Mess Pricing</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#22201E] tracking-tight">
            Transparent, Affordable <span className="text-[#226D3B]">Meal Plans</span>
          </h2>

          <p className="text-sm sm:text-base text-[#6B6760] font-medium leading-relaxed">
            Nutritious, warm, homemade meals prepared daily with zero preservatives. Pause, resume, or extend anytime with zero lock-in fee.
          </p>

          {/* Cycle Tabs */}
          <div className="flex items-center justify-center gap-1.5 p-1 rounded-2xl bg-[#EAE4D8]/70 max-w-sm mx-auto mt-6 border border-[#DDD5C5]">
            {[
              { id: 'all', label: 'All Plans' },
              { id: 'monthly', label: 'Monthly' },
              { id: 'weekly', label: 'Weekly' },
              { id: 'daily', label: 'Daily Trial' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedCycle(tab.id as any)}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black transition-all ${
                  selectedCycle === tab.id
                    ? 'bg-[#226D3B] text-white shadow-xs'
                    : 'text-[#6B6760] hover:text-[#22201E]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Pricing Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-7 items-stretch">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-96 rounded-3xl bg-[#EBE5DA] animate-pulse border border-[#DFD7C8]"
              />
            ))}
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-sm">
            No active meal plans available at the moment. Please check back shortly.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7 items-stretch">
            <AnimatePresence>
              {filteredPlans.map((plan, index) => {
                const currentPrice = plan.discounted_price ? Number(plan.discounted_price) : Number(plan.price);
                const originalPrice = plan.discounted_price ? Number(plan.price) : null;
                const isFeatured = Boolean(plan.is_featured);

                // Default features fallback if empty in DB
                const featuresList =
                  plan.features && plan.features.length > 0
                    ? plan.features
                    : [
                        'Doorstep delivery included across Nagpur',
                        'Fresh, hot homestyle cooked meals',
                        'Pause & extend subscription anytime',
                        'Zero artificial preservatives',
                      ];

                return (
                  <motion.div
                    key={plan.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    className="flex"
                  >
                    <div
                      className={`relative flex flex-col justify-between w-full rounded-3xl p-6 sm:p-7 transition-all duration-300 bg-white ${
                        isFeatured
                          ? 'border-2 border-[#226D3B] shadow-xl shadow-[#226D3B]/10 md:-translate-y-1.5 ring-4 ring-[#226D3B]/10'
                          : 'border border-[#E5E0D6] shadow-xs hover:border-[#226D3B]/50 hover:shadow-md'
                      }`}
                    >
                      {/* Popular / Featured Pill */}
                      {isFeatured && (
                        <div className="absolute -top-3.5 right-6 bg-gradient-to-r from-amber-600 to-amber-700 text-white text-[10px] font-black px-3.5 py-1 rounded-full flex items-center gap-1 shadow-md uppercase tracking-wider">
                          <Star size={11} className="fill-current text-amber-200" />
                          <span>Most Popular</span>
                        </div>
                      )}

                      <div className="space-y-4">
                        {/* Plan Header */}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase text-[#226D3B] bg-[#EDF4EF] px-2.5 py-0.5 rounded-full">
                              {plan.plan_type} • {plan.duration_days} {plan.duration_unit || 'Days'}
                            </span>
                            <span className="text-[10px] font-bold uppercase text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full capitalize">
                              {plan.meal_type} Portion
                            </span>
                          </div>
                          <h3 className="text-xl font-black text-[#22201E] mt-2.5">{plan.name}</h3>
                          {plan.description && (
                            <p className="text-xs text-[#6B6760] mt-1 leading-relaxed">{plan.description}</p>
                          )}
                        </div>

                        {/* Included Meals Pill */}
                        {plan.included_meals && (
                          <div className="p-3 rounded-2xl bg-[#F4F8F5] border border-[#E0EBE3] space-y-1">
                            <div className="text-[10px] font-black text-[#1B572F] uppercase tracking-wider flex items-center gap-1">
                              <UtensilsCrossed size={12} />
                              <span>Included In Tiffin</span>
                            </div>
                            <p className="text-xs font-bold text-[#1B572F] leading-snug">
                              {plan.included_meals}
                            </p>
                          </div>
                        )}

                        {/* Price Display */}
                        <div className="pt-2">
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-[#1B572F]">₹{currentPrice}</span>
                            {originalPrice && (
                              <span className="text-sm line-through text-gray-400 font-bold">
                                ₹{originalPrice}
                              </span>
                            )}
                            <span className="text-xs text-[#226D3B] font-bold">
                              / {plan.plan_type === 'monthly' ? 'month' : plan.plan_type === 'weekly' ? 'week' : 'meal'}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#6B6760] font-semibold mt-0.5">
                            Just ₹{Math.round(currentPrice / plan.duration_days)}/day homestyle meal
                          </p>
                        </div>

                        {/* Feature Bullets */}
                        <div className="pt-2 border-t border-[#F0EBE1] space-y-2">
                          {featuresList.map((feature, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-[#4A4641] font-medium">
                              <CheckCircle2 size={14} className="text-[#226D3B] shrink-0 mt-0.5" />
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action CTA */}
                      <div className="pt-6 mt-5 border-t border-[#F0EBE1]">
                        <Button
                          asChild
                          className={`w-full rounded-2xl h-11 text-xs font-black transition-all ${
                            isFeatured
                              ? 'bg-[#226D3B] hover:bg-[#1B572F] text-white shadow-lg shadow-[#226D3B]/25'
                              : 'bg-[#2E2B27] hover:bg-[#1E1C19] text-white'
                          }`}
                        >
                          <Link to={`/checkout?planId=${plan.id}`}>
                            <span>Subscribe to Plan</span>
                            <ArrowRight size={14} className="ml-1.5 inline" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Bottom Assurance Banner */}
        <div className="mt-14 max-w-4xl mx-auto p-6 rounded-3xl bg-[#EAE4D8]/80 border border-[#DDD5C5] flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#226D3B] text-white flex items-center justify-center shrink-0 shadow-md">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-[#22201E]">100% Flexible Subscription Policy</h4>
              <p className="text-xs text-[#6B6760] mt-0.5">
                Going out of town? Pause your subscription anytime from your customer dashboard with zero deducted days.
              </p>
            </div>
          </div>
          <Link
            to="/contact"
            className="px-4 py-2 rounded-xl bg-white border border-[#DDD5C5] text-[#22201E] text-xs font-bold hover:bg-gray-50 shrink-0 transition-colors shadow-xs"
          >
            Have Questions?
          </Link>
        </div>
      </div>
    </section>
  );
}
