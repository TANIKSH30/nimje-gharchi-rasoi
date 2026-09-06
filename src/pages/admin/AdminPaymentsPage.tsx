import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Copy,
  CheckCheck,
  RefreshCw,
  QrCode,
  Check,
  X,
  AlertTriangle,
  FileText,
  User,
  IndianRupee,
  ExternalLink,
  ShieldCheck,
  Filter,
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { verifyPaymentByAdmin } from '@/services/adminService';

export default function AdminPaymentsPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Approval / Rejection Modal states
  const [approvingPayment, setApprovingPayment] = useState<any | null>(null);
  const [rejectingPayment, setRejectingPayment] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Payment Not Received');
  const [customRejectionReason, setCustomRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchPayments = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      let { data, error } = await supabase
        .from('payments')
        .select('*, profile:profiles(id, full_name, email, phone)')
        .order('created_at', { ascending: false });

      if (error) {
        const fallback = await supabase
          .from('payments')
          .select('*')
          .order('created_at', { ascending: false });
        data = fallback.data;
      }

      setPayments(data || []);
    } catch (err) {
      console.error('Error loading payments:', err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPayments();

    // Realtime payment channel
    const channel = supabase
      .channel('admin-payments-page')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments' },
        () => {
          fetchPayments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Handle Approve Action
  const handleApprove = async () => {
    if (!approvingPayment || !user) return;
    setActionLoading(true);
    setActionMessage(null);

    try {
      const result = await verifyPaymentByAdmin({
        paymentId: approvingPayment.id,
        action: 'approve',
        adminUserId: user.id,
      });

      setActionMessage({ type: 'success', text: result.message });
      setApprovingPayment(null);
      await fetchPayments();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Approval failed' });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Reject Action
  const handleReject = async () => {
    if (!rejectingPayment || !user) return;
    setActionLoading(true);
    setActionMessage(null);

    const finalReason =
      rejectionReason === 'Other'
        ? customRejectionReason.trim() || 'Payment could not be verified'
        : rejectionReason;

    try {
      const result = await verifyPaymentByAdmin({
        paymentId: rejectingPayment.id,
        action: 'reject',
        rejectionReason: finalReason,
        adminUserId: user.id,
      });

      setActionMessage({ type: 'success', text: result.message });
      setRejectingPayment(null);
      setCustomRejectionReason('');
      await fetchPayments();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Rejection failed' });
    } finally {
      setActionLoading(false);
    }
  };

  // Filter Payments
  const filteredPayments = payments.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (p.payment_reference || '').toLowerCase().includes(q) ||
      (p.utr || '').toLowerCase().includes(q) ||
      (p.profile?.full_name || '').toLowerCase().includes(q) ||
      (p.profile?.email || '').toLowerCase().includes(q) ||
      (p.profile?.phone || '').toLowerCase().includes(q) ||
      (p.id || '').toLowerCase().includes(q) ||
      (p.order_id || '').toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'pending_verification'
        ? p.status === 'pending_verification'
        : p.status === statusFilter;

    let matchesDate = true;
    if (dateFilter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      matchesDate = (p.created_at || '').startsWith(today);
    } else if (dateFilter === '7d') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      matchesDate = new Date(p.created_at) >= sevenDaysAgo;
    } else if (dateFilter === '30d') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      matchesDate = new Date(p.created_at) >= thirtyDaysAgo;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const pendingPayments = payments.filter((p) => p.status === 'pending_verification');

  return (
    <AdminLayout
      title="Payment Verification Center"
      subtitle="Verify UPI QR & UTR submissions, approve subscriptions & maintain the transaction ledger"
      actions={
        <Button
          onClick={() => fetchPayments(true)}
          variant="outline"
          size="sm"
          disabled={refreshing}
          className="rounded-xl text-xs font-bold gap-2 border-gray-200"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Action feedback banner */}
        {actionMessage && (
          <div
            className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold shadow-xs ${
              actionMessage.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                : 'bg-red-50 border border-red-200 text-red-900'
            }`}
          >
            <div className="flex items-center gap-2">
              {actionMessage.type === 'success' ? (
                <CheckCircle2 size={16} className="text-emerald-600" />
              ) : (
                <AlertTriangle size={16} className="text-red-600" />
              )}
              <span>{actionMessage.text}</span>
            </div>
            <button
              onClick={() => setActionMessage(null)}
              className="text-gray-400 hover:text-gray-700"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* 1. TOP SECTION: PENDING PAYMENT VERIFICATION QUEUE */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping" />
              <h3 className="text-lg font-black text-gray-900">
                Pending Verification Queue ({pendingPayments.length})
              </h3>
            </div>
            {pendingPayments.length > 0 && (
              <span className="text-xs font-extrabold text-amber-800 bg-amber-100/80 px-3 py-1 rounded-full border border-amber-200">
                Action Required
              </span>
            )}
          </div>

          {loading ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-gray-200">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-gray-500 font-semibold">Loading pending queue...</p>
            </div>
          ) : pendingPayments.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-gray-200">
              <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-2" />
              <h4 className="font-extrabold text-sm text-gray-900">Queue is Clear!</h4>
              <p className="text-xs text-gray-500 mt-0.5">
                All submitted UTR payments have been reviewed and verified.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingPayments.map((payment) => (
                <Card
                  key={payment.id}
                  className="rounded-3xl border-2 border-amber-300/80 bg-gradient-to-b from-amber-50/40 via-white to-white p-5 shadow-sm relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                        Pending UTR
                      </span>
                      <h4 className="font-black text-base text-gray-900 mt-1 truncate">
                        {payment.profile?.full_name || 'Customer'}
                      </h4>
                      <p className="text-xs text-gray-500 truncate">
                        {payment.profile?.phone || payment.profile?.email || 'No phone'}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-xl font-black text-emerald-700">
                        ₹{payment.amount}
                      </span>
                      <p className="text-[10px] text-gray-400">
                        {new Date(payment.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  {/* UTR Box */}
                  <div className="p-3 rounded-2xl bg-amber-100/60 border border-amber-200/80 space-y-1 my-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wider">
                        UTR / Transaction ID
                      </span>
                      {payment.utr && (
                        <button
                          onClick={() => handleCopy(payment.utr, payment.id)}
                          className="text-amber-800 hover:text-amber-950 text-xs flex items-center gap-1 font-bold"
                          title="Copy UTR"
                        >
                          {copiedId === payment.id ? (
                            <CheckCheck size={12} className="text-emerald-700" />
                          ) : (
                            <Copy size={12} />
                          )}
                          <span className="text-[10px]">Copy</span>
                        </button>
                      )}
                    </div>
                    <p className="font-mono text-sm font-black text-gray-900 select-all tracking-wide break-all">
                      {payment.utr || 'No UTR provided'}
                    </p>
                  </div>

                  {/* Reference info */}
                  <div className="text-[11px] text-gray-500 space-y-1 mb-4">
                    <p className="truncate">
                      <strong>Ref:</strong>{' '}
                      <span className="font-mono">{payment.payment_reference || payment.id.slice(0, 8)}</span>
                    </p>
                    {payment.subscription_id && (
                      <p className="truncate">
                        <strong>Subscription:</strong> Active on approval
                      </p>
                    )}
                  </div>

                  {/* Approve / Reject Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                    <Button
                      onClick={() => setRejectingPayment(payment)}
                      variant="outline"
                      size="sm"
                      className="rounded-xl border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 font-bold text-xs"
                    >
                      <X size={14} className="mr-1" /> Reject
                    </Button>

                    <Button
                      onClick={() => setApprovingPayment(payment)}
                      size="sm"
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/20"
                    >
                      <Check size={14} className="mr-1" /> Approve
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* 2. BOTTOM SECTION: COMPLETE PAYMENT LEDGER */}
        <Card className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xs space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-lg text-gray-900">Payment Ledger</h3>
              <p className="text-xs text-gray-500">
                Complete audit trail of all transactions, UTR submissions, and verification logs
              </p>
            </div>

            {/* Search & Filter Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[220px]">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search UTR, Ref, Customer..."
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
                <option value="pending_verification">Pending Verification</option>
                <option value="paid">Paid & Verified</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>

              {/* Date Filter */}
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="h-9 px-3 rounded-2xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] text-gray-600 font-extrabold uppercase text-[10px] tracking-wider border-y border-gray-100">
                <tr>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">UTR / Transaction Ref</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Submitted Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-gray-400 font-medium">
                      No matching payment records found.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => {
                    const isPending = p.status === 'pending_verification';
                    const isPaid = p.status === 'paid';
                    const isRejected = p.status === 'rejected';

                    return (
                      <tr key={p.id} className="hover:bg-gray-50/70 transition-colors">
                        {/* Customer */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-gray-900">
                            {p.profile?.full_name || 'Customer'}
                          </div>
                          <div className="text-[11px] text-gray-500">
                            {p.profile?.phone || p.profile?.email || 'N/A'}
                          </div>
                        </td>

                        {/* UTR */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 font-mono font-bold text-gray-900">
                            <span>{p.utr || p.payment_reference || `#${p.id.slice(0, 8)}`}</span>
                            {p.utr && (
                              <button
                                onClick={() => handleCopy(p.utr, p.id)}
                                className="text-gray-400 hover:text-gray-700"
                                title="Copy"
                              >
                                {copiedId === p.id ? (
                                  <CheckCheck size={12} className="text-emerald-600" />
                                ) : (
                                  <Copy size={12} />
                                )}
                              </button>
                            )}
                          </div>
                          {p.payment_reference && p.utr && (
                            <div className="text-[10px] text-gray-400 font-mono">
                              Ref: {p.payment_reference}
                            </div>
                          )}
                        </td>

                        {/* Amount */}
                        <td className="py-3 px-4 font-black text-gray-900 text-sm">
                          ₹{p.amount}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          <Badge
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              isPaid
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                : isPending
                                ? 'bg-amber-100 text-amber-900 border-amber-200 animate-pulse'
                                : isRejected
                                ? 'bg-red-100 text-red-800 border-red-200'
                                : 'bg-gray-100 text-gray-700 border-gray-200'
                            }`}
                          >
                            {isPending ? 'Pending Verification' : isPaid ? 'Paid' : isRejected ? 'Rejected' : p.status}
                          </Badge>
                          {p.rejection_reason && (
                            <p className="text-[10px] text-red-600 mt-0.5 max-w-xs truncate">
                              Reason: {p.rejection_reason}
                            </p>
                          )}
                        </td>

                        {/* Date */}
                        <td className="py-3 px-4 text-gray-600 text-[11px]">
                          <div>{new Date(p.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                          <div className="text-[10px] text-gray-400">
                            {new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          {isPending ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                onClick={() => setRejectingPayment(p)}
                                size="sm"
                                variant="outline"
                                className="h-7 px-2.5 rounded-xl text-red-700 border-red-200 hover:bg-red-50 text-[11px] font-bold"
                              >
                                Reject
                              </Button>
                              <Button
                                onClick={() => setApprovingPayment(p)}
                                size="sm"
                                className="h-7 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black"
                              >
                                Approve
                              </Button>
                            </div>
                          ) : (
                            <span className="text-[10px] font-semibold text-gray-400">
                              {isPaid ? 'Verified' : 'Processed'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* APPROVE CONFIRMATION MODAL */}
        <Modal
          isOpen={!!approvingPayment}
          onClose={() => !actionLoading && setApprovingPayment(null)}
          title="Confirm Payment Approval"
        >
          {approvingPayment && (
            <div className="space-y-4 text-left">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-2">
                <div className="flex justify-between items-center pb-2 border-b border-emerald-200/60">
                  <span className="text-xs font-bold text-emerald-800">Customer Name:</span>
                  <span className="font-extrabold text-sm text-emerald-950">
                    {approvingPayment.profile?.full_name || 'Customer'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-emerald-800">Verified Amount:</span>
                  <span className="text-lg font-black text-emerald-700">
                    ₹{approvingPayment.amount}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-emerald-800">Submitted UTR:</span>
                  <span className="font-mono text-xs font-black text-emerald-900 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                    {approvingPayment.utr || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-emerald-800">Payment Reference:</span>
                  <span className="font-mono text-xs text-emerald-900">
                    {approvingPayment.payment_reference || approvingPayment.id.slice(0, 8)}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200 text-xs text-gray-600 space-y-1">
                <p className="font-bold text-gray-800">Upon approval:</p>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                  <li>Payment status will be updated to <strong>Paid</strong>.</li>
                  <li>Linked subscription will be marked <strong>Active</strong>.</li>
                  <li>Customer's order will be <strong>Confirmed</strong> for kitchen scheduling.</li>
                  <li>In-app notification & confirmation email will be dispatched.</li>
                </ul>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <Button
                  onClick={() => setApprovingPayment(null)}
                  variant="outline"
                  disabled={actionLoading}
                  className="rounded-xl font-bold text-xs"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/20"
                >
                  {actionLoading ? 'Verifying...' : 'Approve Payment'}
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* REJECT PAYMENT MODAL */}
        <Modal
          isOpen={!!rejectingPayment}
          onClose={() => !actionLoading && setRejectingPayment(null)}
          title="Reject Payment Submission"
        >
          {rejectingPayment && (
            <div className="space-y-4 text-left">
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-950 space-y-1.5">
                <p className="text-xs font-bold">
                  Rejecting payment of <span className="font-black text-sm text-red-700">₹{rejectingPayment.amount}</span> for{' '}
                  <span className="font-extrabold">{rejectingPayment.profile?.full_name || 'Customer'}</span>
                </p>
                <p className="font-mono text-xs text-red-800">
                  UTR: {rejectingPayment.utr || 'N/A'}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-gray-700">Select Rejection Reason:</label>
                <div className="space-y-1.5 text-xs">
                  {[
                    'Payment Not Received in Bank Account',
                    'Invalid or Incomplete 12-digit UTR',
                    'Incorrect Amount Transferred',
                    'Duplicate Transaction ID / Already Claimed',
                    'Other',
                  ].map((r) => (
                    <label
                      key={r}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                        rejectionReason === r
                          ? 'bg-red-50 border-red-300 font-bold text-red-900'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="rejectionReason"
                        value={r}
                        checked={rejectionReason === r}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="text-red-600 focus:ring-red-500"
                      />
                      <span>{r}</span>
                    </label>
                  ))}
                </div>
              </div>

              {rejectionReason === 'Other' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Specify Custom Reason:</label>
                  <Input
                    placeholder="Enter reason visible to customer..."
                    value={customRejectionReason}
                    onChange={(e) => setCustomRejectionReason(e.target.value)}
                    className="rounded-xl text-xs"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <Button
                  onClick={() => setRejectingPayment(null)}
                  variant="outline"
                  disabled={actionLoading}
                  className="rounded-xl font-bold text-xs"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={actionLoading}
                  className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-md shadow-red-600/20"
                >
                  {actionLoading ? 'Rejecting...' : 'Reject Payment'}
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
