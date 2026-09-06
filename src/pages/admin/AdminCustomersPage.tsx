import React, { useEffect, useState } from 'react';
import {
  Search,
  Users,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShoppingBag,
  CreditCard,
  IndianRupee,
  ChevronRight,
  RefreshCw,
  X,
  Clock,
  CheckCircle2,
  Shield,
  Eye,
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { supabase } from '@/lib/supabase/client';
import { getCustomerDeepDetails } from '@/services/adminService';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Customer Detail Drawer state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerDetails, setCustomerDetails] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchCustomers = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      setLoading(true);
      // 1. Try with explicit foreign key relationship
      let { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          subscriptions(*, plan:plans(*)),
          orders(id, total_amount, status),
          payments:payments!payments_user_id_fkey(id, amount, status)
        `)
        .order('created_at', { ascending: false });

      // 2. Fallback if relationship syntax differs across environments
      if (error) {
        console.warn('Using resilient customer data aggregation:', error.message);
        const [profilesRes, subsRes, ordersRes, paymentsRes] = await Promise.all([
          supabase.from('profiles').select('*').order('created_at', { ascending: false }),
          supabase.from('subscriptions').select('*, plan:plans(*)'),
          supabase.from('orders').select('id, user_id, total_amount, status'),
          supabase.from('payments').select('id, user_id, amount, status'),
        ]);

        const profiles = profilesRes.data || [];
        const subs = subsRes.data || [];
        const orders = ordersRes.data || [];
        const payments = paymentsRes.data || [];

        data = profiles.map((prof) => ({
          ...prof,
          subscriptions: subs.filter((s) => s.user_id === prof.id),
          orders: orders.filter((o) => o.user_id === prof.id),
          payments: payments.filter((p) => p.user_id === prof.id),
        }));
        error = null;
      }

      setCustomers(data || []);
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const openCustomerModal = async (customerId: string) => {
    setSelectedCustomerId(customerId);
    setDetailsLoading(true);
    try {
      const details = await getCustomerDeepDetails(customerId);
      setCustomerDetails(details);
    } catch (err) {
      console.error('Error fetching customer deep details:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (c.full_name || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q);

    const matchesRole = roleFilter === 'all' ? true : c.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <AdminLayout
      title="Customer CRM & Directory"
      subtitle="Complete profiles, delivery addresses, lifetime value, and order history of registered patrons"
      actions={
        <Button
          onClick={() => fetchCustomers(true)}
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
        {/* Table Card */}
        <Card className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xs space-y-5">
          {/* Header Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-lg text-gray-900">Registered Patrons ({filteredCustomers.length})</h3>
              <p className="text-xs text-gray-500">
                Click any customer row to inspect subscription cycles, delivery addresses & payment logs
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[220px]">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search name, email, phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 rounded-2xl text-xs h-9"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-9 px-3 rounded-2xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">All Roles</option>
                <option value="customer">Customers Only</option>
                <option value="admin">Admins</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] text-gray-600 font-extrabold uppercase text-[10px] tracking-wider border-y border-gray-100">
                <tr>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Active Plan</th>
                  <th className="py-3 px-4">Total Orders</th>
                  <th className="py-3 px-4">Joined Date</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400 font-medium">
                      Loading customer directory...
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400 font-medium">
                      No matching patrons found.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((c) => {
                    const activeSub = (c.subscriptions || []).find((s: any) => s.status === 'active');
                    const orderCount = (c.orders || []).length;

                    return (
                      <tr
                        key={c.id}
                        onClick={() => openCustomerModal(c.id)}
                        className="hover:bg-emerald-50/30 cursor-pointer transition-colors"
                      >
                        {/* Name */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 font-black text-xs flex items-center justify-center flex-shrink-0">
                              {c.full_name?.charAt(0) || c.email?.charAt(0)?.toUpperCase() || 'C'}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{c.full_name || 'Anonymous'}</p>
                              {c.role === 'admin' && (
                                <Badge className="text-[9px] bg-purple-100 text-purple-800 border-purple-200">
                                  Admin
                                </Badge>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="py-3.5 px-4 text-gray-600">{c.email}</td>

                        {/* Phone */}
                        <td className="py-3.5 px-4 text-gray-600 font-mono text-[11px]">
                          {c.phone || '—'}
                        </td>

                        {/* Active Plan */}
                        <td className="py-3.5 px-4">
                          {activeSub ? (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-bold">
                              {activeSub.plan?.name || 'Active Plan'}
                            </Badge>
                          ) : (
                            <span className="text-gray-400 text-[11px]">No active plan</span>
                          )}
                        </td>

                        {/* Total Orders */}
                        <td className="py-3.5 px-4 font-black text-gray-900">{orderCount}</td>

                        {/* Joined Date */}
                        <td className="py-3.5 px-4 text-gray-500 text-[11px]">
                          {new Date(c.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-4 text-right">
                          <Button size="sm" variant="ghost" className="h-7 text-xs font-bold text-emerald-700 hover:bg-emerald-50 rounded-xl">
                            View <ChevronRight size={14} className="ml-1" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* CUSTOMER DETAIL MODAL / DRAWER */}
        <Modal
          isOpen={!!selectedCustomerId}
          onClose={() => {
            setSelectedCustomerId(null);
            setCustomerDetails(null);
          }}
          title="Customer Profile & Business Telemetry"
        >
          {detailsLoading || !customerDetails ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-gray-400">Loading customer telemetry...</p>
            </div>
          ) : (
            <div className="space-y-5 text-left text-xs">
              {/* Header profile card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white font-black text-lg flex items-center justify-center shadow-md shadow-amber-500/20">
                    {customerDetails.profile?.full_name?.charAt(0) || 'C'}
                  </div>
                  <div>
                    <h4 className="font-black text-base text-gray-900">
                      {customerDetails.profile?.full_name || 'Customer'}
                    </h4>
                    <p className="text-gray-600 text-xs mt-0.5">{customerDetails.profile?.email}</p>
                    <p className="text-gray-500 text-[11px]">{customerDetails.profile?.phone || 'No phone'}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-black uppercase text-gray-500">Verified Spend</span>
                  <p className="text-lg font-black text-emerald-700 mt-0.5">
                    ₹{customerDetails.totalSpent?.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              {/* Delivery Addresses */}
              <div className="space-y-2">
                <h5 className="font-extrabold text-gray-900 flex items-center gap-1.5">
                  <MapPin size={14} className="text-emerald-600" /> Registered Delivery Addresses ({customerDetails.addresses?.length || 0})
                </h5>
                {customerDetails.addresses?.length === 0 ? (
                  <p className="text-gray-400 text-[11px] py-1">No address registered yet.</p>
                ) : (
                  <div className="space-y-2">
                    {customerDetails.addresses.map((a: any) => (
                      <div key={a.id} className="p-3 rounded-2xl bg-gray-50 border border-gray-200 text-[11px] space-y-0.5">
                        <div className="flex justify-between font-bold text-gray-900">
                          <span>{a.name} ({a.phone})</span>
                          {a.is_default && <Badge className="text-[9px] bg-emerald-100 text-emerald-800">Default</Badge>}
                        </div>
                        <p className="text-gray-600">{a.address_line}, {a.area}, {a.city} - {a.pincode}</p>
                        {a.landmark && <p className="text-gray-400 italic">Landmark: {a.landmark}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Subscriptions */}
              <div className="space-y-2">
                <h5 className="font-extrabold text-gray-900 flex items-center gap-1.5">
                  <Calendar size={14} className="text-emerald-600" /> Subscriptions ({customerDetails.subscriptions?.length || 0})
                </h5>
                {customerDetails.subscriptions?.length === 0 ? (
                  <p className="text-gray-400 text-[11px] py-1">No subscriptions recorded.</p>
                ) : (
                  <div className="max-h-36 overflow-y-auto space-y-1.5">
                    {customerDetails.subscriptions.map((s: any) => (
                      <div key={s.id} className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 flex justify-between items-center text-[11px]">
                        <div>
                          <span className="font-bold text-gray-900">{s.plan?.name || 'Tiffin Plan'}</span>
                          <span className="text-gray-500 ml-2">₹{s.amount}</span>
                          <div className="text-[10px] text-gray-400">{s.start_date} → {s.end_date}</div>
                        </div>
                        <Badge className="text-[10px]">{s.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Payment History */}
              <div className="space-y-2">
                <h5 className="font-extrabold text-gray-900 flex items-center gap-1.5">
                  <CreditCard size={14} className="text-emerald-600" /> Payment History ({customerDetails.payments?.length || 0})
                </h5>
                {customerDetails.payments?.length === 0 ? (
                  <p className="text-gray-400 text-[11px] py-1">No payments submitted.</p>
                ) : (
                  <div className="max-h-36 overflow-y-auto space-y-1.5">
                    {customerDetails.payments.map((p: any) => (
                      <div key={p.id} className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 flex justify-between items-center text-[11px]">
                        <div>
                          <span className="font-mono font-bold text-gray-900">{p.utr ? `UTR: ${p.utr}` : p.payment_reference || `#${p.id.slice(0, 8)}`}</span>
                          <span className="font-black text-emerald-700 ml-2">₹{p.amount}</span>
                        </div>
                        <Badge className="text-[10px]">{p.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
