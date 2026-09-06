-- ==============================================================================
-- NIMJE GHARCHI RASOI - COMPLETE PRODUCTION DATABASE SCHEMA
-- PostgreSQL + Supabase Auth + RLS + Triggers + Indexes
-- ==============================================================================

-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. Drop existing triggers and tables if re-running (safe initialization)
-- Note: Drop child tables first
drop table if exists public.order_items cascade;
drop table if exists public.payments cascade;
drop table if exists public.orders cascade;
drop table if exists public.subscriptions cascade;
drop table if exists public.addresses cascade;
drop table if exists public.addons cascade;
drop table if exists public.plans cascade;
drop table if exists public.profiles cascade;

-- ==============================================================================
-- 3. PROFILES TABLE (Linked to auth.users)
-- ==============================================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text not null,
  phone text,
  role text not null check (role in ('customer', 'admin')) default 'customer',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for profiles
create index idx_profiles_role on public.profiles(role);
create index idx_profiles_email on public.profiles(email);

-- ==============================================================================
-- 4. ADDRESSES TABLE
-- ==============================================================================
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  phone text not null,
  address_line text not null,
  area text not null,
  city text not null default 'Nagpur',
  state text not null default 'Maharashtra',
  pincode text not null,
  landmark text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_addresses_user_id on public.addresses(user_id);

-- ==============================================================================
-- 5. PLANS TABLE
-- ==============================================================================
create table public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  plan_type text not null check (plan_type in ('daily', 'weekly', 'monthly')),
  meal_type text not null check (meal_type in ('full', 'half', 'morning', 'evening', 'both')),
  price numeric(10, 2) not null check (price >= 0),
  discounted_price numeric(10, 2) check (discounted_price >= 0),
  duration_days integer not null check (duration_days > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_plans_active on public.plans(is_active);
create index idx_plans_type on public.plans(plan_type);

-- ==============================================================================
-- 6. ADDONS TABLE (Special meals / Extra items)
-- ==============================================================================
create table public.addons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text not null default 'addon',
  price numeric(10, 2) not null check (price >= 0),
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_addons_available on public.addons(is_available);

-- ==============================================================================
-- 7. SUBSCRIPTIONS TABLE
-- ==============================================================================
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_id uuid not null references public.plans(id),
  address_id uuid references public.addresses(id) on delete set null,
  start_date date not null,
  end_date date not null,
  status text not null check (status in ('pending', 'active', 'paused', 'expired', 'cancelled')) default 'pending',
  amount numeric(10, 2) not null check (amount >= 0),
  payment_status text not null check (payment_status in ('pending', 'paid', 'failed', 'refunded')) default 'pending',
  delivery_time text not null check (delivery_time in ('morning', 'evening', 'both')) default 'morning',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_subscriptions_user_id on public.subscriptions(user_id);
create index idx_subscriptions_status on public.subscriptions(status);
create index idx_subscriptions_dates on public.subscriptions(start_date, end_date);

-- ==============================================================================
-- 8. ORDERS TABLE
-- ==============================================================================
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  address_id uuid references public.addresses(id) on delete set null,
  order_date date not null default current_date,
  meal_type text not null default 'full',
  order_type text not null check (order_type in ('subscription_delivery', 'special_order', 'addon')) default 'subscription_delivery',
  subtotal numeric(10, 2) not null default 0 check (subtotal >= 0),
  addon_amount numeric(10, 2) not null default 0 check (addon_amount >= 0),
  total_amount numeric(10, 2) not null default 0 check (total_amount >= 0),
  status text not null check (status in ('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled')) default 'pending',
  special_instructions text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_orders_user_id on public.orders(user_id);
create index idx_orders_order_date on public.orders(order_date);
create index idx_orders_status on public.orders(status);
create index idx_orders_created_at on public.orders(created_at desc);

-- ==============================================================================
-- 9. ORDER ITEMS TABLE
-- ==============================================================================
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  item_name text not null,
  item_type text not null default 'addon',
  quantity integer not null check (quantity > 0) default 1,
  unit_price numeric(10, 2) not null check (unit_price >= 0) default 0,
  total_price numeric(10, 2) not null check (total_price >= 0) default 0,
  created_at timestamptz not null default now()
);

create index idx_order_items_order_id on public.order_items(order_id);

-- ==============================================================================
-- 10. PAYMENTS TABLE (UPI QR & Manual UTR Verification + Historical Records)
-- ==============================================================================
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  payment_reference text unique,
  amount numeric(10, 2) not null check (amount >= 0),
  currency text not null default 'INR',
  status text not null check (status in ('created', 'pending', 'pending_verification', 'paid', 'rejected', 'failed', 'cancelled', 'refunded')) default 'pending',
  payment_method text not null default 'upi_qr',
  utr text,
  upi_id text,
  submitted_at timestamptz,
  verified_at timestamptz,
  verified_by uuid references public.profiles(id) on delete set null,
  rejection_reason text,
  -- Historical Razorpay columns preserved for archive
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_payments_user_id on public.payments(user_id);
create index idx_payments_reference on public.payments(payment_reference);
create index idx_payments_utr on public.payments(utr);
create unique index idx_payments_unique_active_utr on public.payments(utr) where utr is not null and status in ('pending_verification', 'paid');
create index idx_payments_status on public.payments(status);
create index idx_payments_created_at on public.payments(created_at desc);

-- ==============================================================================
-- 10B. BUSINESS SETTINGS TABLE (Dynamic UPI ID, Service Timings & Config)
-- ==============================================================================
create table public.business_settings (
  id text primary key default 'default',
  business_name text not null default 'Nimje Gharchi Rasoi',
  payee_name text not null default 'Taniksh Nimje',
  upi_id text not null default 'tanikshnimje@okaxis',
  payment_instructions text default 'Scan the QR code using any UPI App (Google Pay, PhonePe, Paytm, BHIM, Cred, etc.). After successful payment, enter the 12-digit UTR / Transaction ID below.',
  phone text default '+91 78230 98970',
  email text default 'contact@nimjegharchirasoi.com',
  location text default 'Near Reshimbagh / Civil Lines, Nagpur, Maharashtra',
  lunch_slot text default '11:30 AM – 1:30 PM',
  dinner_slot text default '7:30 PM – 9:30 PM',
  updated_at timestamptz not null default now()
);

insert into public.business_settings (id, business_name, payee_name, upi_id)
values ('default', 'Nimje Gharchi Rasoi', 'Taniksh Nimje', 'tanikshnimje@okaxis')
on conflict (id) do nothing;

-- ==============================================================================
-- 11. SECURITY DEFINER HELPER FUNCTION (Admin Check)
-- Prevents RLS recursive evaluation while guaranteeing security
-- ==============================================================================
create or replace function public.is_admin(user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = user_id and role = 'admin'
  );
$$;

-- Helper to check if current authenticated user is admin
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

-- ==============================================================================
-- 12. AUTOMATIC PROFILE CREATION TRIGGER (Email + Google Auth)
-- ==============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, phone, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    coalesce(new.raw_user_meta_data->>'phone', new.phone, null),
    'customer'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url),
    updated_at = now();
  return new;
end;
$$;

-- Attach trigger to auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update on auth.users
  for each row execute procedure public.handle_new_user();

-- Automatic updated_at column refresh trigger
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trigger_profiles_updated_at before update on public.profiles for each row execute procedure public.handle_updated_at();
create trigger trigger_addresses_updated_at before update on public.addresses for each row execute procedure public.handle_updated_at();
create trigger trigger_plans_updated_at before update on public.plans for each row execute procedure public.handle_updated_at();
create trigger trigger_subscriptions_updated_at before update on public.subscriptions for each row execute procedure public.handle_updated_at();
create trigger trigger_orders_updated_at before update on public.orders for each row execute procedure public.handle_updated_at();
create trigger trigger_payments_updated_at before update on public.payments for each row execute procedure public.handle_updated_at();

-- ==============================================================================
-- 13. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.plans enable row level security;
alter table public.addons enable row level security;
alter table public.subscriptions enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.business_settings enable row level security;

-- BUSINESS SETTINGS POLICIES
create policy "Anyone can read business settings"
  on public.business_settings for select
  using (true);

create policy "Only admins can update business settings"
  on public.business_settings for all
  using (public.is_current_user_admin());

-- PROFILES POLICIES
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id or public.is_current_user_admin());

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id or public.is_current_user_admin());

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id or public.is_current_user_admin())
  with check (
    -- Customer cannot escalate their own role to admin
    case when public.is_current_user_admin() then true else (role = 'customer') end
  );

create policy "Admins can insert or delete profiles"
  on public.profiles for all
  using (public.is_current_user_admin());

-- ADDRESSES POLICIES
create policy "Users can view own addresses"
  on public.addresses for select
  using (auth.uid() = user_id or public.is_current_user_admin());

create policy "Users can insert own addresses"
  on public.addresses for insert
  with check (auth.uid() = user_id or public.is_current_user_admin());

create policy "Users can update own addresses"
  on public.addresses for update
  using (auth.uid() = user_id or public.is_current_user_admin());

create policy "Users can delete own addresses"
  on public.addresses for delete
  using (auth.uid() = user_id or public.is_current_user_admin());

-- PLANS POLICIES (Public read active plans, Admin full control)
create policy "Anyone can view active plans"
  on public.plans for select
  using (is_active = true or public.is_current_user_admin());

create policy "Only admins can manage plans"
  on public.plans for all
  using (public.is_current_user_admin());

-- ADDONS POLICIES (Public read available addons, Admin full control)
create policy "Anyone can view available addons"
  on public.addons for select
  using (is_available = true or public.is_current_user_admin());

create policy "Only admins can manage addons"
  on public.addons for all
  using (public.is_current_user_admin());

-- SUBSCRIPTIONS POLICIES
create policy "Users can view own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = user_id or public.is_current_user_admin());

create policy "Users can insert own subscriptions"
  on public.subscriptions for insert
  with check (auth.uid() = user_id or public.is_current_user_admin());

create policy "Users or Admin can update subscriptions"
  on public.subscriptions for update
  using (auth.uid() = user_id or public.is_current_user_admin());

-- ORDERS POLICIES
create policy "Users can view own orders"
  on public.orders for select
  using (auth.uid() = user_id or public.is_current_user_admin());

create policy "Users can insert own orders"
  on public.orders for insert
  with check (auth.uid() = user_id or public.is_current_user_admin());

create policy "Admin can update orders"
  on public.orders for update
  using (public.is_current_user_admin() or auth.uid() = user_id);

-- ORDER ITEMS POLICIES
create policy "Users can view own order items"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
      and (orders.user_id = auth.uid() or public.is_current_user_admin())
    )
  );

create policy "Users can insert own order items"
  on public.order_items for insert
  with check (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
      and (orders.user_id = auth.uid() or public.is_current_user_admin())
    )
  );

-- PAYMENTS POLICIES
create policy "Users can view own payments"
  on public.payments for select
  using (auth.uid() = user_id or public.is_current_user_admin());

create policy "Authenticated users can insert payments"
  on public.payments for insert
  with check (auth.uid() = user_id or public.is_current_user_admin());

create policy "Admin and Server can update payments"
  on public.payments for update
  using (public.is_current_user_admin() or auth.uid() = user_id);

-- ==============================================================================
-- 14. SEED INITIAL PLANS AND ADD-ONS
-- ==============================================================================
insert into public.plans (name, description, plan_type, meal_type, price, discounted_price, duration_days, is_active)
values
  ('Monthly Full Tiffin', '4 Roti, Rice, Dal, 2 Sabji (1 Dry + 1 Gravy), Salad, Pickle & Sweet on Sunday', 'monthly', 'full', 3300.00, 3000.00, 30, true),
  ('Monthly Half Tiffin', '3 Roti, Rice, Dal, 1 Sabji, Salad & Pickle', 'monthly', 'half', 2600.00, 2400.00, 30, true),
  ('Weekly Full Tiffin', '7 Days complete homemade meal trial - 4 Roti, Rice, Dal, 2 Sabji & Salad', 'weekly', 'full', 950.00, 850.00, 7, true),
  ('Weekly Half Tiffin', '7 Days light meal - 3 Roti, Rice, Dal, 1 Sabji & Salad', 'weekly', 'half', 750.00, 650.00, 7, true),
  ('Daily Morning Full', 'Fresh warm lunch delivery - 4 Roti, Rice, Dal, 2 Sabji & Salad', 'daily', 'morning', 100.00, 90.00, 1, true),
  ('Daily Morning Half', 'Light lunch delivery - 3 Roti, Rice, Dal, 1 Sabji & Salad', 'daily', 'morning', 70.00, 60.00, 1, true),
  ('Daily Evening Full', 'Homestyle dinner - 4 Roti, Rice, Dal, 2 Sabji & Salad', 'daily', 'evening', 100.00, 90.00, 1, true),
  ('Daily Evening Half', 'Homestyle light dinner - 3 Roti, Rice, Dal, 1 Sabji & Salad', 'daily', 'evening', 70.00, 60.00, 1, true);

insert into public.addons (name, description, category, price, is_available)
values
  ('Extra Roti (Set of 2)', 'Hot whole-wheat phulkas with ghee', 'addon', 15.00, true),
  ('5 Extra Rotis', 'Pack of 5 soft whole-wheat phulkas', 'addon', 35.00, true),
  ('Special Paneer Sabji', 'Paneer Butter Masala / Matar Paneer portion', 'addon', 90.00, true),
  ('Special Non-Veg Sabji / Chicken Curry', 'Authentic Saoji / Maharashtrian style chicken curry', 'addon', 140.00, true),
  ('Dal Tadka (Extra Bowl)', 'Yellow lentils tempered with cumin, garlic and ghee', 'addon', 50.00, true),
  ('Jeera Rice (Extra Portion)', 'Fragrant basmati rice tossed with cumin', 'addon', 50.00, true),
  ('Gulab Jamun (2 pcs)', 'Hot sweet soft milk solids dumplings in sugar syrup', 'addon', 40.00, true),
  ('Curd / Dahi (Bowl)', 'Fresh chilled homemade curd', 'addon', 25.00, true);
