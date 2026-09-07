import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import WhatsAppButton from '@/components/layout/WhatsAppButton';
import SEOHead from '@/components/seo/SEOHead';
import { ShieldCheck, Heart, Award, Utensils, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BUSINESS_CONFIG } from '@/config/business';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FCFBF8] w-full max-w-full overflow-x-hidden">
      <SEOHead
        title="Our Story & 20-Year Heritage | Nimje Gharchi Rasoi Nagpur"
        description="Learn about the story, kitchen values, and authentic Vidarbha cooking heritage behind Nimje Gharchi Rasoi, Nagpur's trusted homemade tiffin service."
        canonicalPath="/about"
      />
      <Navbar />

      <main className="flex-grow pt-28 pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-14 space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-800 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-100">
              Our Journey & Kitchen Philosophy
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight">
              Bringing the Warmth of Mother's Kitchen to Nagpur
            </h1>
            <p className="text-gray-600 mt-3 text-sm sm:text-base max-w-3xl mx-auto leading-relaxed">
              Founded by the Nimje family, Nimje Gharchi Rasoi was born out of a simple belief: everyone living away from home—students, working professionals, and families—deserves pure, wholesome, and delicious home-cooked meals every single day.
            </p>
          </div>

          {/* Story Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center mb-16">
            <div className="rounded-3xl overflow-hidden shadow-xl border-4 border-white">
              <img
                src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=80"
                alt="Homestyle Kitchen Preparation at Nimje Gharchi Rasoi Nagpur"
                className="w-full h-80 object-cover transform hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
                No Artificial Additives. Zero Compromises.
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Commercial restaurant food is loaded with palm oil, excess spices, and heavy creams that harm digestion over time. At Nimje Gharchi Rasoi, we cook strictly like home: using pure sunflower/soybean oil, authentic Vidarbha spices ground in-house, and whole wheat MP Sharbati atta.
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">
                Each tiffin is packed in food-grade, hot-seal containers right after preparation to ensure you receive piping hot meals for both lunch and dinner across Nagpur.
              </p>
            </div>
          </div>

          {/* Core Values / Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
            <Card className="rounded-3xl p-6 text-center border border-gray-200/80 shadow-xs bg-white">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-4">
                <ShieldCheck size={24} />
              </div>
              <h3 className="font-black text-base text-gray-900 mb-2">High Hygiene Standards</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Every utensil and vegetable is thoroughly sanitized before cooking in our spotless home kitchen.
              </p>
            </Card>

            <Card className="rounded-3xl p-6 text-center border border-gray-200/80 shadow-xs bg-white">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-4">
                <Heart size={24} />
              </div>
              <h3 className="font-black text-base text-gray-900 mb-2">Cooked with Care</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Prepared fresh twice daily under the strict personal supervision of the Nimje family.
              </p>
            </Card>

            <Card className="rounded-3xl p-6 text-center border border-gray-200/80 shadow-xs bg-white">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto mb-4">
                <Award size={24} />
              </div>
              <h3 className="font-black text-base text-gray-900 mb-2">Punctual Delivery</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Dedicated delivery staff ensuring your tiffin reaches before lunch and dinner timings without fail.
              </p>
            </Card>
          </div>

          {/* Call to action card */}
          <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-emerald-800 to-teal-950 text-white text-center space-y-4 shadow-xl">
            <h3 className="text-2xl sm:text-3xl font-black">
              Taste the Difference of Real Home Cooking
            </h3>
            <p className="text-emerald-100/90 text-sm max-w-xl mx-auto">
              Join hundreds of happy students, professionals, and families in Nagpur who trust Nimje Gharchi Rasoi for their daily meals.
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <Button
                asChild
                size="lg"
                className="rounded-full bg-amber-400 hover:bg-amber-300 text-amber-950 font-black px-7"
              >
                <Link to="/checkout">Order Tiffin Now</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-full bg-white/10 hover:bg-white/20 text-white border-white/30 font-bold"
              >
                <Link to="/contact">Contact Our Kitchen</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
