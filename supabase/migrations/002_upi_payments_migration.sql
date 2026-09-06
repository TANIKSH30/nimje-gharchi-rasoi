-- ==============================================================================
-- NIMJE GHARCHI RASOI - NON-DESTRUCTIVE ADDITIVE UPI PAYMENTS MIGRATION
-- Migration File: 002_upi_payments_migration.sql
-- PURPOSE:
-- 1. Adds missing UPI payment fields to public.payments
-- 2. Makes legacy razorpay_order_id nullable
-- 3. Safely updates status CHECK constraint to support 'pending_verification' & 'rejected'
-- 4. Sets default payment_method to 'upi_qr'
-- 5. Adds unique index on payment_reference and duplicate protection for UTR
-- 6. Creates public.business_settings table for dynamic UPI configuration
-- 7. Configures secure Row Level Security (RLS) policies
-- 8. Signals PostgREST schema cache reload
-- ==============================================================================

-- 1. Create Business Settings Table for Dynamic UPI & Kitchen Configuration
create table if not exists public.business_settings (
  id text primary key default 'default',
  business_name text not null default 'Nimje Gharchi Rasoi',
  payee_name text not null default 'Taniksh Nimje',
  upi_id text not null default 'tanikshnimje@okaxis',
  payment_instructions text default 'Scan the QR code using any UPI App (Google Pay, PhonePe, Paytm, BHIM, Cred, etc.). After successful payment, enter the 12-digit UTR / Transaction ID below.',
  phone text default '+91 78230 98970',
  email text default 'contact@nimjegharchirasoi.com',
  location text default 'Near Reshimbagh / Civil Lines, Nagpur, Maharashtra',
  lunch_slot text default '11:30 AM – 2:00 PM',
  dinner_slot text default '7:30 PM – 10:00 PM',
  updated_at timestamptz not null default now()
);

-- Seed initial business settings record if not exists
insert into public.business_settings (id, business_name, payee_name, upi_id, payment_instructions, phone, email, location, lunch_slot, dinner_slot)
values (
  'default',
  'Nimje Gharchi Rasoi',
  'Taniksh Nimje',
  'tanikshnimje@okaxis',
  'Scan the QR code using any UPI App (Google Pay, PhonePe, Paytm, BHIM, Cred, etc.). After successful payment, enter the 12-digit UTR / Transaction ID below.',
  '+91 78230 98970',
  'contact@nimjegharchirasoi.com',
  'Near Reshimbagh / Civil Lines, Nagpur, Maharashtra',
  '11:30 AM – 2:00 PM',
  '7:30 PM – 10:00 PM'
)
on conflict (id) do nothing;

-- 2. Safely Make Legacy Razorpay Columns Nullable (Preserves Historical Data)
do $$
begin
  if exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'payments' and column_name = 'razorpay_order_id'
  ) then
    alter table public.payments alter column razorpay_order_id drop not null;
  end if;
end $$;

-- 3. Safely Add Missing UPI & Verification Columns to public.payments
alter table public.payments 
  add column if not exists payment_reference text,
  add column if not exists utr text,
  add column if not exists upi_id text,
  add column if not exists submitted_at timestamptz,
  add column if not exists verified_at timestamptz,
  add column if not exists verified_by uuid references public.profiles(id) on delete set null,
  add column if not exists rejection_reason text;

-- 4. Update payment_method default
alter table public.payments alter column payment_method set default 'upi_qr';

-- 5. Safely Update payment status CHECK constraint
alter table public.payments drop constraint if exists payments_status_check;
alter table public.payments add constraint payments_status_check 
  check (status in ('created', 'pending', 'pending_verification', 'paid', 'rejected', 'failed', 'cancelled', 'refunded'));

-- 6. Indexes for Performance & Duplicate Protection
-- Unique index on payment_reference for non-null values
create unique index if not exists idx_payments_payment_reference 
  on public.payments(payment_reference) 
  where payment_reference is not null;

-- General query index on UTR
create index if not exists idx_payments_utr 
  on public.payments(utr);

-- Partial unique index to prevent duplicate UTR reuse across active/verified transactions
create unique index if not exists idx_payments_unique_active_utr 
  on public.payments(utr) 
  where utr is not null and status in ('pending_verification', 'paid');

-- 7. Row Level Security (RLS) Configuration
alter table public.business_settings enable row level security;
alter table public.payments enable row level security;

-- Business Settings Policies
drop policy if exists "Anyone can read business settings" on public.business_settings;
create policy "Anyone can read business settings"
  on public.business_settings for select
  using (true);

drop policy if exists "Only admins can update business settings" on public.business_settings;
create policy "Only admins can update business settings"
  on public.business_settings for all
  using (public.is_current_user_admin());

-- Payments Policies
drop policy if exists "Users can view own payments" on public.payments;
create policy "Users can view own payments"
  on public.payments for select
  using (auth.uid() = user_id or public.is_current_user_admin());

drop policy if exists "Authenticated users can insert payments" on public.payments;
create policy "Authenticated users can insert payments"
  on public.payments for insert
  with check (auth.uid() = user_id or public.is_current_user_admin());

drop policy if exists "Admin and Server can update payments" on public.payments;
create policy "Admin and Server can update payments"
  on public.payments for update
  using (public.is_current_user_admin() or auth.uid() = user_id);

-- 8. PostgREST Schema Cache Reload Signal
-- Notifies PostgREST to immediately rebuild its internal OpenAPI schema cache
notify pgrst, 'reload schema';
notify pgrst, 'reload config';
