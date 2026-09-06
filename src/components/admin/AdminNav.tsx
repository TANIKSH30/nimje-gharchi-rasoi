import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  Calendar,
  CreditCard,
  UtensilsCrossed,
  BarChart3,
  Settings,
  ArrowLeft,
  Shield,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AdminNav() {
  const location = useLocation();
  const { profile } = useAuth();

  const links = [
    { name: 'Overview', path: '/admin', icon: LayoutDashboard },
    { name: 'Tiffin Orders', path: '/admin/orders', icon: ShoppingBag },
    { name: 'Special Orders', path: '/admin/special-orders', icon: Package },
    { name: 'Customers', path: '/admin/customers', icon: Users },
    { name: 'Subscriptions', path: '/admin/subscriptions', icon: Calendar },
    { name: 'Meal Plans', path: '/admin/plans', icon: UtensilsCrossed },
    { name: 'Payments & UPI', path: '/admin/payments', icon: CreditCard },
    { name: 'Reports', path: '/admin/reports', icon: BarChart3 },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col justify-between hidden md:flex flex-shrink-0 min-h-[calc(100vh-5rem)]">
      <div className="space-y-6">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
          <Shield size={14} /> Admin Workspace
        </div>

        <nav className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-foreground'
                }`}
              >
                <Icon size={18} />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="pt-6 border-t border-gray-100">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-foreground transition-colors px-3 py-2"
        >
          <ArrowLeft size={14} /> Switch to Customer View
        </Link>
      </div>
    </aside>
  );
}
