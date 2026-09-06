# System Architecture Documentation — Nimje Gharchi Rasoi

This document details the end-to-end software architecture, security boundaries, database design, payment flows, and deployment model for **Nimje Gharchi Rasoi**, an authentic homestyle tiffin and mess subscription platform tailored for Nagpur, Maharashtra.

---

## 1. High-Level System Architecture

```mermaid
flowchart TD
    subgraph ClientLayer ["Client Layer (Browser / Mobile PWA)"]
        UserBrowser["Customer Web App\n(React 19 + Vite + Tailwind)"]
        AdminBrowser["Admin Command Center\n(React 19 + Protected Route)"]
    end

    subgraph EdgeCDN ["Edge & CDN Layer (Vercel)"]
        VercelEdge["Vercel Edge Network\n(SPA Rewrites + Security Headers + Asset CDN)"]
    end

    subgraph BackendLayer ["Backend as a Service (Supabase)"]
        SupaAuth["Supabase Auth\n(JWT + Session Persistence)"]
        PostgresDB["PostgreSQL Database\n(Tables + Indexes + Triggers)"]
        RLSLayer["Row Level Security (RLS)\n(Authoritative Enforcement)"]
        EdgeFuncs["Supabase Edge Functions\n(Notification Webhooks / Alert Dispatch)"]
    end

    subgraph ExternalServices ["External Services"]
        UPIApps["UPI Payment Apps\n(GPay, PhonePe, Paytm, BHIM)"]
        ResendMail["Resend Email API\n(Order Confirmed & Alert Emails)"]
        SMSGateway["Fast2SMS / Twilio\n(Customer & Admin SMS)"]
    end

    UserBrowser -->|HTTPS / Assets| VercelEdge
    AdminBrowser -->|HTTPS / Assets| VercelEdge
    UserBrowser -->|Auth & Queries| SupaAuth
    UserBrowser -->|PostgREST (RLS Guarded)| RLSLayer
    AdminBrowser -->|Admin APIs (RLS Definered)| RLSLayer
    RLSLayer --> PostgresDB
    UserBrowser -->|UPI DeepLink / QR| UPIApps
    PostgresDB -->|Triggers / Logs| EdgeFuncs
    EdgeFuncs --> ResendMail
    EdgeFuncs --> SMSGateway
```

---

## 2. Frontend Architecture & Component Structure

The frontend is built using **React 19**, **TypeScript**, **Vite**, and **Tailwind CSS**. It follows a modular directory layout:

```
src/
├── components/
│   ├── auth/            # AuthModal, ProtectedRoute, AdminRoute
│   ├── layout/          # Navbar, Footer
│   ├── sections/        # Hero, MealPlans, WeeklyMenu, DeliveryZoneMap, KitchenGallery
│   └── ui/              # Button, Input, Card, Modal, Badge, Tabs, Dialog
├── context/
│   └── AuthContext.tsx  # Supabase Auth state, Session, User Profile, Role management
├── lib/
│   ├── rateLimit.ts     # Action throttling (sliding window token bucket)
│   ├── upi.ts           # NPCI standard UPI QR & URI generation, reference hashing
│   ├── utils.ts         # Class merging & general utilities
│   ├── validations.ts   # Client & server validation schemas
│   └── supabase/
│       └── client.ts    # Supabase singleton client instance
├── pages/
│   ├── HomePage.tsx               # Landing page, USP, menus, delivery zones, reviews
│   ├── MenuPage.tsx               # Complete Maharashtrian weekly rotating menu
│   ├── PlansPage.tsx              # Subscription plan selector & pricing
│   ├── SpecialOrdersPage.tsx      # Add-on dishes, custom kilograms, extra rotis
│   ├── CheckoutPage.tsx           # Address selection, delivery time slots, order summary
│   ├── PaymentPage.tsx            # Dynamic UPI QR, payee details, UTR input modal
│   ├── CustomerDashboardPage.tsx  # Active subscriptions, order tracking, review CTAs
│   ├── ContactPage.tsx            # Kitchen location, WhatsApp links, inquiry form
│   ├── LoginPage.tsx / SignupPage.tsx # Auth pages with redirect query support
│   └── admin/
│       ├── AdminDashboardPage.tsx     # Revenue metrics, active orders, live summary
│       ├── AdminOrdersPage.tsx        # Order status pipeline (Confirmed -> Delivered)
│       ├── AdminPaymentsPage.tsx      # UTR verification modal, Approve/Reject logic
│       ├── AdminSubscriptionsPage.tsx # Customer plan management & renewal alerts
│       ├── AdminMenuPage.tsx          # Dynamic weekly menu items editor
│       ├── AdminSpecialOrdersPage.tsx # Addon dish inventory & pricing management
│       ├── AdminPlansPage.tsx         # Subscription duration & tier pricing editor
│       └── AdminSettingsPage.tsx      # UPI ID, payee name, cutoff timings
├── services/
│   ├── adminService.ts         # Admin payment approval/rejection, metrics queries
│   ├── notificationService.ts  # In-app alerts, WhatsApp formatters, webhook dispatch
│   └── paymentService.ts       # Intent creation, UTR submissions, IST date calculations
└── types/
    └── database.ts             # TypeScript definitions matching Supabase schema
```

---

## 3. Database Schema & Relational Model

```mermaid
erDiagram
    PROFILES ||--o{ ADDRESSES : owns
    PROFILES ||--o{ SUBSCRIPTIONS : subscribes
    PROFILES ||--o{ ORDERS : places
    PROFILES ||--o{ PAYMENTS : initiates
    PROFILES ||--o{ NOTIFICATIONS : receives
    PLANS ||--o{ SUBSCRIPTIONS : defines
    SUBSCRIPTIONS ||--o{ ORDERS : generates
    ORDERS ||--o{ ORDER_ITEMS : contains
    PAYMENTS ||--o| ORDERS : settles
    PAYMENTS ||--o| SUBSCRIPTIONS : activates

    PROFILES {
        uuid id PK
        text email
        text full_name
        text phone
        text role "customer | admin"
        timestamptz created_at
    }

    PLANS {
        uuid id PK
        text name
        numeric price
        numeric discounted_price
        int duration_days
        text meal_type
        boolean is_active
    }

    SUBSCRIPTIONS {
        uuid id PK
        uuid user_id FK
        uuid plan_id FK
        date start_date
        date end_date
        numeric amount
        text status "pending | active | paused | cancelled | expired"
        text payment_status "pending | paid | failed"
    }

    ORDERS {
        uuid id PK
        uuid user_id FK
        uuid subscription_id FK
        date order_date
        numeric total_amount
        text status "pending | confirmed | preparing | out_for_delivery | delivered | cancelled"
    }

    PAYMENTS {
        uuid id PK
        uuid user_id FK
        text payment_reference
        text utr
        numeric amount
        text status "pending | pending_verification | paid | rejected | cancelled"
        timestamptz verified_at
        uuid verified_by FK
        text rejection_reason
    }

    SPECIAL_ORDER_PRODUCTS {
        uuid id PK
        text name
        numeric price
        text unit
        numeric pricing_unit_step
        boolean is_available
    }
```

---

## 4. Payment & UTR Verification Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant Frontend as React / Vite Client
    participant SupabaseDB as Supabase Database (RLS)
    actor Admin
    participant Notify as Notification Service

    Customer->>Frontend: Selects Plan / Special Order & Proceeds to Checkout
    Frontend->>SupabaseDB: Insert Pending Payment Intent (amount validated from DB)
    SupabaseDB-->>Frontend: Return Payment ID & Reference
    Frontend->>Customer: Displays Dynamic UPI QR Code & Instructions
    Customer->>Customer: Scans QR & Pays via UPI App (GPay/PhonePe)
    Customer->>Frontend: Enters 12-digit UTR / Transaction ID
    Frontend->>SupabaseDB: UPDATE payment (utr, status = 'pending_verification')
    Note over SupabaseDB: RLS ensures customer cannot set status = 'paid'
    Frontend->>Notify: Triggers Admin Alert (New Payment Pending)
    Admin->>Frontend: Opens Admin Payments Command Center
    Admin->>Frontend: Inspects Bank Statement vs Submitted UTR
    alt UTR Matches & Amount Received
        Admin->>Frontend: Clicks "Approve & Activate"
        Frontend->>SupabaseDB: UPDATE payment (status = 'paid', verified_at = now)
        SupabaseDB->>SupabaseDB: UPDATE subscription (status = 'active', payment_status = 'paid')
        SupabaseDB->>SupabaseDB: UPDATE orders (status = 'confirmed')
        Frontend->>Notify: Dispatches "Order Confirmed" Customer Notification
    else Invalid UTR / Fraudulent Submission
        Admin->>Frontend: Clicks "Reject Payment" (Enters reason)
        Frontend->>SupabaseDB: UPDATE payment (status = 'rejected', rejection_reason)
        SupabaseDB->>SupabaseDB: UPDATE orders (status = 'cancelled')
        Frontend->>Notify: Dispatches Payment Rejection Notice
    end
```

---

## 5. Security Model & Client Trust Boundaries

### Untrusted Client Boundaries
Under no circumstances does the application trust financial values, activation flags, or administrative commands supplied directly by the client browser:

| Operation | Client Role Capability | Authoritative Server/Database Enforcement |
| :--- | :--- | :--- |
| **Payment Status Modification** | Can only transition `pending` → `pending_verification` | RLS prevents setting `status = 'paid'` or modifying `verified_at` / `verified_by`. |
| **Subscription Activation** | Can only create `pending` subscriptions | Only `is_current_user_admin()` can update `status` to `'active'` or modify dates. |
| **Order Item Pricing** | Submits product ID and desired quantity | Pricing is queried directly from `plans` and `special_order_products`. Client-submitted unit prices are discarded. |
| **User Role Escalation** | Can update full name and phone in `profiles` | RLS `WITH CHECK` enforces `role = 'customer'` for non-admins. |
| **Data Isolation (IDOR)** | Can only query records matching `auth.uid() = user_id` | RLS prevents cross-tenant data access across all tables. |
| **Admin Route Direct Access** | Redirected to `/login` by `<AdminRoute>` | Even if URL is forged, PostgREST queries fail with empty datasets due to `is_current_user_admin()` RLS checks. |

---

## 6. Timezone Handling (Asia/Kolkata)

The application is engineered exclusively for Indian operations. Calendar dates for subscription commencement, duration intervals, and meal cutoff times utilize `Asia/Kolkata` (IST):

- **Helper**: `getIstDateString()` leverages `Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' })` to generate standard `YYYY-MM-DD` strings.
- **Midnight Boundary Defense**: Prevents the standard UTC regression bug between `00:00` and `05:30` IST where naive UTC dates fall back to the prior day.
