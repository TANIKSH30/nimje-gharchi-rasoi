-- ==============================================================================
-- NIMJE GHARCHI RASOI - SUPABASE AUTH & PROFILES RLS POLICY FIX
-- Ensures seamless Google OAuth & Email Signup profile creation
-- ==============================================================================

-- 1. Allow authenticated users to insert their own profile row
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id or public.is_current_user_admin());

-- 2. Allow users to read own profile (or admin read all)
drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id or public.is_current_user_admin());

-- 3. Allow users to update own profile without role escalation
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id or public.is_current_user_admin())
  with check (
    case when public.is_current_user_admin() then true else (role = 'customer') end
  );

-- 4. Automatic handle_new_user trigger with security definer
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, phone, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(coalesce(new.email, 'customer@nimje.com'), '@', 1)),
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

-- 5. Attach trigger to auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update on auth.users
  for each row execute procedure public.handle_new_user();
