import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import SEOHead from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/Button';
import { UtensilsCrossed, Home, CalendarCheck, Phone, ArrowLeft } from 'lucide-react';
import { getPhoneCallUrl } from '@/config/business';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FCFBF8]">
      <SEOHead
        title="Page Not Found (404) | Nimje Gharchi Rasoi"
        description="The requested page could not be found on Nimje Gharchi Rasoi. Navigate back to our home or view meal plans."
        noIndex={true}
      />
      <Navbar />

      <main className="flex-grow flex items-center justify-center pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-lg w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-emerald-100/80 text-emerald-800 flex items-center justify-center mx-auto shadow-md shadow-emerald-800/10">
            <UtensilsCrossed size={40} />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-black uppercase text-amber-700 bg-amber-100/80 px-3 py-1 rounded-full">
              Error 404
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
              Recipe Not Found
            </h1>
            <p className="text-sm text-gray-600 leading-relaxed max-w-sm mx-auto">
              We couldn't find the page you're looking for. It might have moved or the address was typed incorrectly.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <Button
              asChild
              className="w-full rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold h-12 shadow-md shadow-emerald-700/20"
            >
              <Link to="/" className="inline-flex items-center justify-center gap-2">
                <Home size={16} />
                <span>Return Home</span>
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="w-full rounded-2xl border-gray-300 font-bold h-12 hover:bg-emerald-50/50 text-gray-800"
            >
              <Link to="/plans" className="inline-flex items-center justify-center gap-2">
                <CalendarCheck size={16} />
                <span>View Meal Plans</span>
              </Link>
            </Button>
          </div>

          <div className="pt-4 border-t border-gray-200/80 flex items-center justify-center gap-4 text-xs font-bold text-gray-500">
            <Link to="/special-orders" className="hover:text-emerald-800 transition-colors">
              Special Delicacies
            </Link>
            <span>•</span>
            <Link to="/contact" className="hover:text-emerald-800 transition-colors">
              Contact Support
            </Link>
            <span>•</span>
            <a href={getPhoneCallUrl()} className="hover:text-emerald-800 transition-colors">
              Call Kitchen
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
