import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  IndianRupee,
  TrendingUp,
  Calendar,
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  ArrowUpRight,
  PieChart,
  ShoppingBag,
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getRevenueAnalyticsData } from '@/services/adminService';

export default function AdminReportsPage() {
  const [timeRange, setTimeRange] = useState<'today' | '7d' | '30d' | 'month' | 'all'>('30d');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      setLoading(true);
      const res = await getRevenueAnalyticsData(timeRange);
      setData(res);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const maxRevenue = data?.dailyTrend?.reduce((max: number, d: any) => Math.max(max, d.revenue), 0) || 1;

  return (
    <AdminLayout
      title="Revenue Analytics & Financial Reports"
      subtitle="Audited financial telemetry strictly aggregated from verified 'paid' UPI transactions"
      actions={
        <div className="flex items-center gap-2">
          {/* Time range selector */}
          <div className="flex items-center bg-white p-1 rounded-2xl border border-gray-200 text-xs shadow-xs">
            {[
              { id: 'today', label: 'Today' },
              { id: '7d', label: '7 Days' },
              { id: '30d', label: '30 Days' },
              { id: 'month', label: 'This Month' },
              { id: 'all', label: 'All Time' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTimeRange(t.id as any)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                  timeRange === t.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <Button
            onClick={() => fetchAnalytics(true)}
            variant="outline"
            size="sm"
            disabled={refreshing}
            className="rounded-xl text-xs font-bold gap-2 border-gray-200"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 rounded-3xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/40 shadow-xs">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-700">
                <IndianRupee size={20} />
              </div>
              <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-extrabold">
                Verified Real Revenue
              </Badge>
            </div>
            <p className="text-xs font-bold text-gray-500">Total Paid Revenue</p>
            <h3 className="text-3xl font-black text-gray-900 mt-1">
              ₹{data?.totalVerifiedRevenue?.toLocaleString('en-IN') || 0}
            </h3>
            <p className="text-[11px] text-emerald-700 font-semibold mt-1">
              From {data?.paidCount || 0} approved transaction{data?.paidCount !== 1 ? 's' : ''}
            </p>
          </Card>

          <Card className="p-5 rounded-3xl border border-amber-100 bg-gradient-to-br from-white to-amber-50/40 shadow-xs">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-700">
                <Clock size={20} />
              </div>
              <Badge className="bg-amber-50 text-amber-800 border-amber-200 text-[10px] font-extrabold">
                Pending Verification
              </Badge>
            </div>
            <p className="text-xs font-bold text-gray-500">Unsettled Amount</p>
            <h3 className="text-3xl font-black text-gray-900 mt-1">
              ₹{data?.pendingAmount?.toLocaleString('en-IN') || 0}
            </h3>
            <p className="text-[11px] text-amber-800 font-semibold mt-1">
              Across {data?.pendingCount || 0} pending UTR submission{data?.pendingCount !== 1 ? 's' : ''}
            </p>
          </Card>

          <Card className="p-5 rounded-3xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/40 shadow-xs">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2.5 rounded-2xl bg-blue-100 text-blue-700">
                <TrendingUp size={20} />
              </div>
              <Badge className="bg-blue-50 text-blue-800 border-blue-200 text-[10px] font-extrabold">
                Average Value
              </Badge>
            </div>
            <p className="text-xs font-bold text-gray-500">Avg. Order Value</p>
            <h3 className="text-3xl font-black text-gray-900 mt-1">
              ₹{data?.avgOrderValue?.toLocaleString('en-IN') || 0}
            </h3>
            <p className="text-[11px] text-blue-700 font-semibold mt-1">
              Per successful subscription / order
            </p>
          </Card>

          <Card className="p-5 rounded-3xl border border-purple-100 bg-gradient-to-br from-white to-purple-50/40 shadow-xs">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2.5 rounded-2xl bg-purple-100 text-purple-700">
                <CreditCard size={20} />
              </div>
              <Badge className="bg-purple-50 text-purple-800 border-purple-200 text-[10px] font-extrabold">
                Success Rate
              </Badge>
            </div>
            <p className="text-xs font-bold text-gray-500">Approval Rate</p>
            <h3 className="text-3xl font-black text-gray-900 mt-1">
              {data?.statusDistribution?.total > 0
                ? Math.round((data.paidCount / data.statusDistribution.total) * 100)
                : 100}%
            </h3>
            <p className="text-[11px] text-purple-700 font-semibold mt-1">
              UTR verification accuracy
            </p>
          </Card>
        </div>

        {/* Dynamic Daily Revenue Bar Chart */}
        <Card className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-gray-900">
                Verified Daily Revenue Trend
              </h3>
              <p className="text-xs text-gray-500">
                Aggregated daily collection from verified UPI transactions
              </p>
            </div>
            <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200">
              Live Data
            </Badge>
          </div>

          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !data?.dailyTrend || data.dailyTrend.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
              <BarChart3 size={32} className="text-gray-400 mb-2" />
              <p className="text-sm font-bold text-gray-700">No verified revenue records in this timeframe.</p>
              <p className="text-xs text-gray-400 mt-1">
                Approved payments will be charted here automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-3 pt-4">
              <div className="h-56 flex items-end gap-2 sm:gap-4 overflow-x-auto pb-2 custom-scrollbar">
                {data.dailyTrend.map((d: any) => {
                  const heightPercent = Math.max(12, Math.round((d.revenue / maxRevenue) * 100));
                  return (
                    <div key={d.date} className="flex-1 min-w-[40px] flex flex-col items-center gap-1.5 h-full justify-end group">
                      <span className="text-[10px] font-black text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
                        ₹{d.revenue}
                      </span>
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full bg-gradient-to-t from-emerald-700 to-emerald-500 rounded-t-xl transition-all duration-300 group-hover:from-emerald-600 group-hover:to-amber-400 shadow-xs"
                      />
                      <span className="text-[10px] font-semibold text-gray-500 truncate max-w-[50px]">
                        {new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>

        {/* Breakdown Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payment Status Distribution */}
          <Card className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
            <div>
              <h3 className="font-extrabold text-base text-gray-900">Payment Status Breakdown</h3>
              <p className="text-xs text-gray-500">Distribution of all logged transaction submissions</p>
            </div>

            <div className="space-y-3 pt-2">
              {[
                {
                  label: 'Verified & Paid',
                  count: data?.paidCount || 0,
                  amount: data?.totalVerifiedRevenue || 0,
                  color: 'bg-emerald-500',
                  text: 'text-emerald-800',
                },
                {
                  label: 'Pending Verification',
                  count: data?.pendingCount || 0,
                  amount: data?.pendingAmount || 0,
                  color: 'bg-amber-500',
                  text: 'text-amber-800',
                },
                {
                  label: 'Rejected Payments',
                  count: data?.rejectedCount || 0,
                  amount: 0,
                  color: 'bg-red-500',
                  text: 'text-red-800',
                },
              ].map((item) => (
                <div key={item.label} className="p-3 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-3 h-3 rounded-full ${item.color}`} />
                    <div>
                      <p className="font-bold text-gray-900">{item.label}</p>
                      <p className="text-[10px] text-gray-500">{item.count} submissions</p>
                    </div>
                  </div>
                  {item.amount > 0 && (
                    <span className={`font-black text-sm ${item.text}`}>
                      ₹{item.amount.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Verified Ledger Entries */}
          <Card className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
            <div>
              <h3 className="font-extrabold text-base text-gray-900">Latest Verified Payments</h3>
              <p className="text-xs text-gray-500">Most recent transactions cleared by administrator</p>
            </div>

            <div className="divide-y divide-gray-100">
              {!data?.recentPaidPayments || data.recentPaidPayments.length === 0 ? (
                <p className="text-xs text-gray-400 py-6 text-center">No paid transactions in this filter.</p>
              ) : (
                data.recentPaidPayments.map((p: any) => (
                  <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-gray-900">{p.profile?.full_name || 'Customer'}</p>
                      <p className="text-[10px] text-gray-400 font-mono">
                        {p.utr ? `UTR: ${p.utr}` : p.payment_reference || `#${p.id.slice(0, 8)}`}
                      </p>
                    </div>
                    <span className="font-black text-emerald-700">₹{p.amount}</span>
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
