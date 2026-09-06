import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Sun, Moon, ArrowRight } from 'lucide-react';

export default function MenuSection() {
  const [activeTab, setActiveTab] = useState<'morning' | 'evening'>('morning');

  const menuItems = {
    morning: [
      {
        id: 1,
        name: 'Paneer Butter Masala',
        type: 'veg',
        price: '90',
        desc: 'Served with 4 Roti, Rice, Dal, Salad & Pickle',
        img: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      },
      {
        id: 2,
        name: 'Aloo Gobi Matar & Dal Fry',
        type: 'veg',
        price: '90',
        desc: 'Homestyle dry sabji with 4 Roti, Jeera Rice, Dal & Salad',
        img: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      },
      {
        id: 3,
        name: 'Saoji Chicken Curry Special',
        type: 'nonveg',
        price: '140',
        desc: 'Authentic Vidarbha style spicy chicken curry with 4 Roti & Rice',
        img: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      },
    ],
    evening: [
      {
        id: 4,
        name: 'Dal Makhani & Mix Veg',
        type: 'veg',
        price: '90',
        desc: 'Served with 4 Roti, Steamed Rice & Roasted Papad',
        img: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      },
      {
        id: 5,
        name: 'Egg Curry (2 Eggs)',
        type: 'nonveg',
        price: '110',
        desc: 'Rich onion tomato gravy with boiled fried eggs, 4 Roti & Rice',
        img: 'https://images.unsplash.com/photo-1628178122485-9a84a60b9437?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      },
      {
        id: 6,
        name: 'Bhindi Masala & Tadka Dal',
        type: 'veg',
        price: '90',
        desc: 'Crispy seasoned ladyfingers with 4 hot phulkas, Dal & Rice',
        img: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      },
    ],
  };

  return (
    <section id="menu" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="secondary" className="mb-3 px-3 py-1 font-bold">
            Today's Fresh Thali
          </Badge>
          <h2 className="text-3xl md:text-5xl font-extrabold text-foreground mb-4">
            Fresh from Our Kitchen
          </h2>
          <p className="text-gray-600 text-base sm:text-lg">
            Cooked fresh twice a day with pure, natural ingredients and wholesome spices.
          </p>
        </div>

        {/* Custom Tabs */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex bg-gray-100 p-1.5 rounded-full shadow-inner border border-gray-200">
            <button
              onClick={() => setActiveTab('morning')}
              className={`flex items-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 rounded-full font-bold text-sm sm:text-base transition-all cursor-pointer ${
                activeTab === 'morning'
                  ? 'bg-primary text-white shadow-md'
                  : 'text-gray-600 hover:text-foreground'
              }`}
            >
              <Sun size={18} /> Lunch Menu
            </button>
            <button
              onClick={() => setActiveTab('evening')}
              className={`flex items-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 rounded-full font-bold text-sm sm:text-base transition-all cursor-pointer ${
                activeTab === 'evening'
                  ? 'bg-secondary text-white shadow-md'
                  : 'text-gray-600 hover:text-foreground'
              }`}
            >
              <Moon size={18} /> Dinner Menu
            </button>
          </div>
        </div>

        {/* Menu Cards */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {menuItems[activeTab].map((item) => (
              <Card
                key={item.id}
                className="overflow-hidden border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 group bg-white rounded-2xl flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-52 overflow-hidden bg-gray-100">
                    <img
                      src={item.img}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3.5 right-3.5">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold shadow-md ${
                          item.type === 'veg'
                            ? 'bg-green-100 text-green-800 border border-green-300'
                            : 'bg-red-100 text-red-800 border border-red-300'
                        }`}
                      >
                        {item.type === 'veg' ? '🌱 Pure Veg' : '🍗 Non-Veg'}
                      </span>
                    </div>
                  </div>
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-foreground">{item.name}</h3>
                      <span className="text-xl font-black text-primary">₹{item.price}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 min-h-[38px] leading-relaxed">
                      {item.desc}
                    </p>
                  </CardContent>
                </div>
                <div className="p-5 pt-0">
                  <Button asChild className="w-full rounded-xl" variant="outline">
                    <Link to="/checkout">
                      <span>Order Tiffin</span>
                      <ArrowRight size={15} className="ml-1.5 inline" />
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
