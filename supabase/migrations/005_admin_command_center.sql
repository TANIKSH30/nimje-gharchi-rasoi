-- ==============================================================================
-- NIMJE GHARCHI RASOI - MIGRATION 005: ADMIN COMMAND CENTER & MENU MANAGEMENT
-- Additive, Non-destructive, Idempotent
-- ==============================================================================

-- 1. MENU MANAGEMENT TABLE
create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  menu_date date not null default current_date,
  meal_type text not null check (meal_type in ('morning', 'evening', 'special')),
  dish_name text not null,
  description text,
  is_veg boolean not null default true,
  price numeric(10, 2) default 0 check (price >= 0),
  is_available boolean not null default true,
  is_special boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_menu_items_date on public.menu_items(menu_date);
create index if not exists idx_menu_items_meal_type on public.menu_items(meal_type);
create index if not exists idx_menu_items_available on public.menu_items(is_available);

-- 2. ADMIN AUDIT TRAIL LOGS
create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.profiles(id) on delete set null,
  admin_email text,
  action text not null,
  target_type text not null,
  target_id text,
  details jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_created_at on public.admin_audit_logs(created_at desc);
create index if not exists idx_audit_logs_target on public.admin_audit_logs(target_type, target_id);
create index if not exists idx_audit_logs_admin on public.admin_audit_logs(admin_id);

-- 3. BUSINESS SETTINGS TABLE
create table if not exists public.business_settings (
  id text primary key default 'default',
  business_name text not null default 'Nimje Gharchi Rasoi',
  payee_name text not null default 'Taniksh Nimje',
  upi_id text not null default 'tanikshnimje@okaxis',
  payment_instructions text default 'Scan the QR code using any UPI App (Google Pay, PhonePe, Paytm, BHIM, Cred, etc.). After successful payment, enter the 12-digit UTR / Transaction ID below.',
  phone text default '+91 78230 98970',
  email text default 'tanikshnimje@gmail.com',
  location text default 'Near Reshimbagh / Civil Lines, Nagpur, Maharashtra',
  lunch_slot text default '11:30 AM – 1:30 PM',
  dinner_slot text default '7:30 PM – 9:30 PM',
  order_cutoff_morning text default '09:00 AM',
  order_cutoff_evening text default '05:00 PM',
  updated_at timestamptz not null default now()
);

-- Seed default settings row if not present
insert into public.business_settings (id, business_name, payee_name, upi_id)
values ('default', 'Nimje Gharchi Rasoi', 'Taniksh Nimje', 'tanikshnimje@okaxis')
on conflict (id) do nothing;

-- 4. RLS POLICIES FOR NEW TABLES
alter table public.menu_items enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.business_settings enable row level security;

-- Menu items: Anyone can view available items
drop policy if exists "Anyone can view menu items" on public.menu_items;
create policy "Anyone can view menu items"
  on public.menu_items for select
  using (true);

-- Menu items: Only admins can insert/update/delete
drop policy if exists "Admins can manage menu items" on public.menu_items;
create policy "Admins can manage menu items"
  on public.menu_items for all
  using (public.is_current_user_admin())
  with check (public.is_current_user_admin());

-- Audit logs: Only admins can view and insert
drop policy if exists "Admins can view audit logs" on public.admin_audit_logs;
create policy "Admins can view audit logs"
  on public.admin_audit_logs for select
  using (public.is_current_user_admin());

drop policy if exists "Admins can insert audit logs" on public.admin_audit_logs;
create policy "Admins can insert audit logs"
  on public.admin_audit_logs for insert
  with check (public.is_current_user_admin());

-- Business Settings: Public can read, Admins can manage
drop policy if exists "Public can read business settings" on public.business_settings;
create policy "Public can read business settings"
  on public.business_settings for select
  using (true);

drop policy if exists "Admins can update business settings" on public.business_settings;
create policy "Admins can update business settings"
  on public.business_settings for all
  using (public.is_current_user_admin())
  with check (public.is_current_user_admin());

-- 5. INITIAL SAMPLE MENU SEED (If table is currently empty)
insert into public.menu_items (menu_date, meal_type, dish_name, description, is_veg, price, is_available, is_special)
select current_date, 'morning', 'Kande Pohe & Filter Chai', 'Authentic Maharashtrian spiced flattened rice with roasted peanuts, lemon & fresh coriander.', true, 0, true, false
where not exists (select 1 from public.menu_items where menu_date = current_date and meal_type = 'morning');

insert into public.menu_items (menu_date, meal_type, dish_name, description, is_veg, price, is_available, is_special)
select current_date, 'evening', 'Nagpuri Saoji Dal, Jeera Rice & 4 Chapatis', 'Traditional homestyle lentil curry cooked with freshly ground spices, served with steaming rice & soft phulkas.', true, 0, true, false
where not exists (select 1 from public.menu_items where menu_date = current_date and meal_type = 'evening');

insert into public.menu_items (menu_date, meal_type, dish_name, description, is_veg, price, is_available, is_special)
select current_date, 'special', 'Special Matar Paneer & Gulab Jamun', 'Rich cottage cheese in creamy tomato gravy with soft peas, served with 2 hot gulab jamuns.', true, 180, true, true
where not exists (select 1 from public.menu_items where menu_date = current_date and meal_type = 'special');
