import React from 'react';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';

export default function ReviewsSection() {
  const reviews = [
    {
      id: 1,
      name: 'Priya Sharma',
      role: 'IT Engineer, IT Park Nagpur',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
      rating: 5,
      text: 'Best homemade food service in Nagpur. The paneer sabji and soft phulkas remind me exactly of how my mom makes it. Perfect hygiene and always on time at lunch.',
    },
    {
      id: 2,
      name: 'Rahul Verma',
      role: 'VNIT Nagpur Student',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
      rating: 5,
      text: "I've been subscribed to their monthly plan for 8 months now. It's pocket-friendly, incredibly tasty, wholesome, and I haven't missed home food since moving to Nagpur!",
    },
    {
      id: 3,
      name: 'Sneha Patil',
      role: 'Bank Manager, Civil Lines',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
      rating: 5,
      text: 'The packaging is completely leak-proof and the food arrives steaming hot. The Sunday special meals and gulab jamun are something our family always looks forward to.',
    },
  ];

  return (
    <section id="reviews" className="py-24 bg-primary/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-3">
            Real Customer Stories
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-foreground mb-4">
            Loved by <span className="text-primary">Thousands</span> Across Nagpur
          </h2>
          <p className="text-gray-600 text-base sm:text-lg">
            Don't just take our word for it. Here is why students and professionals rate us 5 stars.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <Card className="h-full border border-gray-200/80 shadow-md hover:shadow-xl transition-shadow bg-white rounded-3xl relative overflow-hidden">
                <div className="absolute top-6 right-6 text-primary/10 pointer-events-none">
                  <Quote size={44} />
                </div>
                <CardContent className="p-8 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex gap-1 mb-5">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} size={17} className="fill-secondary text-secondary" />
                      ))}
                    </div>
                    <p className="text-gray-600 text-sm sm:text-base mb-8 italic relative z-10 leading-relaxed">
                      "{review.text}"
                    </p>
                  </div>
                  <div className="flex items-center gap-3.5 pt-4 border-t border-gray-100">
                    <img
                      src={review.image}
                      alt={review.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-primary/30"
                    />
                    <div>
                      <h4 className="font-bold text-foreground text-sm sm:text-base">{review.name}</h4>
                      <p className="text-xs text-gray-500">{review.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
