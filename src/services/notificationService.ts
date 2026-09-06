import { supabase } from '@/lib/supabase/client';
import { Notification } from '@/types/database';

export const ADMIN_EMAIL = 'tanikshnimje@gmail.com';
export const ADMIN_PHONE = '7823098970';

export interface NewOrderNotificationPayload {
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  amount: number;
  orderType: string;
  mealType?: string;
  items?: any[];
  paymentMethod?: string;
  paymentStatus?: string;
  utr?: string | null;
  address?: any;
  specialInstructions?: string | null;
  createdAt?: string;
}

export interface OrderConfirmedNotificationPayload {
  customerName: string;
  customerEmail: string;
  amount: number;
  mealType?: string;
  deliveryTime?: string;
}

export interface OrderCancelledNotificationPayload {
  customerName: string;
  customerEmail: string;
  amount?: number;
  reason?: string;
}

export interface SubscriptionExpiryNotificationPayload {
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  planName: string;
  endDate: string;
  daysRemaining?: number;
  isExpired?: boolean;
}

/**
 * Tone options for renewal reminders
 */
export type RenewalMessageTone = 'standard' | 'urgent' | 'english';

/**
 * Generates a clean, professional, branded WhatsApp message with multiple tone variations
 */
export function generateProfessionalRenewalMessage(params: {
  customerName: string;
  planName: string;
  endDate: string;
  daysRemaining?: number;
  isExpired?: boolean;
  tone?: RenewalMessageTone;
  customRenewalUrl?: string;
}): string {
  const { customerName, planName, endDate, daysRemaining, isExpired, tone = 'standard', customRenewalUrl } = params;
  const name = customerName?.trim() || 'Patron';
  const siteUrl = customRenewalUrl || (typeof window !== 'undefined' ? `${window.location.origin}/checkout` : 'https://nimjegharchirasoi.com/checkout');

  if (tone === 'english') {
    if (isExpired) {
      return `🍱 *NIMJE GHARCHI RASOI — NAGPUR*\n_Authentic Homestyle Tiffin & Meal Service_\n━━━━━━━━━━━━━━━━━━━━━\nDear *${name}*,\n\nGreetings from Nimje Gharchi Rasoi! 🙏\n\nYour tiffin subscription (*${planName}*) ended on *${endDate}*.\n\nTo continue receiving fresh, wholesome lunch and dinner deliveries without any interruption, please renew your subscription:\n\n👉 *Renew Online:* ${siteUrl}\n\n📞 *Support Helpline:* +91 78230 98970\n📍 *Kitchen:* Nagpur, Maharashtra\n\n_Thank you for choosing Nimje Gharchi Rasoi!_`;
    }
    return `🍱 *NIMJE GHARCHI RASOI — NAGPUR*\n_Authentic Homestyle Tiffin & Meal Service_\n━━━━━━━━━━━━━━━━━━━━━\nDear *${name}*,\n\nThis is a friendly reminder that your meal subscription (*${planName}*) will expire on *${endDate}* (${daysRemaining ?? 1} day(s) remaining).\n\nTo ensure your daily meal deliveries continue smoothly, please renew your plan:\n\n👉 *Renew Online:* ${siteUrl}\n\n📞 *Support Helpline:* +91 78230 98970\n📍 *Kitchen:* Nagpur, Maharashtra\n\n_Warm regards,_\n*Team Nimje Gharchi Rasoi*`;
  }

  if (tone === 'urgent') {
    if (isExpired) {
      return `🚨 *URGENT: TIFFIN SERVICE PAUSED — NIMJE GHARCHI RASOI*\n━━━━━━━━━━━━━━━━━━━━━\nNamaste *${name}* Ji 🙏,\n\nAapka tiffin subscription (*${planName}*) date *${endDate}* ko expire ho chuka hai. Is kaaran kal se aapki meal delivery hold par hai.\n\n🍱 *Apni daily tiffin service turant resume karne ke liye abhi renew karein:*\n👉 *Instant Renewal Link:* ${siteUrl}\n\n📞 *Help / Assistance:* +91 78230 98970\n📍 *Nandanvan, Nagpur*\n\n_Dhanyawad! Team Nimje Gharchi Rasoi_`;
    }
    return `🚨 *ATTENTION: TIFFIN EXPIRING TODAY — NIMJE GHARCHI RASOI*\n━━━━━━━━━━━━━━━━━━━━━\nNamaste *${name}* Ji 🙏,\n\nReminder: Aapka tiffin subscription (*${planName}*) *${daysRemaining === 0 ? 'aaj hi' : 'kal'} (${endDate}) expire ho raha hai*.\n\nKal ke fresh lunch & dinner dispatch me koi rukawat na aaye, iske liye kripya apna plan abhi renew karein:\n\n👉 *Renew Now:* ${siteUrl}\n\n📞 *Direct Support:* +91 78230 98970\n\n_Dhanyawad! Nimje Gharchi Rasoi, Nagpur_`;
  }

  // Standard Homestyle Tone (Recommended - Respectful Hindi/English)
  if (isExpired) {
    return `🍱 *NIMJE GHARCHI RASOI — NAGPUR* 🍱\n_Ghar Jaisa Shuddh, Swadisht & Poshtik Khana_\n━━━━━━━━━━━━━━━━━━━━━\nNamaste *${name}* Ji 🙏,\n\nHum aasha karte hain ki aapko hamare ghar jaise khane ka swad pasand aa raha hai.\n\n⚠️ *Subscription Status Update:*\nAapka active meal subscription (*${planName}*) date *${endDate}* ko expire ho chuka hai.\n\n✨ Apne daily lunch / dinner ki fresh aur swadisht delivery bina kisi gap ke continue rakhne ke liye kripya apna subscription renew kar lein.\n\n👉 *Direct Online Renewal Link:*\n${siteUrl}\n\n📌 *Helpline / WhatsApp:* +91 78230 98970\n📍 *Kitchen:* Nandanvan, Nagpur\n\n_Dhanyawad! Aapki seva me sadhaiv tatpar._\n*Team Nimje Gharchi Rasoi*`;
  }

  if (daysRemaining === 0) {
    return `🍱 *NIMJE GHARCHI RASOI — NAGPUR* 🍱\n_Ghar Jaisa Shuddh, Swadisht & Poshtik Khana_\n━━━━━━━━━━━━━━━━━━━━━\nNamaste *${name}* Ji 🙏,\n\nReminder: Aapka tiffin subscription (*${planName}*) *aaj (${endDate}) expire ho raha hai*.\n\nKal ke fresh & hot meal dispatch ko uninterrupted continue rakhne ke liye kripya apna subscription abhi renew karein:\n\n👉 *Renew Plan Now:*\n${siteUrl}\n\n📞 *Support Helpline:* +91 78230 98970\n📍 *Nagpur, Maharashtra*\n\n_Dhanyawad! Nimje Gharchi Rasoi_`;
  }

  return `🍱 *NIMJE GHARCHI RASOI — NAGPUR* 🍱\n_Ghar Jaisa Shuddh, Swadisht & Poshtik Khana_\n━━━━━━━━━━━━━━━━━━━━━\nNamaste *${name}* Ji 🙏,\n\nAapka tiffin subscription (*${planName}*) agle *${daysRemaining || 2} dino me (${endDate}) expire hone wala hai*.\n\nDaily garam aur shuddh homestyle meal uninterrupted paane ke liye apna plan abhi renew karein:\n\n👉 *Quick Renewal Link:*\n${siteUrl}\n\n📞 *Support Helpline:* +91 78230 98970\n📍 *Nagpur, Maharashtra*\n\n_Dhanyawad! Team Nimje Gharchi Rasoi_`;
}

/**
 * Generates a direct 1-click WhatsApp reminder URL with pre-formatted professional message
 */
export function buildWhatsAppRenewalUrl(params: {
  phone: string;
  customerName: string;
  planName: string;
  endDate: string;
  daysRemaining?: number;
  isExpired?: boolean;
  tone?: RenewalMessageTone;
  customRenewalUrl?: string;
}): string {
  const { phone, customerName, planName, endDate, daysRemaining, isExpired, tone, customRenewalUrl } = params;
  const cleanPhone = phone.replace(/\D/g, '').slice(-10);
  const message = generateProfessionalRenewalMessage({
    customerName,
    planName,
    endDate,
    daysRemaining,
    isExpired,
    tone,
    customRenewalUrl,
  });

  return `https://api.whatsapp.com/send?phone=91${cleanPhone}&text=${encodeURIComponent(message)}`;
}

/**
 * Creates an in-app notification record in the database.
 */
export async function createInAppNotification(params: {
  userId: string;
  title: string;
  message: string;
  type: string;
  orderId?: string;
}): Promise<void> {
  if (!params.userId) return;
  try {
    await supabase.from('notifications').insert({
      user_id: params.userId,
      title: params.title,
      message: params.message,
      type: params.type,
      order_id: null, // Subscriptions do not use orders table fkey
      is_read: false,
    });
  } catch (err: any) {
    console.warn('[Notification Service] In-app notification creation error:', err.message);
  }
}

/**
 * Automatic Expiry Alert Trigger for a user (idempotent, max 1 per 24 hours)
 */
export async function checkAndTriggerAutomaticExpiryAlert(
  userId: string,
  subscription: {
    id: string;
    end_date: string;
    plan?: { name: string };
  },
  customerProfile?: { full_name?: string | null; phone?: string | null; email?: string | null }
) {
  if (!userId || !subscription?.end_date) return;

  try {
    const today = new Date().toISOString().split('T')[0];
    const end = subscription.end_date.split('T')[0];

    const todayDate = new Date(today + 'T00:00:00');
    const endDate = new Date(end + 'T00:00:00');
    const diffDays = Math.round((endDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));

    // Only trigger if expiring soon (<= 2 days) or already expired (within last 7 days)
    if (diffDays > 2 || diffDays < -7) return;

    const isExpired = diffDays < 0;
    const notifType = isExpired ? 'subscription_expired' : 'subscription_expiring';

    // Check if we already alerted today
    const { data: recentNotifs } = await supabase
      .from('notifications')
      .select('created_at')
      .eq('user_id', userId)
      .eq('type', notifType)
      .order('created_at', { ascending: false })
      .limit(1);

    if (recentNotifs && recentNotifs.length > 0) {
      const lastAlertTime = new Date(recentNotifs[0].created_at).getTime();
      const now = new Date().getTime();
      // If alerted less than 24 hours ago, skip duplicate
      if (now - lastAlertTime < 24 * 60 * 60 * 1000) {
        return;
      }
    }

    // Trigger In-App + Edge Function Notification
    await triggerSubscriptionExpiryNotification(
      subscription.id,
      {
        customerName: customerProfile?.full_name || 'Customer',
        customerPhone: customerProfile?.phone || null,
        customerEmail: customerProfile?.email || null,
        planName: subscription.plan?.name || 'Tiffin Plan',
        endDate: subscription.end_date,
        daysRemaining: diffDays,
        isExpired,
      },
      userId
    );
  } catch (err) {
    console.warn('[Notification Service] Automatic expiry check error:', err);
  }
}

/**
 * Safe wrapper to invoke Supabase Edge Functions without breaking client flow or CORS preflight failures
 */
async function invokeEdgeFunctionSafe(action: string, orderId: string | null, payload: any): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke('notify', {
      body: {
        action,
        orderId: orderId || undefined,
        payload,
      },
    });
    if (error) {
      // Non-blocking log
    }
  } catch (_) {
    // Non-blocking fallback if edge function is not deployed on Supabase project
  }
}

/**
 * Dispatches Subscription Expiry / Renewal Notification to Customer via Phone SMS, Email, and In-App
 */
export async function triggerSubscriptionExpiryNotification(
  subscriptionId: string,
  payload: SubscriptionExpiryNotificationPayload,
  userId: string
): Promise<{ success: boolean; whatsappUrl?: string; messageText?: string }> {
  try {
    const isExpired = payload.isExpired || (payload.daysRemaining !== undefined && payload.daysRemaining < 0);
    const title = isExpired
      ? '⚠️ Your Tiffin Subscription has Expired'
      : payload.daysRemaining === 0
      ? '⏰ Your Subscription Expires Today!'
      : `⏰ Your Subscription Expires in ${payload.daysRemaining} Days`;

    const message = isExpired
      ? `Your ${payload.planName} ended on ${payload.endDate}. Renew now to continue hot homestyle meal deliveries in Nagpur.`
      : `Your ${payload.planName} is valid until ${payload.endDate}. Renew today for uninterrupted service.`;

    // 1. Direct In-App Notification insertion to database
    if (userId) {
      await createInAppNotification({
        userId,
        title,
        message,
        type: isExpired ? 'subscription_expired' : 'subscription_expiring',
      });
    }

    // 2. Safe Edge Function Dispatch (SMS & Email)
    const actionType = isExpired ? 'customer_subscription_expired' : 'customer_subscription_expiring';
    await invokeEdgeFunctionSafe(actionType, null, payload);

    // 3. Client-side audit log in notification_logs with upsert (resolves 409 Conflict)
    try {
      const recipient = payload.customerPhone || payload.customerEmail || userId || 'customer';
      await supabase.from('notification_logs').upsert(
        {
          event_key: `sub_alert:${subscriptionId}:${payload.endDate}`,
          event_type: actionType,
          recipient,
          channel: 'in_app',
          order_id: null,
          status: 'sent',
          error_message: null,
          payload,
          created_at: new Date().toISOString(),
        },
        { onConflict: 'event_key,channel,recipient' }
      );
    } catch (_) {}

    // 4. Generate WhatsApp Link & Message
    const messageText = generateProfessionalRenewalMessage({
      customerName: payload.customerName,
      planName: payload.planName,
      endDate: payload.endDate,
      daysRemaining: payload.daysRemaining,
      isExpired: payload.isExpired,
    });

    let whatsappUrl: string | undefined = undefined;
    if (payload.customerPhone) {
      whatsappUrl = buildWhatsAppRenewalUrl({
        phone: payload.customerPhone,
        customerName: payload.customerName,
        planName: payload.planName,
        endDate: payload.endDate,
        daysRemaining: payload.daysRemaining,
        isExpired: payload.isExpired,
      });
    }

    return { success: true, whatsappUrl, messageText };
  } catch (err: any) {
    console.warn('[Notification Service] Error sending subscription expiry notification:', err);
    return { success: false };
  }
}

/**
 * Dispatches Admin Email + SMS notification for newly placed orders, plus in-app alerts.
 */
export async function triggerAdminNewOrderNotification(
  orderId: string,
  payload: NewOrderNotificationPayload,
  userId?: string
): Promise<void> {
  try {
    const shortId = orderId.slice(0, 8);

    if (userId) {
      createInAppNotification({
        userId,
        title: '🍱 Order Placed Successfully!',
        message: `Your order #${shortId} (₹${payload.amount}) has been received and is pending verification.`,
        type: 'order_placed',
        orderId,
      });
    }

    try {
      const { data: admins } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin');

      if (admins && admins.length > 0) {
        for (const admin of admins) {
          createInAppNotification({
            userId: admin.id,
            title: `🍱 New Order #${shortId} Received!`,
            message: `New order from ${payload.customerName} of ₹${payload.amount}.`,
            type: 'admin_new_order',
            orderId,
          });
        }
      }
    } catch (_) {}

    await invokeEdgeFunctionSafe('admin_new_order', orderId, payload);
  } catch (err: any) {
    console.warn('[Notification Service] Background notification dispatch:', err.message);
  }
}

/**
 * Dispatches Customer Confirmation Email and in-app alerts when Admin confirms an order.
 */
export async function triggerCustomerOrderConfirmedNotification(
  orderId: string,
  payload: OrderConfirmedNotificationPayload,
  userId?: string
): Promise<void> {
  try {
    const shortId = orderId.slice(0, 8);

    if (userId) {
      createInAppNotification({
        userId,
        title: '🎉 Order Confirmed!',
        message: `Your order #${shortId} (₹${payload.amount}) has been confirmed by Nimje Gharchi Rasoi!`,
        type: 'order_confirmed',
        orderId,
      });
    }

    await invokeEdgeFunctionSafe('customer_order_confirmed', orderId, payload);
  } catch (err: any) {
    console.warn('[Notification Service] Customer notification dispatch:', err.message);
  }
}

/**
 * Dispatches Customer Cancellation Email and in-app alerts when Admin cancels an order.
 */
export async function triggerCustomerOrderCancelledNotification(
  orderId: string,
  payload: OrderCancelledNotificationPayload,
  userId?: string
): Promise<void> {
  try {
    const shortId = orderId.slice(0, 8);

    if (userId) {
      createInAppNotification({
        userId,
        title: '❌ Order Cancelled',
        message: `Your order #${shortId} was cancelled.${payload.reason ? ` Reason: ${payload.reason}` : ''}`,
        type: 'order_cancelled',
        orderId,
      });
    }

    await invokeEdgeFunctionSafe('customer_order_cancelled', orderId, payload);
  } catch (err: any) {
    console.warn('[Notification Service] Cancellation notification dispatch:', err.message);
  }
}

/**
 * Fetches in-app notifications for authenticated user.
 */
export async function fetchUserNotifications(userId: string): Promise<Notification[]> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return [];
      }
      return [];
    }

    return (data as Notification[]) || [];
  } catch (err) {
    return [];
  }
}

/**
 * Marks a single notification as read.
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
  } catch (err) {
    // Non-blocking
  }
}

/**
 * Marks all notifications as read for current user.
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  try {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
  } catch (err) {
    // Non-blocking
  }
}

/**
 * Subscribes to realtime in-app notifications for the logged-in user.
 */
export function subscribeToUserNotifications(
  userId: string,
  onNewNotification: (notification: Notification) => void
) {
  try {
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new) {
            onNewNotification(payload.new as Notification);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          // Channel error fallback
        }
      });

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (_) {}
    };
  } catch (err) {
    return () => {};
  }
}
