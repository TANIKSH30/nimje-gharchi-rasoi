-- ==============================================================================
-- NIMJE GHARCHI RASOI - MIGRATION 007: COMPLETE ADMIN ROLES, PLANS & SETTINGS SCHEMA FIX
-- Copy and paste this into Supabase SQL Editor and click RUN
-- ==============================================================================

-- 1. ADD NEW COLUMNS TO PLANS TABLE (SAFE & NON-DESTRUCTIVE)
alter table public.plans
  add column if not exists features text[] default array[]::text[],
  add column if not exists duration_unit text default 'days',
  add column if not exists available_timings text[] default array['morning', 'evening']::text[],
  add column if not exists included_meals text,
  add column if not exists display_order integer default 0,
  add column if not exists is_featured boolean default false;

-- 2. ADD CUTOFF COLUMNS TO BUSINESS_SETTINGS TABLE (SAFE & NON-DESTRUCTIVE)
alter table public.business_settings
  add column if not exists order_cutoff_morning text default '09:00 AM',
  add column if not exists order_cutoff_evening text default '05:00 PM';

-- 3. PROMOTE AUTHORIZED OWNER ACCOUNT TO ADMIN IN PROFILES
update public.profiles
set role = 'admin'
where lower(email) = 'tanikshnimje@gmail.com';

-- 4. ENSURE ADMIN HELPER FUNCTION IS ACCESSIBLE
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

-- 5. REFRESH RLS POLICIES ON PLANS TABLE
alter table public.plans enable row level security;

drop policy if exists "Anyone can view active plans" on public.plans;
drop policy if exists "Only admins can manage plans" on public.plans;
drop policy if exists "Admins can insert plans" on public.plans;
drop policy if exists "Admins can update plans" on public.plans;
drop policy if exists "Admins can delete plans" on public.plans;

-- Anyone can view active plans (or all if admin)
create policy "Anyone can view active plans"
  on public.plans for select
  using (is_active = true or public.is_current_user_admin());

-- Admins can create plans
create policy "Admins can insert plans"
  on public.plans for insert
  with check (public.is_current_user_admin());

-- Admins can update plans
create policy "Admins can update plans"
  on public.plans for update
  using (public.is_current_user_admin())
  with check (public.is_current_user_admin());

-- Admins can delete plans
create policy "Admins can delete plans"
  on public.plans for delete
  using (public.is_current_user_admin());

-- 6. REFRESH RLS POLICIES ON BUSINESS SETTINGS TABLE
alter table public.business_settings enable row level security;

drop policy if exists "Anyone can read business settings" on public.business_settings;
drop policy if exists "Public can read business settings" on public.business_settings;
drop policy if exists "Only admins can update business settings" on public.business_settings;
drop policy if exists "Admins can update business settings" on public.business_settings;

create policy "Public can read business settings"
  on public.business_settings for select
  using (true);

create policy "Admins can update business settings"
  on public.business_settings for all
  using (public.is_current_user_admin())
  with check (public.is_current_user_admin());

-- 7. VERIFY PROFILES
select id, email, full_name, role from public.profiles;
