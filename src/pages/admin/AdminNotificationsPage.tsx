import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  ShoppingBag,
  CreditCard,
  CheckCircle2,
  XCircle,
  Calendar,
  UtensilsCrossed,
  Filter,
  RefreshCw,
  Trash2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import {
  fetchUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/services/notificationService';
import { Notification } from '@/types/database';

export default function AdminNotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'orders' | 'payments'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = async (isManual = false) => {
    if (!user) return;
    if (isManual) setRefreshing(true);
    try {
      setLoading(true);
      const list = await fetchUserNotifications(user.id);
      setNotifications(list);
    } catch (err) {
      console.error('Error fetching admin notifications:', err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNotifications();

    if (user?.id) {
      const channel = supabase
        .channel(`admin-notifs-page-${user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
          () => {
            loadNotifications();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user?.id]);

  const handleMarkAsRead = async (id: string) => {
    await markNotificationAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    await markAllNotificationsAsRead(user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const filteredNotifs = notifications.filter((n) => {
    if (filter === 'unread') return !n.is_read;
    if (filter === 'orders') return n.type.includes('order');
    if (filter === 'payments') return n.type.includes('payment') || n.type.includes('utr');
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <AdminLayout
      title="Admin Notification Center"
      subtitle="Real-time order alerts, payment verifications, customer requests, and system events"
      actions={
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              onClick={handleMarkAllRead}
              size="sm"
              variant="outline"
              className="rounded-xl text-xs font-bold gap-1.5 border-emerald-200 text-emerald-800 hover:bg-emerald-50"
            >
              <CheckCheck size={14} />
              <span>Mark All Read</span>
            </Button>
          )}
          <Button
            onClick={() => loadNotifications(true)}
            variant="outline"
            size="sm"
            disabled={refreshing}
            className="rounded-xl text-xs font-bold gap-2 border-gray-200"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Filters and Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-gray-200 shadow-xs">
            {[
              { id: 'all', label: `All (${notifications.length})` },
              { id: 'unread', label: `Unread (${unreadCount})` },
              { id: 'orders', label: 'Orders' },
              { id: 'payments', label: 'Payments' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  filter === tab.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <Card className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xs">
          {loading ? (
            <div className="py-12 text-center">
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-gray-400 font-semibold">Loading notification history...</p>
            </div>
          ) : filteredNotifs.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
                <Bell size={24} />
              </div>
              <h4 className="font-extrabold text-sm text-gray-900">No Notifications</h4>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                You're all caught up! New order placements and payment submissions will appear here live.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredNotifs.map((n) => {
                const isOrder = n.type.includes('order');
                const isPayment = n.type.includes('payment') || n.type.includes('utr');

                return (
                  <div
                    key={n.id}
                    className={`py-4 px-3 sm:px-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                      n.is_read
                        ? 'hover:bg-gray-50/60'
                        : 'bg-emerald-50/50 hover:bg-emerald-50/80 border border-emerald-100/80'
                    }`}
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isPayment
                            ? 'bg-amber-100 text-amber-800'
                            : isOrder
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {isPayment ? (
                          <CreditCard size={18} />
                        ) : isOrder ? (
                          <ShoppingBag size={18} />
                        ) : (
                          <Bell size={18} />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-sm text-gray-900">
                            {n.title}
                          </h4>
                          {!n.is_read && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                          {n.message}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1">
                          {new Date(n.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}{' '}
                          at{' '}
                          {new Date(n.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0 pt-2 sm:pt-0">
                      {isPayment && (
                        <Button asChild size="sm" variant="outline" className="h-7 text-xs font-bold rounded-xl border-amber-200 text-amber-900 hover:bg-amber-50">
                          <Link to="/admin/payments">
                            Verify <ArrowRight size={12} className="ml-1" />
                          </Link>
                        </Button>
                      )}
                      {isOrder && (
                        <Button asChild size="sm" variant="outline" className="h-7 text-xs font-bold rounded-xl border-emerald-200 text-emerald-900 hover:bg-emerald-50">
                          <Link to="/admin/orders">
                            View Order <ArrowRight size={12} className="ml-1" />
                          </Link>
                        </Button>
                      )}
                      {!n.is_read && (
                        <button
                          onClick={() => handleMarkAsRead(n.id)}
                          className="px-2.5 py-1 text-[11px] font-bold text-gray-500 hover:text-emerald-700 rounded-lg hover:bg-white"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}
