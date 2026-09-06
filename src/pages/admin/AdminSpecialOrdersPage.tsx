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
  Plus,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  Package,
  Layers,
  Phone,
  Mail,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { supabase } from '@/lib/supabase/client';
import { SpecialOrderProduct, SpecialOrderCategory } from '@/types/database';
import {
  createSpecialOrderProductAdmin,
  updateSpecialOrderProductAdmin,
  deleteSpecialOrderProductAdmin,
  toggleSpecialOrderProductAvailability,
  updateOrderStatusByAdmin,
  verifyPaymentByAdmin,
} from '@/services/adminService';
import {
  SPECIAL_ORDER_CATEGORIES,
  fetchAllSpecialOrderProductsAdmin,
  formatPriceUnit,
} from '@/services/specialOrderService';
import { useAuth } from '@/context/AuthContext';

export default function AdminSpecialOrdersPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'orders' | 'products'>('orders');

  // Orders state
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersSearch, setOrdersSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Products state
  const [products, setProducts] = useState<SpecialOrderProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');
  const [productSearch, setProductSearch] = useState('');

  // Product modal
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<SpecialOrderProduct | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    category: 'veg' as SpecialOrderCategory,
    image_url: '',
    price: '',
    unit: 'kg',
    pricing_unit_step: '1',
    min_quantity: '0.5',
    max_quantity: '10',
    quantity_step: '0.5',
    is_available: true,
    advance_notice_hours: '24',
    display_order: '0',
  });

  // Fetch orders
  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      let query = supabase
        .from('orders')
        .select(`
          *,
          profile:profiles(id, full_name, email, phone),
          address:addresses(*),
          order_items(*),
          payments(*)
        `)
        .eq('order_type', 'special_order')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error loading special orders:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  // Fetch products
  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      const data = await fetchAllSpecialOrderProductsAdmin();
      setProducts(data);
    } catch (err) {
      console.error('Error loading special order products:', err);
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchProducts();

    const channel = supabase
      .channel('admin-special-orders-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'special_order_products' }, () => {
        fetchProducts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [statusFilter]);

  // Order status management
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      await updateOrderStatusByAdmin(orderId, newStatus, undefined, user?.id);
      await fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev: any) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      alert('Failed to update status');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Quick verify payment
  const handleVerifyOrderPayment = async (paymentId: string) => {
    if (!user) return;
    try {
      await verifyPaymentByAdmin({
        paymentId,
        action: 'approve',
        adminUserId: user.id,
      });
      await fetchOrders();
      alert('Payment approved and order confirmed!');
    } catch (err: any) {
      alert(err.message || 'Payment approval failed');
    }
  };

  // Product management actions
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      description: '',
      category: 'veg',
      image_url: '',
      price: '',
      unit: 'kg',
      pricing_unit_step: '1',
      min_quantity: '0.5',
      max_quantity: '10',
      quantity_step: '0.5',
      is_available: true,
      advance_notice_hours: '24',
      display_order: '0',
    });
    setProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod: SpecialOrderProduct) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name,
      description: prod.description || '',
      category: prod.category,
      image_url: prod.image_url || '',
      price: String(prod.price),
      unit: prod.unit,
      pricing_unit_step: String(prod.pricing_unit_step || 1),
      min_quantity: String(prod.min_quantity || 1),
      max_quantity: String(prod.max_quantity || 100),
      quantity_step: String(prod.quantity_step || 1),
      is_available: prod.is_available,
      advance_notice_hours: String(prod.advance_notice_hours || 24),
      display_order: String(prod.display_order || 0),
    });
    setProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price) {
      alert('Please fill product name and price');
      return;
    }

    setSavingProduct(true);
    try {
      if (editingProduct) {
        await updateSpecialOrderProductAdmin(editingProduct.id, productForm);
      } else {
        await createSpecialOrderProductAdmin(productForm);
      }
      await fetchProducts();
      setProductModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Error saving product');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleToggleProduct = async (prod: SpecialOrderProduct) => {
    try {
      await toggleSpecialOrderProductAvailability(prod.id, !prod.is_available);
      await fetchProducts();
    } catch (err: any) {
      alert(err.message || 'Error updating product');
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? Historical orders will keep their snapshot records.`)) {
      return;
    }
    try {
      await deleteSpecialOrderProductAdmin(id);
      await fetchProducts();
    } catch (err: any) {
      alert(err.message || 'Error deleting product');
    }
  };

  // Filtered lists
  const filteredOrders = orders.filter((o) => {
    const q = ordersSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      (o.profile?.full_name || '').toLowerCase().includes(q) ||
      (o.profile?.phone || '').toLowerCase().includes(q) ||
      (o.id || '').toLowerCase().includes(q) ||
      (o.special_instructions || '').toLowerCase().includes(q)
    );
  });

  const filteredProductsList = products.filter((p) => {
    const matchesCat = productCategoryFilter === 'all' || p.category === productCategoryFilter;
    const q = productSearch.toLowerCase().trim();
    const matchesSearch =
      !q || p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q));
    return matchesCat && matchesSearch;
  });

  return (
    <AdminLayout
      title="Special Orders Management"
      subtitle="Manage custom bulk delicacies catalog, customer orders, kitchen prep schedules & delivery tracking"
      actions={
        <div className="flex gap-2">
          {activeTab === 'products' ? (
            <Button onClick={handleOpenAddProduct} className="rounded-xl text-xs font-bold gap-1 shadow-sm">
              <Plus size={14} /> Add New Delicacy
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={fetchOrders}
              className="rounded-xl text-xs font-bold gap-1"
            >
              <RefreshCw size={13} className={ordersLoading ? 'animate-spin' : ''} /> Refresh
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'orders'
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-gray-500 hover:text-foreground'
            }`}
          >
            <ShoppingBag size={16} /> Incoming Special Orders ({orders.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'products'
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-gray-500 hover:text-foreground'
            }`}
          >
            <Layers size={16} /> Delicacy Catalog & Pricing ({products.length})
          </button>
        </div>

        {/* TAB 1: SPECIAL ORDERS */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {['all', 'pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'].map(
                  (st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors cursor-pointer ${
                        statusFilter === st
                          ? 'bg-primary text-white shadow-xs'
                          : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  )
                )}
              </div>

              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search customer, phone, ID..."
                  value={ordersSearch}
                  onChange={(e) => setOrdersSearch(e.target.value)}
                  className="pl-9 h-9 text-xs rounded-xl bg-white"
                />
              </div>
            </div>

            {/* Orders Table */}
            {ordersLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-16 bg-white rounded-2xl border border-gray-100 animate-pulse" />
                ))}
              </div>
            ) : filteredOrders.length === 0 ? (
              <Card className="p-12 text-center rounded-3xl border border-gray-200 bg-white">
                <ShoppingBag size={36} className="text-gray-300 mx-auto mb-2" />
                <h4 className="font-bold text-base text-foreground">No special orders found</h4>
                <p className="text-xs text-gray-400 mt-1">Orders placed by customers will appear here in real time.</p>
              </Card>
            ) : (
              <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Order ID & Date</th>
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Delicacies Ordered</th>
                        <th className="py-3 px-4">Required Delivery</th>
                        <th className="py-3 px-4">Total Amount</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredOrders.map((order) => {
                        const items = order.order_items || [];
                        const payment = order.payments?.[0];

                        return (
                          <tr key={order.id} className="hover:bg-gray-50/60 transition-colors">
                            <td className="py-3.5 px-4">
                              <span className="font-mono font-bold text-foreground block">
                                #{order.id.slice(0, 8)}
                              </span>
                              <span className="text-[11px] text-gray-400">
                                {new Date(order.created_at).toLocaleDateString()}
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              <span className="font-bold text-foreground block">
                                {order.profile?.full_name || 'Customer'}
                              </span>
                              <span className="text-[11px] text-gray-500 font-mono">
                                {order.profile?.phone || order.address?.phone || 'No phone'}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 max-w-xs">
                              <div className="space-y-1">
                                {items.map((it: any) => (
                                  <div key={it.id} className="text-xs">
                                    <span className="font-bold text-foreground">{it.item_name}</span>
                                    <span className="text-gray-500 ml-1">
                                      ({it.quantity} {it.unit_snapshot || 'pcs'})
                                    </span>
                                  </div>
                                ))}
                                {order.special_instructions && (
                                  <p className="text-[10px] text-amber-700 font-medium italic truncate">
                                    Note: {order.special_instructions}
                                  </p>
                                )}
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1 font-bold text-foreground">
                                <Calendar size={12} className="text-primary" />
                                {order.required_date || order.order_date}
                              </div>
                              <span className="text-[10px] text-gray-500 capitalize block">
                                Slot: {order.preferred_time || order.meal_type}
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              <span className="text-sm font-black text-primary">₹{order.total_amount}</span>
                              {payment && (
                                <span
                                  className={`block text-[10px] font-bold ${
                                    payment.status === 'paid'
                                      ? 'text-emerald-700'
                                      : payment.status === 'pending_verification'
                                      ? 'text-amber-700'
                                      : 'text-gray-400'
                                  }`}
                                >
                                  {payment.status === 'paid' ? 'Paid' : `UTR: ${payment.utr || 'Pending'}`}
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4">
                              <Badge
                                variant={
                                  order.status === 'delivered'
                                    ? 'success'
                                    : order.status === 'confirmed' || order.status === 'preparing'
                                    ? 'default'
                                    : order.status === 'cancelled'
                                    ? 'destructive'
                                    : 'warning'
                                }
                                className="text-[10px] uppercase font-extrabold px-2"
                              >
                                {order.status.replace('_', ' ')}
                              </Badge>
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedOrder(order)}
                                  className="h-7 text-xs rounded-lg px-2"
                                >
                                  <Eye size={12} className="mr-1" /> View
                                </Button>

                                {order.status === 'pending' && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleUpdateOrderStatus(order.id, 'confirmed')}
                                    disabled={updatingOrderId === order.id}
                                    className="h-7 text-xs rounded-lg px-2 font-bold bg-emerald-700 hover:bg-emerald-800"
                                  >
                                    Confirm
                                  </Button>
                                )}

                                {order.status === 'confirmed' && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleUpdateOrderStatus(order.id, 'preparing')}
                                    disabled={updatingOrderId === order.id}
                                    className="h-7 text-xs rounded-lg px-2 font-bold"
                                  >
                                    Prep
                                  </Button>
                                )}

                                {order.status === 'preparing' && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleUpdateOrderStatus(order.id, 'out_for_delivery')}
                                    disabled={updatingOrderId === order.id}
                                    className="h-7 text-xs rounded-lg px-2 font-bold bg-blue-600 hover:bg-blue-700"
                                  >
                                    Dispatch
                                  </Button>
                                )}

                                {order.status === 'out_for_delivery' && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}
                                    disabled={updatingOrderId === order.id}
                                    className="h-7 text-xs rounded-lg px-2 font-bold bg-emerald-600 hover:bg-emerald-700"
                                  >
                                    Delivered
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SPECIAL ORDER PRODUCTS */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {SPECIAL_ORDER_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setProductCategoryFilter(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                      productCategoryFilter === cat.id
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search delicacy by name..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-9 h-9 text-xs rounded-xl bg-white"
                />
              </div>
            </div>

            {/* Products Grid */}
            {productsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-48 bg-white rounded-3xl border border-gray-100 animate-pulse" />
                ))}
              </div>
            ) : filteredProductsList.length === 0 ? (
              <Card className="p-12 text-center rounded-3xl border border-gray-200 bg-white">
                <Layers size={36} className="text-gray-300 mx-auto mb-2" />
                <h4 className="font-bold text-base text-foreground">No delicacies found</h4>
                <p className="text-xs text-gray-400 mt-1">Click "Add New Delicacy" to create a new special order food item.</p>
                <Button onClick={handleOpenAddProduct} size="sm" className="mt-4 rounded-xl text-xs">
                  <Plus size={14} className="mr-1" /> Add Delicacy
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProductsList.map((prod) => (
                  <Card
                    key={prod.id}
                    className={`rounded-3xl border p-5 bg-white space-y-4 flex flex-col justify-between transition-all ${
                      prod.is_available ? 'border-gray-200' : 'border-gray-200 opacity-60 bg-gray-50'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                            {prod.category.replace('_', ' ')}
                          </span>
                          <h4 className="font-bold text-base text-foreground mt-1">{prod.name}</h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleProduct(prod)}
                          title={prod.is_available ? 'Click to disable' : 'Click to enable'}
                          className="cursor-pointer text-primary hover:opacity-80"
                        >
                          {prod.is_available ? (
                            <ToggleRight size={28} className="text-primary" />
                          ) : (
                            <ToggleLeft size={28} className="text-gray-400" />
                          )}
                        </button>
                      </div>

                      <p className="text-xs text-gray-500 line-clamp-2">
                        {prod.description || 'No description provided.'}
                      </p>

                      <div className="pt-2 border-t border-gray-100 flex items-baseline justify-between">
                        <div>
                          <span className="text-xl font-black text-primary">₹{prod.price}</span>
                          <span className="text-xs font-semibold text-gray-500 ml-1">
                            / {prod.pricing_unit_step > 1 ? `${prod.pricing_unit_step} ` : ''}{prod.unit}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-gray-500">
                          {prod.advance_notice_hours}h notice
                        </span>
                      </div>

                      <div className="bg-gray-50 p-2.5 rounded-xl text-[11px] text-gray-600 grid grid-cols-3 gap-1 text-center font-medium">
                        <div>
                          <span className="text-gray-400 block text-[10px]">Min</span>
                          {prod.min_quantity} {prod.unit}
                        </div>
                        <div>
                          <span className="text-gray-400 block text-[10px]">Step</span>
                          {prod.quantity_step} {prod.unit}
                        </div>
                        <div>
                          <span className="text-gray-400 block text-[10px]">Max</span>
                          {prod.max_quantity} {prod.unit}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEditProduct(prod)}
                        className="w-full text-xs rounded-xl h-8"
                      >
                        <Edit2 size={12} className="mr-1" /> Edit Product
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteProduct(prod.id, prod.name)}
                        className="text-destructive hover:bg-destructive/10 text-xs rounded-xl h-8 px-2"
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Special Order #${selectedOrder?.id?.slice(0, 8)}`}
      >
        {selectedOrder && (
          <div className="space-y-4 text-xs pt-1">
            {/* Customer & Address Details */}
            <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
              <p className="font-bold text-sm text-foreground">{selectedOrder.profile?.full_name || 'Customer'}</p>
              <p className="text-gray-500 flex items-center gap-1 font-mono">
                <Phone size={12} /> {selectedOrder.profile?.phone || selectedOrder.address?.phone || 'No phone'}
              </p>
              <p className="text-gray-500 flex items-center gap-1">
                <Mail size={12} /> {selectedOrder.profile?.email}
              </p>
              {selectedOrder.address && (
                <p className="text-gray-600 flex items-start gap-1 pt-1 border-t border-gray-200/60 mt-1">
                  <MapPin size={12} className="flex-shrink-0 mt-0.5 text-primary" />
                  <span>
                    {selectedOrder.address.address_line}, {selectedOrder.address.area}, {selectedOrder.address.city} ({selectedOrder.address.pincode})
                  </span>
                </p>
              )}
            </div>

            {/* Schedule & Notes */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-primary/5 rounded-2xl border border-primary/10">
                <span className="text-[10px] font-bold text-gray-400 block uppercase">Required Date</span>
                <span className="text-sm font-black text-primary">
                  {selectedOrder.required_date || selectedOrder.order_date}
                </span>
                <span className="text-[11px] text-gray-500 block capitalize">
                  Slot: {selectedOrder.preferred_time || selectedOrder.meal_type}
                </span>
              </div>

              <div className="p-3 bg-amber-500/5 rounded-2xl border border-amber-500/10">
                <span className="text-[10px] font-bold text-gray-400 block uppercase">Order Total</span>
                <span className="text-sm font-black text-amber-700">₹{selectedOrder.total_amount}</span>
                <span className="text-[11px] text-gray-500 block">Status: {selectedOrder.status}</span>
              </div>
            </div>

            {selectedOrder.special_instructions && (
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/60 text-amber-900">
                <span className="font-bold block mb-0.5">Cooking / Packing Note:</span>
                <p className="italic">{selectedOrder.special_instructions}</p>
              </div>
            )}

            {/* Order Items */}
            <div>
              <span className="font-bold text-foreground block mb-1">Delicacies in Order:</span>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {selectedOrder.order_items?.map((it: any) => (
                  <div
                    key={it.id}
                    className="flex justify-between items-center p-2 rounded-xl bg-gray-50 border border-gray-100"
                  >
                    <div>
                      <span className="font-bold text-foreground">{it.item_name}</span>
                      <span className="text-gray-500 ml-1">
                        x {it.quantity} {it.unit_snapshot || 'pcs'}
                      </span>
                    </div>
                    <span className="font-black text-foreground">₹{it.total_price}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment & UTR Verification */}
            {selectedOrder.payments?.[0] && (
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">UPI Payment UTR</span>
                  <span className="font-mono font-bold text-foreground">
                    {selectedOrder.payments[0].utr || 'No UTR submitted yet'}
                  </span>
                </div>
                {selectedOrder.payments[0].status === 'pending_verification' && (
                  <Button
                    size="sm"
                    onClick={() => handleVerifyOrderPayment(selectedOrder.payments[0].id)}
                    className="rounded-xl text-xs font-bold"
                  >
                    Approve Payment
                  </Button>
                )}
              </div>
            )}

            {/* Status Update Actions */}
            <div className="pt-2 border-t border-gray-100">
              <label className="font-bold text-foreground block mb-1.5">Change Order Status:</label>
              <div className="grid grid-cols-3 gap-1.5">
                {['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleUpdateOrderStatus(selectedOrder.id, st)}
                    disabled={updatingOrderId === selectedOrder.id}
                    className={`p-2 rounded-xl text-[11px] font-bold capitalize transition-colors cursor-pointer ${
                      selectedOrder.status === st
                        ? 'bg-primary text-white font-black'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        title={editingProduct ? `Edit ${editingProduct.name}` : 'Add New Special Delicacy'}
      >
        <form onSubmit={handleSaveProduct} className="space-y-4 pt-1 text-xs">
          <div>
            <label className="font-bold text-foreground block mb-1">Delicacy / Dish Name *</label>
            <Input
              required
              placeholder="e.g. Nagpur Authentic Saoji Chicken Curry"
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              className="h-9 text-xs rounded-xl"
            />
          </div>

          <div>
            <label className="font-bold text-foreground block mb-1">Short Description</label>
            <Input
              placeholder="Homestyle spices, country chicken, slow roasted gravies..."
              value={productForm.description}
              onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              className="h-9 text-xs rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-foreground block mb-1">Category *</label>
              <select
                value={productForm.category}
                onChange={(e) => setProductForm({ ...productForm, category: e.target.value as any })}
                className="w-full h-9 rounded-xl border border-gray-200 bg-white px-2 font-medium"
              >
                <option value="roti">Roti & Breads</option>
                <option value="veg">Veg Sabji</option>
                <option value="non_veg">Non-Veg Gravies</option>
                <option value="rice_dal">Rice & Dal</option>
                <option value="sweets">Sweets & Desserts</option>
                <option value="bulk_party">Bulk / Party Packs</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-foreground block mb-1">Price (₹) *</label>
              <Input
                type="number"
                step="any"
                required
                placeholder="e.g. 480"
                value={productForm.price}
                onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                className="h-9 text-xs rounded-xl font-bold font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-foreground block mb-1">Measurement Unit *</label>
              <select
                value={productForm.unit}
                onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                className="w-full h-9 rounded-xl border border-gray-200 bg-white px-2 font-medium"
              >
                <option value="kg">kg (Kilogram)</option>
                <option value="g">g (Gram)</option>
                <option value="pcs">pcs (Pieces)</option>
                <option value="plate">plate (Plates / Thali)</option>
                <option value="bowl">bowl (Bowl)</option>
                <option value="packet">packet (Packet)</option>
                <option value="litre">litre (Litre)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-foreground block mb-1">Pricing Unit Step</label>
              <Input
                type="number"
                step="any"
                placeholder="1 (for 1 kg) or 10 (for 10 pcs)"
                value={productForm.pricing_unit_step}
                onChange={(e) => setProductForm({ ...productForm, pricing_unit_step: e.target.value })}
                className="h-9 text-xs rounded-xl"
              />
            </div>
          </div>

          {/* Quantity Rules */}
          <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
            <span className="font-bold text-foreground block">Customer Quantity Ordering Rules:</span>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-gray-500 block mb-0.5">Min Qty</label>
                <Input
                  type="number"
                  step="any"
                  value={productForm.min_quantity}
                  onChange={(e) => setProductForm({ ...productForm, min_quantity: e.target.value })}
                  className="h-8 text-xs rounded-lg"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 block mb-0.5">Step Qty</label>
                <Input
                  type="number"
                  step="any"
                  value={productForm.quantity_step}
                  onChange={(e) => setProductForm({ ...productForm, quantity_step: e.target.value })}
                  className="h-8 text-xs rounded-lg"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 block mb-0.5">Max Qty</label>
                <Input
                  type="number"
                  step="any"
                  value={productForm.max_quantity}
                  onChange={(e) => setProductForm({ ...productForm, max_quantity: e.target.value })}
                  className="h-8 text-xs rounded-lg"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-foreground block mb-1">Advance Notice (Hours)</label>
              <Input
                type="number"
                placeholder="24"
                value={productForm.advance_notice_hours}
                onChange={(e) => setProductForm({ ...productForm, advance_notice_hours: e.target.value })}
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div>
              <label className="font-bold text-foreground block mb-1">Display Sort Order</label>
              <Input
                type="number"
                placeholder="0"
                value={productForm.display_order}
                onChange={(e) => setProductForm({ ...productForm, display_order: e.target.value })}
                className="h-9 text-xs rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-foreground block mb-1">Image URL (Optional)</label>
            <Input
              placeholder="https://images.unsplash.com/..."
              value={productForm.image_url}
              onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
              className="h-9 text-xs rounded-xl"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="is_available_chk"
              checked={productForm.is_available}
              onChange={(e) => setProductForm({ ...productForm, is_available: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="is_available_chk" className="font-bold text-foreground cursor-pointer">
              Available for Customer Ordering
            </label>
          </div>

          <Button type="submit" loading={savingProduct} className="w-full h-10 rounded-2xl font-bold mt-2">
            {editingProduct ? 'Update Delicacy' : 'Create Delicacy'}
          </Button>
        </form>
      </Modal>
    </AdminLayout>
  );
}
