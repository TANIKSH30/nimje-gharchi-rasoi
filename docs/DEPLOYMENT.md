# Production Deployment Guide — Nimje Gharchi Rasoi

This guide provides step-by-step instructions for deploying **Nimje Gharchi Rasoi** to **Vercel** with a **Supabase PostgreSQL** backend.

---

## 1. Prerequisites

- A GitHub repository with this codebase pushed.
- A **Supabase** project created at [supabase.com](https://supabase.com).
- A **Vercel** account linked to your GitHub.

---

## 2. Supabase Database Configuration

### Step 2.1: Run Migrations in Supabase SQL Editor
Open your Supabase Dashboard → **SQL Editor** → Execute the migration scripts located in `supabase/migrations/` in sequential order:

1. `002_upi_payments_migration.sql` (UPI fields, business settings table)
2. `003_auth_profiles_rls_fix.sql` (Auth triggers & profile RLS)
3. `004_admin_and_notifications.sql` (In-app notifications & audit logs)
4. `005_admin_command_center.sql` (Admin dashboard aggregations)
5. `006_plans_management_enhancements.sql` (Dynamic plan customization)
6. `007_fix_admin_roles_and_plans_rls.sql` (Admin definer function)
7. `008_special_orders_system.sql` (Special dishes & kilograms system)
8. `009_production_security_hardening.sql` (**CRITICAL**: Production RLS lockdown & admin role sanitization)

### Step 2.2: Configure Supabase Auth Redirect URLs
1. Navigate to **Authentication** → **URL Configuration**.
2. Set **Site URL** to your production domain:
   ```
   https://nimjegharchirasoi.com (or https://your-app.vercel.app)
   ```
3. In **Redirect URLs**, add:
   ```
   https://your-app.vercel.app/**
   https://your-app.vercel.app/auth/callback
   http://localhost:5173/**
   ```

---

## 3. Vercel Deployment

### Step 3.1: Import Project to Vercel
1. Log in to [vercel.com](https://vercel.com) and click **"Add New"** → **"Project"**.
2. Select your GitHub repository (`nimje-gharchi-rasoi`).
3. Framework Preset: **Vite**
4. Root Directory: `./`
5. Build Command: `npm run build`
6. Output Directory: `dist`

### Step 3.2: Configure Environment Variables in Vercel
Under **Environment Variables**, add the following production variables:

| Variable Name | Value Description | Example |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | Your Supabase Project URL | `https://xyzcompany.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase Project Anon Public Key | `eyJhbGciOiJIUz...` |
| `VITE_UPI_ID` | Business UPI ID | `tanikshnimje@okaxis` |
| `VITE_PAYEE_NAME` | Payee Name displayed on UPI apps | `Taniksh Nimje` |
| `VITE_BUSINESS_NAME` | Display Business Name | `Nimje Gharchi Rasoi` |
| `VITE_APP_URL` | Production Domain URL | `https://your-app.vercel.app` |

> **IMPORTANT**: NEVER add `SUPABASE_SERVICE_ROLE_KEY` to Vercel Environment Variables for this frontend SPA.

### Step 3.3: Deploy
Click **Deploy**. Vercel will build the project and output a live production URL.

---

## 4. Post-Deployment Verification Checklist

- [ ] **SPA Direct Navigation**: Open `https://your-domain.vercel.app/login` directly; ensure it loads without 404 error (handled by `vercel.json` rewrite).
- [ ] **HTTPS & Security Headers**: Check response headers on production URL for `X-Frame-Options: DENY` and `X-Content-Type-Options: nosniff`.
- [ ] **User Signup / Login**: Create a test customer account with email/password.
- [ ] **Google OAuth**: Test Google Sign-In button and verify callback redirect.
- [ ] **Customer Checkout**: Select a 30-day meal plan, proceed to checkout, verify dynamic UPI QR display.
- [ ] **UTR Submission**: Enter a test 12-digit UTR, submit, and confirm `pending_verification` state.
- [ ] **Admin Command Center**: Log in as `tanikshnimje@gmail.com`, open `/admin/payments`, verify payment approval & plan activation.
- [ ] **Google Review CTA**: Confirm Google review cards open direct rating query.
- [ ] **Rate Limiting**: Attempt submitting contact form 4 times in quick succession; confirm polite cooldown alert.
