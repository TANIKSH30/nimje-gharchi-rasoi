import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CreditCard,
  Calendar,
  Bell,
  BarChart3,
  Users,
  UtensilsCrossed,
  Settings,
  ArrowLeft,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  ShieldCheck,
  Search,
  ExternalLink,
  Sparkles,
  AlertCircle,
  Clock,
  CheckCircle2,
  Package,
  ShoppingBag,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { fetchUserNotifications } from '@/services/notificationService';
import { Notification } from '@/types/database';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function AdminLayout({
  children,
  title,
  subtitle,
  actions,
}: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);
  const [recentNotifs, setRecentNotifs] = useState<Notification[]>([]);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  // Fetch live counts
  const fetchLiveCounts = async () => {
    try {
      // Pending payments count
      const { count: pendingCount } = await supabase
        .from('payments')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending_verification');

      setPendingPaymentsCount(pendingCount || 0);

      // Unread notifications count
      if (user?.id) {
        const notifs = await fetchUserNotifications(user.id);
        setRecentNotifs(notifs.slice(0, 5));
        setUnreadNotifsCount(notifs.filter((n) => !n.is_read).length);
      }
    } catch (err) {
      console.warn('Error fetching live admin counts:', err);
    }
  };

  useEffect(() => {
    fetchLiveCounts();

    // Supabase realtime channel for payments & notifications
    const paymentsChannel = supabase
      .channel('admin-layout-payments')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments' },
        () => {
          fetchLiveCounts();
        }
      )
      .subscribe();

    const notifsChannel = supabase
      .channel('admin-layout-notifs')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        () => {
          fetchLiveCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(paymentsChannel);
      supabase.removeChannel(notifsChannel);
    };
  }, [user?.id]);

  const navLinks = [
    { name: 'Overview', path: '/admin', icon: LayoutDashboard },
    { name: 'Special Orders', path: '/admin/special-orders', icon: Package },
    { name: 'Tiffin Orders', path: '/admin/orders', icon: ShoppingBag },
    {
      name: 'Payments',
      path: '/admin/payments',
      icon: CreditCard,
      badge: pendingPaymentsCount > 0 ? pendingPaymentsCount : undefined,
      badgeColor: 'bg-amber-500 text-white',
    },
    { name: 'Subscriptions', path: '/admin/subscriptions', icon: Calendar },
    {
      name: 'Notifications',
      path: '/admin/notifications',
      icon: Bell,
      badge: unreadNotifsCount > 0 ? unreadNotifsCount : undefined,
      badgeColor: 'bg-primary text-white',
    },
    { name: 'Revenue Analytics', path: '/admin/analytics', icon: BarChart3 },
    { name: 'Customers', path: '/admin/customers', icon: Users },
    { name: 'Meal Plans', path: '/admin/plans', icon: Sparkles },
    { name: 'Menu Management', path: '/admin/menu', icon: UtensilsCrossed },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#FBF9F4] text-foreground flex">
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar (Desktop + Mobile Drawer) */}
      <aside
        className={`fixed md:sticky top-0 h-screen z-50 flex flex-col justify-between bg-[#0E281E] text-white border-r border-[#1C4233] transition-all duration-300 ease-in-out ${
          collapsed ? 'w-20' : 'w-72'
        } ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top: Brand Header */}
        <div className="p-5 border-b border-[#1C4233] flex items-center justify-between">
          <Link
            to="/admin"
            className={`flex items-center gap-3 overflow-hidden ${
              collapsed ? 'justify-center w-full' : ''
            }`}
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-black text-white shadow-lg shadow-amber-500/20 flex-shrink-0">
              <UtensilsCrossed size={20} />
            </div>
            {!collapsed && (
              <div>
                <h1 className="font-black text-sm tracking-tight text-white leading-tight">
                  NIMJE GHARCHI RASOI
                </h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] font-bold text-emerald-300/80 uppercase tracking-wider">
                    Admin Command
                  </span>
                </div>
              </div>
            )}
          </Link>

          {/* Desktop collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden md:flex w-7 h-7 rounded-lg bg-[#16382B] text-gray-300 hover:text-white hover:bg-[#1E4D3B] items-center justify-center transition-colors"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>

          {/* Mobile close button */}
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar"
            className="md:hidden w-8 h-8 rounded-lg bg-[#16382B] text-gray-300 hover:text-white flex items-center justify-center"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive =
              location.pathname === link.path ||
              (link.path !== '/admin' && location.pathname.startsWith(link.path)) ||
              (link.path === '/admin/analytics' && location.pathname === '/admin/reports');

            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? link.name : undefined}
                className={`flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all relative group ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-md shadow-emerald-950/40'
                    : 'text-gray-300 hover:bg-[#16382B] hover:text-white'
                } ${collapsed ? 'justify-center' : ''}`}
              >
                <Icon
                  size={19}
                  className={`flex-shrink-0 transition-transform duration-200 ${
                    isActive ? 'scale-110 text-amber-300' : 'text-gray-400 group-hover:text-amber-400'
                  }`}
                />
                {!collapsed && (
                  <span className="flex-1 truncate tracking-wide">{link.name}</span>
                )}
                {!collapsed && link.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider animate-pulse ${link.badgeColor}`}
                  >
                    {link.badge}
                  </span>
                )}
                {collapsed && link.badge !== undefined && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-amber-400" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom User / Switch / Logout section */}
        <div className="p-4 border-t border-[#1C4233] space-y-3 bg-[#0A1E16]">
          {!collapsed ? (
            <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#133327] border border-[#1E4B39]">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black text-sm flex-shrink-0">
                {profile?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  {profile?.full_name || 'Admin User'}
                </p>
                <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
              </div>
              <ShieldCheck size={16} className="text-emerald-400 flex-shrink-0" />
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black text-sm">
                {profile?.full_name?.charAt(0) || 'A'}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <Link
              to="/dashboard"
              title="Switch to Customer Dashboard"
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-bold text-gray-400 hover:text-white hover:bg-[#16382B] transition-colors ${
                collapsed ? 'justify-center' : ''
              }`}
            >
              <ArrowLeft size={15} />
              {!collapsed && <span>Customer View</span>}
            </Link>

            <button
              onClick={handleSignOut}
              title="Logout"
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors w-full text-left ${
                collapsed ? 'justify-center' : ''
              }`}
            >
              <LogOut size={15} />
              {!collapsed && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#EAE5D9] px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4 shadow-xs">
          {/* Left: Mobile menu toggle + Page title */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open mobile menu"
              className="md:hidden w-9 h-9 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-700 hover:bg-gray-100"
            >
              <Menu size={20} />
            </button>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight leading-none truncate">
                {title}
              </h2>
              {subtitle && (
                <p className="text-xs text-gray-500 mt-1 truncate hidden sm:block">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Right: Quick actions, Pending Alert, Notifications, User info */}
          <div className="flex items-center gap-2.5 sm:gap-4 flex-shrink-0">
            {/* Pending Payments Alert Button */}
            {pendingPaymentsCount > 0 && (
              <Link
                to="/admin/payments"
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold hover:bg-amber-100 transition-colors shadow-xs"
              >
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span className="hidden sm:inline">Pending Verifications:</span>
                <span className="px-1.5 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-black">
                  {pendingPaymentsCount}
                </span>
              </Link>
            )}

            {/* Notification Bell with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                aria-label="Admin Notifications"
                className="relative w-9 h-9 rounded-xl border border-gray-200 hover:border-gray-300 bg-white flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Bell size={18} />
                {unreadNotifsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-white text-[9px] font-black flex items-center justify-center shadow-xs">
                    {unreadNotifsCount}
                  </span>
                )}
              </button>

              {/* Dropdown Menu */}
              {notifDropdownOpen && (
                <>
                  <div
                    onClick={() => setNotifDropdownOpen(false)}
                    className="fixed inset-0 z-40"
                  />
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl border border-gray-200 shadow-2xl z-50 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <Bell size={16} className="text-primary" />
                        <h4 className="font-extrabold text-sm text-gray-900">
                          Admin Alerts ({unreadNotifsCount})
                        </h4>
                      </div>
                      <Link
                        to="/admin/notifications"
                        onClick={() => setNotifDropdownOpen(false)}
                        className="text-xs font-bold text-primary hover:underline"
                      >
                        View All
                      </Link>
                    </div>

                    <div className="max-h-72 overflow-y-auto space-y-2">
                      {recentNotifs.length === 0 ? (
                        <p className="text-xs text-gray-400 py-6 text-center">
                          No recent notifications.
                        </p>
                      ) : (
                        recentNotifs.map((n) => (
                          <div
                            key={n.id}
                            className={`p-3 rounded-2xl border text-xs transition-colors ${
                              n.is_read
                                ? 'bg-gray-50/50 border-gray-100 text-gray-600'
                                : 'bg-emerald-50/50 border-emerald-100 text-emerald-950 font-medium'
                            }`}
                          >
                            <p className="font-bold text-gray-900">{n.title}</p>
                            <p className="text-[11px] text-gray-600 mt-0.5">{n.message}</p>
                            <p className="text-[9px] text-gray-400 mt-1">
                              {new Date(n.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Custom Header Actions (e.g. Add Dish, Filter) */}
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
