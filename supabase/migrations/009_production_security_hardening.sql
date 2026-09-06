-- ==============================================================================
-- NIMJE GHARCHI RASOI - MIGRATION 009: PRODUCTION SECURITY HARDENING & RLS LOCKDOWN
-- Copy and paste this into Supabase SQL Editor and click RUN
-- ==============================================================================

-- 1. SANITIZE & REMEDIATE ADMIN ROLES
-- Explicitly ensure ONLY the authorized owner email holds admin role
update public.profiles
set role = 'customer'
where lower(email) != 'tanikshnimje@gmail.com' and role = 'admin';

update public.profiles
set role = 'admin'
where lower(email) = 'tanikshnimje@gmail.com';

-- 2. HARDENED ADMIN VERIFICATION FUNCTION
create or replace function public.is_current_user_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- 3. HARDEN PAYMENTS TABLE RLS
alter table public.payments enable row level security;

-- Drop all old/conflicting payment policies
drop policy if exists "Users can view own payments" on public.payments;
drop policy if exists "Authenticated users can insert payments" on public.payments;
drop policy if exists "Admin and Server can update payments" on public.payments;
drop policy if exists "Anyone can read payments" on public.payments;
drop policy if exists "Admins can manage payments" on public.payments;
drop policy if exists "Customers can insert own pending payments" on public.payments;
drop policy if exists "Customers can submit utr for own pending payments" on public.payments;
drop policy if exists "Admins full access to payments" on public.payments;

-- SELECT: Customers view own payments, Admins view all
create policy "Users can view own payments"
  on public.payments for select
  using (auth.uid() = user_id or public.is_current_user_admin());

-- INSERT: Customers can only insert their own payments with 'pending' status
create policy "Customers can insert own pending payments"
  on public.payments for insert
  with check (
    (auth.uid() = user_id and status in ('pending', 'created'))
    or public.is_current_user_admin()
  );

-- UPDATE: Customers can ONLY transition their own payment from pending -> pending_verification (submitting UTR)
-- Customers CANNOT set status to 'paid', 'rejected', 'cancelled', or modify verification fields
create policy "Customers can submit utr for own pending payments"
  on public.payments for update
  using (
    auth.uid() = user_id and status = 'pending'
  )
  with check (
    auth.uid() = user_id 
    and status in ('pending', 'pending_verification')
    and verified_at is null
    and verified_by is null
    and rejection_reason is null
  );

-- UPDATE/DELETE for Admins: Full management capabilities
create policy "Admins full access to payments"
  on public.payments for all
  using (public.is_current_user_admin())
  with check (public.is_current_user_admin());


-- 4. HARDEN SUBSCRIPTIONS TABLE RLS
alter table public.subscriptions enable row level security;

drop policy if exists "Users can view own subscriptions" on public.subscriptions;
drop policy if exists "Users can insert own subscriptions" on public.subscriptions;
drop policy if exists "Users or Admin can update subscriptions" on public.subscriptions;
drop policy if exists "Customers can view own subscriptions" on public.subscriptions;
drop policy if exists "Customers can insert own pending subscriptions" on public.subscriptions;
drop policy if exists "Admins can manage subscriptions" on public.subscriptions;

-- SELECT: Customers can only view their own subscriptions, Admins view all
create policy "Customers can view own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = user_id or public.is_current_user_admin());

-- INSERT: Customers can only create 'pending' subscriptions for themselves
create policy "Customers can insert own pending subscriptions"
  on public.subscriptions for insert
  with check (
    (auth.uid() = user_id and status = 'pending' and payment_status = 'pending')
    or public.is_current_user_admin()
  );

-- UPDATE/DELETE: STRICTLY ADMINS ONLY. Customers CANNOT activate or alter subscription dates/amounts
create policy "Admins can manage subscriptions"
  on public.subscriptions for all
  using (public.is_current_user_admin())
  with check (public.is_current_user_admin());


-- 5. HARDEN ORDERS TABLE RLS
alter table public.orders enable row level security;

drop policy if exists "Users can view own orders" on public.orders;
drop policy if exists "Users can insert own orders" on public.orders;
drop policy if exists "Admin can update orders" on public.orders;
drop policy if exists "Admins can update orders" on public.orders;
drop policy if exists "Users or Admin can update orders" on public.orders;
drop policy if exists "Customers can view own orders" on public.orders;
drop policy if exists "Customers can insert own pending orders" on public.orders;
drop policy if exists "Admins can manage orders" on public.orders;

-- SELECT: Customers view own orders, Admins view all
create policy "Customers can view own orders"
  on public.orders for select
  using (auth.uid() = user_id or public.is_current_user_admin());

-- INSERT: Customers can only create 'pending' orders for themselves
create policy "Customers can insert own pending orders"
  on public.orders for insert
  with check (
    (auth.uid() = user_id and status = 'pending')
    or public.is_current_user_admin()
  );

-- UPDATE/DELETE: STRICTLY ADMINS ONLY. Customers CANNOT confirm, deliver, or manipulate prices/orders
create policy "Admins can manage orders"
  on public.orders for all
  using (public.is_current_user_admin())
  with check (public.is_current_user_admin());


-- 6. HARDEN ORDER_ITEMS TABLE RLS
alter table public.order_items enable row level security;

drop policy if exists "Users can view order items for own orders" on public.order_items;
drop policy if exists "Users can insert items for own pending orders" on public.order_items;
drop policy if exists "Admins can manage order items" on public.order_items;

-- SELECT: Users can view items belonging to their own orders
create policy "Users can view order items for own orders"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (o.user_id = auth.uid() or public.is_current_user_admin())
    )
  );

-- INSERT: Users can insert items for their own pending orders
create policy "Users can insert items for own pending orders"
  on public.order_items for insert
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and o.user_id = auth.uid()
        and o.status = 'pending'
    )
    or public.is_current_user_admin()
  );

-- UPDATE/DELETE: STRICTLY ADMINS ONLY
create policy "Admins can manage order items"
  on public.order_items for all
  using (public.is_current_user_admin())
  with check (public.is_current_user_admin());


-- 7. REFRESH SCHEMA CACHE
notify pgrst, 'reload schema';
notify pgrst, 'reload config';
