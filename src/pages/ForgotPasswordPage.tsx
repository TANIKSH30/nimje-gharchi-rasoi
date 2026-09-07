import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import SEOHead from '@/components/seo/SEOHead';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const { resetPassword } = useAuth();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: resetError } = await resetPassword(email);
      if (resetError) {
        setError(resetError.message || 'Failed to send password reset email');
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#FCFBF8] relative overflow-hidden">
      <SEOHead
        title="Forgot Password | Nimje Gharchi Rasoi"
        description="Reset your account password for Nimje Gharchi Rasoi."
        noIndex={true}
      />
      <div className="w-full max-w-md relative z-10">
        <Card className="rounded-3xl shadow-xl border border-gray-200 bg-white">
          <CardContent className="p-8">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-foreground mb-6 transition-colors font-medium"
            >
              <ArrowLeft size={14} /> Back to Login
            </Link>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-black text-foreground tracking-tight">
                Reset Your Password
              </h2>
              <p className="text-xs text-gray-500 mt-1.5">
                Enter your registered email address and we'll send you a password reset link.
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
                <h3 className="text-lg font-bold text-foreground">Reset Link Sent!</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                  We've sent a password reset link to <strong>{email}</strong>. Please check your inbox or spam folder.
                </p>
                <Button asChild variant="outline" className="rounded-xl mt-4 w-full">
                  <Link to="/login">Return to Login</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    required
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <Button
                  type="submit"
                  loading={loading}
                  className="w-full h-11 text-sm font-bold rounded-xl mt-2"
                >
                  Send Reset Link
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
