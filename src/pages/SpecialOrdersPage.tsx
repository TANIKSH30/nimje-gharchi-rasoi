import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShoppingBag,
  Plus,
  Minus,
  Check,
  MapPin,
  Clock,
  Sparkles,
  AlertCircle,
  QrCode,
  Copy,
  CheckCheck,
  Smartphone,
  Info,
  ShieldCheck,
  Search,
  Calendar,
  UtensilsCrossed,
  ChefHat,
  Trash2,
  SlidersHorizontal,
  Flame,
  ArrowRight,
  Package,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { SpecialOrderProduct, SpecialOrderCategory, Address } from '@/types/database';
import {
  SPECIAL_ORDER_CATEGORIES,
  fetchActiveSpecialOrderProducts,
  calculateItemLinePrice,
  formatPriceUnit,
  validateQuantityRules,
} from '@/services/specialOrderService';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import WhatsAppButton from '@/components/layout/WhatsAppButton';
import SEOHead from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { createPaymentIntent, submitPaymentUtr, PaymentIntentResult } from '@/services/paymentService';

interface CartItem {
  product: SpecialOrderProduct;
  quantity: number;
  lineTotal: number;
}

export default function SpecialOrdersPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [products, setProducts] = useState<SpecialOrderProduct[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<SpecialOrderCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Cart state
  const [cart, setCart] = useState<{ [productId: string]: CartItem }>({});
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [requiredDate, setRequiredDate] = useState<string>('');
  const [preferredTime, setPreferredTime] = useState<string>('lunch');
  const [specialInstructions, setSpecialInstructions] = useState<string>('');
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Custom quantity modal / input per card
  const [customQtyValues, setCustomQtyValues] = useState<{ [productId: string]: string }>({});

  // Payment state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntentResult | null>(null);
  const [initiatingPayment, setInitiatingPayment] = useState(false);
  const [utrInput, setUtrInput] = useState('');
  const [submittingUtr, setSubmittingUtr] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Address modal
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    name: '',
    phone: '',
    address_line: '',
    area: '',
    city: 'Nagpur',
    state: 'Maharashtra',
    pincode: '',
    landmark: '',
  });

  // Calculate earliest allowed delivery date based on max advance notice
  const minRequiredDateString = useMemo(() => {
    const now = new Date();
    // Default 12 hours advance if no products, else 24 hours
    now.setHours(now.getHours() + 12);
    return now.toISOString().split('T')[0];
  }, []);

  useEffect(() => {
    // Set default required date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setRequiredDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const prods = await fetchActiveSpecialOrderProducts();
        setProducts(prods);

        if (user) {
          const { data: addrs } = await supabase
            .from('addresses')
            .select('*')
            .eq('user_id', user.id)
            .order('is_default', { ascending: false });

          const addrList = (addrs as Address[]) || [];
          setAddresses(addrList);
          if (addrList.length > 0) {
            setSelectedAddressId(addrList[0].id);
          }
        }
      } catch (err: any) {
        console.error('Error fetching special orders data:', err);
        setError('Failed to load special order delicacies. Please refresh.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user]);

  // Filter products by category and search query
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [products, activeCategory, searchQuery]);

  // Cart operations
  const handleAddToCart = (product: SpecialOrderProduct, customQuantity?: number) => {
    const qty = customQuantity !== undefined ? customQuantity : (Number(product.min_quantity) || 1);
    const validation = validateQuantityRules(product, qty);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid quantity');
      return;
    }

    setError(null);
    const lineTotal = calculateItemLinePrice(Number(product.price), Number(product.pricing_unit_step), qty);

    setCart((prev) => ({
      ...prev,
      [product.id]: {
        product,
        quantity: qty,
        lineTotal,
      },
    }));
  };

  const handleAdjustQuantity = (productId: string, deltaSteps: number) => {
    setCart((prev) => {
      const existing = prev[productId];
      if (!existing) return prev;

      const product = existing.product;
      const step = Number(product.quantity_step) || 1;
      const min = Number(product.min_quantity) || 1;
      const max = Number(product.max_quantity) || 1000;

      const newQty = Math.round((existing.quantity + deltaSteps * step) * 100) / 100;

      if (newQty < min) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }

      if (newQty > max) {
        return prev;
      }

      const lineTotal = calculateItemLinePrice(Number(product.price), Number(product.pricing_unit_step), newQty);
      return {
        ...prev,
        [productId]: {
          ...existing,
          quantity: newQty,
          lineTotal,
        },
      };
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => {
      const copy = { ...prev };
      delete copy[productId];
      return copy;
    });
  };

  const handleClearCart = () => {
    setCart({});
  };

  const cartItemsList = Object.values(cart);
  const cartTotalItemsCount = cartItemsList.length;
  const cartSubtotal = cartItemsList.reduce((sum, item) => sum + item.lineTotal, 0);

  // Initiate UPI Checkout for Special Order
  const handleProceedToPay = async () => {
    if (!user) {
      navigate('/login?redirect=/special-orders');
      return;
    }
    if (cartItemsList.length === 0) {
      setError('Please add at least one special order delicacy to your order');
      return;
    }
    if (!selectedAddressId) {
      setError('Please select or add a delivery address in Nagpur');
      return;
    }
    if (!requiredDate) {
      setError('Please select a required delivery date');
      return;
    }

    setError(null);
    setInitiatingPayment(true);

    try {
      const itemsPayload = cartItemsList.map((item) => ({
        id: item.product.id,
        name: item.product.name,
        price: Number(item.product.price),
        quantity: item.quantity,
        unit: item.product.unit,
      }));

      const intent = await createPaymentIntent(user.id, {
        addressId: selectedAddressId,
        orderType: 'special_order',
        deliveryTime: preferredTime as any,
        requiredDate,
        preferredTime,
        specialInstructions,
        items: itemsPayload,
      });

      setPaymentIntent(intent);
      setPaymentModalOpen(true);
      setIsMobileCartOpen(false);
    } catch (err: any) {
      setError(err.message || 'Payment initiation error');
    } finally {
      setInitiatingPayment(false);
    }
  };

  // Submit UTR verification
  const handleSubmitUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentIntent || !user) return;

    const trimmedUtr = utrInput.trim();
    if (!trimmedUtr || trimmedUtr.length < 6) {
      setError('Please enter a valid 12-digit UTR / Transaction ID (at least 6 characters)');
      return;
    }

    setError(null);
    setSubmittingUtr(true);

    try {
      const itemsPayload = cartItemsList.map((item) => ({
        id: item.product.id,
        name: item.product.name,
        price: Number(item.product.price),
        quantity: item.quantity,
        unit: item.product.unit,
      }));

      await submitPaymentUtr(user.id, {
        paymentId: paymentIntent.payment_id,
        utr: trimmedUtr,
        addressId: selectedAddressId,
        deliveryTime: preferredTime as any,
        requiredDate,
        preferredTime,
        specialInstructions,
        items: itemsPayload,
      });

      setCart({});
      navigate('/orders?success=special_order_placed');
    } catch (err: any) {
      setError(err.message || 'Failed to submit UTR verification');
    } finally {
      setSubmittingUtr(false);
    }
  };

  const handleCopyUpi = () => {
    if (!paymentIntent?.upi_id) return;
    navigator.clipboard.writeText(paymentIntent.upi_id);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingAddress(true);
    try {
      const { data, error: err } = await supabase
        .from('addresses')
        .insert({
          user_id: user.id,
          name: newAddress.name || profile?.full_name || 'Customer',
          phone: newAddress.phone || profile?.phone || '',
          address_line: newAddress.address_line,
          area: newAddress.area,
          city: newAddress.city,
          state: newAddress.state,
          pincode: newAddress.pincode,
          landmark: newAddress.landmark || null,
          is_default: addresses.length === 0,
        })
        .select()
        .single();
      if (err) throw err;
      if (data) {
        setAddresses([data as Address, ...addresses]);
        setSelectedAddressId(data.id);
        setIsAddAddressOpen(false);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingAddress(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F3EC] flex flex-col selection:bg-primary/20 w-full max-w-full overflow-x-hidden">
      <SEOHead
        title="Special Homemade Food Orders & Nagpur Delicacies"
        description="Order extra rotis, authentic Vidarbha curries, fresh paneer sabji, and traditional sweets made-to-order from Nimje Gharchi Rasoi in Nagpur."
        canonicalPath="/special-orders"
      />
      <Navbar />

      {/* Hero Section */}
      <section className="pt-28 pb-10 sm:pt-36 sm:pb-14 px-4 sm:px-6 lg:px-8 border-b border-[#E5E0D6] bg-gradient-to-b from-[#FAF8F5] to-[#F6F3EC]">
        <div className="max-w-6xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-800/10 border border-emerald-800/20 text-emerald-900 text-xs font-bold uppercase tracking-wider shadow-xs">
            <ChefHat size={14} className="text-emerald-800" />
            <span>Homestyle Catering & Custom Portions</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-[#22201E] tracking-tight">
            Special Homemade Orders
          </h1>

          <p className="text-base sm:text-lg text-gray-700 max-w-2xl mx-auto font-medium">
            Need more than your regular daily tiffin? Order rotis, authentic Saoji curries, paneer sabjis, rice, and traditional sweets separately in the exact quantity you need.
          </p>

          {/* Quick Category Stats */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/80 border border-[#E5E0D6] text-xs font-semibold text-gray-700 shadow-xs">
              <Flame size={13} className="text-amber-600" /> Fresh Made-to-Order
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/80 border border-[#E5E0D6] text-xs font-semibold text-gray-700 shadow-xs">
              <Package size={13} className="text-emerald-700" /> Custom Units (kg / pcs / plates)
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/80 border border-[#E5E0D6] text-xs font-semibold text-gray-700 shadow-xs">
              <MapPin size={13} className="text-primary" /> Delivery across Nagpur
            </span>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-grow py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2">
                <AlertCircle size={18} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-xs font-bold hover:underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Filters & Search Bar */}
          <div className="space-y-4 mb-8">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
                {SPECIAL_ORDER_CATEGORIES.map((cat) => {
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveCategory(cat.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        isActive
                          ? 'bg-primary text-white shadow-sm shadow-primary/20 scale-102'
                          : 'bg-white text-gray-700 border border-[#E5E0D6] hover:bg-gray-50'
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <Input
                  type="text"
                  placeholder="Search rotis, chicken, paneer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 text-xs rounded-xl bg-white border-[#E5E0D6]"
                />
              </div>
            </div>
          </div>

          {/* Layout Grid: Products (left) + Order Summary Cart (right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Products Column */}
            <div className="lg:col-span-8 space-y-6">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="h-72 rounded-3xl bg-white border border-[#E5E0D6] p-4 animate-pulse space-y-4"
                    >
                      <div className="h-36 bg-gray-100 rounded-2xl" />
                      <div className="h-4 bg-gray-100 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <Card className="rounded-3xl border border-[#E5E0D6] p-12 text-center bg-white">
                  <UtensilsCrossed size={40} className="text-gray-400 mx-auto mb-3" />
                  <h3 className="font-bold text-lg text-foreground">No special items found</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Try searching for something else or switch category filters.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setActiveCategory('all');
                      setSearchQuery('');
                    }}
                    className="mt-4 rounded-xl text-xs"
                  >
                    Clear Filters
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {filteredProducts.map((product) => {
                    const cartItem = cart[product.id];
                    const inCart = !!cartItem;
                    const priceLabel = formatPriceUnit(
                      Number(product.price),
                      Number(product.pricing_unit_step),
                      product.unit
                    );

                    return (
                      <Card
                        key={product.id}
                        className={`rounded-3xl border bg-white overflow-hidden transition-all duration-200 flex flex-col justify-between ${
                          inCart
                            ? 'border-primary shadow-md ring-1 ring-primary/20'
                            : 'border-[#E5E0D6] hover:border-gray-300 hover:shadow-xs'
                        } ${!product.is_available ? 'opacity-70 grayscale-30' : ''}`}
                      >
                        <div>
                          {/* Image Banner */}
                          <div className="relative h-44 w-full bg-[#EDE8DE] overflow-hidden">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                                onError={(e) => {
                                  (e.currentTarget as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : null}

                            {/* Fallback pattern if image is missing */}
                            <div className="absolute inset-0 flex items-center justify-center -z-1 text-gray-400 font-medium text-xs">
                              <UtensilsCrossed size={32} className="opacity-40" />
                            </div>

                            {/* Category Badge */}
                            <div className="absolute top-3 left-3">
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/90 backdrop-blur-md text-emerald-800 shadow-xs border border-white/50">
                                {product.category.replace('_', ' ')}
                              </span>
                            </div>

                            {/* Advance Notice Badge */}
                            {product.advance_notice_hours > 0 && (
                              <div className="absolute top-3 right-3">
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-900/80 text-amber-100 backdrop-blur-md flex items-center gap-1 shadow-xs">
                                  <Clock size={10} /> {product.advance_notice_hours}h notice
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="p-5 space-y-2">
                            <div className="flex justify-between items-start gap-2">
                              <h3 className="font-extrabold text-base text-foreground leading-snug">
                                {product.name}
                              </h3>
                            </div>

                            <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                              {product.description || 'Authentic homestyle preparation with pure spices and ingredients in Nagpur.'}
                            </p>

                            {/* Price and Unit */}
                            <div className="pt-2 flex items-baseline justify-between">
                              <div>
                                <span className="text-xl font-black text-primary tracking-tight">
                                  ₹{product.price}
                                </span>
                                <span className="text-xs font-semibold text-gray-500 ml-1">
                                  / {product.pricing_unit_step > 1 ? `${product.pricing_unit_step} ` : ''}{product.unit}
                                </span>
                              </div>

                              <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                                Min: {product.min_quantity} {product.unit} (Step: {product.quantity_step})
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Card Footer Controls */}
                        <div className="p-5 pt-0">
                          <div className="pt-3 border-t border-gray-100">
                            {!product.is_available ? (
                              <div className="text-center py-2 px-3 rounded-xl bg-gray-100 text-gray-400 text-xs font-bold">
                                Currently Unavailable
                              </div>
                            ) : inCart ? (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-2xl p-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleAdjustQuantity(product.id, -1)}
                                    className="w-8 h-8 rounded-xl bg-white border border-gray-200 text-foreground flex items-center justify-center text-xs font-bold hover:bg-gray-100 shadow-2xs transition-colors cursor-pointer"
                                  >
                                    <Minus size={14} />
                                  </button>

                                  <div className="text-center">
                                    <span className="text-sm font-black text-primary">
                                      {cartItem.quantity} {product.unit}
                                    </span>
                                    <span className="text-[10px] text-gray-500 block font-bold">
                                      Total: ₹{cartItem.lineTotal}
                                    </span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleAdjustQuantity(product.id, 1)}
                                    className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center text-xs font-bold hover:bg-primary/90 shadow-2xs transition-colors cursor-pointer"
                                  >
                                    <Plus size={14} />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex gap-2 items-center">
                                <Button
                                  type="button"
                                  onClick={() => handleAddToCart(product)}
                                  className="w-full rounded-2xl h-10 font-bold text-xs shadow-xs"
                                >
                                  <Plus size={14} className="mr-1" /> Add {product.min_quantity} {product.unit}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sticky Special Order Cart Panel */}
            <div className="lg:col-span-4 sticky top-28 space-y-4">
              <Card className="rounded-3xl border border-[#E5E0D6] p-6 bg-white shadow-sm space-y-5">
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                      <ShoppingBag size={16} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-foreground">Special Order Basket</h3>
                      <p className="text-[11px] text-gray-500">{cartTotalItemsCount} dishes selected</p>
                    </div>
                  </div>

                  {cartTotalItemsCount > 0 && (
                    <button
                      type="button"
                      onClick={handleClearCart}
                      className="text-[11px] font-bold text-gray-400 hover:text-destructive transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Items List */}
                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {cartTotalItemsCount === 0 ? (
                    <div className="py-8 text-center text-xs text-gray-400 space-y-2">
                      <UtensilsCrossed size={28} className="mx-auto text-gray-300" />
                      <p className="font-medium">Your special order basket is empty.</p>
                      <p className="text-[11px] text-gray-400">
                        Add rotis, gravies or sweets from the left to start.
                      </p>
                    </div>
                  ) : (
                    cartItemsList.map(({ product, quantity, lineTotal }) => (
                      <div
                        key={product.id}
                        className="p-3 rounded-2xl bg-gray-50/80 border border-gray-100 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-foreground truncate">{product.name}</h4>
                          <p className="text-[11px] text-gray-500">
                            {quantity} {product.unit} @ ₹{product.price}/{product.pricing_unit_step > 1 ? `${product.pricing_unit_step} ` : ''}{product.unit}
                          </p>
                          <p className="text-xs font-black text-primary mt-0.5">₹{lineTotal}</p>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => handleAdjustQuantity(product.id, -1)}
                            className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-xs font-bold hover:bg-gray-100 cursor-pointer"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="font-black text-xs w-6 text-center">{quantity}</span>
                          <button
                            type="button"
                            onClick={() => handleAdjustQuantity(product.id, 1)}
                            className="w-6 h-6 rounded-lg bg-primary text-white flex items-center justify-center text-xs font-bold hover:bg-primary/90 cursor-pointer"
                          >
                            <Plus size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveFromCart(product.id)}
                            className="w-6 h-6 rounded-lg text-gray-400 hover:text-destructive flex items-center justify-center ml-1 cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Delivery Date & Time Details */}
                <div className="space-y-3 pt-3 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-gray-700 block mb-1 flex items-center gap-1">
                        <Calendar size={12} className="text-primary" /> Required Date
                      </label>
                      <Input
                        type="date"
                        min={minRequiredDateString}
                        value={requiredDate}
                        onChange={(e) => setRequiredDate(e.target.value)}
                        className="h-9 text-xs rounded-xl"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-gray-700 block mb-1 flex items-center gap-1">
                        <Clock size={12} className="text-primary" /> Preferred Slot
                      </label>
                      <select
                        value={preferredTime}
                        onChange={(e) => setPreferredTime(e.target.value)}
                        className="w-full h-9 text-xs rounded-xl border border-gray-200 bg-white px-2 font-medium text-foreground"
                      >
                        <option value="lunch">Lunch (11:30 AM – 1:30 PM)</option>
                        <option value="dinner">Dinner (7:30 PM – 9:30 PM)</option>
                        <option value="morning">Morning Preparation</option>
                        <option value="evening">Evening Preparation</option>
                      </select>
                    </div>
                  </div>

                  {/* Delivery Address */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] font-bold text-gray-700 flex items-center gap-1">
                        <MapPin size={12} className="text-primary" /> Delivery Address
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsAddAddressOpen(true)}
                        className="text-[11px] text-primary font-bold hover:underline cursor-pointer"
                      >
                        + Add New
                      </button>
                    </div>

                    {addresses.length === 0 ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsAddAddressOpen(true)}
                        className="w-full text-xs rounded-xl h-8"
                      >
                        Add Delivery Address First
                      </Button>
                    ) : (
                      <select
                        value={selectedAddressId}
                        onChange={(e) => setSelectedAddressId(e.target.value)}
                        className="w-full text-xs rounded-xl border border-gray-200 bg-white p-2 text-foreground font-medium"
                      >
                        {addresses.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name} - {a.address_line}, {a.area} ({a.pincode})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Cooking Notes */}
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      Special Cooking Notes (Optional)
                    </label>
                    <Input
                      placeholder="e.g. Less oil, extra soft rotis, spicy tarri..."
                      maxLength={150}
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      className="h-8 text-xs rounded-xl"
                    />
                  </div>
                </div>

                {/* Subtotal & Checkout */}
                <div className="pt-3 border-t border-gray-100 space-y-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Order Subtotal
                    </span>
                    <span className="text-2xl font-black text-primary">₹{cartSubtotal}</span>
                  </div>

                  <Button
                    onClick={handleProceedToPay}
                    disabled={cartTotalItemsCount === 0 || initiatingPayment}
                    loading={initiatingPayment}
                    className="w-full rounded-2xl h-12 font-bold text-sm shadow-md shadow-primary/20"
                  >
                    Proceed to UPI Payment (₹{cartSubtotal})
                  </Button>

                  <p className="text-[10px] text-gray-400 text-center">
                    Secure direct UPI QR payment • Verified by Nimje Gharchi Rasoi admin
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Mobile Cart Trigger Bar */}
      {cartTotalItemsCount > 0 && (
        <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40">
          <div className="bg-primary text-white p-4 rounded-2xl shadow-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-100 font-medium">
                {cartTotalItemsCount} items in basket
              </p>
              <p className="text-lg font-black">₹{cartSubtotal}</p>
            </div>
            <Button
              onClick={handleProceedToPay}
              size="sm"
              className="bg-white text-primary hover:bg-gray-100 font-black rounded-xl h-10 px-4"
            >
              Checkout Now <ArrowRight size={14} className="ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Payment Modal with UPI QR & UTR */}
      <Modal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title="Complete Your UPI Payment"
      >
        {paymentIntent && (
          <div className="space-y-6 pt-2">
            <div className="text-center bg-primary/5 p-4 rounded-2xl border border-primary/10">
              <p className="text-xs text-gray-500 font-medium">Special Order Total Amount</p>
              <p className="text-3xl font-black text-primary mt-0.5">₹{paymentIntent.amount}</p>
              <p className="text-[11px] text-gray-400 mt-1">Ref: {paymentIntent.payment_reference}</p>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center">
              <div className="p-3 bg-white border-2 border-gray-200 rounded-3xl shadow-md">
                <img
                  src={paymentIntent.qr_code_url}
                  alt="UPI QR Code"
                  className="w-52 h-52 object-contain"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2 font-medium text-center">
                Scan with GPay, PhonePe, Paytm, BHIM, Cred, or any UPI App
              </p>
            </div>

            {/* UPI ID Copy */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold">UPI ID (VPA)</p>
                <p className="text-sm font-mono font-bold text-foreground">{paymentIntent.upi_id}</p>
              </div>
              <Button size="sm" variant="outline" onClick={handleCopyUpi} className="rounded-xl text-xs">
                {copiedUpi ? <CheckCheck size={14} className="text-primary" /> : <Copy size={14} />}
                <span className="ml-1">{copiedUpi ? 'Copied' : 'Copy'}</span>
              </Button>
            </div>

            {/* UTR Form */}
            <form onSubmit={handleSubmitUtr} className="space-y-3 pt-2 border-t border-gray-100">
              <label className="block text-xs font-bold text-foreground">
                Enter 12-Digit UTR / Transaction ID after payment:
              </label>
              <Input
                placeholder="e.g. 423589123456"
                value={utrInput}
                onChange={(e) => setUtrInput(e.target.value)}
                required
                className="h-11 font-mono tracking-wide font-bold"
              />
              <Button
                type="submit"
                disabled={submittingUtr || !utrInput.trim()}
                loading={submittingUtr}
                className="w-full h-11 rounded-2xl font-bold"
              >
                I Have Paid — Submit Verification
              </Button>
            </form>
          </div>
        )}
      </Modal>

      {/* Add Address Modal */}
      <Modal
        isOpen={isAddAddressOpen}
        onClose={() => setIsAddAddressOpen(false)}
        title="Add Delivery Address in Nagpur"
      >
        <form onSubmit={handleSaveAddress} className="space-y-4 pt-2">
          <Input
            placeholder="Recipient Full Name"
            value={newAddress.name}
            onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
            required
          />
          <Input
            placeholder="10-Digit Mobile Number"
            value={newAddress.phone}
            onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
            required
          />
          <Input
            placeholder="Flat, House No., Building Name"
            value={newAddress.address_line}
            onChange={(e) => setNewAddress({ ...newAddress, address_line: e.target.value })}
            required
          />
          <Input
            placeholder="Area / Colony (e.g. Nandanvan, Venkatesh Nagar, Hiwari Nagar, Hasanbag)"
            value={newAddress.area}
            onChange={(e) => setNewAddress({ ...newAddress, area: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="City"
              value={newAddress.city}
              onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
              required
            />
            <Input
              placeholder="Pincode (e.g. 440024)"
              value={newAddress.pincode}
              onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
              required
            />
          </div>
          <Input
            placeholder="Landmark (Optional)"
            value={newAddress.landmark}
            onChange={(e) => setNewAddress({ ...newAddress, landmark: e.target.value })}
          />
          <Button type="submit" loading={savingAddress} className="w-full rounded-2xl h-11 font-bold">
            Save Delivery Address
          </Button>
        </form>
      </Modal>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
