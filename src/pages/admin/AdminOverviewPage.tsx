import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  ShoppingBag,
  Package,
  Calendar,
  CreditCard,
  IndianRupee,
  UtensilsCrossed,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  RefreshCw,
  Sun,
  Moon,
  Sparkles,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { getAdminMetrics, updateOrderStatusByAdmin } from '@/services/adminService';
import { supabase } from '@/lib/supabase/client';

export default function AdminOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchMetrics = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await getAdminMetrics();
      setData(res);
    } catch (err) {
      console.error('Error fetching admin metrics:', err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMetrics();

    // Supabase Realtime listeners for orders & payments
    const ordersChannel = supabase
      .channel('admin-overview-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchMetrics();
      })
      .subscribe();

    const paymentsChannel = supabase
      .channel('admin-overview-payments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        fetchMetrics();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(paymentsChannel);
    };
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      await updateOrderStatusByAdmin(orderId, newStatus);
      await fetchMetrics();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const metrics = data?.metrics || {};
  const recentOrders = data?.recentOrders || [];
  const recentPayments = data?.recentPayments || [];
  const operations = metrics?.operations || {
    morningMeals: 0,
    eveningMeals: 0,
    totalExpectedMeals: 0,
    pendingOrders: 0,
    confirmedOrders: 0,
  };
  const statusCounts = metrics?.statusCounts || {};
  const pendingVerificationsCount = metrics?.pendingVerificationsCount || 0;

  if (loading) {
    return (
      <AdminLayout title="Overview" subtitle="Loading metrics...">
        <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-gray-500">Connecting to live kitchen telemetry...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Executive Overview"
      subtitle="Nimje Gharchi Rasoi • Live Mess Operations & Revenue Telemetry"
      actions={
        <Button
          onClick={() => fetchMetrics(true)}
          variant="outline"
          size="sm"
          disabled={refreshing}
          className="rounded-xl text-xs font-bold gap-2 border-gray-200"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Urgent Pending Payments Alert Banner */}
        {pendingVerificationsCount > 0 && (
          <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-orange-500/10 border-2 border-amber-500/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-amber-500/20">
                <CreditCard size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-amber-950">
                  {pendingVerificationsCount} UTR Payment Verification{pendingVerificationsCount > 1 ? 's' : ''} Pending
                </h3>
                <p className="text-xs text-amber-900/80 mt-0.5">
                  Customers have submitted UPI references. Please verify bank deposits to activate subscriptions.
                </p>
              </div>
            </div>

            <Button asChild size="sm" className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs flex-shrink-0 shadow-md shadow-amber-600/20">
              <Link to="/admin/payments" className="flex items-center gap-2">
                Review & Verify UTRs <ArrowRight size={14} />
              </Link>
            </Button>
          </div>
        )}

        {/* Top 5 Primary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* 1. Verified Revenue */}
          <Card className="rounded-3xl border border-emerald-100 p-5 bg-gradient-to-br from-white to-emerald-50/40 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-700">
                <IndianRupee size={19} />
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Verified
              </span>
            </div>
            <p className="text-xs font-bold text-gray-500">Today's Revenue</p>
            <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">
              ₹{metrics.todayRevenue?.toLocaleString('en-IN') || 0}
            </h3>
            <p className="text-[11px] text-emerald-700 font-semibold mt-1">
              Strictly verified 'paid' payments
            </p>
          </Card>

          {/* 2. Today's Orders */}
          <Card className="rounded-3xl border border-amber-100 p-5 bg-gradient-to-br from-white to-amber-50/40 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-700">
                <ShoppingBag size={19} />
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                Daily
              </span>
            </div>
            <p className="text-xs font-bold text-gray-500">Today's Orders</p>
            <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">
              {metrics.todayOrders || 0}
            </h3>
            <p className="text-[11px] text-amber-800 font-semibold mt-1">
              Subscriptions & special deliveries
            </p>
          </Card>

          {/* 3. Pending Payments */}
          <Card className="rounded-3xl border border-orange-100 p-5 bg-gradient-to-br from-white to-orange-50/40 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div className="p-2.5 rounded-2xl bg-orange-100 text-orange-700">
                <CreditCard size={19} />
              </div>
              {pendingVerificationsCount > 0 && (
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-orange-500 text-white animate-pulse">
                  Action Req.
                </span>
              )}
            </div>
            <p className="text-xs font-bold text-gray-500">Pending Payments</p>
            <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">
              {pendingVerificationsCount}
            </h3>
            <p className="text-[11px] text-orange-700 font-semibold mt-1">
              Awaiting UTR match
            </p>
          </Card>

          {/* 4. Total Customers */}
          <Card className="rounded-3xl border border-blue-100 p-5 bg-gradient-to-br from-white to-blue-50/40 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div className="p-2.5 rounded-2xl bg-blue-100 text-blue-700">
                <Users size={19} />
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Registered
              </span>
            </div>
            <p className="text-xs font-bold text-gray-500">Total Customers</p>
            <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">
              {metrics.totalCustomers || 0}
            </h3>
            <p className="text-[11px] text-blue-700 font-semibold mt-1">
              Nagpur tiffin patrons
            </p>
          </Card>

          {/* 5. Active Subscriptions */}
          <Card className="rounded-3xl border border-purple-100 p-5 bg-gradient-to-br from-white to-purple-50/40 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div className="p-2.5 rounded-2xl bg-purple-100 text-purple-700">
                <Calendar size={19} />
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                Active
              </span>
            </div>
            <p className="text-xs font-bold text-gray-500">Active Plans</p>
            <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">
              {metrics.activeSubscriptions || 0}
            </h3>
            <p className="text-[11px] text-purple-700 font-semibold mt-1">
              Daily subscribers
            </p>
          </Card>
        </div>

        {/* Operations & Quick Actions Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Kitchen Meal Count (Real database metrics) */}
          <Card className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xs lg:col-span-2">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <UtensilsCrossed size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-gray-900">Today's Kitchen Operations</h3>
                  <p className="text-xs text-gray-500">Live meal prep quotas derived from scheduled orders</p>
                </div>
              </div>
              <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200">
                Nagpur Hub
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-100 text-center">
                <div className="flex items-center justify-center gap-1.5 text-amber-700 font-bold text-xs mb-1">
                  <Sun size={14} /> Morning
                </div>
                <p className="text-2xl font-black text-gray-900">{operations.morningMeals}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Breakfast / Lunch</p>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-center">
                <div className="flex items-center justify-center gap-1.5 text-indigo-700 font-bold text-xs mb-1">
                  <Moon size={14} /> Evening
                </div>
                <p className="text-2xl font-black text-gray-900">{operations.eveningMeals}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Dinner Tiffins</p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-center">
                <div className="flex items-center justify-center gap-1.5 text-emerald-700 font-bold text-xs mb-1">
                  <CheckCircle2 size={14} /> Confirmed
                </div>
                <p className="text-2xl font-black text-gray-900">{operations.confirmedOrders}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Ready for dispatch</p>
              </div>

              <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-100 text-center">
                <div className="flex items-center justify-center gap-1.5 text-orange-700 font-bold text-xs mb-1">
                  <Clock size={14} /> Pending
                </div>
                <p className="text-2xl font-black text-gray-900">{operations.pendingOrders}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Awaiting verification</p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="mt-6 pt-5 border-t border-gray-100 flex flex-wrap gap-3">
              <Button asChild size="sm" className="rounded-xl font-bold text-xs bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs">
                <Link to="/admin/payments">
                  <CreditCard size={14} className="mr-1.5" /> Verify Pending Payments
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="rounded-xl font-bold text-xs border-gray-200">
                <Link to="/admin/special-orders">
                  <Package size={14} className="mr-1.5" /> Special Orders
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="rounded-xl font-bold text-xs border-gray-200">
                <Link to="/admin/orders">
                  <ShoppingBag size={14} className="mr-1.5" /> Tiffin Orders
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="rounded-xl font-bold text-xs border-gray-200">
                <Link to="/admin/menu">
                  <UtensilsCrossed size={14} className="mr-1.5" /> Manage Menu
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="rounded-xl font-bold text-xs border-gray-200">
                <Link to="/admin/customers">
                  <Users size={14} className="mr-1.5" /> Customer CRM
                </Link>
              </Button>
            </div>
          </Card>

          {/* Quick Order Status Breakdown Card */}
          <Card className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="font-extrabold text-base text-gray-900 mb-1">Order Pipeline Status</h3>
              <p className="text-xs text-gray-500 mb-4">Current order fulfillment distribution</p>

              <div className="space-y-3">
                {[
                  { label: 'Pending Verification', count: statusCounts.pending || 0, color: 'bg-amber-500', text: 'text-amber-700' },
                  { label: 'Confirmed & Scheduled', count: statusCounts.confirmed || 0, color: 'bg-emerald-600', text: 'text-emerald-700' },
                  { label: 'Preparing in Kitchen', count: statusCounts.preparing || 0, color: 'bg-blue-600', text: 'text-blue-700' },
                  { label: 'Out for Delivery', count: statusCounts.out_for_delivery || 0, color: 'bg-indigo-600', text: 'text-indigo-700' },
                  { label: 'Delivered', count: statusCounts.delivered || 0, color: 'bg-teal-600', text: 'text-teal-700' },
                  { label: 'Cancelled', count: statusCounts.cancelled || 0, color: 'bg-gray-400', text: 'text-gray-500' },
                ].map((st) => (
                  <div key={st.label} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${st.color}`} />
                      <span className="text-gray-700 font-semibold">{st.label}</span>
                    </div>
                    <span className={`font-black ${st.text}`}>{st.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <Button asChild size="sm" variant="ghost" className="w-full mt-4 text-xs font-bold text-emerald-800 hover:bg-emerald-50 rounded-xl">
              <Link to="/admin/analytics">
                Deep Analytics Report <ChevronRight size={14} className="ml-1" />
              </Link>
            </Button>
          </Card>
        </div>

        {/* Live Recent Orders & Payments Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <Card className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="font-extrabold text-base text-gray-900">Recent Orders</h3>
                <p className="text-xs text-gray-500">Live incoming customer subscriptions and meal orders</p>
              </div>
              <Button asChild size="sm" variant="ghost" className="text-xs font-bold text-emerald-700">
                <Link to="/admin/orders">View All</Link>
              </Button>
            </div>

            <div className="divide-y divide-gray-100 mt-2">
              {recentOrders.length === 0 ? (
                <p className="text-xs text-gray-400 py-8 text-center">No orders placed yet.</p>
              ) : (
                recentOrders.slice(0, 6).map((order: any) => (
                  <div key={order.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs text-gray-900">
                          #{order.id.slice(0, 8)}
                        </span>
                        <Badge className={`text-[10px] font-bold px-2 py-0.2 ${
                          order.status === 'confirmed'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : order.status === 'pending'
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {order.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 truncate mt-0.5">
                        {order.profile?.full_name || 'Customer'} • {order.meal_type || 'Full Tiffin'}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="font-black text-xs text-gray-900">₹{order.total_amount}</p>
                      <p className="text-[10px] text-gray-400">
                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Recent Payments Telemetry */}
          <Card className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="font-extrabold text-base text-gray-900">Recent Payment Submissions</h3>
                <p className="text-xs text-gray-500">Live UPI QR references submitted by patrons</p>
              </div>
              <Button asChild size="sm" variant="ghost" className="text-xs font-bold text-emerald-700">
                <Link to="/admin/payments">Payment Ledger</Link>
              </Button>
            </div>

            <div className="divide-y divide-gray-100 mt-2">
              {recentPayments.length === 0 ? (
                <p className="text-xs text-gray-400 py-8 text-center">No payment submissions yet.</p>
              ) : (
                recentPayments.slice(0, 6).map((payment: any) => (
                  <div key={payment.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-gray-900">
                          {payment.utr ? `UTR: ${payment.utr}` : payment.payment_reference || `#${payment.id.slice(0, 8)}`}
                        </span>
                        <Badge className={`text-[10px] font-bold px-2 py-0.2 ${
                          payment.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : payment.status === 'pending_verification'
                            ? 'bg-amber-100 text-amber-800 border-amber-200 animate-pulse'
                            : 'bg-red-100 text-red-800 border-red-200'
                        }`}>
                          {payment.status === 'pending_verification' ? 'Pending Approval' : payment.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 truncate mt-0.5">
                        {payment.profile?.full_name || 'Customer'}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="font-black text-xs text-gray-900">₹{payment.amount}</p>
                      <p className="text-[10px] text-gray-400">
                        {new Date(payment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
