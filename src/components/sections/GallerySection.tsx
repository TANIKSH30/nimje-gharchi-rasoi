import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Flame, ShieldCheck, Heart, Eye, X, ChefHat, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

interface GalleryItem {
  id: number;
  title: string;
  category: 'prep' | 'breads' | 'curries' | 'sweets';
  subtitle: string;
  tag: string;
  src: string;
}

const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 1,
    title: 'Hot Whole-Wheat Phulkas',
    category: 'breads',
    subtitle: '100% whole wheat dough rolled fresh and puffed on direct flame with pure ghee brushing.',
    tag: 'Fresh Twice Daily',
    src: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=1000&auto=format&fit=crop&q=85',
  },
  {
    id: 2,
    title: 'Authentic Vidarbha Gravies',
    category: 'curries',
    subtitle: 'Slow-simmered Saoji and Vidarbha curries with roasted spices in heavy-bottom handis.',
    tag: 'Slow Cooked',
    src: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=1000&auto=format&fit=crop&q=85',
  },
  {
    id: 3,
    title: 'Traditional Stone-Ground Spices',
    category: 'prep',
    subtitle: 'Handpicked cumin, coriander seeds, dry red chilies, and turmeric roasted to perfection.',
    tag: 'Pure & Unadulterated',
    src: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=1000&auto=format&fit=crop&q=85',
  },
  {
    id: 4,
    title: 'Desi Ghee Dal Tadka',
    category: 'curries',
    subtitle: 'Golden yellow lentils infused with sizzling garlic, whole cumin, and pure desi ghee.',
    tag: 'Homestyle Flavor',
    src: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1000&auto=format&fit=crop&q=85',
  },
  {
    id: 5,
    title: 'Fresh Farm Produce Prep',
    category: 'prep',
    subtitle: 'Locally sourced fresh seasonal vegetables washed, sorted, and chopped in hygienic stations.',
    tag: 'Sanitized Stations',
    src: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1000&auto=format&fit=crop&q=85',
  },
  {
    id: 6,
    title: 'Fragrant Basmati Rice',
    category: 'curries',
    subtitle: 'Fluffy long-grain royal basmati rice cooked to tender perfection without extra starches.',
    tag: 'Daily Aromatic Rice',
    src: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=1000&auto=format&fit=crop&q=85',
  },
  {
    id: 7,
    title: 'Weekend Special Sweets',
    category: 'sweets',
    subtitle: 'Golden mawa Gulab Jamuns, festive Puran Poli, and traditional Maharashtrian sweets.',
    tag: 'Pure Sweet Delights',
    src: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=1000&auto=format&fit=crop&q=85',
  },
  {
    id: 8,
    title: 'Maharashtrian Festive Puran Poli',
    category: 'sweets',
    subtitle: 'Hand-stuffed sweet chana dal & organic jaggery puran baked with aromatic cardamom & nutmeg.',
    tag: 'Traditional Taste',
    src: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=1000&auto=format&fit=crop&q=85',
  },
];

export default function GallerySection() {
  const [activeFilter, setActiveFilter] = useState<'all' | 'prep' | 'breads' | 'curries' | 'sweets'>('all');
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryItem | null>(null);

  const filteredItems = activeFilter === 'all'
    ? GALLERY_ITEMS
    : GALLERY_ITEMS.filter((item) => item.category === activeFilter);

  return (
    <section className="py-20 sm:py-28 bg-[#F8F6F0] overflow-hidden border-t border-[#E5E0D6]/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-800/10 border border-emerald-800/20 text-emerald-900 text-xs font-bold uppercase tracking-wider">
            <ChefHat size={14} className="text-emerald-800" />
            <span>20+ Years Culinary Excellence</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-[#22201E] tracking-tight">
            Inside Our Homestyle Kitchen
          </h2>

          <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
            Take a visual tour into how each tiffin is prepared twice a day in Nagpur with hygiene, whole spices, fresh farm produce, and motherly care.
          </p>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            {[
              { id: 'all', label: 'All Kitchen Moments' },
              { id: 'breads', label: 'Fresh Phulkas & Roti' },
              { id: 'curries', label: 'Handi Gravies & Dal' },
              { id: 'prep', label: 'Spices & Clean Prep' },
              { id: 'sweets', label: 'Traditional Sweets' },
            ].map((tab) => {
              const isActive = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFilter(tab.id as any)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-800 text-white shadow-md shadow-emerald-950/20 scale-102'
                      : 'bg-white text-gray-700 border border-[#E5E0D6] hover:bg-gray-50'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05, duration: 0.4 }}
              onClick={() => setSelectedPhoto(item)}
              className="group relative h-80 rounded-3xl overflow-hidden shadow-sm border border-[#E5E0D6] bg-white cursor-pointer"
            >
              {/* Image */}
              <img
                src={item.src}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
                loading="lazy"
              />

              {/* Gradient Scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-75 group-hover:opacity-90 transition-opacity duration-300" />

              {/* Top Tag Badge */}
              <div className="absolute top-3 left-3 z-10">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/95 text-emerald-900 backdrop-blur-md shadow-xs border border-white/40">
                  {item.tag}
                </span>
              </div>

              {/* Hover Quick Zoom Eye Icon */}
              <div className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/40 text-white backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Eye size={15} />
              </div>

              {/* Bottom Caption */}
              <div className="absolute bottom-0 left-0 right-0 p-5 z-10 space-y-1 transform transition-transform duration-300 group-hover:-translate-y-1">
                <h3 className="text-white font-black text-base leading-snug">
                  {item.title}
                </h3>
                <p className="text-zinc-200/90 text-xs line-clamp-2 leading-relaxed font-normal">
                  {item.subtitle}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Hygiene & Quality Badges */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-[#E5E0D6] shadow-xs text-center space-y-1">
            <Flame size={20} className="text-amber-600 mx-auto" />
            <h4 className="font-bold text-xs text-foreground">Cooked Fresh 2x Daily</h4>
            <p className="text-[11px] text-gray-500">Morning 5:00 AM & Evening 3:30 PM</p>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-[#E5E0D6] shadow-xs text-center space-y-1">
            <ShieldCheck size={20} className="text-emerald-700 mx-auto" />
            <h4 className="font-bold text-xs text-foreground">Pure & Chemical-Free</h4>
            <p className="text-[11px] text-gray-500">Zero added soda, zero artificial colors</p>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-[#E5E0D6] shadow-xs text-center space-y-1">
            <ChefHat size={20} className="text-emerald-700 mx-auto" />
            <h4 className="font-bold text-xs text-foreground">100% Whole Wheat</h4>
            <p className="text-[11px] text-gray-500">Soft phulkas with light desi ghee</p>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-[#E5E0D6] shadow-xs text-center space-y-1">
            <Heart size={20} className="text-amber-600 mx-auto" />
            <h4 className="font-bold text-xs text-foreground">Homestyle Care</h4>
            <p className="text-[11px] text-gray-500">Balanced spices, gentle on digestion</p>
          </div>
        </div>
      </div>

      {/* High-Resolution Photo Lightbox Modal */}
      <Modal
        isOpen={!!selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        title={selectedPhoto?.title || 'Kitchen Gallery'}
      >
        {selectedPhoto && (
          <div className="space-y-4 pt-1">
            <div className="rounded-2xl overflow-hidden bg-black/5 max-h-[60vh] border border-gray-200">
              <img
                src={selectedPhoto.src}
                alt={selectedPhoto.title}
                className="w-full h-full object-cover max-h-[60vh]"
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                  {selectedPhoto.tag}
                </span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed pt-1">
                {selectedPhoto.subtitle}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}
