import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AdminRoute from '@/components/auth/AdminRoute';

// Public Pages
import HomePage from '@/pages/HomePage';
import PlansPage from '@/pages/PlansPage';
import SpecialOrdersPage from '@/pages/SpecialOrdersPage';
import AboutPage from '@/pages/AboutPage';
import ContactPage from '@/pages/ContactPage';
import CheckoutPage from '@/pages/CheckoutPage';

// Legal Pages
import PrivacyPolicyPage from '@/pages/legal/PrivacyPolicyPage';
import TermsPage from '@/pages/legal/TermsPage';
import RefundPolicyPage from '@/pages/legal/RefundPolicyPage';

// Auth Pages
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import AuthCallbackPage from '@/pages/AuthCallbackPage';

// Customer Dashboard Pages
import CustomerDashboardPage from '@/pages/CustomerDashboardPage';
import SubscriptionsPage from '@/pages/SubscriptionsPage';
import OrdersPage from '@/pages/OrdersPage';
import PaymentsPage from '@/pages/PaymentsPage';
import ProfilePage from '@/pages/ProfilePage';
import AddressesPage from '@/pages/AddressesPage';

// Admin Pages
import AdminOverviewPage from '@/pages/admin/AdminOverviewPage';
import AdminPaymentsPage from '@/pages/admin/AdminPaymentsPage';
import AdminSubscriptionsPage from '@/pages/admin/AdminSubscriptionsPage';
import AdminOrdersPage from '@/pages/admin/AdminOrdersPage';
import AdminSpecialOrdersPage from '@/pages/admin/AdminSpecialOrdersPage';
import AdminCustomersPage from '@/pages/admin/AdminCustomersPage';
import AdminMenuPage from '@/pages/admin/AdminMenuPage';
import AdminPlansPage from '@/pages/admin/AdminPlansPage';
import AdminReportsPage from '@/pages/admin/AdminReportsPage';
import AdminNotificationsPage from '@/pages/admin/AdminNotificationsPage';
import AdminSettingsPage from '@/pages/admin/AdminSettingsPage';

// 404 Page
import NotFoundPage from '@/pages/NotFoundPage';

import ScrollToTop from '@/components/layout/ScrollToTop';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/plans" element={<PlansPage />} />
          <Route path="/special-orders" element={<SpecialOrdersPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />

          {/* Legal & Policy Routes */}
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/refund-policy" element={<RefundPolicyPage />} />

          {/* Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          {/* Customer Portal (Protected) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <CustomerDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subscriptions"
            element={
              <ProtectedRoute>
                <SubscriptionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <OrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments"
            element={
              <ProtectedRoute>
                <PaymentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/addresses"
            element={
              <ProtectedRoute>
                <AddressesPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Command Center (Admin Protected) */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminOverviewPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/payments"
            element={
              <AdminRoute>
                <AdminPaymentsPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/subscriptions"
            element={
              <AdminRoute>
                <AdminSubscriptionsPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <AdminRoute>
                <AdminOrdersPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/special-orders"
            element={
              <AdminRoute>
                <AdminSpecialOrdersPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/customers"
            element={
              <AdminRoute>
                <AdminCustomersPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/menu"
            element={
              <AdminRoute>
                <AdminMenuPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/plans"
            element={
              <AdminRoute>
                <AdminPlansPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <AdminRoute>
                <AdminReportsPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <AdminRoute>
                <AdminReportsPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/notifications"
            element={
              <AdminRoute>
                <AdminNotificationsPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <AdminRoute>
                <AdminSettingsPage />
              </AdminRoute>
            }
          />

          {/* 404 Fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
