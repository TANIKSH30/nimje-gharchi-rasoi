-- ==============================================================================
-- NIMJE GHARCHI RASOI - MIGRATION 008: SPECIAL ORDERS SYSTEM SCHEMA
-- Run this script in your Supabase SQL Editor
-- ==============================================================================

-- 1. CREATE SPECIAL ORDER PRODUCTS TABLE
create table if not exists public.special_order_products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text not null check (category in ('roti', 'veg', 'non_veg', 'rice_dal', 'sweets', 'bulk_party', 'other')),
  image_url text,
  price numeric(10, 2) not null check (price >= 0),
  unit text not null default 'pcs',
  pricing_unit_step numeric(10, 2) not null default 1.0 check (pricing_unit_step > 0),
  min_quantity numeric(10, 2) not null default 1.0 check (min_quantity > 0),
  max_quantity numeric(10, 2) not null default 100.0 check (max_quantity >= min_quantity),
  quantity_step numeric(10, 2) not null default 1.0 check (quantity_step > 0),
  is_available boolean not null default true,
  advance_notice_hours integer not null default 24 check (advance_notice_hours >= 0),
  allow_instructions boolean not null default true,
  display_order integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists idx_special_order_products_cat on public.special_order_products(category);
create index if not exists idx_special_order_products_avail on public.special_order_products(is_available);
create index if not exists idx_special_order_products_order on public.special_order_products(display_order);

-- 2. EXTEND ORDERS TABLE WITH DELIVERY SCHEDULE FIELDS
alter table public.orders
  add column if not exists required_date date,
  add column if not exists preferred_time text;

-- 3. EXTEND ORDER ITEMS TABLE WITH SNAPSHOT & DECIMAL QUANTITY SUPPORT
-- Support decimal quantities like 0.5 kg, 1.5 kg
alter table public.order_items
  alter column quantity type numeric(10, 2);

alter table public.order_items
  add column if not exists unit_snapshot text default 'pcs',
  add column if not exists product_id uuid references public.special_order_products(id) on delete set null;

-- 4. ATTACH UPDATED_AT TRIGGER
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trigger_special_order_products_updated_at on public.special_order_products;
create trigger trigger_special_order_products_updated_at
  before update on public.special_order_products
  for each row execute procedure public.handle_updated_at();

-- 5. ROW LEVEL SECURITY (RLS)
alter table public.special_order_products enable row level security;

drop policy if exists "Anyone can view available special order products" on public.special_order_products;
drop policy if exists "Admins can manage special order products" on public.special_order_products;
drop policy if exists "Admins can insert special order products" on public.special_order_products;
drop policy if exists "Admins can update special order products" on public.special_order_products;
drop policy if exists "Admins can delete special order products" on public.special_order_products;

-- Public read for active items or admin viewing all
create policy "Anyone can view available special order products"
  on public.special_order_products for select
  using (is_available = true or public.is_current_user_admin());

-- Admin write policies
create policy "Admins can insert special order products"
  on public.special_order_products for insert
  with check (public.is_current_user_admin());

create policy "Admins can update special order products"
  on public.special_order_products for update
  using (public.is_current_user_admin())
  with check (public.is_current_user_admin());

create policy "Admins can delete special order products"
  on public.special_order_products for delete
  using (public.is_current_user_admin());

-- 6. SEED INITIAL SPECIAL ORDER PRODUCTS
insert into public.special_order_products (
  name, description, category, image_url, price, unit, pricing_unit_step, min_quantity, max_quantity, quantity_step, is_available, advance_notice_hours, display_order
)
values
  (
    'Fresh Whole-Wheat Phulka Rotis',
    'Soft, hot homemade rotis made from 100% whole wheat with light desi ghee brushing.',
    'roti',
    'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=800&auto=format&fit=crop&q=80',
    120.00,
    'pcs',
    10.0,
    10.0,
    200.0,
    10.0,
    true,
    12,
    1
  ),
  (
    'Nagpur Authentic Saoji Chicken Curry',
    'Signature hot and spicy Saoji-style homestyle chicken curry cooked with slow-roasted spices and tender country chicken.',
    'non_veg',
    'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800&auto=format&fit=crop&q=80',
    480.00,
    'kg',
    1.0,
    0.5,
    10.0,
    0.5,
    true,
    24,
    2
  ),
  (
    'Kolhapuri Chicken Sukka',
    'Rich dry-roasted chicken tossed with grated roasted coconut, garlic, and special roasted masala blend.',
    'non_veg',
    'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=800&auto=format&fit=crop&q=80',
    520.00,
    'kg',
    1.0,
    0.5,
    5.0,
    0.5,
    true,
    24,
    3
  ),
  (
    'Shahi Matar Paneer Masala',
    'Fresh soft cottage cheese cubes cooked in rich onion-tomato gravy with sweet garden green peas.',
    'veg',
    'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80',
    380.00,
    'kg',
    1.0,
    0.5,
    10.0,
    0.5,
    true,
    12,
    4
  ),
  (
    'Vidarbha Sev Bhaji (Nagpuri Tarri)',
    'Traditional Vidarbha spicy garlic-clove gravy served with crispy thick gram flour sev.',
    'veg',
    'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=800&auto=format&fit=crop&q=80',
    260.00,
    'kg',
    1.0,
    0.5,
    6.0,
    0.5,
    true,
    12,
    5
  ),
  (
    'Homestyle Dal Tadka (Desi Ghee)',
    'Golden yellow lentils slow-cooked and tempered with roasted cumin, browned garlic, green chilies, and pure ghee.',
    'rice_dal',
    'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&auto=format&fit=crop&q=80',
    220.00,
    'kg',
    1.0,
    0.5,
    10.0,
    0.5,
    true,
    12,
    6
  ),
  (
    'Fragrant Jeera Basmati Rice',
    'Fluffy long-grain royal basmati rice tempered with whole roasted cumin seeds and fresh coriander leaves.',
    'rice_dal',
    'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&auto=format&fit=crop&q=80',
    180.00,
    'kg',
    1.0,
    0.5,
    10.0,
    0.5,
    true,
    12,
    7
  ),
  (
    'Maharashtrian Puran Poli (Desi Ghee)',
    'Traditional festive Maharashtrian flatbread stuffed with sweet cooked chana dal, organic jaggery, cardamom, and nutmeg.',
    'sweets',
    'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80',
    240.00,
    'pcs',
    5.0,
    5.0,
    50.0,
    5.0,
    true,
    24,
    8
  ),
  (
    'Hot Gulab Jamun (Pure Mawa)',
    'Melt-in-mouth milk solid dumplings fried to golden perfection and soaked in warm cardamom saffron syrup.',
    'sweets',
    'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80',
    220.00,
    'pcs',
    10.0,
    10.0,
    100.0,
    10.0,
    true,
    12,
    9
  ),
  (
    'Mini Party Feast Pack (Tray Delivery)',
    'Complete party pack per plate: 4 Phulkas + 1 Paneer/Chicken Sabji + 1 Dry Veg Sabji + Dal Tadka + Jeera Rice + Sweet + Salad.',
    'bulk_party',
    'https://images.unsplash.com/photo-1613292443284-8d10ef9383fe?w=800&auto=format&fit=crop&q=80',
    190.00,
    'plate',
    1.0,
    5.0,
    100.0,
    5.0,
    true,
    24,
    10
  )
on conflict do nothing;
