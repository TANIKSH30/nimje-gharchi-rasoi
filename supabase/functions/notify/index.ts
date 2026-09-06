import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-auth',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') || 'contact@nimjegharchirasoi.com';
const ADMIN_PHONE = Deno.env.get('ADMIN_PHONE') || '+917823098970';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';
const RESEND_FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') || 'Nimje Gharchi Rasoi <onboarding@resend.dev>';
const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID') || '';
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN') || '';
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER') || '';
const FAST2SMS_API_KEY = Deno.env.get('FAST2SMS_API_KEY') || '';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json();
    const { action, orderId, payload } = body;

    if (!action || !orderId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: action and orderId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results: any[] = [];

    // =========================================================================
    // EVENT 1: NEW ORDER CREATED -> NOTIFY ADMIN (Email + SMS)
    // =========================================================================
    if (action === 'admin_new_order') {
      const eventKey = `order_created:${orderId}`;

      // 1. Admin Email
      const emailResult = await handleEmailNotification({
        supabase,
        eventKey,
        eventType: 'admin_new_order_email',
        recipient: ADMIN_EMAIL,
        orderId,
        subject: `🍱 [New Order #${orderId.slice(0, 8)}] ₹${payload.amount} - ${payload.customerName}`,
        html: generateAdminNewOrderEmailHtml(orderId, payload),
      });
      results.push(emailResult);

      // 2. Admin SMS
      const smsMessage = `New order received - Order #${orderId.slice(0, 8)} - Customer: ${payload.customerName} (${payload.customerPhone || 'N/A'}) - Amount: ₹${payload.amount} - Payment: ${payload.paymentStatus || 'Pending'}. Please check admin dashboard.`;
      const smsResult = await handleSmsNotification({
        supabase,
        eventKey,
        eventType: 'admin_new_order_sms',
        recipient: ADMIN_PHONE,
        orderId,
        message: smsMessage,
      });
      results.push(smsResult);
    }

    // =========================================================================
    // EVENT 2: ADMIN CONFIRMS ORDER -> NOTIFY CUSTOMER (Email)
    // =========================================================================
    else if (action === 'customer_order_confirmed') {
      const eventKey = `order_confirmed:${orderId}`;
      const customerEmail = payload.customerEmail;

      if (customerEmail) {
        const emailResult = await handleEmailNotification({
          supabase,
          eventKey,
          eventType: 'customer_order_confirmed_email',
          recipient: customerEmail,
          orderId,
          subject: `🎉 Your Order #${orderId.slice(0, 8)} has been confirmed! - Nimje Gharchi Rasoi`,
          html: generateCustomerOrderConfirmedEmailHtml(orderId, payload),
        });
        results.push(emailResult);
      }
    }

    // =========================================================================
    // EVENT 3: ADMIN CANCELS ORDER -> NOTIFY CUSTOMER (Email)
    // =========================================================================
    else if (action === 'customer_order_cancelled') {
      const eventKey = `order_cancelled:${orderId}`;
      const customerEmail = payload.customerEmail;

      if (customerEmail) {
        const emailResult = await handleEmailNotification({
          supabase,
          eventKey,
          eventType: 'customer_order_cancelled_email',
          recipient: customerEmail,
          orderId,
          subject: `Order Update: Order #${orderId.slice(0, 8)} Cancelled - Nimje Gharchi Rasoi`,
          html: generateCustomerOrderCancelledEmailHtml(orderId, payload),
        });
        results.push(emailResult);
      }
    }

    // =========================================================================
    // EVENT 4: SUBSCRIPTION EXPIRING SOON -> NOTIFY CUSTOMER (SMS + Email)
    // =========================================================================
    else if (action === 'customer_subscription_expiring') {
      const eventKey = `sub_expiring:${orderId}:${payload.endDate}`;
      const customerPhone = payload.customerPhone;
      const customerEmail = payload.customerEmail;

      // 1. Send SMS reminder to customer
      if (customerPhone) {
        const smsMessage = `Namaste ${payload.customerName || 'Patron'} Ji! Aapka Nimje Gharchi Rasoi tiffin subscription (${payload.planName}) date ${payload.endDate} ko expire hone wala hai. Uninterrupted fresh meal delivery ke liye abhi renew karein: https://nimjegharchirasoi.com/checkout - Helpline: 7823098970`;
        const smsResult = await handleSmsNotification({
          supabase,
          eventKey,
          eventType: 'customer_sub_expiring_sms',
          recipient: customerPhone,
          orderId: null, // Subscriptions do not map to orders table fkey
          message: smsMessage,
        });
        results.push(smsResult);
      }

      // 2. Send Email reminder to customer
      if (customerEmail) {
        const emailResult = await handleEmailNotification({
          supabase,
          eventKey,
          eventType: 'customer_sub_expiring_email',
          recipient: customerEmail,
          orderId: null,
          subject: `⏰ Renewal Reminder: Your ${payload.planName} Expires on ${payload.endDate} - Nimje Gharchi Rasoi`,
          html: generateCustomerSubscriptionExpiringEmailHtml(payload),
        });
        results.push(emailResult);
      }
    }

    // =========================================================================
    // EVENT 5: SUBSCRIPTION EXPIRED -> NOTIFY CUSTOMER (SMS + Email)
    // =========================================================================
    else if (action === 'customer_subscription_expired') {
      const eventKey = `sub_expired:${orderId}:${payload.endDate}`;
      const customerPhone = payload.customerPhone;
      const customerEmail = payload.customerEmail;

      // 1. Send SMS notification
      if (customerPhone) {
        const smsMessage = `Namaste ${payload.customerName || 'Patron'} Ji! Aapka Nimje Gharchi Rasoi tiffin subscription (${payload.planName}) date ${payload.endDate} ko complete ho chuka hai. Ghar jaisa shuddh khana resume karne ke liye abhi renew karein: https://nimjegharchirasoi.com/checkout - Helpline: 7823098970`;
        const smsResult = await handleSmsNotification({
          supabase,
          eventKey,
          eventType: 'customer_sub_expired_sms',
          recipient: customerPhone,
          orderId: null, // Subscriptions do not map to orders table fkey
          message: smsMessage,
        });
        results.push(smsResult);
      }

      // 2. Send Email notification
      if (customerEmail) {
        const emailResult = await handleEmailNotification({
          supabase,
          eventKey,
          eventType: 'customer_sub_expired_email',
          recipient: customerEmail,
          orderId: null,
          subject: `⚠️ Important: Your Tiffin Subscription has Expired - Nimje Gharchi Rasoi`,
          html: generateCustomerSubscriptionExpiredEmailHtml(payload),
        });
        results.push(emailResult);
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Notification edge function error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Internal notification error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper: Check idempotency and send Email
async function handleEmailNotification(params: {
  supabase: any;
  eventKey: string;
  eventType: string;
  recipient: string;
  orderId: string;
  subject: string;
  html: string;
}) {
  const { supabase, eventKey, eventType, recipient, orderId, subject, html } = params;

  const { data: existingLog } = await supabase
    .from('notification_logs')
    .select('id, status')
    .eq('event_key', eventKey)
    .eq('channel', 'email')
    .eq('recipient', recipient)
    .maybeSingle();

  if (existingLog && existingLog.status === 'sent') {
    return { channel: 'email', recipient, status: 'skipped_duplicate', message: 'Notification already delivered.' };
  }

  if (!RESEND_API_KEY) {
    await supabase.from('notification_logs').upsert(
      {
        event_key: eventKey,
        event_type: eventType,
        recipient,
        channel: 'email',
        order_id: orderId,
        status: 'skipped',
        error_message: 'Email provider not configured (RESEND_API_KEY missing in environment)',
      },
      { onConflict: 'event_key,channel,recipient' }
    );
    return { channel: 'email', recipient, status: 'skipped_no_provider' };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: [recipient],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Resend API error (${res.status}): ${errText}`);
    }

    await supabase.from('notification_logs').upsert(
      {
        event_key: eventKey,
        event_type: eventType,
        recipient,
        channel: 'email',
        order_id: orderId,
        status: 'sent',
        error_message: null,
      },
      { onConflict: 'event_key,channel,recipient' }
    );

    return { channel: 'email', recipient, status: 'sent' };
  } catch (err: any) {
    console.error('Email dispatch error:', err);
    await supabase.from('notification_logs').upsert(
      {
        event_key: eventKey,
        event_type: eventType,
        recipient,
        channel: 'email',
        order_id: orderId,
        status: 'failed',
        error_message: err.message || 'Unknown email failure',
      },
      { onConflict: 'event_key,channel,recipient' }
    );
    return { channel: 'email', recipient, status: 'failed', error: err.message };
  }
}

// Helper: Check idempotency and send SMS
async function handleSmsNotification(params: {
  supabase: any;
  eventKey: string;
  eventType: string;
  recipient: string;
  orderId: string;
  message: string;
}) {
  const { supabase, eventKey, eventType, recipient, orderId, message } = params;

  const { data: existingLog } = await supabase
    .from('notification_logs')
    .select('id, status')
    .eq('event_key', eventKey)
    .eq('channel', 'sms')
    .eq('recipient', recipient)
    .maybeSingle();

  if (existingLog && existingLog.status === 'sent') {
    return { channel: 'sms', recipient, status: 'skipped_duplicate' };
  }

  if (!FAST2SMS_API_KEY && (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN)) {
    await supabase.from('notification_logs').upsert(
      {
        event_key: eventKey,
        event_type: eventType,
        recipient,
        channel: 'sms',
        order_id: orderId,
        status: 'skipped',
        error_message: 'SMS provider not configured (TWILIO / FAST2SMS keys missing in environment)',
      },
      { onConflict: 'event_key,channel,recipient' }
    );
    return { channel: 'sms', recipient, status: 'skipped_no_provider' };
  }

  try {
    if (FAST2SMS_API_KEY) {
      const cleanPhone = recipient.replace(/\D/g, '').slice(-10);
      const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': FAST2SMS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'q',
          message,
          language: 'english',
          flash: 0,
          numbers: cleanPhone,
        }),
      });
      if (!res.ok) throw new Error(`Fast2SMS failed: ${await res.text()}`);
    } else if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER) {
      const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
      const formattedTo = recipient.startsWith('+') ? recipient : `+91${recipient.replace(/\D/g, '').slice(-10)}`;
      const formData = new URLSearchParams();
      formData.append('To', formattedTo);
      formData.append('From', TWILIO_PHONE_NUMBER);
      formData.append('Body', message);

      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });
      if (!res.ok) throw new Error(`Twilio SMS failed: ${await res.text()}`);
    }

    await supabase.from('notification_logs').upsert(
      {
        event_key: eventKey,
        event_type: eventType,
        recipient,
        channel: 'sms',
        order_id: orderId,
        status: 'sent',
        error_message: null,
      },
      { onConflict: 'event_key,channel,recipient' }
    );
    return { channel: 'sms', recipient, status: 'sent' };
  } catch (err: any) {
    console.error('SMS dispatch error:', err);
    await supabase.from('notification_logs').upsert(
      {
        event_key: eventKey,
        event_type: eventType,
        recipient,
        channel: 'sms',
        order_id: orderId,
        status: 'failed',
        error_message: err.message || 'Unknown SMS failure',
      },
      { onConflict: 'event_key,channel,recipient' }
    );
    return { channel: 'sms', recipient, status: 'failed', error: err.message };
  }
}

// HTML Email Templates
function generateAdminNewOrderEmailHtml(orderId: string, p: any): string {
  const shortId = orderId.slice(0, 8);
  const itemsList = Array.isArray(p.items)
    ? p.items.map((i: any) => `<li><strong>${i.name || i.item_name}</strong> × ${i.quantity} (₹${i.price || i.unit_price})</li>`).join('')
    : '<li>Subscription Daily Tiffin</li>';

  return `
    <div style="font-family: Arial, sans-serif; background-color: #fdfaf6; padding: 24px; color: #2d2d2d;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #f0e6d6; overflow: hidden;">
        <div style="background-color: #d97706; padding: 20px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 22px;">🍱 New Order Received!</h1>
          <p style="margin: 4px 0 0 0; font-size: 14px;">Order #${shortId}</p>
        </div>
        <div style="padding: 24px;">
          <h3 style="margin-top: 0; color: #1f2937;">Customer Details:</h3>
          <p style="margin: 4px 0;"><strong>Name:</strong> ${p.customerName || 'Customer'}</p>
          <p style="margin: 4px 0;"><strong>Phone:</strong> ${p.customerPhone || 'N/A'}</p>
          <p style="margin: 4px 0;"><strong>Email:</strong> ${p.customerEmail || 'N/A'}</p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />

          <h3 style="color: #1f2937;">Order Summary:</h3>
          <p style="margin: 4px 0;"><strong>Order Type:</strong> ${p.orderType === 'subscription_delivery' ? 'Daily Tiffin Subscription' : 'Special Dish Order'}</p>
          <p style="margin: 4px 0;"><strong>Meal Type:</strong> ${p.mealType || 'Standard'}</p>
          <p style="margin: 4px 0;"><strong>Total Amount:</strong> <span style="font-size: 18px; color: #d97706; font-weight: bold;">₹${p.amount}</span></p>
          <p style="margin: 4px 0;"><strong>Payment Method:</strong> ${p.paymentMethod || 'UPI QR'}</p>
          <p style="margin: 4px 0;"><strong>Payment Status:</strong> ${p.paymentStatus || 'Pending Verification'}</p>
          ${p.utr ? `<p style="margin: 4px 0;"><strong>UPI UTR / Ref:</strong> <code>${p.utr}</code></p>` : ''}
          
          <h4 style="margin: 12px 0 6px 0;">Items Ordered:</h4>
          <ul style="padding-left: 20px; margin: 0;">${itemsList}</ul>

          ${p.address ? `
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
            <h3 style="color: #1f2937;">Delivery Address:</h3>
            <p style="margin: 4px 0;">${p.address.address_line || ''}, ${p.address.area || ''}, ${p.address.city || 'Nagpur'} - ${p.address.pincode || ''}</p>
            ${p.address.landmark ? `<p style="margin: 4px 0; color: #6b7280;"><em>Landmark: ${p.address.landmark}</em></p>` : ''}
          ` : ''}

          <div style="text-align: center; margin-top: 24px;">
            <a href="http://localhost:5173/admin/orders" style="display: inline-block; background-color: #d97706; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold;">Review in Admin Dashboard</a>
          </div>
        </div>
      </div>
    </div>
  `;
}

function generateCustomerOrderConfirmedEmailHtml(orderId: string, p: any): string {
  const shortId = orderId.slice(0, 8);
  return `
    <div style="font-family: Arial, sans-serif; background-color: #fdfaf6; padding: 24px; color: #2d2d2d;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #f0e6d6; overflow: hidden;">
        <div style="background-color: #16a34a; padding: 24px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px;">🎉 Order Confirmed!</h1>
          <p style="margin: 6px 0 0 0; font-size: 15px;">Your meal is being scheduled with care.</p>
        </div>
        <div style="padding: 24px;">
          <p style="font-size: 16px; margin-top: 0;">Namaste <strong>${p.customerName || 'Customer'}</strong>,</p>
          <p style="color: #4b5563; line-height: 1.5;">Your order <strong>#${shortId}</strong> has been confirmed by the kitchen team at <strong>Nimje Gharchi Rasoi</strong>.</p>
          <div style="text-align: center; margin-top: 24px;">
            <a href="http://localhost:5173/orders" style="display: inline-block; background-color: #16a34a; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold;">View Order Details</a>
          </div>
        </div>
      </div>
    </div>
  `;
}

function generateCustomerOrderCancelledEmailHtml(orderId: string, p: any): string {
  const shortId = orderId.slice(0, 8);
  return `
    <div style="font-family: Arial, sans-serif; background-color: #fdfaf6; padding: 24px; color: #2d2d2d;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #f0e6d6; overflow: hidden;">
        <div style="background-color: #ef4444; padding: 20px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 22px;">Order Cancelled</h1>
          <p style="margin: 4px 0 0 0; font-size: 14px;">Order #${shortId}</p>
        </div>
        <div style="padding: 24px;">
          <p style="font-size: 15px; margin-top: 0;">Hello <strong>${p.customerName || 'Customer'}</strong>,</p>
          <p style="color: #4b5563; line-height: 1.5;">Your order <strong>#${shortId}</strong> has been cancelled.</p>
          ${p.reason ? `<p style="margin: 8px 0; color: #ef4444;"><strong>Reason:</strong> ${p.reason}</p>` : ''}
        </div>
      </div>
    </div>
  `;
}

function generateCustomerSubscriptionExpiringEmailHtml(p: any): string {
  return `
    <div style="font-family: Arial, sans-serif; background-color: #fdfaf6; padding: 24px; color: #2d2d2d;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #f0e6d6; overflow: hidden;">
        <div style="background-color: #d97706; padding: 24px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 22px;">⏰ Subscription Expiry Reminder</h1>
          <p style="margin: 4px 0 0 0; font-size: 14px;">Nimje Gharchi Rasoi, Nagpur</p>
        </div>
        <div style="padding: 24px;">
          <p style="font-size: 16px; margin-top: 0;">Namaste <strong>${p.customerName || 'Customer'}</strong>,</p>
          <p style="color: #4b5563; line-height: 1.6;">
            Aapka tiffin subscription <strong>${p.planName}</strong> date <strong>${p.endDate}</strong> ko expire hone wala hai.
          </p>
          <p style="color: #4b5563; line-height: 1.6;">
            Daily fresh homestyle lunch & dinner bina kisi gap ke paane ke liye, kripya apna subscription abhi renew karein.
          </p>
          <div style="text-align: center; margin-top: 24px;">
            <a href="http://localhost:5173/checkout" style="display: inline-block; background-color: #d97706; color: white; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: bold; font-size: 15px;">Renew Subscription Now</a>
          </div>
          <p style="text-align: center; margin-top: 20px; font-size: 12px; color: #9ca3af;">Nimje Gharchi Rasoi • Contact: +91 78230 98970</p>
        </div>
      </div>
    </div>
  `;
}

function generateCustomerSubscriptionExpiredEmailHtml(p: any): string {
  return `
    <div style="font-family: Arial, sans-serif; background-color: #fdfaf6; padding: 24px; color: #2d2d2d;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #f0e6d6; overflow: hidden;">
        <div style="background-color: #dc2626; padding: 24px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 22px;">⚠️ Subscription Expired</h1>
          <p style="margin: 4px 0 0 0; font-size: 14px;">Nimje Gharchi Rasoi, Nagpur</p>
        </div>
        <div style="padding: 24px;">
          <p style="font-size: 16px; margin-top: 0;">Namaste <strong>${p.customerName || 'Customer'}</strong>,</p>
          <p style="color: #4b5563; line-height: 1.6;">
            Aapka tiffin subscription <strong>${p.planName}</strong> <strong>${p.endDate}</strong> ko expire ho chuka hai.
          </p>
          <p style="color: #4b5563; line-height: 1.6;">
            Ghar jaisa shuddh aur swadisht khana dobara shuru karne ke liye apna subscription abhi renew karein.
          </p>
          <div style="text-align: center; margin-top: 24px;">
            <a href="http://localhost:5173/plans" style="display: inline-block; background-color: #16a34a; color: white; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: bold; font-size: 15px;">Renew Subscription</a>
          </div>
          <p style="text-align: center; margin-top: 20px; font-size: 12px; color: #9ca3af;">Nimje Gharchi Rasoi • Contact: +91 78230 98970</p>
        </div>
      </div>
    </div>
  `;
}
