import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Plus, ArrowRight } from 'lucide-react';

export default function SpecialOrderSection() {
  const specials = [
    {
      title: 'Extra Hot Rotis',
      items: [
        { name: 'Extra Roti (Set of 2)', price: '15', link: '/special-orders' },
        { name: '5 Fresh Rotis with Ghee', price: '35', link: '/special-orders' },
      ],
      img: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
    },
    {
      title: 'Special Veg Delicacies',
      items: [
        { name: 'Special Paneer Sabji', price: '90', link: '/special-orders' },
        { name: 'Dal Tadka (Extra Bowl)', price: '50', link: '/special-orders' },
      ],
      img: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
    },
    {
      title: 'Special Non-Veg Corner',
      items: [
        { name: 'Authentic Chicken Curry', price: '140', link: '/special-orders' },
        { name: 'Hot Gulab Jamun (2 pcs)', price: '40', link: '/special-orders' },
      ],
      img: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
    },
  ];

  return (
    <section id="special" className="py-20 bg-gray-50/70 border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-bold uppercase tracking-wider mb-3">
            Add-ons & Extras
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-foreground mb-4">
            Customize Your Daily Meal
          </h2>
          <p className="text-gray-600 text-base sm:text-lg">
            Craving extra rotis, sweet dishes, or special paneer/chicken? Add them easily to your order.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {specials.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              className="bg-white rounded-3xl overflow-hidden shadow-md border border-gray-200 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="h-44 overflow-hidden relative">
                  <img
                    src={section.img}
                    alt={section.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex items-end p-5">
                    <h3 className="text-xl font-bold text-white tracking-wide">
                      {section.title}
                    </h3>
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  {section.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100/80 transition-colors"
                    >
                      <span className="font-semibold text-foreground text-sm">{item.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-primary">₹{item.price}</span>
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="h-8 px-3 rounded-lg text-xs font-bold border-primary/30 text-primary hover:bg-primary hover:text-white"
                        >
                          <Link to="/special-orders">
                            <Plus size={13} className="mr-0.5" />
                            Add
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-5 pt-0">
                <Button asChild variant="ghost" className="w-full text-xs text-gray-600 font-semibold hover:text-primary">
                  <Link to="/special-orders">
                    View All Special Items
                    <ArrowRight size={13} className="ml-1 inline" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
