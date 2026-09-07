import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Check,
  ChevronRight,
  ChevronLeft,
  MapPin,
  Plus,
  ShieldCheck,
  Clock,
  AlertCircle,
  ShoppingBag,
  Utensils,
  QrCode,
  Copy,
  CheckCheck,
  ExternalLink,
  Info,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { Plan, Addon, Address } from '@/types/database';
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

export default function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [step, setStep] = useState(1);
  const totalSteps = 4;

  // Data states
  const [plans, setPlans] = useState<Plan[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selection states
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [deliveryTime, setDeliveryTime] = useState<'morning' | 'evening' | 'both'>('morning');
  const [selectedAddons, setSelectedAddons] = useState<{ [id: string]: number }>({});
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Payment Intent & UPI state
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntentResult | null>(null);
  const [initiatingPayment, setInitiatingPayment] = useState(false);
  const [utrInput, setUtrInput] = useState('');
  const [submittingUtr, setSubmittingUtr] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState<{
    reference: string;
    message: string;
  } | null>(null);

  // New Address Modal state
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

  // Fetch initial plans, addons, and user addresses
  useEffect(() => {
    async function initData() {
      try {
        const [plansRes, addonsRes] = await Promise.all([
          supabase.from('plans').select('*').eq('is_active', true).order('price', { ascending: true }),
          supabase.from('addons').select('*').eq('is_available', true).order('price', { ascending: true }),
        ]);

        const loadedPlans = ((plansRes.data as Plan[]) || []).sort((a, b) => {
          if (a.display_order !== undefined && b.display_order !== undefined) {
            return (a.display_order ?? 99) - (b.display_order ?? 99);
          }
          return (a.discounted_price || a.price) - (b.discounted_price || b.price);
        });
        setPlans(loadedPlans);
        setAddons((addonsRes.data as Addon[]) || []);

        const initialPlanId = searchParams.get('planId');
        if (initialPlanId && loadedPlans.some((p) => p.id === initialPlanId)) {
          setSelectedPlanId(initialPlanId);
        } else if (loadedPlans.length > 0) {
          setSelectedPlanId(loadedPlans[0].id);
        }

        if (user) {
          const { data: userAddrs } = await supabase
            .from('addresses')
            .select('*')
            .eq('user_id', user.id)
            .order('is_default', { ascending: false });

          const addrList = (userAddrs as Address[]) || [];
          setAddresses(addrList);
          if (addrList.length > 0) {
            setSelectedAddressId(addrList[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching checkout data:', err);
      } finally {
        setLoading(false);
      }
    }

    initData();
  }, [user, searchParams]);

  // Selected Plan Object
  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || plans[0];

  // Calculate estimated totals
  const planPrice = selectedPlan
    ? selectedPlan.discounted_price
      ? Number(selectedPlan.discounted_price)
      : Number(selectedPlan.price)
    : 0;

  const addonTotal = Object.entries(selectedAddons).reduce((sum, [addonId, qty]) => {
    const item = addons.find((a) => a.id === addonId);
    return sum + (item ? Number(item.price) * qty : 0);
  }, 0);

  const grandTotal = planPrice + addonTotal;

  // Add Address Handler
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate(`/login?redirect=/checkout`);
      return;
    }

    setSavingAddress(true);
    try {
      const { data, error: addrError } = await supabase
        .from('addresses')
        .insert({
          user_id: user.id,
          name: newAddress.name || profile?.full_name || 'Customer',
          phone: newAddress.phone || profile?.phone || '',
          address_line: newAddress.address_line,
          area: newAddress.area,
          city: newAddress.city || 'Nagpur',
          state: newAddress.state || 'Maharashtra',
          pincode: newAddress.pincode,
          landmark: newAddress.landmark || null,
          is_default: addresses.length === 0,
        })
        .select()
        .single();

      if (addrError) throw addrError;

      if (data) {
        setAddresses([data as Address, ...addresses]);
        setSelectedAddressId(data.id);
        setIsAddAddressOpen(false);
        setNewAddress({
          name: '',
          phone: '',
          address_line: '',
          area: '',
          city: 'Nagpur',
          state: 'Maharashtra',
          pincode: '',
          landmark: '',
        });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save address');
    } finally {
      setSavingAddress(false);
    }
  };

  // Move from Step 3 to Step 4: Create UPI Payment Intent (Server-calculated)
  const handleProceedToPayment = async () => {
    if (!user) {
      navigate(`/login?redirect=/checkout`);
      return;
    }
    if (!selectedAddressId) {
      setError('Please select or add a delivery address');
      setStep(2);
      return;
    }

    setError(null);
    setInitiatingPayment(true);

    try {
      const itemsPayload = Object.entries(selectedAddons)
        .filter(([_, qty]) => qty > 0)
        .map(([id, qty]) => {
          const item = addons.find((a) => a.id === id);
          return {
            id,
            name: item?.name || 'Add-on Item',
            price: item ? Number(item.price) : 0,
            quantity: qty,
          };
        });

      const intent = await createPaymentIntent(user.id, {
        planId: selectedPlanId,
        addressId: selectedAddressId,
        deliveryTime: deliveryTime,
        orderType: 'subscription',
        specialInstructions: specialInstructions,
        items: itemsPayload,
      });

      setPaymentIntent(intent);
      setStep(4);
    } catch (err: any) {
      setError(err.message || 'Payment initiation error');
    } finally {
      setInitiatingPayment(false);
    }
  };

  // Step 4: Submit UTR / Transaction ID
  const handleSubmitUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentIntent || !user) return;

    const trimmedUtr = utrInput.trim();
    if (!trimmedUtr || trimmedUtr.length < 6) {
      setError('Please enter a valid UTR / Transaction ID (at least 6 characters)');
      return;
    }

    setError(null);
    setSubmittingUtr(true);

    try {
      const itemsPayload = Object.entries(selectedAddons)
        .filter(([_, qty]) => qty > 0)
        .map(([id, qty]) => {
          const item = addons.find((a) => a.id === id);
          return {
            id,
            name: item?.name || 'Add-on Item',
            price: item ? Number(item.price) : 0,
            quantity: qty,
          };
        });

      const result = await submitPaymentUtr(user.id, {
        paymentId: paymentIntent.payment_id,
        utr: trimmedUtr,
        planId: selectedPlanId,
        addressId: selectedAddressId,
        deliveryTime: deliveryTime,
        specialInstructions: specialInstructions,
        items: itemsPayload,
      });

      setPaymentSuccessData({
        reference: result.payment_reference,
        message: result.message,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to submit UTR');
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

  // Step validation
  const handleNextStep = () => {
    setError(null);
    if (step === 1 && !selectedPlanId) {
      setError('Please select a meal subscription plan');
      return;
    }
    if (step === 2) {
      if (!user) {
        navigate(`/login?redirect=/checkout`);
        return;
      }
      if (!selectedAddressId) {
        setError('Please select or add a delivery address');
        return;
      }
    }
    if (step === 3) {
      handleProceedToPayment();
      return;
    }
    setStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const stepsLabels = ['Choose Plan', 'Delivery Address', 'Customize & Time', 'UPI Payment'];

  return (
    <div className="min-h-screen bg-[#FCFBF8] flex flex-col w-full max-w-full overflow-x-hidden">
      <SEOHead
        title="Checkout & Tiffin Subscription | Nimje Gharchi Rasoi"
        description="Complete your homemade tiffin subscription order securely."
        noIndex={true}
      />
      <Navbar />

      <main className="flex-grow pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
              Start Your Tiffin Subscription
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              Fresh homestyle cooking delivered right to your doorstep in Nagpur.
            </p>
          </div>

          {/* Stepper */}
          <div className="mb-10">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 -z-10 rounded-full" />
              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary -z-10 rounded-full transition-all duration-300"
                style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
              />

              {stepsLabels.map((label, idx) => (
                <div key={label} className="flex flex-col items-center gap-2">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                      step > idx + 1
                        ? 'bg-primary text-white'
                        : step === idx + 1
                        ? 'bg-primary text-white ring-4 ring-primary/20'
                        : 'bg-white border-2 border-gray-300 text-gray-400'
                    }`}
                  >
                    {step > idx + 1 ? <Check size={18} /> : idx + 1}
                  </div>
                  <span
                    className={`text-xs font-semibold hidden sm:block ${
                      step >= idx + 1 ? 'text-primary font-bold' : 'text-gray-400'
                    }`}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-3">
              <AlertCircle size={18} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Main Form Card */}
          <Card className="rounded-3xl border border-gray-200 bg-white overflow-hidden shadow-xs">
            <div className="p-6 sm:p-8">
              {/* STEP 1: Plan Selection */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">Select Subscription Plan</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Choose from our popular monthly, weekly, or daily meal plans.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {plans.map((plan) => {
                      const isSelected = selectedPlanId === plan.id;
                      const price = plan.discounted_price ? Number(plan.discounted_price) : Number(plan.price);
                      return (
                        <div
                          key={plan.id}
                          onClick={() => setSelectedPlanId(plan.id)}
                          className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/5 shadow-md shadow-primary/10 ring-2 ring-primary/20'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                              {plan.plan_type} • {plan.duration_days} Days
                            </span>
                            {isSelected && <Check size={18} className="text-primary" />}
                          </div>

                          <h3 className="font-black text-lg text-foreground">{plan.name}</h3>
                          {plan.included_meals ? (
                            <p className="text-xs text-primary font-bold mt-1 line-clamp-1">
                              {plan.included_meals}
                            </p>
                          ) : (
                            plan.description && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {plan.description}
                              </p>
                            )
                          )}

                          <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-baseline">
                            <div>
                              <span className="text-2xl font-black text-foreground">₹{price}</span>
                              {plan.discounted_price && (
                                <span className="text-xs text-gray-400 line-through ml-2">
                                  ₹{plan.price}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-gray-400 font-medium">
                              (₹{Math.round(price / plan.duration_days)}/day)
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 2: Address Selection */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">Delivery Address</h2>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Where should we deliver your daily hot meal in Nagpur?
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setIsAddAddressOpen(true)}
                      className="rounded-xl text-xs"
                    >
                      <Plus size={14} className="mr-1" /> Add Address
                    </Button>
                  </div>

                  {addresses.length === 0 ? (
                    <div className="p-8 border-2 border-dashed border-gray-200 rounded-2xl text-center space-y-3">
                      <MapPin size={32} className="text-gray-400 mx-auto" />
                      <p className="text-sm font-semibold text-foreground">No address saved yet</p>
                      <p className="text-xs text-gray-400 max-w-sm mx-auto">
                        Please add your Nagpur delivery address to ensure prompt tiffin delivery.
                      </p>
                      <Button
                        size="sm"
                        onClick={() => setIsAddAddressOpen(true)}
                        className="rounded-xl"
                      >
                        Add Delivery Address
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {addresses.map((addr) => {
                        const isSelected = selectedAddressId === addr.id;
                        return (
                          <div
                            key={addr.id}
                            onClick={() => setSelectedAddressId(addr.id)}
                            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                              isSelected
                                ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                                : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-bold text-sm text-foreground">{addr.name}</span>
                              {isSelected && <Check size={16} className="text-primary" />}
                            </div>
                            <p className="text-xs text-gray-600 font-medium">{addr.phone}</p>
                            <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                              {addr.address_line}, {addr.area}, {addr.city} - {addr.pincode}
                            </p>
                            {addr.landmark && (
                              <p className="text-[11px] text-gray-400 mt-1 italic">
                                Near: {addr.landmark}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: Customize & Addons */}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">Customize & Delivery Time</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Select delivery schedule and add extra dishes or rotis.
                    </p>
                  </div>

                  {/* Meal Delivery Timing */}
                  <div>
                    <label className="text-xs font-bold text-foreground block mb-2">
                      Preferred Meal Delivery Time
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { id: 'morning', label: 'Lunch (11:30 AM – 2:00 PM)' },
                        { id: 'evening', label: 'Dinner (7:30 PM – 10:00 PM)' },
                        { id: 'both', label: 'Both Lunch & Dinner' },
                      ].map((t) => (
                        <div
                          key={t.id}
                          onClick={() => setDeliveryTime(t.id as any)}
                          className={`p-3.5 rounded-xl border-2 cursor-pointer text-center transition-all ${
                            deliveryTime === t.id
                              ? 'border-primary bg-primary/5 font-bold text-primary'
                              : 'border-gray-200 text-gray-600 bg-white hover:border-gray-300'
                          }`}
                        >
                          <span className="text-xs">{t.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Addons Selection */}
                  {addons.length > 0 && (
                    <div>
                      <label className="text-xs font-bold text-foreground block mb-2">
                        Add-ons / Special Extras (Optional)
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
                        {addons.map((item) => {
                          const qty = selectedAddons[item.id] || 0;
                          return (
                            <div
                              key={item.id}
                              className="p-3 rounded-xl border border-gray-200 flex justify-between items-center bg-gray-50/70"
                            >
                              <div>
                                <p className="font-semibold text-xs text-foreground">{item.name}</p>
                                <p className="text-[11px] text-primary font-bold">₹{item.price}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {qty > 0 && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setSelectedAddons((prev) => ({
                                          ...prev,
                                          [item.id]: Math.max(0, qty - 1),
                                        }))
                                      }
                                      className="w-7 h-7 rounded-lg bg-gray-200 flex items-center justify-center font-bold text-xs cursor-pointer"
                                    >
                                      -
                                    </button>
                                    <span className="text-xs font-bold w-4 text-center">{qty}</span>
                                  </>
                                )}
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedAddons((prev) => ({
                                      ...prev,
                                      [item.id]: qty + 1,
                                    }))
                                  }
                                  className="w-7 h-7 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-xs cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Special Instructions */}
                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1">
                      Cooking / Delivery Instructions
                    </label>
                    <Input
                      placeholder="e.g. Please use less spice, ring bell twice..."
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                    />
                  </div>

                  {/* Total Summary */}
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2 text-xs">
                    <div className="flex justify-between text-gray-600">
                      <span>{selectedPlan?.name || 'Selected Plan'}</span>
                      <span className="font-bold">₹{planPrice}</span>
                    </div>
                    {addonTotal > 0 && (
                      <div className="flex justify-between text-gray-600">
                        <span>Selected Add-ons</span>
                        <span className="font-bold">₹{addonTotal}</span>
                      </div>
                    )}
                    <div className="border-t border-gray-200 pt-2 flex justify-between text-sm font-black text-foreground">
                      <span>Grand Total Amount</span>
                      <span className="text-primary text-base">₹{grandTotal}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: UPI Payment & UTR Verification */}
              {step === 4 && paymentIntent && !paymentSuccessData && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">Complete UPI Payment</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Scan the QR code and submit your 12-digit UTR / Transaction ID.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    {/* Left: QR Code */}
                    <div className="flex flex-col items-center p-6 bg-gray-50 rounded-3xl border border-gray-200">
                      <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-200 mb-4">
                        <img
                          src={paymentIntent.qr_code_url}
                          alt="UPI QR Code"
                          className="w-48 h-48 object-contain"
                        />
                      </div>
                      <p className="text-xs font-bold text-foreground text-center">
                        Amount to Pay: <span className="text-primary font-black text-base">₹{paymentIntent.amount}</span>
                      </p>
                      <p className="text-[11px] text-gray-400 text-center mt-1">
                        Scan with Google Pay, PhonePe, Paytm, BHIM, or any UPI App
                      </p>
                    </div>

                    {/* Right: Payment details & UTR input */}
                    <div className="space-y-4">
                      {/* VPA Details */}
                      <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex justify-between items-center">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-gray-400">Payee UPI ID</p>
                          <p className="text-sm font-mono font-bold text-foreground">{paymentIntent.upi_id}</p>
                          <p className="text-xs text-gray-500">{paymentIntent.payee_name}</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={handleCopyUpi} className="rounded-xl text-xs">
                          {copiedUpi ? <CheckCheck size={14} className="text-primary" /> : <Copy size={14} />}
                          <span className="ml-1">{copiedUpi ? 'Copied' : 'Copy'}</span>
                        </Button>
                      </div>

                      {/* UTR Form */}
                      <form onSubmit={handleSubmitUtr} className="space-y-4">
                        <div>
                          <label className="text-xs font-bold text-foreground block mb-1">
                            Enter 12-Digit UTR / Transaction ID:
                          </label>
                          <Input
                            placeholder="e.g. 423589123456"
                            value={utrInput}
                            onChange={(e) => setUtrInput(e.target.value)}
                            required
                            className="h-11 font-mono text-sm tracking-wide font-bold"
                          />
                          <p className="text-[11px] text-gray-500 mt-1">
                            Find this 12-digit number in your UPI app payment receipt.
                          </p>
                        </div>

                        <Button
                          type="submit"
                          loading={submittingUtr}
                          disabled={!utrInput.trim()}
                          className="w-full h-12 text-sm font-bold rounded-2xl shadow-lg shadow-primary/20"
                        >
                          I Have Paid — Submit Verification
                        </Button>
                      </form>
                    </div>
                  </div>
                </div>
              )}

              {/* SUCCESS VIEW */}
              {paymentSuccessData && (
                <div className="text-center py-10 space-y-6">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 size={36} />
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-foreground">
                      Payment Submitted Successfully!
                    </h2>
                    <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
                      {paymentSuccessData.message}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 max-w-sm mx-auto text-xs space-y-1">
                    <p className="text-gray-400">Payment Reference</p>
                    <p className="font-mono font-bold text-sm text-foreground">
                      {paymentSuccessData.reference}
                    </p>
                    <Badge variant="outline" className="mt-2 bg-amber-50 text-amber-800 border-amber-200">
                      Pending Admin Verification
                    </Badge>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                    <Button asChild className="rounded-xl">
                      <Link to="/dashboard">Go to Customer Dashboard</Link>
                    </Button>
                    <Button asChild variant="outline" className="rounded-xl">
                      <Link to="/orders">View My Orders</Link>
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Stepper Actions */}
            {!paymentSuccessData && (
              <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                {step > 1 ? (
                  <Button
                    variant="outline"
                    onClick={() => setStep((prev) => Math.max(1, prev - 1))}
                    disabled={initiatingPayment || submittingUtr}
                    className="rounded-xl text-xs"
                  >
                    <ChevronLeft size={14} className="mr-1" /> Back
                  </Button>
                ) : (
                  <div />
                )}

                {step < 4 ? (
                  <Button
                    onClick={handleNextStep}
                    loading={initiatingPayment}
                    className="rounded-xl text-xs font-bold"
                  >
                    {step === 3 ? 'Proceed to Payment' : 'Next Step'}
                    <ChevronRight size={14} className="ml-1" />
                  </Button>
                ) : null}
              </div>
            )}
          </Card>
        </div>
      </main>

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
