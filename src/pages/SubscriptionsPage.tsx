import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, ArrowLeft, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { Subscription } from '@/types/database';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

function getLocalDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function SubscriptionsPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login?redirect=/subscriptions');
      return;
    }

    async function fetchSubs() {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select(`
            *,
            plan:plans(*),
            address:addresses(*)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setSubscriptions((data as Subscription[]) || []);
      } catch (err) {
        console.error('Error fetching subscriptions:', err);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchSubs();
    }
  }, [user, authLoading, navigate]);

  const todayStr = getLocalDateString();

  return (
    <div className="min-h-screen bg-[#FCFBF8] flex flex-col">
      <Navbar />

      <main className="flex-grow pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-foreground mb-2"
              >
                <ArrowLeft size={14} /> Back to Dashboard
              </Link>
              <h1 className="text-3xl font-black text-foreground">My Subscriptions</h1>
              <p className="text-xs text-gray-500 mt-1">Manage active, paused, and past meal subscription plans.</p>
            </div>
            <Button asChild className="rounded-xl text-xs gap-1.5 shadow-md shadow-primary/20 font-bold">
              <Link to="/checkout">
                <RefreshCw size={14} /> Renew / New Plan
              </Link>
            </Button>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-36 rounded-3xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : subscriptions.length === 0 ? (
            <Card className="p-12 text-center rounded-3xl border border-gray-200 bg-white">
              <Calendar size={36} className="text-gray-400 mx-auto mb-3" />
              <h3 className="font-bold text-base text-foreground">No Subscriptions Found</h3>
              <p className="text-xs text-gray-500 mt-1 mb-4">You haven't subscribed to any mess plan yet.</p>
              <Button asChild className="rounded-xl">
                <Link to="/plans">Explore Plans</Link>
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {subscriptions.map((sub) => {
                const endDateVal = sub.end_date ? sub.end_date.split('T')[0] : '';
                const isPastEnd = endDateVal ? endDateVal < todayStr : false;
                const isRealExpired = isPastEnd || sub.status === 'expired';
                const isRealActive = !isPastEnd && sub.status === 'active';

                return (
                  <Card
                    key={sub.id}
                    className={`rounded-3xl border p-6 bg-white shadow-xs ${
                      isRealExpired ? 'border-gray-200 bg-gray-50/40' : 'border-emerald-200 shadow-sm'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg text-foreground">{sub.plan?.name || 'Tiffin Plan'}</h3>
                          <Badge
                            variant={isRealActive ? 'success' : isRealExpired ? 'destructive' : sub.status === 'paused' ? 'warning' : 'outline'}
                            className="text-[10px] capitalize"
                          >
                            {isRealActive ? 'Active' : isRealExpired ? 'Expired' : sub.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Coverage: <strong>{sub.start_date}</strong> to <strong>{sub.end_date}</strong> • Slot:{' '}
                          <span className="capitalize">{sub.delivery_time}</span>
                        </p>
                        {sub.address && (
                          <p className="text-xs text-gray-400 mt-1">
                            Delivery to: {sub.address.address_line}, {sub.address.area}
                          </p>
                        )}
                      </div>

                      <div className="text-right sm:flex flex-col items-end">
                        <span className="text-2xl font-black text-primary">₹{sub.amount}</span>
                        <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 size={12} /> Status: {sub.payment_status}
                        </span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
