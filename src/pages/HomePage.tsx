import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import WhatsAppButton from '@/components/layout/WhatsAppButton';
import SEOHead from '@/components/seo/SEOHead';
import HeroSection from '@/components/sections/HeroSection';
import TrustSection from '@/components/sections/TrustSection';
import HowItWorksSection from '@/components/sections/HowItWorksSection';
import AboutSection from '@/components/sections/AboutSection';
import PricingSection from '@/components/sections/PricingSection';
import SpecialOrderSection from '@/components/sections/SpecialOrderSection';
import GallerySection from '@/components/sections/GallerySection';
import ReviewsSection from '@/components/sections/ReviewsSection';
import FaqSection from '@/components/sections/FaqSection';
import ContactSection from '@/components/sections/ContactSection';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FCFBF8] text-foreground relative w-full max-w-full overflow-x-hidden">
      <SEOHead
        title="Homemade Tiffin & Mess Service in Nagpur"
        description="Fresh, hygienic, and authentic Maharashtrian & Vidarbha home-cooked tiffins delivered daily across Nagpur. Zero preservatives, 100% pure veg, prepared with mother’s care."
        canonicalPath="/"
      />
      <Navbar />
      <main className="flex-grow">
        <HeroSection />
        <TrustSection />
        <HowItWorksSection />
        <AboutSection />
        <PricingSection />
        <SpecialOrderSection />
        <GallerySection />
        <ReviewsSection />
        <FaqSection />
        <ContactSection />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
