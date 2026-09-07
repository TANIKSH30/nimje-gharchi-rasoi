import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import SEOHead from '@/components/seo/SEOHead';

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(updateError.message || 'Failed to update password');
      } else {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#FCFBF8]">
      <SEOHead
        title="Set New Password | Nimje Gharchi Rasoi"
        description="Set a new password for your Nimje Gharchi Rasoi account."
        noIndex={true}
      />
      <div className="w-full max-w-md">
        <Card className="rounded-3xl shadow-xl border border-gray-200 bg-white">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-black text-foreground tracking-tight">
                Set New Password
              </h2>
              <p className="text-xs text-gray-500 mt-1.5">
                Choose a strong password for your Nimje Gharchi Rasoi account.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-3 text-destructive text-sm font-medium">
                <AlertCircle size={18} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={28} />
                </div>
                <h3 className="text-lg font-bold text-foreground">Password Updated!</h3>
                <p className="text-xs text-gray-500">
                  Your password has been changed successfully. Redirecting to login...
                </p>
              </div>
            ) : (
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    New Password
                  </label>
                  <Input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Confirm Password
                  </label>
                  <Input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                <Button
                  type="submit"
                  loading={loading}
                  className="w-full h-11 text-sm font-bold rounded-xl mt-2"
                >
                  Update Password
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
