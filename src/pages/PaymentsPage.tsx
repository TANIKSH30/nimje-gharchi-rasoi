import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CreditCard,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Clock,
  XCircle,
  Copy,
  CheckCheck,
  QrCode,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { Payment } from '@/types/database';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function PaymentsPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login?redirect=/payments');
      return;
    }

    async function fetchPayments() {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('payments')
          .select(`
            *,
            subscription:subscriptions(*, plan:plans(*)),
            order:orders(*)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPayments((data as Payment[]) || []);
      } catch (err) {
        console.error('Error fetching payments:', err);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchPayments();
    }
  }, [user, authLoading, navigate]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <Badge variant="success" className="text-[11px] gap-1 py-0.5">
            <CheckCircle2 size={12} /> Payment Verified
          </Badge>
        );
      case 'pending_verification':
        return (
          <Badge variant="warning" className="text-[11px] gap-1 py-0.5 animate-pulse">
            <Clock size={12} /> Pending Verification
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="text-[11px] gap-1 py-0.5">
            <XCircle size={12} /> Verification Rejected
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="outline" className="text-[11px] py-0.5">
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="text-[11px] py-0.5">
            Payment Pending
          </Badge>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFBF8] flex flex-col">
      <Navbar />

      <main className="flex-grow pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-foreground mb-2"
              >
                <ArrowLeft size={14} /> Back to Dashboard
              </Link>
              <h1 className="text-3xl font-black text-foreground">Payment Receipts</h1>
              <p className="text-xs text-gray-500 mt-1">
                UPI QR transaction records, UTR verification status, and invoices.
              </p>
            </div>

            <Button asChild size="sm" className="rounded-xl text-xs shadow-md shadow-primary/20 font-bold">
              <Link to="/checkout">New Subscription</Link>
            </Button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 rounded-3xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : payments.length === 0 ? (
            <Card className="p-12 text-center rounded-3xl border border-gray-200 bg-white">
              <CreditCard size={36} className="text-gray-400 mx-auto mb-3" />
              <h3 className="font-bold text-base text-foreground">No Payment Records Yet</h3>
              <p className="text-xs text-gray-500 mt-1 mb-4">
                Your UPI payment transactions and verification status will appear here.
              </p>
              <Button asChild className="rounded-xl font-bold">
                <Link to="/checkout">Start a Subscription</Link>
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {payments.map((p) => {
                const planName = p.subscription?.plan?.name || (p.order ? 'Special Order Delivery' : 'Tiffin Service');
                const isRejected = p.status === 'rejected';

                return (
                  <Card
                    key={p.id}
                    className={`rounded-3xl border p-6 bg-white shadow-xs space-y-4 ${
                      isRejected ? 'border-destructive/30 bg-destructive/5' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-base text-foreground flex items-center gap-1.5">
                            <QrCode size={16} className="text-primary" /> {planName}
                          </h4>
                          {getStatusBadge(p.status)}
                        </div>
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                          <span>
                            Ref:{' '}
                            <strong className="font-mono text-foreground">
                              {p.payment_reference || p.razorpay_order_id || p.id.slice(0, 8)}
                            </strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(p.payment_reference || p.id, p.id)}
                            className="text-gray-400 hover:text-foreground cursor-pointer"
                            title="Copy Reference"
                          >
                            {copiedId === p.id ? (
                              <CheckCheck size={12} className="text-emerald-600" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-2xl font-black text-primary">₹{p.amount}</span>
                        <span className="block text-[11px] text-gray-400 font-medium">INR • UPI Payment</span>
                      </div>
                    </div>

                    {/* UTR & Metadata Row */}
                    <div className="pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-gray-400 block text-[11px]">Submitted UTR / Ref</span>
                        <span className="font-mono font-bold text-foreground">
                          {p.utr || p.razorpay_payment_id || 'Not Submitted'}
                        </span>
                      </div>

                      <div>
                        <span className="text-gray-400 block text-[11px]">Submitted At</span>
                        <span className="text-foreground">
                          {p.submitted_at || p.created_at
                            ? new Date(p.submitted_at || p.created_at).toLocaleString('en-IN', {
                                timeZone: 'Asia/Kolkata',
                              })
                            : '—'}
                        </span>
                      </div>

                      <div>
                        <span className="text-gray-400 block text-[11px]">Verified At</span>
                        <span className="text-foreground">
                          {p.verified_at || p.paid_at
                            ? new Date(p.verified_at || p.paid_at!).toLocaleString('en-IN', {
                                timeZone: 'Asia/Kolkata',
                              })
                            : 'Pending Manual Verification'}
                        </span>
                      </div>
                    </div>

                    {/* Rejection Alert */}
                    {isRejected && p.rejection_reason && (
                      <div className="p-3.5 rounded-2xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-start gap-2">
                        <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                        <div>
                          <strong className="block">Verification Rejected Reason:</strong>
                          <span>{p.rejection_reason}</span>
                          <div className="mt-2">
                            <Button asChild size="sm" variant="destructive" className="h-7 text-xs rounded-lg">
                              <Link to="/checkout">Retry Payment / New Order</Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
