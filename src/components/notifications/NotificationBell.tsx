import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  Clock,
  Bike,
  Package,
  XCircle,
  ShieldCheck,
  CheckCheck,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Notification } from '@/types/database';
import {
  fetchUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  subscribeToUserNotifications,
} from '@/services/notificationService';

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    // Initial load
    async function load() {
      setLoading(true);
      const list = await fetchUserNotifications(user.id);
      setNotifications(list);
      setLoading(false);
    }
    load();

    // Subscribe to realtime notifications
    const unsubscribe = subscribeToUserNotifications(user.id, (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]);
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
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

  if (!user) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'order_confirmed':
        return <CheckCircle2 size={16} className="text-emerald-600" />;
      case 'out_for_delivery':
        return <Bike size={16} className="text-amber-600" />;
      case 'delivered':
        return <Package size={16} className="text-primary" />;
      case 'order_cancelled':
        return <XCircle size={16} className="text-red-500" />;
      case 'payment_verified':
        return <ShieldCheck size={16} className="text-blue-600" />;
      default:
        return <Clock size={16} className="text-gray-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full text-gray-600 hover:text-primary hover:bg-primary/5 transition-all cursor-pointer focus:outline-none"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white shadow-xs animate-in zoom-in">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="font-extrabold text-sm text-foreground">Notifications</h4>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[11px]">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-semibold text-primary hover:underline cursor-pointer inline-flex items-center gap-1"
              >
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {loading ? (
              <div className="p-8 text-center text-xs text-gray-400">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400 space-y-1">
                <p className="font-semibold text-gray-600">All caught up!</p>
                <p>No notifications at the moment.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={(e) => handleMarkAsRead(notif.id, e)}
                  className={`p-3.5 flex items-start gap-3 transition-colors hover:bg-gray-50/80 cursor-pointer ${
                    !notif.is_read ? 'bg-amber-50/40 font-medium' : ''
                  }`}
                >
                  <div className="mt-0.5 p-2 rounded-xl bg-gray-50 border border-gray-100 flex-shrink-0">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-grow min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold text-foreground truncate">{notif.title}</p>
                      {!notif.is_read && (
                        <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-gray-600 leading-relaxed line-clamp-2">
                      {notif.message}
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-gray-400">
                        {new Date(notif.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {notif.order_id && (
                        <Link
                          to="/orders"
                          onClick={() => setIsOpen(false)}
                          className="text-[10px] font-bold text-primary hover:underline inline-flex items-center gap-0.5"
                        >
                          View Order <ExternalLink size={10} />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
