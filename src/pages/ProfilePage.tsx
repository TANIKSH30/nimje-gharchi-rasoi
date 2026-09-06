import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User as UserIcon, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateErr) throw updateErr;

      await refreshProfile();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFBF8] flex flex-col">
      <Navbar />

      <main className="flex-grow pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto space-y-6">
          <div>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-foreground mb-2"
            >
              <ArrowLeft size={14} /> Back to Dashboard
            </Link>
            <h1 className="text-3xl font-black text-foreground">My Profile</h1>
            <p className="text-xs text-gray-500 mt-1">Manage your account details and contact information.</p>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-destructive/10 text-destructive text-xs font-medium flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {success && (
            <div className="p-4 rounded-2xl bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 size={16} /> Profile updated successfully!
            </div>
          )}

          <Card className="rounded-3xl border border-gray-200 p-8 bg-white shadow-xs">
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Email Address (Verified)
                </label>
                <Input
                  disabled
                  value={user?.email || ''}
                  className="bg-gray-100 text-gray-500 font-mono text-xs cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Full Name
                </label>
                <Input
                  required
                  placeholder="Your Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Phone Number
                </label>
                <Input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="pt-4">
                <Button type="submit" loading={saving} className="w-full rounded-xl font-bold">
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
