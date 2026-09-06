import { supabase } from '@/lib/supabase/client';
import {
  getBusinessUPIConfig,
  buildUPIPaymentUrl,
  generateUPIQRCode,
  generatePaymentReference,
} from '@/lib/upi';
import { Plan, Addon, Address } from '@/types/database';
import { triggerAdminNewOrderNotification } from '@/services/notificationService';
import { enforceRateLimit } from '@/lib/rateLimit';

/**
 * Returns YYYY-MM-DD string in Asia/Kolkata timezone (IST)
 * Prevents UTC date shift between 00:00 and 05:30 IST
 */
export function getIstDateString(d: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

/**
 * Accurately adds days to an IST YYYY-MM-DD date string
 */
export function addDaysToIstDate(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().split('T')[0];
}

export interface OrderItemParam {
  id: string;
  name?: string;
  price?: number;
  quantity: number;
  unit?: string;
}

export interface CreateIntentParams {
  planId?: string;
  addressId: string;
  deliveryTime?: 'morning' | 'evening' | 'both';
  orderType: 'subscription' | 'special_order';
  specialInstructions?: string;
  requiredDate?: string;
  preferredTime?: string;
  items?: OrderItemParam[];
}

export interface PaymentIntentResult {
  success: boolean;
  payment_id: string;
  payment_reference: string;
  amount: number;
  currency: string;
  upi_id: string;
  payee_name: string;
  business_name: string;
  payment_instructions: string;
  upi_uri: string;
  qr_code_url: string;
  plan_name: string;
}

export async function createPaymentIntent(
  userId: string,
  params: CreateIntentParams
): Promise<PaymentIntentResult> {
  // Rate limit: 10 payment intent requests per 2 minutes per user
  enforceRateLimit(`payment_intent_${userId}`, 10, 120000, 'Payment Intent Creation');

  const { planId, addressId, orderType, items } = params;

  let calculatedAmount = 0;
  let planData: Plan | null = null;

  // 1. Calculate base plan amount
  if (orderType === 'subscription') {
    if (!planId) throw new Error('Plan is required for subscription orders');
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      throw new Error('Selected plan is not available');
    }
    planData = plan as Plan;
    calculatedAmount = plan.discounted_price ? Number(plan.discounted_price) : Number(plan.price);
  }

  // 2. Authoritative database items calculation (Special order products or Add-ons)
  let itemsTotal = 0;
  if (items && items.length > 0) {
    const itemIds = items.map((i) => i.id);

    // Fetch verified records from authoritative tables
    const [specialProdRes, addonsRes] = await Promise.all([
      supabase
        .from('special_order_products')
        .select('*')
        .in('id', itemIds)
        .eq('is_available', true),
      supabase
        .from('addons')
        .select('*')
        .in('id', itemIds)
        .eq('is_available', true),
    ]);

    const dbSpecialProducts = specialProdRes.data || [];
    const dbAddons = addonsRes.data || [];

    for (const item of items) {
      const quantity = Number(item.quantity);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new Error(`Invalid quantity for item: ${item.name || item.id}`);
      }

      const specialProd = dbSpecialProducts.find((p: any) => p.id === item.id);
      if (specialProd) {
        const step = Number(specialProd.pricing_unit_step) || 1;
        const lineTotal = (quantity / step) * Number(specialProd.price);
        itemsTotal += Math.round(lineTotal * 100) / 100;
        continue;
      }

      const addon = dbAddons.find((a: any) => a.id === item.id);
      if (addon) {
        itemsTotal += Number(addon.price) * quantity;
        continue;
      }

      // Security: Item not in database -> Reject immediately, NEVER trust client-provided price
      throw new Error(`The requested item "${item.name || item.id}" is unavailable or invalid.`);
    }
  }

  calculatedAmount += itemsTotal;
  if (calculatedAmount <= 0) {
    throw new Error('Order amount must be greater than 0');
  }

  // 3. Load business UPI config
  const upiConfig = await getBusinessUPIConfig();
  const paymentReference = generatePaymentReference();

  // 4. Build standard UPI URL & QR
  const upiUri = buildUPIPaymentUrl({
    upiId: upiConfig.upiId,
    payeeName: upiConfig.payeeName,
    amount: calculatedAmount,
    paymentReference,
  });

  const qrCodeDataUrl = await generateUPIQRCode(upiUri);

  // 5. Insert payment record into Supabase (include razorpay_order_id for backward compatibility)
  const insertPayload: any = {
    user_id: userId,
    payment_reference: paymentReference,
    razorpay_order_id: paymentReference, // Satisfies legacy NOT NULL constraint if still present
    amount: calculatedAmount,
    currency: 'INR',
    status: 'pending',
    payment_method: 'upi_qr',
    upi_id: upiConfig.upiId,
  };

  const { data: paymentRecord, error: paymentError } = await supabase
    .from('payments')
    .insert(insertPayload)
    .select()
    .single();

  if (paymentError || !paymentRecord) {
    console.error('Payment intent insert error:', paymentError);
    if (paymentError?.message?.includes('payment_reference')) {
      throw new Error(
        'Database Schema Update Required: The "payment_reference" column is missing from public.payments in Supabase. Please run "supabase/migrations/002_upi_payments_migration.sql" in your Supabase SQL Editor.'
      );
    }
    throw new Error(paymentError?.message || 'Failed to create payment session');
  }

  return {
    success: true,
    payment_id: paymentRecord.id,
    payment_reference: paymentReference,
    amount: calculatedAmount,
    currency: 'INR',
    upi_id: upiConfig.upiId,
    payee_name: upiConfig.payeeName,
    business_name: upiConfig.businessName,
    payment_instructions: upiConfig.paymentInstructions,
    upi_uri: upiUri,
    qr_code_url: qrCodeDataUrl,
    plan_name: planData?.name || (orderType === 'special_order' ? 'Special Food Order' : 'Order'),
  };
}

export interface SubmitUtrParams {
  paymentId: string;
  utr: string;
  planId?: string;
  addressId?: string;
  deliveryTime?: 'morning' | 'evening' | 'both';
  requiredDate?: string;
  preferredTime?: string;
  specialInstructions?: string;
  items?: OrderItemParam[];
}

export async function submitPaymentUtr(
  userId: string,
  params: SubmitUtrParams
) {
  // Rate limit: 5 UTR submission attempts per 3 minutes per user
  enforceRateLimit(`utr_submit_${userId}`, 5, 180000, 'UTR Submission');

  const {
    paymentId,
    utr,
    planId,
    addressId,
    deliveryTime,
    requiredDate,
    preferredTime,
    specialInstructions,
    items,
  } = params;
  const cleanUtr = utr.trim();

  if (!cleanUtr || cleanUtr.length < 6) {
    throw new Error('Please enter a valid 12-digit UTR / Transaction ID');
  }

  // 1. Fetch payment
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .select('*')
    .eq('id', paymentId)
    .eq('user_id', userId)
    .single();

  if (paymentError || !payment) {
    throw new Error('Payment session not found');
  }

  if (payment.status === 'paid') {
    throw new Error('This payment has already been verified and paid');
  }

  // 2. Check duplicate UTR
  const { data: duplicatePayment } = await supabase
    .from('payments')
    .select('id, payment_reference, status')
    .eq('utr', cleanUtr)
    .in('status', ['pending_verification', 'paid'])
    .neq('id', paymentId)
    .maybeSingle();

  if (duplicatePayment) {
    throw new Error('This transaction ID / UTR has already been submitted for another payment.');
  }

  let createdSubscriptionId = payment.subscription_id || null;
  let createdOrderId = payment.order_id || null;

  // 3. Create pending subscription if needed
  if (planId && !createdSubscriptionId) {
    const { data: plan } = await supabase.from('plans').select('*').eq('id', planId).single();
    if (plan) {
      const durationDays = plan.duration_days || 30;
      const startDateStr = getIstDateString();
      const endDateStr = addDaysToIstDate(startDateStr, durationDays);

      const planPrice = plan.discounted_price ? Number(plan.discounted_price) : Number(plan.price);

      const { data: newSub, error: subError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_id: plan.id,
          address_id: addressId || null,
          start_date: startDateStr,
          end_date: endDateStr,
          status: 'pending',
          amount: planPrice,
          payment_status: 'pending',
          delivery_time: deliveryTime || 'morning',
        })
        .select()
        .single();

      if (!subError && newSub) {
        createdSubscriptionId = newSub.id;

        const { data: initialOrder } = await supabase
          .from('orders')
          .insert({
            user_id: userId,
            subscription_id: newSub.id,
            address_id: addressId || null,
            order_date: startDateStr,
            meal_type: plan.meal_type || 'full',
            order_type: 'subscription_delivery',
            subtotal: planPrice,
            total_amount: payment.amount,
            status: 'pending',
            special_instructions: specialInstructions || null,
          })
          .select()
          .single();

        if (initialOrder) {
          createdOrderId = initialOrder.id;
        }
      }
    }
  } else if (items && items.length > 0 && !createdOrderId) {
    // Special order
    const targetDate = requiredDate || getIstDateString();
    const targetSlot = preferredTime || deliveryTime || 'lunch';

    const { data: initialOrder } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        address_id: addressId || null,
        order_date: targetDate,
        required_date: targetDate,
        preferred_time: targetSlot,
        meal_type: targetSlot,
        order_type: 'special_order',
        subtotal: payment.amount,
        total_amount: payment.amount,
        status: 'pending',
        special_instructions: specialInstructions || null,
      })
      .select()
      .single();

    if (initialOrder) {
      createdOrderId = initialOrder.id;

      // Fetch product details for snapshot from authoritative database tables
      const itemIds = items.map((i) => i.id);
      const [specialProdRes, addonsRes] = await Promise.all([
        supabase
          .from('special_order_products')
          .select('*')
          .in('id', itemIds),
        supabase
          .from('addons')
          .select('*')
          .in('id', itemIds),
      ]);

      const dbSpecialProducts = specialProdRes.data || [];
      const dbAddons = addonsRes.data || [];

      for (const item of items) {
        const quantity = Number(item.quantity);
        if (!Number.isFinite(quantity) || quantity <= 0) continue;

        const specialProd = dbSpecialProducts.find((p: any) => p.id === item.id);
        if (specialProd) {
          const step = Number(specialProd.pricing_unit_step) || 1;
          const unitPrice = Number(specialProd.price);
          const lineTotal = (quantity / step) * unitPrice;

          await supabase.from('order_items').insert({
            order_id: initialOrder.id,
            product_id: specialProd.id,
            item_name: specialProd.name,
            item_type: 'special_order',
            unit_snapshot: specialProd.unit || 'pcs',
            quantity: quantity,
            unit_price: unitPrice,
            total_price: Math.round(lineTotal * 100) / 100,
          });
          continue;
        }

        const addon = dbAddons.find((a: any) => a.id === item.id);
        if (addon) {
          const unitPrice = Number(addon.price);
          const lineTotal = unitPrice * quantity;

          await supabase.from('order_items').insert({
            order_id: initialOrder.id,
            item_name: addon.name,
            item_type: 'special_order',
            unit_snapshot: 'pcs',
            quantity: quantity,
            unit_price: unitPrice,
            total_price: Math.round(lineTotal * 100) / 100,
          });
        }
      }
    }
  }

  // 4. Update payment record to pending_verification
  const nowIso = new Date().toISOString();
  const { data: updatedPayment, error: updateError } = await supabase
    .from('payments')
    .update({
      utr: cleanUtr,
      status: 'pending_verification',
      submitted_at: nowIso,
      subscription_id: createdSubscriptionId,
      order_id: createdOrderId,
    })
    .eq('id', paymentId)
    .select()
    .single();

  if (updateError) {
    throw new Error(updateError.message || 'Failed to submit payment details');
  }

  // 5. Trigger Admin Notification (Email & SMS) - Non-blocking
  if (createdOrderId) {
    try {
      // Fetch customer profile & address for complete notification payload
      const [profileRes, addrRes] = await Promise.all([
        supabase.from('profiles').select('full_name, email, phone').eq('id', userId).maybeSingle(),
        addressId ? supabase.from('addresses').select('*').eq('id', addressId).maybeSingle() : Promise.resolve({ data: null }),
      ]);

      const customerProfile = profileRes.data;
      const deliveryAddress = addrRes.data;

      // Trigger async
      triggerAdminNewOrderNotification(
        createdOrderId,
        {
          customerName: customerProfile?.full_name || 'Valued Customer',
          customerPhone: customerProfile?.phone || deliveryAddress?.phone || null,
          customerEmail: customerProfile?.email || null,
          amount: Number(payment.amount),
          orderType: planId ? 'subscription_delivery' : 'special_order',
          mealType: deliveryTime || 'full',
          items: items || [],
          paymentMethod: 'UPI QR',
          paymentStatus: 'Pending Verification (UTR Submitted)',
          utr: cleanUtr,
          address: deliveryAddress,
          specialInstructions: specialInstructions || null,
          createdAt: nowIso,
        },
        userId
      ).catch((e) => console.warn('Background admin notification error:', e));
    } catch (notifErr) {
      console.warn('Non-blocking notification error:', notifErr);
    }
  }

  return {
    success: true,
    status: 'pending_verification',
    payment_reference: updatedPayment.payment_reference,
    subscription_id: createdSubscriptionId,
    order_id: createdOrderId,
    message: 'Your payment details have been submitted successfully. Our team will verify your payment shortly.',
  };
}
