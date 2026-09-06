import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  RefreshCw,
  User,
  UtensilsCrossed,
  IndianRupee,
  MapPin,
  ChevronRight,
  X,
  CreditCard,
  ShoppingBag,
  MessageCircle,
  Send,
  Bell,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { logAdminAction } from '@/services/adminService';
import {
  buildWhatsAppRenewalUrl,
  generateProfessionalRenewalMessage,
  triggerSubscriptionExpiryNotification,
} from '@/services/notificationService';

function getLocalDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function AdminSubscriptionsPage() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sendingReminderId, setSendingReminderId] = useState<string | null>(null);
  const [reminderStatusMsg, setReminderStatusMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Drawer / Detail Modal
  const [selectedSub, setSelectedSub] = useState<any | null>(null);
  const [subOrders, setSubOrders] = useState<any[]>([]);
  const [subPayments, setSubPayments] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Dedicated Reminder Modal
  const [reminderSub, setReminderSub] = useState<any | null>(null);
  const [messageTone, setMessageTone] = useState<'standard' | 'urgent' | 'english'>('standard');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [batchAlerting, setBatchAlerting] = useState(false);

  const todayStr = getLocalDateString();

  const fetchSubs = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          profile:profiles(id, full_name, email, phone),
          plan:plans(*),
          address:addresses(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSubs();

    const channel = supabase
      .channel('admin-subscriptions-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subscriptions' }, () => {
        fetchSubs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const openSubDetail = async (sub: any) => {
    setSelectedSub(sub);
    setDetailLoading(true);
    try {
      const [ordersRes, paymentsRes] = await Promise.all([
        supabase.from('orders').select('*').eq('subscription_id', sub.id).order('created_at', { ascending: false }),
        supabase.from('payments').select('*').eq('subscription_id', sub.id).order('created_at', { ascending: false }),
      ]);
      setSubOrders(ordersRes.data || []);
      setSubPayments(paymentsRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleUpdateSubStatus = async (subId: string, newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', subId);

      if (error) throw error;

      if (user) {
        logAdminAction({
          adminId: user.id,
          action: `subscription_status_${newStatus}`,
          targetType: 'subscription',
          targetId: subId,
          details: { newStatus },
        });
      }

      await fetchSubs();
      if (selectedSub?.id === subId) {
        setSelectedSub((prev: any) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error('Error updating subscription status:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const computeSubMetrics = (sub: any) => {
    const endDateVal = (sub.end_date || '').split('T')[0];
    const isPastEnd = endDateVal ? endDateVal < todayStr : false;
    let diffDays = 0;
    if (endDateVal) {
      const diffTime = new Date(endDateVal + 'T00:00:00').getTime() - new Date(todayStr + 'T00:00:00').getTime();
      diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    }
    const phone = sub.profile?.phone || sub.address?.phone || '';
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    return { endDateVal, isPastEnd, diffDays, phone, cleanPhone };
  };

  // 1-Click Instant WhatsApp Launch
  const handleQuickWhatsApp = (sub: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const { isPastEnd, diffDays, cleanPhone } = computeSubMetrics(sub);
    const customerName = sub.profile?.full_name || 'Customer';

    if (!cleanPhone || cleanPhone.length < 10) {
      // If phone is missing, open modal so admin can review
      openReminderDialog(sub, e);
      return;
    }

    const msg = generateProfessionalRenewalMessage({
      customerName,
      planName: sub.plan?.name || 'Tiffin Plan',
      endDate: sub.end_date,
      daysRemaining: diffDays,
      isExpired: isPastEnd,
      tone: 'standard',
    });

    const waUrl = `https://api.whatsapp.com/send?phone=91${cleanPhone}&text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');

    setReminderStatusMsg(`✅ WhatsApp opened with pre-filled renewal message for ${customerName}!`);
    setTimeout(() => setReminderStatusMsg(null), 5000);
  };

  // 1-Click Instant In-App & SMS/Email Alert
  const handleQuickInAppAlert = async (sub: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const { isPastEnd, diffDays, phone } = computeSubMetrics(sub);
    const customerName = sub.profile?.full_name || 'Customer';

    setSendingReminderId(sub.id);
    try {
      const res = await triggerSubscriptionExpiryNotification(
        sub.id,
        {
          customerName,
          customerPhone: phone || null,
          customerEmail: sub.profile?.email || null,
          planName: sub.plan?.name || 'Tiffin Plan',
          endDate: sub.end_date,
          daysRemaining: diffDays,
          isExpired: isPastEnd,
        },
        sub.user_id || sub.profile?.id || ''
      );

      if (res.success) {
        setReminderStatusMsg(`🔔 In-App renewal reminder & alert successfully dispatched to ${customerName}!`);
      } else {
        setReminderStatusMsg(`⚠️ Alert recorded for ${customerName}.`);
      }
      setTimeout(() => setReminderStatusMsg(null), 5000);
    } catch (err) {
      console.error('Error dispatching alert:', err);
    } finally {
      setSendingReminderId(null);
    }
  };

  // Batch Auto-Alert for all expiring/expired subscriptions
  const handleBatchSendExpiryAlerts = async () => {
    const candidates = subscriptions.filter((s) => {
      const { isPastEnd, diffDays } = computeSubMetrics(s);
      return isPastEnd || (diffDays <= 2 && s.status === 'active');
    });

    if (candidates.length === 0) {
      setReminderStatusMsg('ℹ️ No expiring or expired subscriptions require alerts today.');
      setTimeout(() => setReminderStatusMsg(null), 4000);
      return;
    }

    setBatchAlerting(true);
    let sentCount = 0;

    try {
      for (const sub of candidates) {
        const { isPastEnd, diffDays, phone } = computeSubMetrics(sub);
        await triggerSubscriptionExpiryNotification(
          sub.id,
          {
            customerName: sub.profile?.full_name || 'Customer',
            customerPhone: phone || null,
            customerEmail: sub.profile?.email || null,
            planName: sub.plan?.name || 'Tiffin Plan',
            endDate: sub.end_date,
            daysRemaining: diffDays,
            isExpired: isPastEnd,
          },
          sub.user_id || sub.profile?.id || ''
        );
        sentCount++;
      }

      setReminderStatusMsg(`🎉 Automated renewal alerts successfully dispatched to ${sentCount} patrons!`);
      setTimeout(() => setReminderStatusMsg(null), 6000);
    } catch (err) {
      console.error('Batch alert error:', err);
    } finally {
      setBatchAlerting(false);
    }
  };

  // Open Detailed Reminder Dialog
  const openReminderDialog = (sub: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setReminderSub(sub);
    setMessageTone('standard');

    const { isPastEnd, diffDays } = computeSubMetrics(sub);
    const initialMsg = generateProfessionalRenewalMessage({
      customerName: sub.profile?.full_name || 'Customer',
      planName: sub.plan?.name || 'Tiffin Plan',
      endDate: sub.end_date,
      daysRemaining: diffDays,
      isExpired: isPastEnd,
      tone: 'standard',
    });

    setCustomMessage(initialMsg);
  };

  // Tone switcher inside modal
  const handleToneChange = (newTone: 'standard' | 'urgent' | 'english') => {
    setMessageTone(newTone);
    if (!reminderSub) return;
    const { isPastEnd, diffDays } = computeSubMetrics(reminderSub);
    const updated = generateProfessionalRenewalMessage({
      customerName: reminderSub.profile?.full_name || 'Customer',
      planName: reminderSub.plan?.name || 'Tiffin Plan',
      endDate: reminderSub.end_date,
      daysRemaining: diffDays,
      isExpired: isPastEnd,
      tone: newTone,
    });
    setCustomMessage(updated);
  };

  const handleSendInAppAndSms = async () => {
    if (!reminderSub) return;
    const { isPastEnd, diffDays, phone } = computeSubMetrics(reminderSub);
    setSendingReminderId(reminderSub.id);

    try {
      const res = await triggerSubscriptionExpiryNotification(
        reminderSub.id,
        {
          customerName: reminderSub.profile?.full_name || 'Customer',
          customerPhone: phone || null,
          customerEmail: reminderSub.profile?.email || null,
          planName: reminderSub.plan?.name || 'Tiffin Plan',
          endDate: reminderSub.end_date,
          daysRemaining: diffDays,
          isExpired: isPastEnd,
        },
        reminderSub.user_id || reminderSub.profile?.id || ''
      );

      if (res.success) {
        setReminderStatusMsg(`🔔 In-App & Email/SMS notification dispatched to ${reminderSub.profile?.full_name || 'Customer'}!`);
        setReminderSub(null);
        setTimeout(() => setReminderStatusMsg(null), 5000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSendingReminderId(null);
    }
  };

  const handleLaunchWhatsAppWithCustomMessage = () => {
    if (!reminderSub) return;
    const { cleanPhone } = computeSubMetrics(reminderSub);
    if (!cleanPhone || cleanPhone.length < 10) {
      alert('No valid 10-digit mobile number found for this customer.');
      return;
    }

    const waUrl = `https://api.whatsapp.com/send?phone=91${cleanPhone}&text=${encodeURIComponent(customMessage)}`;
    window.open(waUrl, '_blank');

    setReminderStatusMsg(`✅ WhatsApp chat opened for ${reminderSub.profile?.full_name || 'Customer'}!`);
    setReminderSub(null);
    setTimeout(() => setReminderStatusMsg(null), 5000);
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(customMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Filter logic
  const filteredSubs = subscriptions.filter((sub) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (sub.profile?.full_name || '').toLowerCase().includes(q) ||
      (sub.profile?.email || '').toLowerCase().includes(q) ||
      (sub.profile?.phone || '').toLowerCase().includes(q) ||
      (sub.plan?.name || '').toLowerCase().includes(q) ||
      (sub.id || '').toLowerCase().includes(q);

    const endDateVal = (sub.end_date || '').split('T')[0];
    const isPastEnd = endDateVal ? endDateVal < todayStr : false;
    const realStatus = isPastEnd ? 'expired' : sub.status;

    const matchesStatus = statusFilter === 'all' ? true : realStatus === statusFilter;
    const matchesPlan =
      planFilter === 'all' ? true : sub.plan?.plan_type === planFilter;

    return matchesSearch && matchesStatus && matchesPlan;
  });

  const expiringCount = subscriptions.filter((s) => {
    const { isPastEnd, diffDays } = computeSubMetrics(s);
    return isPastEnd || (diffDays <= 2 && s.status === 'active');
  }).length;

  return (
    <AdminLayout
      title="Subscription Management"
      subtitle="Monitor recurring meal subscriptions, active cycles, pause requests, delivery allocations and professional WhatsApp/SMS renewal reminders"
      actions={
        <div className="flex items-center gap-2">
          {/* Automatic Expiry Alerts Batch Dispatcher */}
          <Button
            onClick={handleBatchSendExpiryAlerts}
            disabled={batchAlerting || expiringCount === 0}
            variant="outline"
            size="sm"
            className="rounded-xl text-xs font-bold gap-2 border-amber-300 bg-amber-50/80 hover:bg-amber-100 text-amber-950 shadow-2xs"
            title="Automatically dispatch In-App alerts to all expiring and expired patrons"
          >
            <Bell size={14} className={batchAlerting ? 'animate-bounce text-amber-700' : 'text-amber-700'} />
            <span>
              {batchAlerting
                ? 'Sending Auto Alerts...'
                : `⚡ Auto Alert All (${expiringCount})`}
            </span>
          </Button>

          <Button
            onClick={() => fetchSubs(true)}
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
        {/* Status Toast */}
        {reminderStatusMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-2xl text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
              <span>{reminderStatusMsg}</span>
            </div>
            <button
              onClick={() => setReminderStatusMsg(null)}
              className="text-emerald-800 hover:text-emerald-950 font-black text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* KPI Stats overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4 rounded-3xl border border-emerald-100 bg-white shadow-xs">
            <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              Active Patrons
            </span>
            <h4 className="text-2xl font-black text-gray-900 mt-2">
              {
                subscriptions.filter((s) => {
                  const end = (s.end_date || '').split('T')[0];
                  return s.status === 'active' && (!end || end >= todayStr);
                }).length
              }
            </h4>
            <p className="text-[11px] text-gray-500 mt-0.5">Daily meal dispatch active</p>
          </Card>

          <Card className="p-4 rounded-3xl border border-amber-100 bg-white shadow-xs">
            <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
              Pending Activation
            </span>
            <h4 className="text-2xl font-black text-gray-900 mt-2">
              {subscriptions.filter((s) => s.status === 'pending').length}
            </h4>
            <p className="text-[11px] text-gray-500 mt-0.5">Awaiting UTR clearance</p>
          </Card>

          <Card className="p-4 rounded-3xl border border-blue-100 bg-white shadow-xs">
            <span className="text-[10px] font-black uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
              Paused / Hold
            </span>
            <h4 className="text-2xl font-black text-gray-900 mt-2">
              {subscriptions.filter((s) => s.status === 'paused').length}
            </h4>
            <p className="text-[11px] text-gray-500 mt-0.5">Patrons on temporary leave</p>
          </Card>

          <Card className="p-4 rounded-3xl border border-gray-100 bg-white shadow-xs">
            <span className="text-[10px] font-black uppercase text-red-700 bg-red-50 px-2 py-0.5 rounded-md">
              Expired / Ended
            </span>
            <h4 className="text-2xl font-black text-gray-900 mt-2">
              {
                subscriptions.filter((s) => {
                  const end = (s.end_date || '').split('T')[0];
                  return s.status === 'expired' || s.status === 'cancelled' || (end && end < todayStr);
                }).length
              }
            </h4>
            <p className="text-[11px] text-gray-500 mt-0.5">Renewal required</p>
          </Card>
        </div>

        {/* Subscription Table Card */}
        <Card className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xs space-y-5">
          {/* Filter Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-lg text-gray-900">All Subscriptions</h3>
              <p className="text-xs text-gray-500">
                Click <strong>WhatsApp</strong> to launch direct chat or <strong>Alert</strong> to dispatch In-App notification instantly
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[200px]">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search customer, plan..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 rounded-2xl text-xs h-9"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 px-3 rounded-2xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="paused">Paused</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </select>

              {/* Plan Filter */}
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="h-9 px-3 rounded-2xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">All Plans</option>
                <option value="monthly">Monthly Plans</option>
                <option value="weekly">Weekly Plans</option>
                <option value="daily">Daily Tiffins</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] text-gray-600 font-extrabold uppercase text-[10px] tracking-wider border-y border-gray-100">
                <tr>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Plan & Meal Slot</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Cycle Dates</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Renewal Reminders</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-gray-400 font-medium">
                      Loading subscriptions...
                    </td>
                  </tr>
                ) : filteredSubs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-gray-400 font-medium">
                      No matching subscriptions found.
                    </td>
                  </tr>
                ) : (
                  filteredSubs.map((sub) => {
                    const { endDateVal, isPastEnd, diffDays, phone, cleanPhone } = computeSubMetrics(sub);
                    const isActive = !isPastEnd && sub.status === 'active';
                    const isExpired = isPastEnd || sub.status === 'expired';
                    const isPending = sub.status === 'pending';
                    const isAlertSending = sendingReminderId === sub.id;

                    return (
                      <tr
                        key={sub.id}
                        onClick={() => openSubDetail(sub)}
                        className="hover:bg-emerald-50/30 cursor-pointer transition-colors"
                      >
                        {/* Customer */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-gray-900">
                            {sub.profile?.full_name || 'Customer'}
                          </div>
                          <div className="text-[11px] text-gray-500">
                            {phone || sub.profile?.email || 'N/A'}
                          </div>
                        </td>

                        {/* Plan */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-gray-900">{sub.plan?.name || 'Tiffin Plan'}</div>
                          <div className="text-[10px] text-gray-500 capitalize">
                            Slot: {sub.delivery_time || 'Morning'} • {sub.plan?.meal_type || 'Full'}
                          </div>
                        </td>

                        {/* Amount */}
                        <td className="py-3.5 px-4 font-black text-gray-900">
                          ₹{sub.amount}
                        </td>

                        {/* Dates */}
                        <td className="py-3.5 px-4 text-gray-600 text-[11px]">
                          <div>
                            {new Date(sub.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}{' '}
                            →{' '}
                            <span className={isPastEnd ? 'font-bold text-red-600' : 'font-bold text-gray-900'}>
                              {new Date(sub.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          {isPastEnd ? (
                            <span className="text-[10px] text-red-600 font-bold">Ended</span>
                          ) : diffDays <= 2 ? (
                            <span className="text-[10px] text-amber-700 font-bold">Expires in {diffDays}d</span>
                          ) : null}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <Badge
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isActive
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                : isExpired
                                ? 'bg-red-100 text-red-800 border-red-200'
                                : isPending
                                ? 'bg-amber-100 text-amber-900 border-amber-200'
                                : sub.status === 'paused'
                                ? 'bg-blue-100 text-blue-800 border-blue-200'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {isActive ? 'Active' : isExpired ? 'Expired' : sub.status}
                          </Badge>
                        </td>

                        {/* 1-Click WhatsApp & In-App Alert Reminders */}
                        <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5">
                            {/* 1-Click WhatsApp Direct Launch */}
                            <button
                              type="button"
                              onClick={(e) => handleQuickWhatsApp(sub, e)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-green-50 hover:bg-green-100 text-green-900 border border-green-200 text-[11px] font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
                              title="1-Click Launch WhatsApp with pre-filled professional reminder"
                            >
                              <MessageCircle size={12} className="text-green-600 fill-green-600" />
                              <span>WhatsApp</span>
                            </button>

                            {/* 1-Click In-App & SMS Dispatch */}
                            <button
                              type="button"
                              onClick={(e) => handleQuickInAppAlert(sub, e)}
                              disabled={isAlertSending}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 text-[11px] font-bold transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                              title="1-Click Dispatch In-App & Email/SMS alert"
                            >
                              <Bell size={11} className={isAlertSending ? 'animate-spin text-amber-800' : 'text-amber-800'} />
                              <span>{isAlertSending ? 'Sending...' : 'Alert'}</span>
                            </button>

                            {/* Customize / Preview Modal Trigger */}
                            <button
                              type="button"
                              onClick={(e) => openReminderDialog(sub, e)}
                              className="p-1 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 text-[11px] transition-all cursor-pointer"
                              title="Preview & Customize Reminder Message"
                            >
                              <Send size={11} />
                            </button>
                          </div>
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-4 text-right">
                          <Button size="sm" variant="ghost" className="h-7 text-xs font-bold text-emerald-700 hover:bg-emerald-50 rounded-xl">
                            View <ChevronRight size={14} className="ml-1" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* ================================================== */}
        {/* DEDICATED PROFESSIONAL RENEWAL REMINDER MODAL */}
        {/* ================================================== */}
        <Modal
          isOpen={!!reminderSub}
          onClose={() => setReminderSub(null)}
          title="Send Subscription Renewal Reminder"
        >
          {reminderSub && (
            <div className="space-y-4 text-left text-xs">
              {/* Patron & Plan Header */}
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EAE6DE] flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-extrabold text-sm text-gray-900">
                    {reminderSub.profile?.full_name || 'Customer'}
                  </h4>
                  <p className="text-xs text-gray-600 mt-0.5 font-mono">
                    📱 {reminderSub.profile?.phone || reminderSub.address?.phone || 'No mobile number'}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Plan: <strong>{reminderSub.plan?.name || 'Tiffin Plan'}</strong> • End Date:{' '}
                    <strong className="text-gray-900">{reminderSub.end_date}</strong>
                  </p>
                </div>

                <Badge className={reminderSub.end_date < todayStr ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-900'}>
                  {reminderSub.end_date < todayStr ? 'Expired' : 'Expiring Soon'}
                </Badge>
              </div>

              {/* Tone Selection Tabs */}
              <div>
                <label className="font-black text-gray-800 uppercase text-[10px] tracking-wider block mb-1.5">
                  Select Message Tone:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleToneChange('standard')}
                    className={`py-2 px-2.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer text-center ${
                      messageTone === 'standard'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    🍱 Standard (Homestyle)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToneChange('urgent')}
                    className={`py-2 px-2.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer text-center ${
                      messageTone === 'urgent'
                        ? 'bg-red-600 text-white border-red-600 shadow-xs'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    🚨 Urgent (Hold Notice)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToneChange('english')}
                    className={`py-2 px-2.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer text-center ${
                      messageTone === 'english'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    💼 Formal English
                  </button>
                </div>
              </div>

              {/* Message Box */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="font-black text-gray-800 uppercase text-[10px] tracking-wider">
                    Professional Message Preview (Editable):
                  </label>
                  <button
                    type="button"
                    onClick={handleCopyMessage}
                    className="text-emerald-700 hover:text-emerald-900 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                    <span>{copied ? 'Copied!' : 'Copy Text'}</span>
                  </button>
                </div>

                <textarea
                  rows={9}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full p-3.5 rounded-2xl border border-gray-200 text-xs font-sans text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 leading-relaxed bg-white shadow-xs"
                />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* 1. WhatsApp Button */}
                <Button
                  onClick={handleLaunchWhatsAppWithCustomMessage}
                  className="w-full rounded-2xl bg-green-600 hover:bg-green-700 text-white font-black text-xs h-11 shadow-md shadow-green-600/20 gap-2 cursor-pointer"
                >
                  <MessageCircle size={16} className="fill-white" />
                  <span>Send via WhatsApp</span>
                  <ExternalLink size={12} />
                </Button>

                {/* 2. In-App & SMS Button */}
                <Button
                  onClick={handleSendInAppAndSms}
                  disabled={sendingReminderId === reminderSub.id}
                  variant="outline"
                  className="w-full rounded-2xl border-emerald-300 text-emerald-900 hover:bg-emerald-50 font-black text-xs h-11 gap-2 cursor-pointer"
                >
                  <Bell size={15} className="text-emerald-700" />
                  <span>{sendingReminderId === reminderSub.id ? 'Sending...' : 'Send In-App & SMS'}</span>
                </Button>
              </div>

              <p className="text-[10px] text-gray-400 text-center pt-1">
                * Clicking WhatsApp opens WhatsApp Web/Mobile directly with this personalized message pre-filled.
              </p>
            </div>
          )}
        </Modal>

        {/* SUBSCRIPTION DETAIL DRAWER / MODAL */}
        <Modal
          isOpen={!!selectedSub}
          onClose={() => setSelectedSub(null)}
          title={`Subscription #${selectedSub?.id.slice(0, 8)}`}
        >
          {selectedSub && (
            <div className="space-y-5 text-left text-xs">
              {/* Customer Banner */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-sm text-emerald-950">
                    {selectedSub.profile?.full_name || 'Customer'}
                  </h4>
                  <p className="text-gray-600 mt-0.5">
                    {selectedSub.profile?.phone || selectedSub.address?.phone || 'No Phone'} • {selectedSub.profile?.email}
                  </p>
                </div>
                <Badge className="bg-emerald-600 text-white font-black text-[11px]">
                  {selectedSub.status}
                </Badge>
              </div>

              {/* Quick WhatsApp Renewal Action */}
              {(selectedSub.profile?.phone || selectedSub.address?.phone) && (
                <div className="p-3.5 rounded-2xl bg-green-50 border border-green-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-green-600 text-white flex items-center justify-center flex-shrink-0">
                      <MessageCircle size={16} className="fill-white" />
                    </div>
                    <div>
                      <p className="font-bold text-green-950 text-xs">Direct WhatsApp Renewal Reminder</p>
                      <p className="text-[11px] text-green-800">1-click personalized message with checkout link</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={(e) => openReminderDialog(selectedSub, e)}
                    className="h-8 text-xs font-bold bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-xs"
                  >
                    Open Tool
                  </Button>
                </div>
              )}

              {/* Plan Details Grid */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-gray-50 border border-gray-200">
                <div>
                  <span className="text-[10px] font-extrabold text-gray-500 uppercase">Plan Name</span>
                  <p className="font-black text-sm text-gray-900 mt-0.5">{selectedSub.plan?.name || 'Tiffin'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-gray-500 uppercase">Total Amount</span>
                  <p className="font-black text-sm text-emerald-700 mt-0.5">₹{selectedSub.amount}</p>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-gray-500 uppercase">Start Date</span>
                  <p className="font-bold text-gray-800 mt-0.5">{selectedSub.start_date}</p>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-gray-500 uppercase">End Date</span>
                  <p className="font-bold text-gray-800 mt-0.5">{selectedSub.end_date}</p>
                </div>
              </div>

              {/* Delivery Address */}
              {selectedSub.address && (
                <div className="p-3 rounded-2xl bg-white border border-gray-200 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-gray-900">
                    <MapPin size={14} className="text-emerald-600" /> Delivery Address
                  </div>
                  <p className="text-gray-600">
                    {selectedSub.address.address_line}, {selectedSub.address.area}, {selectedSub.address.city} - {selectedSub.address.pincode}
                  </p>
                  {selectedSub.address.landmark && (
                    <p className="text-gray-400 italic">Landmark: {selectedSub.address.landmark}</p>
                  )}
                </div>
              )}

              {/* Linked Orders History */}
              <div className="space-y-2">
                <h5 className="font-extrabold text-gray-900">Linked Orders ({subOrders.length})</h5>
                {detailLoading ? (
                  <p className="text-gray-400 py-2">Loading orders...</p>
                ) : subOrders.length === 0 ? (
                  <p className="text-gray-400 py-2">No individual orders linked.</p>
                ) : (
                  <div className="max-h-36 overflow-y-auto space-y-1.5">
                    {subOrders.map((o) => (
                      <div key={o.id} className="p-2 rounded-xl bg-gray-50 border border-gray-200 flex justify-between items-center text-[11px]">
                        <div>
                          <span className="font-bold text-gray-900">Order #{o.id.slice(0, 8)}</span>
                          <span className="text-gray-500 ml-2">({o.meal_type})</span>
                        </div>
                        <Badge className="text-[10px]">{o.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Admin Actions */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                <span className="text-gray-500 text-[11px] font-bold">Quick Status Control:</span>
                <div className="flex gap-1.5">
                  {selectedSub.status !== 'active' && (
                    <Button
                      onClick={() => handleUpdateSubStatus(selectedSub.id, 'active')}
                      size="sm"
                      disabled={updatingStatus}
                      className="h-7 text-xs font-bold bg-emerald-600 text-white rounded-xl"
                    >
                      Set Active
                    </Button>
                  )}
                  {selectedSub.status !== 'paused' && (
                    <Button
                      onClick={() => handleUpdateSubStatus(selectedSub.id, 'paused')}
                      size="sm"
                      variant="outline"
                      disabled={updatingStatus}
                      className="h-7 text-xs font-bold text-blue-700 border-blue-200 rounded-xl"
                    >
                      Pause
                    </Button>
                  )}
                  {selectedSub.status !== 'cancelled' && (
                    <Button
                      onClick={() => handleUpdateSubStatus(selectedSub.id, 'cancelled')}
                      size="sm"
                      variant="outline"
                      disabled={updatingStatus}
                      className="h-7 text-xs font-bold text-red-700 border-red-200 rounded-xl"
                    >
                      Cancel Plan
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
