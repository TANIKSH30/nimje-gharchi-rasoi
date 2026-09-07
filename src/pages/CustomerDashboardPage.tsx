import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  RefreshCw,
  Package,
  MapPin,
  ShoppingBag,
  Plus,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Flame,
  Truck,
  ChefHat,
  Calendar,
  XCircle,
  RotateCcw,
  Check,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { Subscription, Order, Address, Payment } from '@/types/database';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import WhatsAppButton from '@/components/layout/WhatsAppButton';
import SEOHead from '@/components/seo/SEOHead';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  checkAndTriggerAutomaticExpiryAlert,
} from '@/services/notificationService';

interface DashboardStats {
  deliveredCount: number;
  currentStreak: number;
  specialOrdersCount: number;
  totalSpent: number;
}

// Get Local Date YYYY-MM-DD
function getLocalDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function CustomerDashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [activeSub, setActiveSub] = useState<Subscription | null>(null);
  const [latestSub, setLatestSub] = useState<Subscription | null>(null);
  const [pendingPayment, setPendingPayment] = useState<Payment | null>(null);
  const [nextDeliveryOrder, setNextDeliveryOrder] = useState<Order | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [defaultAddress, setDefaultAddress] = useState<Address | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    deliveredCount: 0,
    currentStreak: 0,
    specialOrdersCount: 0,
    totalSpent: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedReviewIdx, setCopiedReviewIdx] = useState<number | null>(null);

  const copyReviewTemplate = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedReviewIdx(idx);
    setTimeout(() => setCopiedReviewIdx(null), 3000);
  };

  const loadCustomerData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const todayStr = getLocalDateString();

      // Parallel safe fetching
      const [subsRes, ordersRes, paymentsRes, addrsRes] = await Promise.all([
        supabase
          .from('subscriptions')
          .select('*, plan:plans(*), address:addresses(*)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('orders')
          .select('*, address:addresses(*), order_items(*)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('payments')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('addresses')
          .select('*')
          .eq('user_id', user.id)
          .order('is_default', { ascending: false }),
      ]);

      // 1. Process Subscriptions
      const subs = (subsRes.data as Subscription[]) || [];
      const latest = subs.length > 0 ? subs[0] : null;

      // Active only if status is 'active' AND end_date >= today
      let active: Subscription | null = null;
      for (const s of subs) {
        if (s.status === 'active' && s.end_date) {
          const endDateVal = s.end_date.split('T')[0];
          if (endDateVal >= todayStr) {
            active = s;
            break;
          }
        }
      }

      setActiveSub(active);
      setLatestSub(latest);

      // Trigger automatic background renewal alert if expiring or expired (max once in 24h)
      if (latest && user) {
        checkAndTriggerAutomaticExpiryAlert(
          user.id,
          {
            id: latest.id,
            end_date: latest.end_date,
            plan: latest.plan,
          },
          profile || undefined
        );
      }

      // 2. Process Payments
      const payments = (paymentsRes.data as Payment[]) || [];
      const pendingPay = payments.find((p) => p.status === 'pending_verification') || null;
      setPendingPayment(pendingPay);

      // 3. Process Orders
      const allOrders = (ordersRes.data as Order[]) || [];
      setRecentOrders(allOrders.slice(0, 5));

      // 4. Process Default Address
      const addresses = (addrsRes.data as Address[]) || [];
      const defaultAddr = addresses.find((a) => a.is_default) || addresses[0] || null;
      setDefaultAddress(defaultAddr);

      // 5. Determine Next Delivery Order
      const upcoming = allOrders.find((o) => {
        const orderDateVal = (o.required_date || o.order_date || '').split('T')[0];
        const isFutureOrToday = orderDateVal ? orderDateVal >= todayStr : false;
        const isActiveStatus = ['confirmed', 'preparing', 'out_for_delivery'].includes(o.status);
        return isFutureOrToday && isActiveStatus;
      });
      setNextDeliveryOrder(upcoming || null);

      // 6. Calculate Real Customer Stats
      const deliveredOrders = allOrders.filter((o) => o.status === 'delivered');
      const deliveredCount = deliveredOrders.length;
      const specialOrdersCount = allOrders.filter((o) => o.order_type === 'special_order').length;

      const paidPayments = payments.filter((p) => p.status === 'paid');
      let totalSpent = 0;
      if (paidPayments.length > 0) {
        totalSpent = paidPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
      } else {
        totalSpent = allOrders
          .filter((o) => ['confirmed', 'delivered', 'preparing', 'out_for_delivery'].includes(o.status))
          .reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0);
      }

      let currentStreak = 0;
      if (active && active.start_date) {
        const start = new Date(active.start_date).getTime();
        const now = new Date().getTime();
        if (now >= start) {
          const daysActive = Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;
          currentStreak = Math.max(1, daysActive);
        }
      } else if (deliveredCount > 0) {
        currentStreak = Math.min(deliveredCount, 7);
      }

      setStats({
        deliveredCount,
        currentStreak,
        specialOrdersCount,
        totalSpent,
      });
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError('Something went wrong while loading your dashboard.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login?redirect=/dashboard');
      return;
    }

    if (user) {
      loadCustomerData();
    }
  }, [user, authLoading, navigate, loadCustomerData]);

  // Derived Subscription calculations
  const effectiveSub = activeSub || latestSub;
  let daysRemaining: number | null = null;
  let isExpiringSoon = false;
  let isExpiresToday = false;
  let isExpired = false;
  let expiredDaysAgo = 0;

  if (effectiveSub?.end_date) {
    const todayStr = getLocalDateString();
    const endDateStr = effectiveSub.end_date.split('T')[0];

    const todayDate = new Date(todayStr + 'T00:00:00');
    const endDate = new Date(endDateStr + 'T00:00:00');
    const diffTime = endDate.getTime() - todayDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      daysRemaining = diffDays;
      if (diffDays <= 2) {
        isExpiringSoon = true;
      }
    } else if (diffDays === 0) {
      daysRemaining = 0;
      isExpiresToday = true;
      isExpiringSoon = true;
    } else {
      isExpired = true;
      expiredDaysAgo = Math.abs(diffDays);
      daysRemaining = null;
    }
  } else if (effectiveSub && effectiveSub.status === 'expired') {
    isExpired = true;
  }

  // Format Helper for Indian Dates
  const formatIndianDate = (dateStr?: string | null) => {
    if (!dateStr) return '';
    try {
      const cleanStr = dateStr.split('T')[0];
      const parts = cleanStr.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString('en-IN', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // Status Badge Helper
  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> Confirmed
          </span>
        );
      case 'out_for_delivery':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200 animate-pulse">
            <Truck size={11} /> Out for Delivery
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
            <Check size={11} className="stroke-[3]" /> Delivered
          </span>
        );
      case 'preparing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
            <ChefHat size={11} /> Preparing
          </span>
        );
      case 'payment_pending':
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock size={11} /> Pending
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-500 border border-gray-200">
            <XCircle size={11} /> Cancelled
          </span>
        );
      case 'refunded':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
            <RotateCcw size={11} /> Refunded
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700 border border-gray-200 capitalize">
            {status.replace(/_/g, ' ')}
          </span>
        );
    }
  };

  const customerGreetingName =
    profile?.full_name?.trim() ||
    user?.email?.split('@')[0] ||
    'Valued Customer';

  return (
    <div className="min-h-screen bg-[#FCFBF8] flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900 w-full max-w-full overflow-x-hidden">
      <SEOHead
        title="Customer Dashboard | Nimje Gharchi Rasoi"
        description="Manage your active tiffin subscriptions, pause meal dates, and track Nagpur deliveries."
        noIndex={true}
      />
      <Navbar />

      <main className="flex-grow pt-24 sm:pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
          {/* ================================================== */}
          {/* 1. HERO / HEADER SECTION */}
          {/* ================================================== */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EAE6DE] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                  Live Portal
                </span>
                <span className="text-xs text-gray-400 font-medium">Nagpur Homestyle Mess</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 tracking-tight">
                Customer Dashboard
              </h1>
              <p className="text-sm sm:text-base text-gray-600 font-medium">
                Welcome back, <span className="font-bold text-gray-900">{customerGreetingName}</span>!
              </p>
            </div>

            {/* Quick Header CTA Buttons */}
            <div className="flex items-center gap-3 flex-wrap">
              <Button
                asChild
                variant="outline"
                className="rounded-2xl gap-2 text-xs sm:text-sm font-bold border-[#EAE6DE] bg-white hover:bg-amber-50/50 hover:text-amber-800 hover:border-amber-300 transition-all h-11 px-4 shadow-xs"
              >
                <Link to="/special-orders">
                  <Plus size={16} className="text-amber-600" />
                  <span>Special Order</span>
                </Link>
              </Button>

              <Button
                asChild
                className="rounded-2xl gap-2 text-xs sm:text-sm font-black bg-emerald-700 hover:bg-emerald-800 text-white shadow-md shadow-emerald-700/20 transition-all h-11 px-5"
              >
                <Link to={activeSub ? '/checkout' : '/plans'}>
                  <RefreshCw size={15} />
                  <span>{activeSub ? 'Renew Subscription' : isExpired ? 'Renew Now' : 'Subscribe / Renew'}</span>
                </Link>
              </Button>
            </div>
          </div>

          {/* ================================================== */}
          {/* NOTIFICATION & EXPIRY WARNING BANNERS */}
          {/* ================================================== */}
          {/* Subtle Expiring Soon Warning (Only when active and expiring in <= 2 days) */}
          {activeSub && isExpiringSoon && !isExpired && (
            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm shadow-amber-500/20">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm sm:text-base text-amber-950">
                      {isExpiresToday
                        ? 'Your subscription expires today!'
                        : `Your subscription expires in ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}`}
                    </h3>
                    <span className="px-2 py-0.5 rounded-md bg-amber-200/80 text-amber-900 font-black text-[10px] uppercase">
                      Action Needed
                    </span>
                  </div>
                  <p className="text-xs text-amber-800/90 mt-0.5">
                    Renew today to ensure uninterrupted hot homestyle lunch and dinner deliveries in Nagpur.
                  </p>
                </div>
              </div>

              <Button
                asChild
                size="sm"
                className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-9 px-4 shadow-sm shadow-amber-600/20 flex-shrink-0"
              >
                <Link to="/checkout" className="flex items-center gap-1.5">
                  <span>Renew Now</span>
                  <ArrowRight size={13} />
                </Link>
              </Button>
            </div>
          )}

          {/* Expired Subscription Banner */}
          {isExpired && effectiveSub && (
            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-red-50 via-rose-50 to-amber-50 border border-red-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm shadow-red-600/20">
                  <Clock size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm sm:text-base text-red-950">
                      Your meal subscription has expired
                    </h3>
                    <span className="px-2 py-0.5 rounded-md bg-red-200 text-red-900 font-black text-[10px] uppercase">
                      Expired
                    </span>
                  </div>
                  <p className="text-xs text-red-800/90 mt-0.5">
                    Your {effectiveSub.plan?.name || 'Tiffin Plan'} ended on{' '}
                    <strong>{formatIndianDate(effectiveSub.end_date)}</strong>. Renew now to resume your daily meals.
                  </p>
                </div>
              </div>

              <Button
                asChild
                size="sm"
                className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs h-9 px-4 shadow-sm shadow-emerald-700/20 flex-shrink-0"
              >
                <Link to="/plans" className="flex items-center gap-1.5">
                  <span>Renew Subscription</span>
                  <ArrowRight size={13} />
                </Link>
              </Button>
            </div>
          )}

          {/* Pending Verification Banner */}
          {pendingPayment && (
            <div className="p-4 sm:p-5 rounded-3xl bg-blue-50/80 border border-blue-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm shadow-blue-600/20">
                  <Clock size={20} className="animate-spin" style={{ animationDuration: '6s' }} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm sm:text-base text-blue-950">
                      Payment Verification in Progress
                    </h3>
                    <Badge variant="info" className="text-[10px] py-0.5">
                      Pending Verification
                    </Badge>
                  </div>
                  <p className="text-xs text-blue-800 mt-1 leading-relaxed">
                    Your UPI payment of <strong className="text-blue-950">₹{pendingPayment.amount}</strong>{' '}
                    (UTR: <span className="font-mono font-bold">{pendingPayment.utr || 'Submitted'}</span>) is being
                    verified by our kitchen manager. Your plan will activate automatically upon verification.
                  </p>
                </div>
              </div>

              <Button
                asChild
                size="sm"
                variant="outline"
                className="rounded-xl text-xs font-bold border-blue-300 text-blue-900 bg-white hover:bg-blue-100/50 flex-shrink-0"
              >
                <Link to="/payments">View Receipt</Link>
              </Button>
            </div>
          )}

          {/* Error State with friendly message */}
          {error && (
            <div className="p-6 rounded-3xl bg-red-50 border border-red-200 text-red-900 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertCircle size={24} className="text-red-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-sm text-red-950">Could Not Load Dashboard Data</h3>
                  <p className="text-xs text-red-700 mt-0.5">{error}</p>
                </div>
              </div>
              <Button
                onClick={loadCustomerData}
                variant="outline"
                size="sm"
                className="rounded-xl text-xs font-bold border-red-300 text-red-900 bg-white hover:bg-red-100"
              >
                Try Again
              </Button>
            </div>
          )}

          {/* ================================================== */}
          {/* 2, 3, 4. MAIN 3 DASHBOARD CARDS (RESPONSIVE GRID) */}
          {/* ================================================== */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 rounded-3xl bg-gray-100/80 animate-pulse border border-gray-200/60" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* -------------------------------------------------- */}
              {/* CARD 1: ACTIVE SUBSCRIPTION */}
              {/* -------------------------------------------------- */}
              {activeSub ? (
                /* ACTIVE STATE */
                <div className="rounded-3xl bg-gradient-to-br from-emerald-800 via-emerald-800 to-teal-900 text-white shadow-xl shadow-emerald-950/15 border border-emerald-700/40 p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-36 h-36 bg-amber-400/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className="text-[11px] font-black uppercase tracking-wider text-emerald-200/90 flex items-center gap-1.5">
                        <Calendar size={14} className="text-amber-300" />
                        Active Subscription
                      </span>

                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Active
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                        {activeSub.plan?.name || 'Homestyle Monthly Tiffin'}
                      </h3>

                      <div className="flex items-center gap-2 flex-wrap text-xs text-emerald-100 font-medium pt-1">
                        <span className="bg-white/15 px-2.5 py-1 rounded-lg">
                          {activeSub.plan?.meal_type === 'half' ? 'Half Tiffin' : 'Full Tiffin'}
                        </span>
                        <span className="bg-white/15 px-2.5 py-1 rounded-lg capitalize">
                          Slot: {activeSub.delivery_time}
                        </span>
                      </div>

                      <div className="pt-2 text-xs text-emerald-100/90 space-y-1">
                        <p>
                          Valid until:{' '}
                          <strong className="text-white font-bold">
                            {formatIndianDate(activeSub.end_date)}
                          </strong>
                        </p>
                        <p className="text-amber-300 font-bold">
                          {daysRemaining !== null
                            ? daysRemaining > 0
                              ? `${daysRemaining} days remaining`
                              : 'Expires today'
                            : 'Active'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/15 flex justify-between items-center text-xs">
                    <Link
                      to="/checkout"
                      className="inline-flex items-center gap-1.5 text-amber-300 font-black hover:text-white transition-colors group-hover:translate-x-0.5 duration-200"
                    >
                      <span>Renew Now</span>
                      <ArrowRight size={14} />
                    </Link>

                    <Link
                      to="/subscriptions"
                      className="text-[11px] text-white/70 hover:text-white underline transition-colors"
                    >
                      View All
                    </Link>
                  </div>
                </div>
              ) : isExpired && effectiveSub ? (
                /* EXPIRED STATE */
                <div className="rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-stone-900 text-white shadow-xl shadow-black/15 border border-red-500/30 p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-36 h-36 bg-red-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className="text-[11px] font-black uppercase tracking-wider text-red-300 flex items-center gap-1.5">
                        <Calendar size={14} className="text-red-400" />
                        Past Subscription
                      </span>

                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-red-500/20 text-red-300 border border-red-500/30">
                        🔴 Expired
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-2xl font-black text-white leading-tight">
                        {effectiveSub.plan?.name || 'Tiffin Plan'}
                      </h3>

                      <div className="flex items-center gap-2 flex-wrap text-xs text-gray-300 font-medium pt-1">
                        <span className="bg-white/10 px-2.5 py-1 rounded-lg">
                          {effectiveSub.plan?.meal_type === 'half' ? 'Half Tiffin' : 'Full Tiffin'}
                        </span>
                        <span className="bg-white/10 px-2.5 py-1 rounded-lg capitalize">
                          Slot: {effectiveSub.delivery_time}
                        </span>
                      </div>

                      <div className="pt-2 text-xs text-gray-300 space-y-1">
                        <p>
                          Subscription ended on:{' '}
                          <strong className="text-red-300 font-bold">
                            {formatIndianDate(effectiveSub.end_date)}
                          </strong>
                        </p>
                        <p className="text-red-400 font-bold">
                          Expired {expiredDaysAgo} {expiredDaysAgo === 1 ? 'day' : 'days'} ago
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/15 flex justify-between items-center text-xs">
                    <Link
                      to="/plans"
                      className="inline-flex items-center gap-1.5 text-amber-400 font-black hover:text-white transition-colors"
                    >
                      <span>Renew Subscription</span>
                      <ArrowRight size={14} />
                    </Link>

                    <Link
                      to="/subscriptions"
                      className="text-[11px] text-white/70 hover:text-white underline transition-colors"
                    >
                      History
                    </Link>
                  </div>
                </div>
              ) : (
                /* NO SUBSCRIPTION STATE */
                <div className="rounded-3xl bg-gradient-to-br from-emerald-800 via-emerald-800 to-teal-900 text-white shadow-xl shadow-emerald-950/15 border border-emerald-700/40 p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className="text-[11px] font-black uppercase tracking-wider text-emerald-200/90 flex items-center gap-1.5">
                        <Calendar size={14} className="text-amber-300" />
                        Subscription
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-white/10 text-white/80">
                        {pendingPayment ? '🟡 Pending' : 'Inactive'}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-2xl font-black text-white">No Active Subscription</h3>
                      <p className="text-xs text-emerald-100/80 leading-relaxed">
                        {pendingPayment
                          ? 'Your payment verification is in progress. Plan will activate upon approval.'
                          : 'Start your tiffin journey with authentic homemade meals in Nagpur.'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/15 flex justify-between items-center text-xs">
                    <Link
                      to="/plans"
                      className="inline-flex items-center gap-1.5 text-amber-300 font-black hover:text-white transition-colors"
                    >
                      <span>Explore Tiffin Plans</span>
                      <ArrowRight size={14} />
                    </Link>

                    <Link to="/plans" className="text-[11px] text-white/70 hover:text-white underline">
                      View Plans
                    </Link>
                  </div>
                </div>
              )}

              {/* -------------------------------------------------- */}
              {/* CARD 2: NEXT DELIVERY */}
              {/* -------------------------------------------------- */}
              <div className="rounded-3xl border border-[#EAE6DE] shadow-xs p-6 sm:p-7 bg-white flex flex-col justify-between relative hover:shadow-md hover:border-emerald-200 transition-all">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="text-[11px] font-black uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                      <Package size={15} className="text-amber-600" />
                      Next Delivery
                    </span>

                    {nextDeliveryOrder && getOrderStatusBadge(nextDeliveryOrder.status)}
                  </div>

                  {nextDeliveryOrder ? (
                    <div className="space-y-2.5">
                      <div>
                        <span className="text-xs font-extrabold text-amber-700 uppercase tracking-wide block">
                          {nextDeliveryOrder.order_type === 'special_order'
                            ? 'Special Food Order'
                            : 'Daily Tiffin'}
                        </span>
                        <h3 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
                          {nextDeliveryOrder.order_items && nextDeliveryOrder.order_items.length > 0
                            ? nextDeliveryOrder.order_items[0].item_name
                            : activeSub?.plan?.name || 'Homemade Thali'}
                        </h3>
                      </div>

                      <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-[#EAE6DE]/60 space-y-1 text-xs">
                        <div className="flex items-center justify-between text-gray-600">
                          <span>Scheduled Date:</span>
                          <span className="font-bold text-gray-900">
                            {formatIndianDate(nextDeliveryOrder.required_date || nextDeliveryOrder.order_date)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-gray-600">
                          <span>Expected Window:</span>
                          <span className="font-bold text-emerald-800">
                            {nextDeliveryOrder.preferred_time?.toLowerCase().includes('evening') ||
                            nextDeliveryOrder.meal_type?.toLowerCase().includes('evening')
                              ? '7:30 PM – 8:30 PM'
                              : '8:00 AM – 9:00 AM'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : activeSub ? (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-emerald-700 uppercase">Upcoming Meal</span>
                      <h3 className="text-xl sm:text-2xl font-black text-gray-900">
                        {activeSub.delivery_time === 'evening' ? 'Evening Dinner' : 'Morning Lunch'}
                      </h3>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Expected Delivery Window:{' '}
                        <strong className="text-gray-900">
                          {activeSub.delivery_time === 'evening' ? '7:30 PM – 8:30 PM' : '8:00 AM – 9:00 AM'}
                        </strong>
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <h3 className="text-xl sm:text-2xl font-black text-gray-900">No Upcoming Delivery</h3>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        {isExpired
                          ? `Your subscription ended on ${formatIndianDate(effectiveSub?.end_date)}. Renew to resume scheduled deliveries.`
                          : 'You have no active meals scheduled for delivery.'}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center text-xs">
                  {nextDeliveryOrder || activeSub ? (
                    <Link
                      to="/orders"
                      className="inline-flex items-center gap-1.5 text-emerald-800 font-extrabold hover:text-emerald-900 transition-colors"
                    >
                      <span>Track Delivery</span>
                      <ArrowRight size={14} />
                    </Link>
                  ) : (
                    <Link
                      to="/plans"
                      className="inline-flex items-center gap-1.5 text-emerald-800 font-extrabold hover:text-emerald-900 transition-colors"
                    >
                      <span>{isExpired ? 'Renew Plan' : 'Order Tiffin'}</span>
                      <ArrowRight size={14} />
                    </Link>
                  )}

                  <Link to="/orders" className="text-[11px] text-gray-400 hover:text-gray-700 underline">
                    All Deliveries
                  </Link>
                </div>
              </div>

              {/* -------------------------------------------------- */}
              {/* CARD 3: DELIVERY ADDRESS */}
              {/* -------------------------------------------------- */}
              <div className="rounded-3xl border border-[#EAE6DE] shadow-xs p-6 sm:p-7 bg-white flex flex-col justify-between relative hover:shadow-md hover:border-emerald-200 transition-all">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="text-[11px] font-black uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                      <MapPin size={15} className="text-emerald-700" />
                      Delivery Address
                    </span>

                    {defaultAddress?.is_default && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Default Hub
                      </span>
                    )}
                  </div>

                  {defaultAddress ? (
                    <div className="space-y-2">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                        {defaultAddress.name || customerGreetingName}
                      </h3>

                      <div className="text-xs text-gray-600 space-y-0.5 leading-relaxed">
                        <p className="font-bold text-gray-900 flex items-center gap-1">
                          <span>📍 {defaultAddress.area}</span>
                        </p>
                        <p className="text-gray-600 line-clamp-2">{defaultAddress.address_line}</p>
                        <p className="text-gray-500">
                          {defaultAddress.city || 'Nagpur'}, Maharashtra
                          {defaultAddress.pincode ? ` - ${defaultAddress.pincode}` : ''}
                        </p>
                        {defaultAddress.phone && (
                          <p className="text-[11px] text-gray-400 pt-1">
                            Contact: <span className="font-medium text-gray-700">{defaultAddress.phone}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900">No Address Saved</h3>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Add your home or office address in Nagpur to receive hot tiffins on time.
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center text-xs">
                  <Link
                    to="/addresses"
                    className="inline-flex items-center gap-1.5 text-emerald-800 font-extrabold hover:text-emerald-900 transition-colors"
                  >
                    <span>{defaultAddress ? 'Manage Addresses' : 'Add Address'}</span>
                    <ArrowRight size={14} />
                  </Link>

                  <span className="text-[11px] text-gray-400">Nagpur Service Zone</span>
                </div>
              </div>
            </div>
          )}

          {/* ================================================== */}
          {/* 5. QUICK ACTIONS SECTION */}
          {/* ================================================== */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                <span>Quick Actions</span>
              </h2>
              <span className="text-xs text-gray-400 font-medium">Customer Shortcuts</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {/* Action 1: Order Tiffin */}
              <Link
                to="/plans"
                className="group p-4 sm:p-5 rounded-3xl bg-white border border-[#EAE6DE] shadow-xs hover:border-emerald-500 hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                    🍱
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-gray-900 group-hover:text-emerald-800 transition-colors">
                      Order Tiffin
                    </h3>
                    <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">Browse Tiffin Plans</p>
                  </div>
                </div>
                <div className="pt-3 flex items-center text-[11px] font-bold text-emerald-700 group-hover:translate-x-1 transition-transform">
                  <span>Explore Plans</span>
                  <ChevronRight size={13} />
                </div>
              </Link>

              {/* Action 2: Special Order */}
              <Link
                to="/special-orders"
                className="group p-4 sm:p-5 rounded-3xl bg-white border border-[#EAE6DE] shadow-xs hover:border-amber-500 hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                    🍛
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-gray-900 group-hover:text-amber-800 transition-colors">
                      Special Order
                    </h3>
                    <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                      Extra roti, sabji or custom kg
                    </p>
                  </div>
                </div>
                <div className="pt-3 flex items-center text-[11px] font-bold text-amber-700 group-hover:translate-x-1 transition-transform">
                  <span>Order Delicacies</span>
                  <ChevronRight size={13} />
                </div>
              </Link>

              {/* Action 3: Manage Address */}
              <Link
                to="/addresses"
                className="group p-4 sm:p-5 rounded-3xl bg-white border border-[#EAE6DE] shadow-xs hover:border-emerald-500 hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                    📍
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-gray-900 group-hover:text-emerald-800 transition-colors">
                      Manage Address
                    </h3>
                    <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">Update delivery location</p>
                  </div>
                </div>
                <div className="pt-3 flex items-center text-[11px] font-bold text-teal-700 group-hover:translate-x-1 transition-transform">
                  <span>Addresses</span>
                  <ChevronRight size={13} />
                </div>
              </Link>

              {/* Action 4: Order History */}
              <Link
                to="/orders"
                className="group p-4 sm:p-5 rounded-3xl bg-white border border-[#EAE6DE] shadow-xs hover:border-emerald-500 hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                    📋
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-gray-900 group-hover:text-purple-800 transition-colors">
                      Order History
                    </h3>
                    <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">View all previous orders</p>
                  </div>
                </div>
                <div className="pt-3 flex items-center text-[11px] font-bold text-purple-700 group-hover:translate-x-1 transition-transform">
                  <span>View All</span>
                  <ChevronRight size={13} />
                </div>
              </Link>
            </div>
          </div>

          {/* ================================================== */}
          {/* 6. SPECIAL ORDER PROMOTION BANNER */}
          {/* ================================================== */}
          <div className="rounded-3xl bg-gradient-to-br from-amber-50 via-orange-50/70 to-amber-100/50 border border-amber-200/90 p-6 sm:p-8 shadow-xs relative overflow-hidden">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-200/80 text-amber-950 font-black text-xs uppercase tracking-wider">
                  <Flame size={14} className="text-amber-600" />
                  Homestyle Kitchen Specials
                </div>

                <div>
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-950 tracking-tight">
                    Hungry for something extra? 🍛
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-700 font-medium mt-1">
                    Order homemade extras along with your regular tiffin in custom quantities.
                  </p>
                </div>

                {/* Available delicacy chips */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {[
                    '• Extra Roti (10-100 pcs)',
                    '• Homestyle Sabji',
                    '• Chicken Sabji (0.5kg / 1kg)',
                    '• Paneer Special',
                    '• Rice & Dal',
                    '• Custom Quantity',
                  ].map((chip, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center text-xs font-bold px-3 py-1 rounded-xl bg-white/90 border border-amber-200 text-gray-800 shadow-2xs"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex-shrink-0 w-full lg:w-auto">
                <Button
                  asChild
                  className="w-full sm:w-auto rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black text-sm h-12 px-6 shadow-md shadow-amber-600/20 gap-2"
                >
                  <Link to="/special-orders">
                    <Plus size={18} />
                    <span>Create Special Order</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* ================================================== */}
          {/* 7. TIFFIN SUMMARY / CUSTOMER STATS */}
          {/* ================================================== */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-500" />
                Your Tiffin Summary
              </h2>
              <span className="text-[11px] text-gray-400 font-medium">Real-time stats</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Stat 1: Meals Delivered */}
              <div className="p-5 rounded-3xl bg-white border border-[#EAE6DE] shadow-xs space-y-1">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 block">
                  Meals Delivered
                </span>
                <p className="text-2xl sm:text-3xl font-black text-emerald-800 tracking-tight">
                  {stats.deliveredCount}
                </p>
                <p className="text-[11px] text-gray-500 font-medium">Homestyle thalis served</p>
              </div>

              {/* Stat 2: Current Streak */}
              <div className="p-5 rounded-3xl bg-white border border-[#EAE6DE] shadow-xs space-y-1">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 block">
                  Current Streak
                </span>
                <div className="flex items-baseline gap-1.5">
                  <p className="text-2xl sm:text-3xl font-black text-amber-700 tracking-tight">
                    {stats.currentStreak}
                  </p>
                  <span className="text-xs font-bold text-gray-500">Days</span>
                </div>
                <p className="text-[11px] text-gray-500 font-medium">Continuous healthy food</p>
              </div>

              {/* Stat 3: Special Orders */}
              <div className="p-5 rounded-3xl bg-white border border-[#EAE6DE] shadow-xs space-y-1">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 block">
                  Special Orders
                </span>
                <p className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                  {stats.specialOrdersCount}
                </p>
                <p className="text-[11px] text-gray-500 font-medium">Custom dishes ordered</p>
              </div>

              {/* Stat 4: Total Spent */}
              <div className="p-5 rounded-3xl bg-white border border-[#EAE6DE] shadow-xs space-y-1">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 block">
                  Total Spent
                </span>
                <p className="text-2xl sm:text-3xl font-black text-emerald-800 tracking-tight">
                  ₹{stats.totalSpent.toLocaleString('en-IN')}
                </p>
                <p className="text-[11px] text-gray-500 font-medium">Verified payments</p>
              </div>
            </div>
          </div>

          {/* ================================================== */}
          {/* 8. GOOGLE REVIEWS & PATRON APPRECIATION CARD */}
          {/* ================================================== */}
          <div className="rounded-3xl bg-gradient-to-br from-amber-500/10 via-emerald-500/5 to-amber-500/5 border border-amber-300/60 p-6 sm:p-8 shadow-xs relative overflow-hidden">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
              <div className="space-y-3 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="flex text-amber-500 text-lg">★★★★★</span>
                  <span className="text-xs font-black text-amber-900 bg-amber-100/90 px-3 py-0.5 rounded-full uppercase tracking-wider">
                    Google Maps Reviews
                  </span>
                </div>

                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                    Love our Ghar Jaisa Khana? Rate us on Google! 🌟
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium mt-1 leading-relaxed">
                    Aapka 1 review Nagpur ke baaki students aur families tak shuddh homestyle khana pahunchane me bohot madad karta hai.
                  </p>
                </div>

                {/* Quick 1-Click Copy Sample Reviews */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                    Click to Copy Sample Review:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      {
                        title: '🍱 Best Tiffin in Nagpur',
                        text: 'Nagpur me Nandanvan area me sabse best tiffin service! Khana bilkul ghar jaisa shuddh aur bina extra oil/masale ke hota hai. 5/5 Stars!',
                      },
                      {
                        title: '🌿 Soft Rotis & Homely Taste',
                        text: 'Nimje Gharchi Rasoi ka taste authentic homestyle hai. Roti soft rehti hai aur daily on-time delivery milti hai. Highly recommended!',
                      },
                      {
                        title: '🎓 Great for Students & Mess',
                        text: 'Very affordable monthly tiffin plan for students & working professionals in Nagpur. Hygienic packing and fresh food everyday!',
                      },
                    ].map((sample, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => copyReviewTemplate(sample.text, idx)}
                        className={`p-2.5 rounded-2xl border text-left text-xs font-sans transition-all cursor-pointer shadow-2xs group ${
                          copiedReviewIdx === idx
                            ? 'bg-emerald-100 border-emerald-400 text-emerald-950'
                            : 'bg-white border-amber-200/80 text-gray-700 hover:border-amber-400 hover:bg-amber-50/50'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold text-[11px] mb-1">
                          <span>{sample.title}</span>
                          <span className="text-[10px] text-amber-700 font-black">
                            {copiedReviewIdx === idx ? '✓ Copied!' : 'Copy'}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 line-clamp-2 leading-tight">
                          "{sample.text}"
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Direct Open Google Review Button */}
              <div className="flex-shrink-0 w-full lg:w-auto flex flex-col items-center gap-2">
                <a
                  href="https://www.google.com/search?q=Nimje+Gharachi+Rasoi+Tiffin+services+Nagpur"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-[#EA4335] hover:bg-[#d33426] text-white font-black text-sm shadow-md shadow-red-500/20 transition-all cursor-pointer"
                >
                  <span className="w-5 h-5 rounded-full bg-white text-[#EA4335] flex items-center justify-center font-black text-xs">
                    G
                  </span>
                  <span>Write a Google Review →</span>
                </a>
                <span className="text-[10px] text-gray-400 font-medium">
                  📍 Nimje Gharachi Rasoi, Nandanvan, Nagpur
                </span>
              </div>
            </div>
          </div>

          {/* ================================================== */}
          {/* 9. RECENT ORDERS & DELIVERIES */}
          {/* ================================================== */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                <ShoppingBag size={20} className="text-emerald-700" />
                <span>Recent Orders & Deliveries</span>
              </h2>
              <Link
                to="/orders"
                className="text-xs font-extrabold text-emerald-800 hover:text-emerald-950 inline-flex items-center gap-1 hover:underline"
              >
                <span>View All</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 rounded-3xl bg-gray-100/80 animate-pulse border border-gray-200/60" />
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              /* Empty State */
              <Card className="rounded-3xl border border-[#EAE6DE] p-10 sm:p-12 text-center bg-white shadow-xs space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto text-2xl">
                  🍱
                </div>
                <h3 className="font-extrabold text-base sm:text-lg text-gray-900">No orders placed yet</h3>
                <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
                  Your recent meal deliveries, subscription tiffins, and special dishes will appear right here.
                </p>
                <div className="pt-2">
                  <Button asChild className="rounded-2xl font-black text-xs px-6 bg-emerald-700 hover:bg-emerald-800">
                    <Link to="/plans">Explore Tiffin Plans</Link>
                  </Button>
                </div>
              </Card>
            ) : (
              <Card className="rounded-3xl border border-[#EAE6DE] overflow-hidden bg-white shadow-xs divide-y divide-gray-100">
                {recentOrders.map((order) => {
                  const isCancelled = order.status === 'cancelled';
                  const orderDateFormatted = formatIndianDate(order.required_date || order.order_date || order.created_at);
                  const isSpecial = order.order_type === 'special_order';

                  // Item description summary
                  let itemSummary = '';
                  if (order.order_items && order.order_items.length > 0) {
                    itemSummary = order.order_items
                      .map((it) => `${it.item_name} × ${it.quantity} ${it.unit_snapshot || 'pcs'}`)
                      .join(', ');
                  } else {
                    itemSummary = `${order.meal_type || 'Full'} Tiffin Delivery`;
                  }

                  return (
                    <div
                      key={order.id}
                      className={`p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors hover:bg-gray-50/70 ${
                        isCancelled ? 'opacity-60 bg-gray-50/40' : ''
                      }`}
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-lg text-[11px] font-black uppercase tracking-wider ${
                              isSpecial
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-emerald-100 text-emerald-900'
                            }`}
                          >
                            {isSpecial ? 'Special Order' : 'Subscription Delivery'}
                          </span>

                          {getOrderStatusBadge(order.status)}
                        </div>

                        <p className="text-sm font-bold text-gray-900 truncate">
                          {itemSummary}
                        </p>

                        <p className="text-xs text-gray-500 flex items-center gap-2">
                          <span>{orderDateFormatted}</span>
                          <span>•</span>
                          <span className="capitalize">{order.preferred_time || order.meal_type || 'Morning'} Slot</span>
                          <span>•</span>
                          <span className="font-extrabold text-emerald-800">₹{order.total_amount}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-4 sm:flex-shrink-0 self-end sm:self-center">
                        <div className="text-right hidden sm:block">
                          <span className="text-base font-black text-gray-900">₹{order.total_amount}</span>
                          <span className="block text-[10px] text-gray-400 uppercase font-bold">
                            Order #{order.id.slice(0, 6)}
                          </span>
                        </div>

                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="rounded-xl text-xs font-extrabold text-emerald-800 hover:text-emerald-950 hover:bg-emerald-50 gap-1"
                        >
                          <Link to="/orders">
                            <span>Details</span>
                            <ArrowRight size={13} />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </Card>
            )}
          </div>
        </div>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
