import { supabase } from '@/lib/supabase/client';
import { Plan } from '@/types/database';
import { logAdminAction } from '@/services/adminService';

export interface PlanAnalytics {
  planId: string;
  activeSubscribers: number;
  totalSubscriptions: number;
  totalOrders: number;
  totalRevenue: number;
  popularityScore: number;
}

export interface PlanDependencyCheck {
  canHardDelete: boolean;
  activeSubscriptionsCount: number;
  totalSubscriptionsCount: number;
  totalOrdersCount: number;
  totalPaymentsCount: number;
  reason?: string;
}

export interface PlanInput {
  name: string;
  description?: string | null;
  plan_type: 'daily' | 'weekly' | 'monthly';
  meal_type: 'full' | 'half' | 'morning' | 'evening' | 'both';
  price: number;
  discounted_price?: number | null;
  duration_days: number;
  duration_unit?: string;
  available_timings?: string[];
  included_meals?: string | null;
  features?: string[];
  display_order?: number;
  is_featured?: boolean;
  is_active: boolean;
}

/**
 * Fetch all plans for Admin Dashboard with optional inclusion of inactive plans
 */
export async function fetchAdminPlans(): Promise<Plan[]> {
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .order('price', { ascending: true });

  if (error) {
    console.error('Error fetching admin plans:', error);
    throw new Error(error.message || 'Failed to load meal plans');
  }

  const list = (data as Plan[]) || [];
  return list.sort((a, b) => {
    if (a.display_order !== undefined && b.display_order !== undefined) {
      return (a.display_order ?? 99) - (b.display_order ?? 99);
    }
    return (a.discounted_price || a.price) - (b.discounted_price || b.price);
  });
}

/**
 * Fetch active plans for Customer website & Checkout
 */
export async function fetchPublicPlans(): Promise<Plan[]> {
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .eq('is_active', true)
    .order('price', { ascending: true });

  if (error) {
    console.error('Error fetching public plans:', error);
    throw new Error(error.message || 'Failed to load meal plans');
  }

  const list = (data as Plan[]) || [];
  return list.sort((a, b) => {
    if (a.display_order !== undefined && b.display_order !== undefined) {
      return (a.display_order ?? 99) - (b.display_order ?? 99);
    }
    return (a.discounted_price || a.price) - (b.discounted_price || b.price);
  });
}

/**
 * Real database analytics computation for each plan.
 * Calculates Active Subscribers, Total Subscriptions, Total Orders, and Revenue Generated.
 */
export async function fetchAllPlansAnalytics(): Promise<Record<string, PlanAnalytics>> {
  try {
    // 1. Fetch all subscriptions with plan_id, status, amount
    const { data: subs, error: subsErr } = await supabase
      .from('subscriptions')
      .select('id, plan_id, status, amount');

    if (subsErr) {
      console.warn('Could not fetch subscriptions for plan analytics:', subsErr);
      return {};
    }

    // 2. Fetch payments linked to subscriptions
    const { data: payments } = await supabase
      .from('payments')
      .select('subscription_id, amount, status')
      .in('status', ['paid']);

    // 3. Fetch orders linked to subscriptions
    const { data: orders } = await supabase
      .from('orders')
      .select('subscription_id, status');

    const subMap: Record<string, { planId: string; status: string; amount: number }> = {};
    (subs || []).forEach((s) => {
      subMap[s.id] = {
        planId: s.plan_id,
        status: s.status,
        amount: Number(s.amount) || 0,
      };
    });

    const analyticsMap: Record<string, PlanAnalytics> = {};

    // Aggregate subscription stats
    (subs || []).forEach((s) => {
      const pid = s.plan_id;
      if (!analyticsMap[pid]) {
        analyticsMap[pid] = {
          planId: pid,
          activeSubscribers: 0,
          totalSubscriptions: 0,
          totalOrders: 0,
          totalRevenue: 0,
          popularityScore: 0,
        };
      }

      analyticsMap[pid].totalSubscriptions += 1;
      if (s.status === 'active') {
        analyticsMap[pid].activeSubscribers += 1;
      }
    });

    // Aggregate paid revenue
    (payments || []).forEach((p) => {
      if (p.subscription_id && subMap[p.subscription_id]) {
        const pid = subMap[p.subscription_id].planId;
        if (analyticsMap[pid]) {
          analyticsMap[pid].totalRevenue += Number(p.amount) || 0;
        }
      }
    });

    // Aggregate orders
    (orders || []).forEach((o) => {
      if (o.subscription_id && subMap[o.subscription_id]) {
        const pid = subMap[o.subscription_id].planId;
        if (analyticsMap[pid]) {
          analyticsMap[pid].totalOrders += 1;
        }
      }
    });

    // Calculate popularity scores
    const totalAllSubs = Object.values(analyticsMap).reduce((sum, a) => sum + a.totalSubscriptions, 0);
    Object.values(analyticsMap).forEach((item) => {
      if (totalAllSubs > 0) {
        item.popularityScore = Math.round((item.totalSubscriptions / totalAllSubs) * 100);
      }
    });

    return analyticsMap;
  } catch (err) {
    console.error('Error calculating plan analytics:', err);
    return {};
  }
}

/**
 * Check if a plan can be safely deleted or must be archived (is_active = false)
 */
export async function checkPlanDependencies(planId: string): Promise<PlanDependencyCheck> {
  const { data: subs, error: subsError } = await supabase
    .from('subscriptions')
    .select('id, status')
    .eq('plan_id', planId);

  if (subsError) {
    console.error('Error checking subscriptions for plan:', subsError);
  }

  const subList = subs || [];
  const totalSubscriptionsCount = subList.length;
  const activeSubscriptionsCount = subList.filter((s) => s.status === 'active').length;

  // Check orders linked to subscriptions of this plan
  let totalOrdersCount = 0;
  if (totalSubscriptionsCount > 0) {
    const subIds = subList.map((s) => s.id);
    const { count } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .in('subscription_id', subIds);
    totalOrdersCount = count || 0;
  }

  // Check payments
  let totalPaymentsCount = 0;
  if (totalSubscriptionsCount > 0) {
    const subIds = subList.map((s) => s.id);
    const { count } = await supabase
      .from('payments')
      .select('id', { count: 'exact', head: true })
      .in('subscription_id', subIds);
    totalPaymentsCount = count || 0;
  }

  const hasHistory = totalSubscriptionsCount > 0 || totalOrdersCount > 0 || totalPaymentsCount > 0;

  return {
    canHardDelete: !hasHistory,
    activeSubscriptionsCount,
    totalSubscriptionsCount,
    totalOrdersCount,
    totalPaymentsCount,
    reason: hasHistory
      ? `This plan has ${totalSubscriptionsCount} subscriptions, ${totalOrdersCount} orders, and ${totalPaymentsCount} payments attached. To preserve historical records, it will be deactivated/archived.`
      : undefined,
  };
}

/**
 * Create a new meal plan
 */
/**
 * Create a new meal plan with resilient fallback for un-migrated columns
 */
export async function createPlan(
  planInput: PlanInput,
  adminId?: string
): Promise<Plan> {
  // 1. Validate required fields
  if (!planInput.name || !planInput.name.trim()) {
    throw new Error('Plan name is required.');
  }

  if (planInput.price < 0) {
    throw new Error('Price cannot be negative.');
  }

  if (planInput.discounted_price !== undefined && planInput.discounted_price !== null) {
    if (planInput.discounted_price < 0) {
      throw new Error('Discounted price cannot be negative.');
    }
  }

  if (planInput.duration_days <= 0) {
    throw new Error('Duration must be at least 1 day.');
  }

  const baseDescription = planInput.description?.trim() || '';
  const includedText = planInput.included_meals?.trim() ? ` [Includes: ${planInput.included_meals.trim()}]` : '';
  const combinedDesc = (baseDescription + (baseDescription ? includedText : planInput.included_meals?.trim() || '')).trim() || null;

  const fullPayload: any = {
    name: planInput.name.trim(),
    description: combinedDesc,
    plan_type: planInput.plan_type,
    meal_type: planInput.meal_type,
    price: Number(planInput.price),
    discounted_price:
      planInput.discounted_price !== undefined && planInput.discounted_price !== null && planInput.discounted_price > 0
        ? Number(planInput.discounted_price)
        : null,
    duration_days: Number(planInput.duration_days),
    duration_unit: planInput.duration_unit || 'days',
    available_timings: planInput.available_timings || ['morning', 'evening'],
    included_meals: planInput.included_meals?.trim() || null,
    features: planInput.features || [],
    display_order: Number(planInput.display_order) || 0,
    is_featured: Boolean(planInput.is_featured),
    is_active: Boolean(planInput.is_active),
  };

  // Base fallback payload with only standard schema columns
  const basePayload: any = {
    name: planInput.name.trim(),
    description: combinedDesc,
    plan_type: planInput.plan_type,
    meal_type: planInput.meal_type,
    price: Number(planInput.price),
    discounted_price:
      planInput.discounted_price !== undefined && planInput.discounted_price !== null && planInput.discounted_price > 0
        ? Number(planInput.discounted_price)
        : null,
    duration_days: Number(planInput.duration_days),
    is_active: Boolean(planInput.is_active),
  };

  // Try full insert first
  let { data, error } = await supabase
    .from('plans')
    .insert(fullPayload)
    .select()
    .single();

  // If column error occurs (e.g. available_timings column missing in DB), fallback to base schema
  if (error && (error.message?.includes('column') || error.message?.includes('schema cache'))) {
    console.warn('Falling back to standard plans schema:', error.message);
    const fallbackRes = await supabase
      .from('plans')
      .insert(basePayload)
      .select()
      .single();

    data = fallbackRes.data;
    error = fallbackRes.error;
  }

  if (error) {
    console.error('Error creating plan:', error);
    if (error.message?.includes('row-level security') || error.message?.includes('violates row-level security')) {
      throw new Error(
        'Admin Role Required: Your account is currently marked as a "customer" in the database. Please execute: UPDATE public.profiles SET role = \'admin\' WHERE id = auth.uid(); in your Supabase SQL Editor to grant admin privileges.'
      );
    }
    throw new Error(error.message || 'Failed to create plan.');
  }

  if (adminId) {
    logAdminAction({
      adminId,
      action: 'plan_created',
      targetType: 'plan',
      targetId: data?.id,
      details: basePayload,
    }).catch((e) => console.warn('Audit log error:', e));
  }

  return data as Plan;
}

/**
 * Update an existing meal plan with resilient fallback
 */
export async function updatePlan(
  planId: string,
  planInput: Partial<PlanInput>,
  adminId?: string
): Promise<Plan> {
  if (planInput.name !== undefined && !planInput.name.trim()) {
    throw new Error('Plan name cannot be empty.');
  }

  if (planInput.price !== undefined && planInput.price < 0) {
    throw new Error('Price cannot be negative.');
  }

  if (planInput.discounted_price !== undefined && planInput.discounted_price !== null && planInput.discounted_price < 0) {
    throw new Error('Discounted price cannot be negative.');
  }

  if (planInput.duration_days !== undefined && planInput.duration_days <= 0) {
    throw new Error('Duration must be greater than zero.');
  }

  const payload: any = { ...planInput };
  if (payload.name) payload.name = payload.name.trim();
  if (payload.description !== undefined) payload.description = payload.description ? payload.description.trim() : null;
  if (payload.price !== undefined) payload.price = Number(payload.price);
  if (payload.discounted_price !== undefined) {
    payload.discounted_price = payload.discounted_price ? Number(payload.discounted_price) : null;
  }
  if (payload.duration_days !== undefined) payload.duration_days = Number(payload.duration_days);
  if (payload.display_order !== undefined) payload.display_order = Number(payload.display_order);

  // Try full update first
  let { data, error } = await supabase
    .from('plans')
    .update(payload)
    .eq('id', planId)
    .select()
    .single();

  // If column error occurs, strip new columns and update base fields
  if (error && (error.message?.includes('column') || error.message?.includes('schema cache'))) {
    console.warn('Falling back to standard plans schema update:', error.message);
    const baseUpdate: any = {
      name: payload.name,
      description: payload.description,
      plan_type: payload.plan_type,
      meal_type: payload.meal_type,
      price: payload.price,
      discounted_price: payload.discounted_price,
      duration_days: payload.duration_days,
      is_active: payload.is_active,
    };

    // Remove undefined
    Object.keys(baseUpdate).forEach((key) => {
      if (baseUpdate[key] === undefined) delete baseUpdate[key];
    });

    const fallbackRes = await supabase
      .from('plans')
      .update(baseUpdate)
      .eq('id', planId)
      .select()
      .single();

    data = fallbackRes.data;
    error = fallbackRes.error;
  }

  if (error) {
    console.error('Error updating plan:', error);
    if (error.message?.includes('row-level security') || error.message?.includes('violates row-level security')) {
      throw new Error(
        'Admin Role Required: Your account is currently marked as a "customer" in the database. Please execute: UPDATE public.profiles SET role = \'admin\' WHERE id = auth.uid(); in your Supabase SQL Editor to grant admin privileges.'
      );
    }
    throw new Error(error.message || 'Failed to update plan.');
  }

  if (adminId) {
    logAdminAction({
      adminId,
      action: 'plan_updated',
      targetType: 'plan',
      targetId: planId,
      details: payload,
    }).catch((e) => console.warn('Audit log error:', e));
  }

  return data as Plan;
}

/**
 * Activate or Deactivate / Archive a meal plan
 */
export async function togglePlanStatus(
  planId: string,
  isActive: boolean,
  adminId?: string
): Promise<void> {
  const { error } = await supabase
    .from('plans')
    .update({ is_active: isActive })
    .eq('id', planId);

  if (error) {
    console.error('Error toggling plan status:', error);
    throw new Error(error.message || 'Failed to change plan status.');
  }

  if (adminId) {
    logAdminAction({
      adminId,
      action: isActive ? 'plan_activated' : 'plan_deactivated',
      targetType: 'plan',
      targetId: planId,
      details: { is_active: isActive },
    }).catch((e) => console.warn('Audit log error:', e));
  }
}

/**
 * Delete or Soft-Archive Plan based on existing dependencies
 */
export async function deleteOrArchivePlan(
  planId: string,
  adminId?: string
): Promise<{ action: 'archived' | 'deleted'; message: string }> {
  const check = await checkPlanDependencies(planId);

  if (!check.canHardDelete) {
    // Soft delete by setting is_active = false
    await togglePlanStatus(planId, false, adminId);
    return {
      action: 'archived',
      message: `Plan safely archived (disabled). ${check.totalSubscriptionsCount} subscriptions and ${check.totalOrdersCount} orders were preserved.`,
    };
  }

  // Hard delete if completely unused
  const { error } = await supabase.from('plans').delete().eq('id', planId);
  if (error) {
    console.error('Error deleting unused plan:', error);
    // Fallback to deactivate if foreign key constraint triggered
    await togglePlanStatus(planId, false, adminId);
    return {
      action: 'archived',
      message: 'Plan was archived to prevent foreign key conflicts.',
    };
  }

  if (adminId) {
    logAdminAction({
      adminId,
      action: 'plan_deleted',
      targetType: 'plan',
      targetId: planId,
      details: { deleted: true },
    }).catch((e) => console.warn('Audit log error:', e));
  }

  return {
    action: 'deleted',
    message: 'Plan permanently deleted successfully.',
  };
}
