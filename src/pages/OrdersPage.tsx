import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, Clock, MapPin, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { Order } from '@/types/database';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import WhatsAppButton from '@/components/layout/WhatsAppButton';
import SEOHead from '@/components/seo/SEOHead';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login?redirect=/orders');
      return;
    }

    async function fetchOrders() {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            address:addresses(*),
            order_items(*)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setOrders((data as Order[]) || []);
      } catch (err) {
        console.error('Error loading orders:', err);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchOrders();
    }
  }, [user, authLoading, navigate]);

  return (
    <div className="min-h-screen bg-[#FCFBF8] flex flex-col">
      <SEOHead
        title="My Order History | Nimje Gharchi Rasoi"
        description="View your past tiffin and special delicacy orders."
        noIndex={true}
      />
      <Navbar />

      <main className="flex-grow pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-foreground mb-2"
            >
              <ArrowLeft size={14} /> Back to Dashboard
            </Link>
            <h1 className="text-3xl font-black text-foreground">My Order History</h1>
            <p className="text-xs text-gray-500 mt-1">Track all your meal deliveries and special dishes in Nagpur.</p>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 rounded-3xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <Card className="p-12 text-center rounded-3xl border border-gray-200 bg-white">
              <ShoppingBag size={36} className="text-gray-400 mx-auto mb-3" />
              <h3 className="font-bold text-base text-foreground">No Orders Yet</h3>
              <p className="text-xs text-gray-500 mt-1 mb-4">Start your subscription or place a special meal order.</p>
              <Button asChild className="rounded-xl font-bold">
                <Link to="/plans">Browse Plans</Link>
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card
                  key={order.id}
                  className="rounded-3xl border border-gray-200 p-6 bg-white shadow-xs"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-gray-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-foreground capitalize">
                          {order.order_type === 'subscription_delivery'
                            ? 'Daily Tiffin Delivery'
                            : 'Special Delicacy Order'}
                        </h3>
                        <Badge
                          variant={
                            order.status === 'delivered' || order.status === 'confirmed'
                              ? 'success'
                              : order.status === 'cancelled'
                              ? 'destructive'
                              : 'warning'
                          }
                          className="text-[10px] capitalize font-bold px-2.5"
                        >
                          {order.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Order #{order.id.slice(0, 8)} • Delivery:{' '}
                        <span className="font-semibold text-gray-600">
                          {order.required_date || order.order_date} ({order.preferred_time || order.meal_type} slot)
                        </span>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-lg font-black text-primary">₹{order.total_amount}</span>
                    </div>
                  </div>

                  {/* Items if any */}
                  {order.order_items && order.order_items.length > 0 && (
                    <div className="pt-4 space-y-1.5">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ordered Delicacies:</p>
                      <div className="flex flex-wrap gap-2">
                        {order.order_items.map((item) => (
                          <span
                            key={item.id}
                            className="inline-flex items-center gap-1.5 text-xs bg-gray-50 border border-gray-200/60 px-3 py-1.5 rounded-xl text-gray-700 font-medium"
                          >
                            <span>{item.item_name}</span>
                            <span className="font-bold text-primary">
                              × {item.quantity} {item.unit_snapshot || 'pcs'}
                            </span>
                            <span className="text-gray-400 text-[11px] font-mono">
                              (₹{item.total_price})
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {order.special_instructions && (
                    <div className="mt-3 text-xs p-2.5 bg-amber-50 rounded-xl border border-amber-200/50 text-amber-900">
                      <span className="font-bold">Cooking note:</span> {order.special_instructions}
                    </div>
                  )}

                  {order.address && (
                    <div className="pt-3 flex items-center gap-2 text-xs text-gray-500">
                      <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                      <span className="truncate">
                        Delivered to: {order.address.address_line}, {order.address.area}, {order.address.city}
                      </span>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
