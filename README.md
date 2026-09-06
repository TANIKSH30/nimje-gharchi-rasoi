# Nimje Gharchi Rasoi (निमजे घरची रसोई)

> **Authentic Homestyle Tiffin & Mess Subscription Platform for Nagpur, Maharashtra**  
> Built with **React 19**, **TypeScript**, **Vite**, **Tailwind CSS**, **Supabase (PostgreSQL + Auth + RLS)**, and a secure **UPI QR Code + UTR Verification** payment workflow with full Admin Command Center and automated customer alerts.

---

## 🌟 Overview

**Nimje Gharchi Rasoi** is a production-ready, full-stack food and tiffin subscription web application. It automates daily meal subscriptions, special catering orders, address routing across Nagpur belts (Nandanvan, Reshimbagh, Medical Square, Sitabuldi, Dharampeth, etc.), dynamic weekly menu rotations, and dual-action payment verifications with Row Level Security (RLS) enforcement.

---

## 🛠️ Tech Stack

- **Frontend**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with Warm Homestyle Brand Aesthetics (Emerald Green, Warm Honey/Gold, Cream)
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL 15, Supabase Auth, Row Level Security, Triggers & Security Definer Functions)
- **Payment Engine**: Standard NPCI UPI URI & QR Code Generation (`upi://pay?pa=...&pn=...&am=...&cu=INR&tn=...`)
- **Icons & Motion**: `lucide-react`, `framer-motion`, `canvas-confetti`
- **Deployment & Edge**: [Vercel](https://vercel.com/) with SPA rewrites and defensive HTTP security headers

---

## 📁 Folder Structure

```
mess/
├── docs/                        # Complete architecture, security, and deployment documentation
│   ├── ARCHITECTURE.md          # System architecture, Mermaid diagrams, component hierarchy
│   ├── SECURITY.md              # RLS policies matrix, RBAC, secret management, threat model
│   └── DEPLOYMENT.md            # Vercel deployment, Supabase setup, and production checklist
├── public/                      # Static assets, favicon, robots.txt, _redirects
├── src/
│   ├── components/
│   │   ├── auth/                # ProtectedRoute, AdminRoute, AuthModal
│   │   ├── layout/              # Navbar, Footer (with Google 5-Star Reviews)
│   │   ├── sections/            # Hero, WeeklyMenu, DeliveryZoneMap, KitchenGallery
│   │   └── ui/                  # Button, Input, Card, Modal, Badge, Tabs
│   ├── context/
│   │   └── AuthContext.tsx      # Supabase Auth state, Session, User Profile, Role management
│   ├── lib/
│   │   ├── rateLimit.ts         # Sliding-window client & edge action throttling
│   │   ├── upi.ts               # NPCI standard UPI QR & URI generation
│   │   ├── utils.ts             # Tailwind class merging
│   │   ├── validations.ts       # Validation schemas
│   │   └── supabase/
│   │       └── client.ts        # Supabase client singleton
│   ├── pages/
│   │   ├── HomePage.tsx         # Landing page, USP, menus, delivery zones, reviews
│   │   ├── MenuPage.tsx         # Complete weekly rotating menu
│   │   ├── PlansPage.tsx        # Subscription plan selector & pricing
│   │   ├── SpecialOrdersPage.tsx# Add-on dishes, custom kilograms, extra rotis
│   │   ├── CheckoutPage.tsx     # Address selection, delivery time slots, order summary
│   │   ├── PaymentPage.tsx      # Dynamic UPI QR, payee details, UTR input modal
│   │   ├── CustomerDashboardPage.tsx # Active subscriptions, order tracking, review CTAs
│   │   ├── ContactPage.tsx      # Kitchen location, WhatsApp links, inquiry form
│   │   └── admin/               # Admin Command Center views (Dashboard, Orders, Payments, Subscriptions, Menu)
│   ├── services/
│   │   ├── adminService.ts      # Admin approval/rejection, metrics queries
│   │   ├── notificationService.ts # In-app alerts, WhatsApp formatters, webhook dispatch
│   │   └── paymentService.ts    # Intent creation, UTR submissions, IST date calculations
│   └── types/
│       └── database.ts          # TypeScript database definitions
├── supabase/
│   └── migrations/              # 001 - 009 Sequential reproducible PostgreSQL migrations
├── vercel.json                  # Vercel SPA rewrites and defensive HTTP security headers
└── .env.example                 # Sanitized environment template (no secrets)
```

---

## 🔐 Security & RLS Model

All operations are guarded by PostgreSQL **Row Level Security (RLS)**:
- **No Client Price Tampering**: Order and subscription totals are calculated server-side/database-side.
- **Immutable Payment Status**: Customers can only update their own row from `pending` → `pending_verification`. Setting `status = 'paid'` or modifying verification fields is blocked by database RLS.
- **Admin RBAC**: Verified at the database layer via `public.is_current_user_admin()` security definer function.
- **Zero-Secret Exposure**: No `service_role` keys or sensitive private API credentials exist in client bundles or public repositories.
- **Timezone Integrity**: Date calculations use `Asia/Kolkata` (IST) to prevent UTC date regression between `00:00` and `05:30` IST.

---

## 🚀 Local Development Setup

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/nimje-gharchi-rasoi.git
cd nimje-gharchi-rasoi
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your Supabase credentials in `.env.local`:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_public_key_here
VITE_UPI_ID=tanikshnimje@okaxis
VITE_PAYEE_NAME="Taniksh Nimje"
VITE_BUSINESS_NAME="Nimje Gharchi Rasoi"
VITE_APP_URL=http://localhost:5173
```

### 3. Apply Supabase Migrations
Execute the migrations in `supabase/migrations/` sequentially (002 through 009) in your Supabase SQL Editor.

### 4. Start Local Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🚢 Production Build & Deployment

### Build Validation
```bash
npx tsc --noEmit
npm run build
```

### Deploying to Vercel
1. Import the repository into [Vercel](https://vercel.com).
2. Set Framework Preset to **Vite**.
3. Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel Project Settings.
4. Deploy!

For complete deployment and architecture details, refer to:
- 📖 [docs/ARCHITECTURE.md](file:///d:/mess/docs/ARCHITECTURE.md)
- 🔒 [docs/SECURITY.md](file:///d:/mess/docs/SECURITY.md)
- 🚀 [docs/DEPLOYMENT.md](file:///d:/mess/docs/DEPLOYMENT.md)
