# Security Policy & Hardening Specification — Nimje Gharchi Rasoi

This document details the security model, Row Level Security (RLS) enforcement, authorization matrix, secret protection protocols, and defensive mechanisms implemented in **Nimje Gharchi Rasoi**.

---

## 1. Authorization & Role-Based Access Control (RBAC)

Authentication and authorization are managed through **Supabase Auth** combined with PostgreSQL **Row Level Security (RLS)** and the PostgreSQL function `public.is_current_user_admin()`.

### Roles
1. **`customer`**: Authenticated end-user. Restricted strictly to self-owned profiles, addresses, orders, subscriptions, and payment submissions.
2. **`admin`**: Designated kitchen manager / owner account (`tanikshnimje@gmail.com`). Authorized to verify payments, manage meal plans, view revenue metrics, update order preparation statuses, and configure kitchen cutoff timings.

### Server-Side Admin Definer Function
```sql
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
```

---

## 2. Row Level Security (RLS) Matrix

Every table in the `public` schema has RLS strictly enabled:

| Table | SELECT | INSERT | UPDATE | DELETE |
| :--- | :--- | :--- | :--- | :--- |
| **`profiles`** | Own profile (`auth.uid() = id`) OR Admin | Own profile (`auth.uid() = id`) | Own profile (`WITH CHECK role = 'customer'`) OR Admin | Admin only |
| **`addresses`** | Own addresses (`auth.uid() = user_id`) OR Admin | Own address (`auth.uid() = user_id`) | Own address OR Admin | Own address OR Admin |
| **`plans`** | Public (`is_active = true`) OR Admin (all) | Admin only | Admin only | Admin only |
| **`addons`** | Public (`is_available = true`) OR Admin (all) | Admin only | Admin only | Admin only |
| **`special_order_products`** | Public (`is_available = true`) OR Admin (all) | Admin only | Admin only | Admin only |
| **`subscriptions`** | Own subscriptions (`auth.uid() = user_id`) OR Admin | Own pending sub (`status = 'pending'`) | **Admin only** (Customers cannot activate or alter dates/amounts) | Admin only |
| **`orders`** | Own orders (`auth.uid() = user_id`) OR Admin | Own pending order (`status = 'pending'`) | **Admin only** (Customers cannot confirm/deliver orders) | Admin only |
| **`order_items`** | Items for own orders OR Admin | Items for own pending orders | Admin only | Admin only |
| **`payments`** | Own payments (`auth.uid() = user_id`) OR Admin | Own pending payment (`status in ('pending', 'created')`) | **Restricted**: Customers can only update own pending payment to submit `utr` into `pending_verification`. Cannot set `paid`/`rejected` | Admin only |
| **`notifications`** | Own notifications (`auth.uid() = user_id`) OR Admin | Own notifications OR Admin | Own notifications (mark as read) | Admin only |
| **`notification_logs`**| Admin only | Admin only | Admin only | Admin only |
| **`business_settings`** | Public read (UPI ID, timings) | Admin only | Admin only | Admin only |

---

## 3. Financial & Payment Tamper Protection

1. **Authoritative Price Validation**:
   - The frontend never dictates the price stored in database records.
   - When a payment intent is created, prices are queried from `public.plans` or `public.special_order_products`.
   - Items not present in the database with `is_available = true` are rejected immediately.
2. **Duplicate UTR Prevention**:
   - A PostgreSQL unique partial index enforces UTR uniqueness across active transactions:
   ```sql
   create unique index idx_payments_unique_active_utr
     on public.payments(utr)
     where utr is not null and status in ('pending_verification', 'paid');
   ```
3. **Immutable Paid State**:
   - Customers cannot mutate a payment once marked as `paid` or `pending_verification`.
   - Admin verification is recorded with `verified_at` timestamp and `verified_by` admin UUID.

---

## 4. Secret Management & Zero-Leakage Policy

| Variable | Scope | Publicly Exposed? | Usage |
| :--- | :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | Client / Browser | **YES (Public)** | Supabase project endpoint |
| `VITE_SUPABASE_ANON_KEY`| Client / Browser | **YES (Public)** | Supabase client access (governed strictly by RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-Side Only | **NO (STRICT SECRET)**| Bypasses RLS for maintenance / Edge functions. **NEVER present in client bundles.** |
| `RESEND_API_KEY` | Supabase Edge Secret | **NO (STRICT SECRET)**| Transactional email dispatch |
| `FAST2SMS_API_KEY` | Supabase Edge Secret | **NO (STRICT SECRET)**| OTP & WhatsApp/SMS dispatch |

---

## 5. Defense-in-Depth & HTTP Security Headers

Configured in `vercel.json`:
- `X-Frame-Options: DENY` (Mitigates Clickjacking)
- `X-Content-Type-Options: nosniff` (Mitigates MIME-type sniffing attacks)
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

---

## 6. Client Action Rate Limiting

Implemented in `src/lib/rateLimit.ts` via sliding window algorithm:
- **Payment Intent Creation**: Max 10 requests per 2 minutes
- **UTR Submission**: Max 5 attempts per 3 minutes
- **Contact Form Submission**: Max 3 messages per 3 minutes
