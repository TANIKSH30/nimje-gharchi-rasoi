import React, { useEffect, useState } from 'react';
import {
  ShoppingBag,
  Search,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle2,
  Truck,
  ChefHat,
  XCircle,
  MapPin,
  Calendar,
  ChevronRight,
  Eye,
  IndianRupee,
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { supabase } from '@/lib/supabase/client';
import { updateOrderStatusByAdmin } from '@/services/adminService';
import { useAuth } from '@/context/AuthContext';

export default function AdminOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const fetchOrders = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      setLoading(true);
      let query = supabase
        .from('orders')
        .select(`
          *,
          profile:profiles(id, full_name, email, phone),
          address:addresses(*),
          order_items(*)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      if (dateFilter) {
        query = query.eq('order_date', dateFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('admin-orders-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [statusFilter, dateFilter]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      await updateOrderStatusByAdmin(orderId, newStatus, undefined, user?.id);
      await fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev: any) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error('Error updating order status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (o.profile?.full_name || '').toLowerCase().includes(q) ||
      (o.profile?.email || '').toLowerCase().includes(q) ||
      (o.profile?.phone || '').toLowerCase().includes(q) ||
      (o.id || '').toLowerCase().includes(q) ||
      (o.special_instructions || '').toLowerCase().includes(q);

    return matchesSearch;
  });

  return (
    <AdminLayout
      title="Mess Order Operations"
      subtitle="Track active tiffin schedules, kitchen cooking batches, dispatch statuses & special instructions"
      actions={
        <Button
          onClick={() => fetchOrders(true)}
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
          {/* Header Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-lg text-gray-900">
                Order Pipeline ({filteredOrders.length})
              </h3>
              <p className="text-xs text-gray-500">
                Click any order to inspect special dietary notes, address & line items
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[200px]">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search customer, order..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 rounded-2xl text-xs h-9"
                />
              </div>

              {/* Date Filter */}
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="h-9 px-3 rounded-2xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 px-3 rounded-2xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="preparing">Preparing in Kitchen</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] text-gray-600 font-extrabold uppercase text-[10px] tracking-wider border-y border-gray-100">
                <tr>
                  <th className="py-3 px-4">Order ID & Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Meal Type & Type</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Fulfillment Status</th>
                  <th className="py-3 px-4 text-right">Quick Transition</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400 font-medium">
                      Loading kitchen orders...
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400 font-medium">
                      No matching orders found.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((o) => {
                    const isPending = o.status === 'pending';
                    const isConfirmed = o.status === 'confirmed';
                    const isPreparing = o.status === 'preparing';
                    const isOut = o.status === 'out_for_delivery';
                    const isDelivered = o.status === 'delivered';

                    return (
                      <tr
                        key={o.id}
                        onClick={() => setSelectedOrder(o)}
                        className="hover:bg-emerald-50/30 cursor-pointer transition-colors"
                      >
                        {/* Order ID */}
                        <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                          <div>#{o.id.slice(0, 8)}</div>
                          <div className="text-[10px] text-gray-400 font-normal">
                            {new Date(o.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                            })}{' '}
                            • {new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-gray-900">
                            {o.profile?.full_name || 'Customer'}
                          </div>
                          <div className="text-[11px] text-gray-500">
                            {o.profile?.phone || o.profile?.email || 'N/A'}
                          </div>
                        </td>

                        {/* Meal & Type */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-gray-900 capitalize">
                            {o.meal_type || 'Full Tiffin'}
                          </div>
                          <div className="text-[10px] text-gray-500">
                            {o.order_type === 'subscription_delivery' ? 'Daily Subscription' : 'Special Dish Order'}
                          </div>
                        </td>

                        {/* Total Amount */}
                        <td className="py-3.5 px-4 font-black text-gray-900 text-sm">
                          ₹{o.total_amount}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <Badge
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              isConfirmed
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                : isPreparing
                                ? 'bg-blue-100 text-blue-800 border-blue-200'
                                : isOut
                                ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                                : isDelivered
                                ? 'bg-teal-100 text-teal-800 border-teal-200'
                                : isPending
                                ? 'bg-amber-100 text-amber-900 border-amber-200 animate-pulse'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {o.status}
                          </Badge>
                        </td>

                        {/* Quick Transition */}
                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={o.status}
                            disabled={updatingId === o.id}
                            onChange={(e) => handleUpdateStatus(o.id, e.target.value)}
                            className="h-7 px-2 rounded-xl border border-gray-200 bg-white text-[11px] font-bold text-gray-700 focus:ring-2 focus:ring-primary/20"
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirm</option>
                            <option value="preparing">Cooking / Prep</option>
                            <option value="out_for_delivery">Out for Delivery</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancel</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* ORDER DETAIL MODAL */}
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Order #${selectedOrder?.id.slice(0, 8)}`}
        >
          {selectedOrder && (
            <div className="space-y-4 text-left text-xs">
              {/* Top Banner */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex justify-between items-center">
                <div>
                  <h4 className="font-extrabold text-sm text-emerald-950">
                    {selectedOrder.profile?.full_name || 'Customer'}
                  </h4>
                  <p className="text-gray-600 mt-0.5">
                    {selectedOrder.profile?.phone} • {selectedOrder.profile?.email}
                  </p>
                </div>
                <Badge className="bg-emerald-600 text-white font-bold">{selectedOrder.status}</Badge>
              </div>

              {/* Delivery Address */}
              {selectedOrder.address && (
                <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200 space-y-1">
                  <span className="font-extrabold text-gray-700 flex items-center gap-1.5">
                    <MapPin size={14} className="text-emerald-600" /> Delivery Address
                  </span>
                  <p className="text-gray-800 font-semibold">
                    {selectedOrder.address.address_line}, {selectedOrder.address.area}, {selectedOrder.address.city} - {selectedOrder.address.pincode}
                  </p>
                  {selectedOrder.address.landmark && (
                    <p className="text-gray-400 italic">Landmark: {selectedOrder.address.landmark}</p>
                  )}
                </div>
              )}

              {/* Special Instructions */}
              {selectedOrder.special_instructions && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-0.5">
                  <span className="font-black text-amber-900">Dietary / Cooking Instructions:</span>
                  <p>{selectedOrder.special_instructions}</p>
                </div>
              )}

              {/* Line items */}
              <div className="space-y-2">
                <span className="font-extrabold text-gray-900">Order Items:</span>
                {selectedOrder.order_items && selectedOrder.order_items.length > 0 ? (
                  <div className="divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-gray-50 p-2">
                    {selectedOrder.order_items.map((item: any) => (
                      <div key={item.id} className="py-2 px-2 flex justify-between">
                        <span className="font-bold text-gray-800">
                          {item.item_name} × {item.quantity}
                        </span>
                        <span className="font-black text-emerald-700">₹{item.total_price}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic p-2 bg-gray-50 rounded-xl">Standard daily tiffin meal delivery.</p>
                )}
              </div>

              {/* Total Summary */}
              <div className="p-3 rounded-2xl bg-emerald-100/60 border border-emerald-200 flex justify-between items-center text-sm font-black text-emerald-950">
                <span>Total Amount</span>
                <span>₹{selectedOrder.total_amount}</span>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
