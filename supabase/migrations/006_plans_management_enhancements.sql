-- ==============================================================================
-- NIMJE GHARCHI RASOI - MIGRATION 006: PLAN MANAGEMENT ENHANCEMENTS
-- Additive, Non-destructive, Idempotent
-- ==============================================================================

-- 1. ADD NEW COLUMNS TO PLANS TABLE IF NOT PRESENT
alter table public.plans
  add column if not exists features text[] default array[]::text[],
  add column if not exists duration_unit text default 'days',
  add column if not exists available_timings text[] default array['morning', 'evening']::text[],
  add column if not exists included_meals text,
  add column if not exists display_order integer default 0,
  add column if not exists is_featured boolean default false;

-- 2. CREATE INDEXES FOR FAST QUERYING AND ORDERING
create index if not exists idx_plans_display_order on public.plans(display_order);
create index if not exists idx_plans_is_featured on public.plans(is_featured);

-- 3. ENSURE RLS POLICIES FOR PLANS
alter table public.plans enable row level security;

-- Public can view active plans (or all if admin)
drop policy if exists "Anyone can view active plans" on public.plans;
create policy "Anyone can view active plans"
  on public.plans for select
  using (is_active = true or public.is_current_user_admin());

-- Admins have full management control (insert, update, delete)
drop policy if exists "Only admins can manage plans" on public.plans;
drop policy if exists "Admins can insert plans" on public.plans;
drop policy if exists "Admins can update plans" on public.plans;
drop policy if exists "Admins can delete plans" on public.plans;

create policy "Admins can insert plans"
  on public.plans for insert
  with check (public.is_current_user_admin());

create policy "Admins can update plans"
  on public.plans for update
  using (public.is_current_user_admin())
  with check (public.is_current_user_admin());

create policy "Admins can delete plans"
  on public.plans for delete
  using (public.is_current_user_admin());

-- 4. POPULATE INITIAL FEATURES AND DISPLAY ORDER FOR SEEDED PLANS IF EMPTY
update public.plans
set
  features = case
    when plan_type = 'monthly' and meal_type = 'full' then array[
      '30 days uninterrupted doorstep delivery',
      'Maximum monthly savings & discounts',
      'Free Sunday Special Dish / Sweet included',
      'Priority customer support & customized diet',
      'Pause & extend subscription on travel'
    ]
    when plan_type = 'monthly' and meal_type = 'half' then array[
      '30 days light homestyle meal delivery',
      'Healthy portion with 3 rotis, dal, rice & sabji',
      'Zero delivery fee in Nagpur',
      'Pause & resume flexibility anytime'
    ]
    when plan_type = 'weekly' then array[
      '7 days continuous meal delivery trial',
      'Discounted bundle pricing savings',
      'Choose lunch, dinner or both slots',
      'Fresh homestyle cooking with zero preservatives'
    ]
    when plan_type = 'daily' then array[
      'Order lunch or dinner anytime',
      'No monthly lock-in or advance needed',
      'Free doorstep delivery in Nagpur',
      'Fresh, hot homestyle cooked meals'
    ]
    else array['Doorstep delivery', 'Fresh hot homestyle food']
  end,
  included_meals = case
    when meal_type = 'full' then '4 Roti, Rice, Dal, 2 Sabji (1 Dry + 1 Gravy), Salad, Pickle'
    when meal_type = 'half' then '3 Roti, Rice, Dal, 1 Sabji, Salad & Pickle'
    when meal_type = 'morning' then '4 Roti, Rice, Dal, 2 Sabji & Salad (Lunch)'
    when meal_type = 'evening' then '4 Roti, Rice, Dal, 2 Sabji & Salad (Dinner)'
    else 'Homestyle Tiffin Meal'
  end,
  duration_unit = case
    when plan_type = 'monthly' then 'months'
    when plan_type = 'weekly' then 'weeks'
    else 'days'
  end,
  available_timings = array['morning', 'evening'],
  display_order = case
    when plan_type = 'monthly' and meal_type = 'full' then 1
    when plan_type = 'monthly' and meal_type = 'half' then 2
    when plan_type = 'weekly' and meal_type = 'full' then 3
    when plan_type = 'weekly' and meal_type = 'half' then 4
    when plan_type = 'daily' and meal_type = 'morning' then 5
    when plan_type = 'daily' and meal_type = 'evening' then 6
    else 10
  end,
  is_featured = case
    when plan_type = 'monthly' and meal_type = 'full' then true
    else false
  end
where features is null or array_length(features, 1) is null;
