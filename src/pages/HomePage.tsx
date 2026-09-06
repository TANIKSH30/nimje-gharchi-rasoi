import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import WhatsAppButton from '@/components/layout/WhatsAppButton';
import HeroSection from '@/components/sections/HeroSection';
import TrustSection from '@/components/sections/TrustSection';
import AboutSection from '@/components/sections/AboutSection';
import PricingSection from '@/components/sections/PricingSection';
import SpecialOrderSection from '@/components/sections/SpecialOrderSection';
import GallerySection from '@/components/sections/GallerySection';
import ReviewsSection from '@/components/sections/ReviewsSection';
import ContactSection from '@/components/sections/ContactSection';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FCFBF8] text-foreground relative">
      <Navbar />
      <main className="flex-grow">
        <HeroSection />
        <TrustSection />
        <AboutSection />
        <PricingSection />
        <SpecialOrderSection />
        <GallerySection />
        <ReviewsSection />
        <ContactSection />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
