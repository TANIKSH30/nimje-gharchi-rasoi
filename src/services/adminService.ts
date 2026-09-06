import { supabase } from '@/lib/supabase/client';
import {
  triggerCustomerOrderConfirmedNotification,
  triggerCustomerOrderCancelledNotification,
} from '@/services/notificationService';

export interface VerifyPaymentParams {
  paymentId: string;
  action: 'approve' | 'reject';
  rejectionReason?: string;
  adminUserId: string;
}

export async function verifyPaymentByAdmin(params: VerifyPaymentParams) {
  const { paymentId, action, rejectionReason, adminUserId } = params;

  // 1. Fetch payment with fallback
  let { data: payment } = await supabase
    .from('payments')
    .select('*, profile:profiles(full_name, email, phone)')
    .eq('id', paymentId)
    .maybeSingle();

  if (!payment) {
    const { data: fallbackPayment } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .maybeSingle();
    payment = fallbackPayment;
  }

  if (!payment) {
    throw new Error('Payment record not found in database');
  }

  let userProfile = payment.profile;
  if (!userProfile && payment.user_id) {
    const { data: pData } = await supabase
      .from('profiles')
      .select('full_name, email, phone')
      .eq('id', payment.user_id)
      .maybeSingle();
    userProfile = pData;
  }

  const nowIso = new Date().toISOString();

  if (action === 'approve') {
    // 1. Update Payment status to paid
    const { error: paymentUpdateError } = await supabase
      .from('payments')
      .update({
        status: 'paid',
        verified_at: nowIso,
        verified_by: adminUserId,
        rejection_reason: null,
      })
      .eq('id', paymentId);

    if (paymentUpdateError) throw paymentUpdateError;

    // 2. Activate subscription if linked
    if (payment.subscription_id) {
      await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          payment_status: 'paid',
        })
        .eq('id', payment.subscription_id);
    }

    // 3. Confirm all linked orders (by order_id or subscription_id)
    if (payment.order_id) {
      await supabase
        .from('orders')
        .update({ status: 'confirmed' })
        .eq('id', payment.order_id);
    }

    if (payment.subscription_id) {
      await supabase
        .from('orders')
        .update({ status: 'confirmed' })
        .eq('subscription_id', payment.subscription_id)
        .eq('status', 'pending');
    }

    // 4. Trigger Customer Order Confirmed Notification
    if (userProfile?.email || payment.user_id) {
      triggerCustomerOrderConfirmedNotification(
        payment.order_id || paymentId,
        {
          customerName: userProfile?.full_name || 'Customer',
          customerEmail: userProfile?.email || '',
          amount: Number(payment.amount),
        },
        payment.user_id
      ).catch((e) => console.warn('Customer notification error:', e));
    }

    // 5. Log audit
    logAdminAction({
      adminId: adminUserId,
      action: 'payment_approved',
      targetType: 'payment',
      targetId: paymentId,
      details: { amount: payment.amount, utr: payment.utr, reference: payment.payment_reference },
    });

    return {
      success: true,
      message: `Payment (UTR: ${payment.utr || payment.payment_reference || payment.id.slice(0, 8)}) successfully verified & approved!`,
    };
  } else if (action === 'reject') {
    const cleanReason = rejectionReason?.trim() || 'Invalid or unverifiable transaction / UTR';

    // 1. Update Payment status to rejected
    const { error: paymentUpdateError } = await supabase
      .from('payments')
      .update({
        status: 'rejected',
        verified_at: nowIso,
        verified_by: adminUserId,
        rejection_reason: cleanReason,
      })
      .eq('id', paymentId);

    if (paymentUpdateError) throw paymentUpdateError;

    // 2. Cancel linked pending subscription if any
    if (payment.subscription_id) {
      await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          payment_status: 'failed',
        })
        .eq('id', payment.subscription_id)
        .eq('status', 'pending');
    }

    // 3. Cancel linked pending order if any
    if (payment.order_id) {
      await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', payment.order_id)
        .eq('status', 'pending');
    }

    if (payment.subscription_id) {
      await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('subscription_id', payment.subscription_id)
        .eq('status', 'pending');
    }

    // 4. Log audit
    logAdminAction({
      adminId: adminUserId,
      action: 'payment_rejected',
      targetType: 'payment',
      targetId: paymentId,
      details: { amount: payment.amount, utr: payment.utr, reason: cleanReason },
    });

    return {
      success: true,
      message: `Payment (UTR: ${payment.utr || payment.payment_reference || payment.id.slice(0, 8)}) marked as rejected.`,
    };
  }

  throw new Error('Invalid verification action');
}

/**
 * Audit Logging Helper
 */
export async function logAdminAction(params: {
  adminId?: string;
  adminEmail?: string;
  action: string;
  targetType: string;
  targetId?: string;
  details?: any;
}) {
  try {
    await supabase.from('admin_audit_logs').insert({
      admin_id: params.adminId || null,
      admin_email: params.adminEmail || null,
      action: params.action,
      target_type: params.targetType,
      target_id: params.targetId || null,
      details: params.details || null,
    });
  } catch (err) {
    // Non-blocking
    console.warn('[Admin Audit] Failed to write log:', err);
  }
}

/**
 * Updates order status from the Admin Panel and synchronizes linked payment/subscription records & notifications.
 */
export async function updateOrderStatusByAdmin(
  orderId: string,
  newStatus: string,
  reason?: string,
  adminUserId?: string
) {
  const nowIso = new Date().toISOString();

  // 1. Fetch order with profile
  const { data: order, error: fetchErr } = await supabase
    .from('orders')
    .select('*, profile:profiles(full_name, email, phone)')
    .eq('id', orderId)
    .single();

  if (fetchErr || !order) {
    throw new Error('Order not found');
  }

  // 2. Perform secure database update on order
  const { error: updateError } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId);

  if (updateError) {
    throw updateError;
  }

  // 3. Synchronize linked payments and subscriptions
  if (newStatus === 'confirmed') {
    await supabase
      .from('payments')
      .update({
        status: 'paid',
        verified_at: nowIso,
        verified_by: adminUserId || null,
      })
      .or(`order_id.eq.${orderId}${order.subscription_id ? `,subscription_id.eq.${order.subscription_id}` : ''}`)
      .eq('status', 'pending_verification');

    if (order.subscription_id) {
      await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          payment_status: 'paid',
        })
        .eq('id', order.subscription_id);
    }
  } else if (newStatus === 'cancelled') {
    await supabase
      .from('payments')
      .update({
        status: 'cancelled',
        rejection_reason: reason || 'Cancelled by admin',
      })
      .or(`order_id.eq.${orderId}${order.subscription_id ? `,subscription_id.eq.${order.subscription_id}` : ''}`)
      .eq('status', 'pending_verification');

    if (order.subscription_id) {
      await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          payment_status: 'failed',
        })
        .eq('id', order.subscription_id);
    }
  }

  // 4. Trigger appropriate customer notification
  if (order.profile?.email || order.user_id) {
    if (newStatus === 'confirmed') {
      triggerCustomerOrderConfirmedNotification(
        orderId,
        {
          customerName: order.profile?.full_name || 'Customer',
          customerEmail: order.profile?.email || '',
          amount: Number(order.total_amount),
          mealType: order.meal_type,
        },
        order.user_id
      ).catch((e) => console.warn('Confirmation notification dispatch failed:', e));
    } else if (newStatus === 'cancelled') {
      triggerCustomerOrderCancelledNotification(
        orderId,
        {
          customerName: order.profile?.full_name || 'Customer',
          customerEmail: order.profile?.email || '',
          amount: Number(order.total_amount),
          reason: reason || 'Cancelled by admin',
        },
        order.user_id
      ).catch((e) => console.warn('Cancellation notification dispatch failed:', e));
    }
  }

  if (adminUserId) {
    logAdminAction({
      adminId: adminUserId,
      action: `order_status_${newStatus}`,
      targetType: 'order',
      targetId: orderId,
      details: { previousStatus: order.status, newStatus, reason },
    });
  }

  return {
    success: true,
    message: `Order #${orderId.slice(0, 8)} status updated to ${newStatus}.`,
  };
}

/**
 * Get comprehensive Admin Command Center Overview Metrics
 */
export async function getAdminMetrics() {
  const today = new Date().toISOString().split('T')[0];

  const [
    customersRes,
    activeSubsRes,
    pendingPaymentsRes,
    todayOrdersRes,
    todayPaymentsRes,
    recentOrdersRes,
    recentPaymentsRes,
    allOrdersRes,
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('payments').select('id', { count: 'exact', head: true }).eq('status', 'pending_verification'),
    supabase.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', today),
    supabase.from('payments').select('amount').eq('status', 'paid').gte('created_at', today),
    supabase.from('orders').select('*, profile:profiles(full_name, email, phone)').order('created_at', { ascending: false }).limit(10),
    supabase.from('payments').select('*, profile:profiles(full_name, email, phone)').order('created_at', { ascending: false }).limit(10),
    supabase.from('orders').select('status, meal_type, created_at'),
  ]);

  const todayRevenue = (todayPaymentsRes.data || []).reduce((acc: number, curr: any) => acc + Number(curr.amount || 0), 0);

  const statusCounts: Record<string, number> = {
    pending: 0,
    confirmed: 0,
    preparing: 0,
    out_for_delivery: 0,
    delivered: 0,
    cancelled: 0,
  };

  let morningMeals = 0;
  let eveningMeals = 0;

  (allOrdersRes.data || []).forEach((o: any) => {
    if (statusCounts[o.status] !== undefined) {
      statusCounts[o.status]++;
    }
    const isToday = o.created_at?.startsWith(today);
    if (isToday && o.status !== 'cancelled') {
      if (o.meal_type === 'morning' || o.meal_type === 'both' || o.meal_type === 'full') morningMeals++;
      if (o.meal_type === 'evening' || o.meal_type === 'both' || o.meal_type === 'full') eveningMeals++;
    }
  });

  return {
    metrics: {
      totalCustomers: customersRes.count || 0,
      activeSubscriptions: activeSubsRes.count || 0,
      pendingVerificationsCount: pendingPaymentsRes.count || 0,
      todayOrders: todayOrdersRes.count || 0,
      todayRevenue,
      statusCounts,
      operations: {
        morningMeals,
        eveningMeals,
        totalExpectedMeals: morningMeals + eveningMeals,
        pendingOrders: statusCounts.pending,
        confirmedOrders: statusCounts.confirmed + statusCounts.preparing + statusCounts.out_for_delivery,
      },
    },
    recentOrders: recentOrdersRes.data || [],
    recentPayments: recentPaymentsRes.data || [],
  };
}

/**
 * MENU MANAGEMENT SERVICES
 */
export interface MenuItem {
  id?: string;
  menu_date: string;
  meal_type: 'morning' | 'evening' | 'special';
  dish_name: string;
  description?: string;
  is_veg: boolean;
  price?: number;
  is_available: boolean;
  is_special: boolean;
  created_at?: string;
  updated_at?: string;
}

export async function getMenuItems(date?: string): Promise<MenuItem[]> {
  try {
    let query = supabase.from('menu_items').select('*').order('created_at', { ascending: true });
    if (date) {
      query = query.eq('menu_date', date);
    }
    const { data, error } = await query;
    if (error) throw error;
    return (data as MenuItem[]) || [];
  } catch (err) {
    console.error('Error fetching menu items:', err);
    return [];
  }
}

export async function createMenuItem(item: MenuItem, adminId?: string) {
  const { data, error } = await supabase.from('menu_items').insert({
    menu_date: item.menu_date,
    meal_type: item.meal_type,
    dish_name: item.dish_name,
    description: item.description || null,
    is_veg: item.is_veg ?? true,
    price: Number(item.price || 0),
    is_available: item.is_available ?? true,
    is_special: item.is_special ?? false,
  }).select().single();

  if (error) throw error;

  if (adminId) {
    logAdminAction({
      adminId,
      action: 'menu_item_created',
      targetType: 'menu',
      targetId: data?.id,
      details: { dishName: item.dish_name, date: item.menu_date, mealType: item.meal_type },
    });
  }

  return data;
}

export async function updateMenuItem(id: string, updates: Partial<MenuItem>, adminId?: string) {
  const { data, error } = await supabase
    .from('menu_items')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  if (adminId) {
    logAdminAction({
      adminId,
      action: 'menu_item_updated',
      targetType: 'menu',
      targetId: id,
      details: updates,
    });
  }

  return data;
}

export async function deleteMenuItem(id: string, adminId?: string) {
  const { error } = await supabase.from('menu_items').delete().eq('id', id);
  if (error) throw error;

  if (adminId) {
    logAdminAction({
      adminId,
      action: 'menu_item_deleted',
      targetType: 'menu',
      targetId: id,
    });
  }
  return true;
}

export async function toggleMenuItemAvailability(id: string, isAvailable: boolean, adminId?: string) {
  return updateMenuItem(id, { is_available: isAvailable }, adminId);
}

/**
 * BUSINESS SETTINGS SERVICES
 */
export interface BusinessSettings {
  id: string;
  business_name: string;
  payee_name: string;
  upi_id: string;
  payment_instructions?: string;
  phone?: string;
  email?: string;
  location?: string;
  lunch_slot?: string;
  dinner_slot?: string;
  order_cutoff_morning?: string;
  order_cutoff_evening?: string;
  updated_at?: string;
}

export async function getBusinessSettings(): Promise<BusinessSettings | null> {
  try {
    const { data, error } = await supabase
      .from('business_settings')
      .select('*')
      .eq('id', 'default')
      .maybeSingle();

    if (error) throw error;
    return data as BusinessSettings;
  } catch (err) {
    console.error('Error fetching business settings:', err);
    return null;
  }
}

export async function updateBusinessSettings(settings: Partial<BusinessSettings>, adminId?: string) {
  const payload: any = {
    id: 'default',
    ...settings,
    updated_at: new Date().toISOString(),
  };

  // Base fallback payload with only standard schema columns
  const basePayload: any = {
    id: 'default',
    business_name: settings.business_name,
    payee_name: settings.payee_name,
    upi_id: settings.upi_id,
    payment_instructions: settings.payment_instructions,
    phone: settings.phone,
    email: settings.email,
    location: settings.location,
    lunch_slot: settings.lunch_slot,
    dinner_slot: settings.dinner_slot,
    updated_at: new Date().toISOString(),
  };

  // Clean undefined from basePayload
  Object.keys(basePayload).forEach((k) => {
    if (basePayload[k] === undefined) delete basePayload[k];
  });

  let { data, error } = await supabase
    .from('business_settings')
    .upsert(payload)
    .select()
    .single();

  // If column error occurs (e.g. order_cutoff_evening missing in DB), fallback to base schema
  if (error && (error.message?.includes('column') || error.message?.includes('schema cache'))) {
    console.warn('Falling back to standard business_settings schema:', error.message);
    const fallbackRes = await supabase
      .from('business_settings')
      .upsert(basePayload)
      .select()
      .single();

    data = fallbackRes.data;
    error = fallbackRes.error;
  }

  if (error) throw error;

  if (adminId) {
    logAdminAction({
      adminId,
      action: 'settings_updated',
      targetType: 'settings',
      targetId: 'default',
      details: settings,
    }).catch((e) => console.warn('Audit log error:', e));
  }

  return data;
}

/**
 * CUSTOMER DEEP MANAGEMENT SERVICES
 */
export async function getCustomerDeepDetails(customerId: string) {
  const [profileRes, addressesRes, subscriptionsRes, ordersRes, paymentsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', customerId).single(),
    supabase.from('addresses').select('*').eq('user_id', customerId),
    supabase.from('subscriptions').select('*, plan:plans(*)').eq('user_id', customerId).order('created_at', { ascending: false }),
    supabase.from('orders').select('*').eq('user_id', customerId).order('created_at', { ascending: false }),
    supabase.from('payments').select('*').eq('user_id', customerId).order('created_at', { ascending: false }),
  ]);

  if (profileRes.error) throw profileRes.error;

  const totalSpent = (paymentsRes.data || [])
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  return {
    profile: profileRes.data,
    addresses: addressesRes.data || [],
    subscriptions: subscriptionsRes.data || [],
    orders: ordersRes.data || [],
    payments: paymentsRes.data || [],
    totalSpent,
    totalOrders: (ordersRes.data || []).length,
  };
}

/**
 * REVENUE ANALYTICS AGGREGATION SERVICES (Strictly Paid Revenue)
 */
export async function getRevenueAnalyticsData(timeRange: 'today' | '7d' | '30d' | 'month' | 'all') {
  const now = new Date();
  let startDate: string | null = null;

  if (timeRange === 'today') {
    startDate = now.toISOString().split('T')[0];
  } else if (timeRange === '7d') {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    startDate = d.toISOString().split('T')[0];
  } else if (timeRange === '30d') {
    const d = new Date(now);
    d.setDate(d.getDate() - 30);
    startDate = d.toISOString().split('T')[0];
  } else if (timeRange === 'month') {
    const d = new Date(now.getFullYear(), now.getMonth(), 1);
    startDate = d.toISOString().split('T')[0];
  }

  let query = supabase
    .from('payments')
    .select('id, amount, status, payment_method, created_at, paid_at, subscription_id, order_id, profile:profiles(full_name, email)');

  if (startDate) {
    query = query.gte('created_at', startDate);
  }

  const { data: payments, error } = await query.order('created_at', { ascending: true });
  if (error) throw error;

  const allPayments = payments || [];
  const paidPayments = allPayments.filter((p) => p.status === 'paid');
  const pendingPayments = allPayments.filter((p) => p.status === 'pending_verification' || p.status === 'pending');
  const rejectedPayments = allPayments.filter((p) => p.status === 'rejected');

  const totalVerifiedRevenue = paidPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const pendingAmount = pendingPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  // Group verified revenue by date
  const revenueByDayMap: Record<string, number> = {};
  paidPayments.forEach((p) => {
    const dateStr = (p.paid_at || p.created_at || '').split('T')[0];
    if (dateStr) {
      revenueByDayMap[dateStr] = (revenueByDayMap[dateStr] || 0) + Number(p.amount || 0);
    }
  });

  const dailyTrend = Object.entries(revenueByDayMap).map(([date, revenue]) => ({
    date,
    revenue,
  }));

  // Status breakdown
  const statusDistribution = {
    paid: paidPayments.length,
    pending: pendingPayments.length,
    rejected: rejectedPayments.length,
    total: allPayments.length,
  };

  const avgOrderValue = paidPayments.length > 0 ? Math.round(totalVerifiedRevenue / paidPayments.length) : 0;

  return {
    totalVerifiedRevenue,
    pendingAmount,
    paidCount: paidPayments.length,
    pendingCount: pendingPayments.length,
    rejectedCount: rejectedPayments.length,
    avgOrderValue,
    dailyTrend,
    statusDistribution,
    recentPaidPayments: paidPayments.slice(-10).reverse(),
  };
}

/**
 * ADMIN AUDIT LOGS FETCH
 */
export async function getAuditLogs(limit: number = 30) {
  try {
    const { data, error } = await supabase
      .from('admin_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    return [];
  }
}

/**
 * SPECIAL ORDER PRODUCTS ADMIN CRUD
 */
export async function createSpecialOrderProductAdmin(product: any) {
  const { data, error } = await supabase
    .from('special_order_products')
    .insert({
      name: product.name,
      description: product.description || null,
      category: product.category,
      image_url: product.image_url || null,
      price: Number(product.price),
      unit: product.unit || 'pcs',
      pricing_unit_step: Number(product.pricing_unit_step) || 1.0,
      min_quantity: Number(product.min_quantity) || 1.0,
      max_quantity: Number(product.max_quantity) || 100.0,
      quantity_step: Number(product.quantity_step) || 1.0,
      is_available: product.is_available ?? true,
      advance_notice_hours: Number(product.advance_notice_hours) || 24,
      allow_instructions: product.allow_instructions ?? true,
      display_order: Number(product.display_order) || 0,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating special order product:', error);
    throw error;
  }
  return data;
}

export async function updateSpecialOrderProductAdmin(id: string, updates: any) {
  const payload: any = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.category !== undefined) payload.category = updates.category;
  if (updates.image_url !== undefined) payload.image_url = updates.image_url;
  if (updates.price !== undefined) payload.price = Number(updates.price);
  if (updates.unit !== undefined) payload.unit = updates.unit;
  if (updates.pricing_unit_step !== undefined) payload.pricing_unit_step = Number(updates.pricing_unit_step);
  if (updates.min_quantity !== undefined) payload.min_quantity = Number(updates.min_quantity);
  if (updates.max_quantity !== undefined) payload.max_quantity = Number(updates.max_quantity);
  if (updates.quantity_step !== undefined) payload.quantity_step = Number(updates.quantity_step);
  if (updates.is_available !== undefined) payload.is_available = updates.is_available;
  if (updates.advance_notice_hours !== undefined) payload.advance_notice_hours = Number(updates.advance_notice_hours);
  if (updates.allow_instructions !== undefined) payload.allow_instructions = updates.allow_instructions;
  if (updates.display_order !== undefined) payload.display_order = Number(updates.display_order);

  const { data, error } = await supabase
    .from('special_order_products')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating special order product:', error);
    throw error;
  }
  return data;
}

export async function deleteSpecialOrderProductAdmin(id: string) {
  const { error } = await supabase
    .from('special_order_products')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting special order product:', error);
    throw error;
  }
  return true;
}

export async function toggleSpecialOrderProductAvailability(id: string, isAvailable: boolean) {
  const { data, error } = await supabase
    .from('special_order_products')
    .update({ is_available: isAvailable })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error toggling product availability:', error);
    throw error;
  }
  return data;
}


