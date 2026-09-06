import React, { useEffect, useState } from 'react';
import {
  Settings,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  Phone,
  Mail,
  Building,
  Save,
  RefreshCw,
  IndianRupee,
  ShieldCheck,
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import {
  getBusinessSettings,
  updateBusinessSettings,
  BusinessSettings,
} from '@/services/adminService';
import { NIMJE_UPI_ID, NIMJE_PAYEE_NAME } from '@/lib/upi';

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [config, setConfig] = useState<BusinessSettings>({
    id: 'default',
    business_name: 'Nimje Gharchi Rasoi',
    payee_name: NIMJE_PAYEE_NAME || 'Taniksh Nimje',
    upi_id: NIMJE_UPI_ID || 'tanikshnimje@okaxis',
    payment_instructions:
      'Scan the QR code using any UPI App (Google Pay, PhonePe, Paytm, BHIM, Cred, etc.). After successful payment, enter the 12-digit UTR / Transaction ID below.',
    phone: '+91 78230 98970',
    email: 'tanikshnimje@gmail.com',
    location: 'Near Reshimbagh / Civil Lines, Nagpur, Maharashtra',
    lunch_slot: '11:30 AM – 1:30 PM',
    dinner_slot: '7:30 PM – 9:30 PM',
    order_cutoff_morning: '09:00 AM',
    order_cutoff_evening: '05:00 PM',
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const data = await getBusinessSettings();
        if (data) {
          setConfig((prev) => ({ ...prev, ...data }));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      await updateBusinessSettings(config, user?.id);
      localStorage.setItem('ngr_business_settings', JSON.stringify(config));
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (err: any) {
      setError(err.message || 'Error saving settings to database.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout
      title="Business & UPI Gateway Settings"
      subtitle="Configure business profile, receiving UPI ID, delivery windows & cutoff timings"
    >
      <div className="max-w-4xl space-y-6">
        {saved && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2 shadow-xs">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>Business profile & UPI configuration saved to database successfully!</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs font-bold flex items-center gap-2 shadow-xs">
            <AlertCircle size={16} className="text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* 1. UPI PAYMENT CONFIGURATION */}
          <Card className="rounded-3xl border border-gray-200 p-6 sm:p-8 bg-white shadow-xs space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
                <QrCode size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-gray-900">
                  UPI Payment Gateway & Payee Information
                </h3>
                <p className="text-xs text-gray-500">
                  This UPI ID and Payee Name are used to dynamically generate QR codes across customer checkout.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-black text-gray-700 block mb-1">
                  Business UPI ID <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  placeholder="e.g. tanikshnimje@okaxis"
                  value={config.upi_id}
                  onChange={(e) => setConfig({ ...config, upi_id: e.target.value })}
                  className="font-mono text-xs font-bold rounded-xl"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Google Pay, PhonePe, Paytm, BHIM, or Bank VPA.
                </p>
              </div>

              <div>
                <label className="font-black text-gray-700 block mb-1">
                  Payee Full Name <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  placeholder="e.g. Taniksh Nimje"
                  value={config.payee_name}
                  onChange={(e) => setConfig({ ...config, payee_name: e.target.value })}
                  className="text-xs font-bold rounded-xl"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Verified name registered on receiving bank account.
                </p>
              </div>

              <div className="sm:col-span-2">
                <label className="font-black text-gray-700 block mb-1">
                  Payment Instructions for Patrons
                </label>
                <textarea
                  rows={2}
                  value={config.payment_instructions}
                  onChange={(e) => setConfig({ ...config, payment_instructions: e.target.value })}
                  className="w-full p-3 rounded-2xl border border-gray-200 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </Card>

          {/* 2. BUSINESS CONTACT & HUB LOCATION */}
          <Card className="rounded-3xl border border-gray-200 p-6 sm:p-8 bg-white shadow-xs space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black">
                <Building size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-gray-900">
                  Mess Identity & Contact Details
                </h3>
                <p className="text-xs text-gray-500">
                  Appears on customer invoices, order confirmations, and customer support.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-black text-gray-700 block mb-1">Business Name</label>
                <Input
                  value={config.business_name}
                  onChange={(e) => setConfig({ ...config, business_name: e.target.value })}
                  className="rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="font-black text-gray-700 block mb-1">Admin Support Phone</label>
                <Input
                  value={config.phone}
                  onChange={(e) => setConfig({ ...config, phone: e.target.value })}
                  className="rounded-xl text-xs font-bold font-mono"
                />
              </div>

              <div>
                <label className="font-black text-gray-700 block mb-1">Admin Notification Email</label>
                <Input
                  type="email"
                  value={config.email}
                  onChange={(e) => setConfig({ ...config, email: e.target.value })}
                  className="rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="font-black text-gray-700 block mb-1">Nagpur Central Kitchen Location</label>
                <Input
                  value={config.location}
                  onChange={(e) => setConfig({ ...config, location: e.target.value })}
                  className="rounded-xl text-xs font-bold"
                />
              </div>
            </div>
          </Card>

          {/* 3. MEAL DELIVERY WINDOWS */}
          <Card className="rounded-3xl border border-gray-200 p-6 sm:p-8 bg-white shadow-xs space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-black">
                <Clock size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-gray-900">
                  Service Delivery Windows & Order Cutoffs
                </h3>
                <p className="text-xs text-gray-500">
                  Schedule timings for hot tiffin delivery rounds across Nagpur.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-black text-gray-700 block mb-1">Lunch Delivery Window</label>
                <Input
                  value={config.lunch_slot}
                  onChange={(e) => setConfig({ ...config, lunch_slot: e.target.value })}
                  className="rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="font-black text-gray-700 block mb-1">Dinner Delivery Window</label>
                <Input
                  value={config.dinner_slot}
                  onChange={(e) => setConfig({ ...config, dinner_slot: e.target.value })}
                  className="rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="font-black text-gray-700 block mb-1">Morning Order Cutoff</label>
                <Input
                  value={config.order_cutoff_morning || '09:00 AM'}
                  onChange={(e) => setConfig({ ...config, order_cutoff_morning: e.target.value })}
                  className="rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="font-black text-gray-700 block mb-1">Evening Order Cutoff</label>
                <Input
                  value={config.order_cutoff_evening || '05:00 PM'}
                  onChange={(e) => setConfig({ ...config, order_cutoff_evening: e.target.value })}
                  className="rounded-xl text-xs"
                />
              </div>
            </div>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-8 py-3 shadow-lg shadow-emerald-600/20 gap-2"
            >
              <Save size={16} />
              <span>{saving ? 'Saving Configuration...' : 'Save Settings to Database'}</span>
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
