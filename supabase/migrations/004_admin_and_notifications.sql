-- ==============================================================================
-- NIMJE GHARCHI RASOI - MIGRATION 004: ADMIN IDENTITY, NOTIFICATIONS & AUDIT LOGS
-- ==============================================================================

-- 1. EXPLICIT ADMIN PROVISIONING
-- Provision existing account for tanikshnimje@gmail.com with admin privileges securely
update public.profiles
set role = 'admin'
where lower(email) = 'tanikshnimje@gmail.com';

-- 2. CREATE NOTIFICATIONS TABLE (In-app customer & admin alerts)
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null default 'general',
  order_id uuid references public.orders(id) on delete set null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_is_read on public.notifications(user_id, is_read);
create index if not exists idx_notifications_created_at on public.notifications(created_at desc);

-- 3. CREATE NOTIFICATION LOGS TABLE (For Idempotency, Failure Tracking & Audit)
create table if not exists public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  event_key text not null, -- e.g. 'order_created:<uuid>' or 'order_confirmed:<uuid>'
  event_type text not null,
  recipient text not null,
  channel text not null check (channel in ('email', 'sms', 'in_app')),
  order_id uuid references public.orders(id) on delete cascade,
  status text not null check (status in ('sent', 'failed', 'skipped', 'queued')),
  error_message text,
  payload jsonb,
  created_at timestamptz not null default now()
);

-- Unique index prevents duplicate notifications across retries/page refreshes
create unique index if not exists idx_notification_logs_dedup 
  on public.notification_logs(event_key, channel, recipient);

create index if not exists idx_notification_logs_order_id 
  on public.notification_logs(order_id);

-- 4. ROW LEVEL SECURITY (RLS) FOR NOTIFICATIONS
alter table public.notifications enable row level security;
alter table public.notification_logs enable row level security;

-- Customers can only read their own notifications (or admin can read all)
drop policy if exists "Users can read own notifications" on public.notifications;
create policy "Users can read own notifications"
  on public.notifications for select
  using (auth.uid() = user_id or public.is_current_user_admin());

-- Customers can only update their own notifications (e.g., mark as read)
drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id or public.is_current_user_admin())
  with check (auth.uid() = user_id or public.is_current_user_admin());

-- Users can insert notifications for themselves, admins can insert for any user
drop policy if exists "Admins can insert notifications" on public.notifications;
drop policy if exists "Users and Admins can insert notifications" on public.notifications;
create policy "Users and Admins can insert notifications"
  on public.notifications for insert
  with check (auth.uid() = user_id or public.is_current_user_admin());

-- Notification logs are only readable/writable by admin or service role
drop policy if exists "Admins can view notification logs" on public.notification_logs;
create policy "Admins can view notification logs"
  on public.notification_logs for select
  using (public.is_current_user_admin());

drop policy if exists "Admins can manage notification logs" on public.notification_logs;
create policy "Admins can manage notification logs"
  on public.notification_logs for all
  using (public.is_current_user_admin());

-- 5. ORDER STATUS RLS REINFORCEMENT
-- Ensure customers cannot mark their own orders as 'confirmed', 'delivered', etc.
drop policy if exists "Admin can update orders" on public.orders;
drop policy if exists "Admins can update orders" on public.orders;
drop policy if exists "Users or Admin can update orders" on public.orders;

create policy "Admins can update orders"
  on public.orders for update
  using (public.is_current_user_admin())
  with check (public.is_current_user_admin());

-- 6. DATABASE TRIGGER FOR CUSTOMER IN-APP NOTIFICATIONS
-- Trigger executes purely within PostgreSQL and does NOT make external network/API calls
create or replace function public.handle_order_status_notification()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_short_id text;
begin
  v_short_id := substring(new.id::text, 1, 8);

  -- Only trigger on status change
  if (old.status is distinct from new.status) then
    if new.status = 'confirmed' then
      insert into public.notifications (user_id, title, message, type, order_id)
      values (
        new.user_id,
        'Order Confirmed! 🎉',
        'Your order #' || v_short_id || ' has been confirmed by Nimje Gharchi Rasoi.',
        'order_confirmed',
        new.id
      );
    elsif new.status = 'preparing' then
      insert into public.notifications (user_id, title, message, type, order_id)
      values (
        new.user_id,
        'Meal Being Prepared 👨‍🍳',
        'Your fresh meal for order #' || v_short_id || ' is being cooked.',
        'order_preparing',
        new.id
      );
    elsif new.status = 'out_for_delivery' then
      insert into public.notifications (user_id, title, message, type, order_id)
      values (
        new.user_id,
        'Tiffin Out for Delivery 🛵',
        'Your meal delivery for order #' || v_short_id || ' is on the way!',
        'out_for_delivery',
        new.id
      );
    elsif new.status = 'delivered' then
      insert into public.notifications (user_id, title, message, type, order_id)
      values (
        new.user_id,
        'Meal Delivered 🍱',
        'Your order #' || v_short_id || ' has been delivered. Enjoy your meal!',
        'delivered',
        new.id
      );
    elsif new.status = 'cancelled' then
      insert into public.notifications (user_id, title, message, type, order_id)
      values (
        new.user_id,
        'Order Cancelled',
        'Your order #' || v_short_id || ' was cancelled.',
        'order_cancelled',
        new.id
      );
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trigger_order_status_notification on public.orders;
create trigger trigger_order_status_notification
  after update of status on public.orders
  for each row execute procedure public.handle_order_status_notification();
