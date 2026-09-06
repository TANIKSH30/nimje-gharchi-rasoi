import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { ShieldCheck, Heart, Sparkles, Utensils, Award, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FCFBF8]">
      <Navbar />

      <main className="flex-grow pt-28 pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
              Our Journey & Kitchen Philosophy
            </span>
            <h1 className="text-4xl sm:text-5xl font-black text-foreground mt-4 tracking-tight">
              Bringing the Warmth of Mother's Kitchen to Nagpur
            </h1>
            <p className="text-gray-600 mt-4 text-base sm:text-lg max-w-3xl mx-auto leading-relaxed">
              Founded by the Nimje family, Nimje Gharchi Rasoi was born out of a simple belief: everyone living away from home deserves pure, wholesome, and delicious home-cooked meals every single day.
            </p>
          </div>

          {/* Story Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center mb-20">
            <div className="rounded-3xl overflow-hidden shadow-xl border border-gray-200">
              <img
                src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
                alt="Homestyle Kitchen Preparation"
                className="w-full h-80 object-cover"
              />
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">
                No Artificial Flavors. No Compromises.
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Commercial restaurant food is loaded with palm oil, excess spices, and heavy creams that ruin digestion over time. At Nimje Gharchi Rasoi, we cook strictly like home: using pure sunflower/soybean oil, authentic Vidarbha spices ground in-house, and whole wheat MP Sharbati atta.
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">
                Each tiffin is packed in food-grade, hot-seal containers right after preparation to ensure you receive piping hot meals for both lunch and dinner.
              </p>
            </div>
          </div>

          {/* Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
            <Card className="rounded-3xl p-6 text-center border border-gray-200 shadow-sm bg-white">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                <ShieldCheck size={24} />
              </div>
              <h3 className="font-bold text-base text-foreground mb-2">High Hygiene Standards</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Every utensil and vegetable is thoroughly sanitized before cooking in our spotless home kitchen.
              </p>
            </Card>

            <Card className="rounded-3xl p-6 text-center border border-gray-200 shadow-sm bg-white">
              <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center mx-auto mb-4">
                <Heart size={24} />
              </div>
              <h3 className="font-bold text-base text-foreground mb-2">Cooked with Love</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Prepared fresh twice daily under the strict personal supervision of the Nimje family.
              </p>
            </Card>

            <Card className="rounded-3xl p-6 text-center border border-gray-200 shadow-sm bg-white">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-4">
                <Award size={24} />
              </div>
              <h3 className="font-bold text-base text-foreground mb-2">Prompt Delivery</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Dedicated delivery staff ensuring your tiffin reaches before lunch and dinner timings without fail.
              </p>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
