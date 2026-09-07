import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { AlertCircle } from 'lucide-react';
import SEOHead from '@/components/seo/SEOHead';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { signInWithEmail, signInWithGoogle, user, profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const customRedirect = searchParams.get('redirect') || searchParams.get('next');
  const urlError = searchParams.get('error');

  useEffect(() => {
    if (urlError) {
      setError(decodeURIComponent(urlError));
    }
  }, [urlError]);

  useEffect(() => {
    if (user && profile) {
      if (customRedirect) {
        navigate(customRedirect);
      } else if (isAdmin) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, profile, isAdmin, navigate, customRedirect]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      const { error: signInError } = await signInWithEmail(cleanEmail, password);
      if (signInError) {
        setError(signInError.message || 'Invalid email or password. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const { error: googleError } = await signInWithGoogle();
      if (googleError) {
        setError(googleError.message || 'Failed to connect to Google.');
        setGoogleLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Google sign in error.');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#FCFBF8] relative overflow-hidden">
      <SEOHead
        title="Sign In | Nimje Gharchi Rasoi"
        description="Sign in to your Nimje Gharchi Rasoi account."
        noIndex={true}
      />
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Brand Header */}
      <Link to="/" className="absolute top-6 left-6 z-20 flex items-center gap-2.5">
        <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary text-white rounded-xl flex items-center justify-center font-black text-lg shadow-md shadow-primary/20">
          N
        </div>
        <div className="flex flex-col">
          <span className="font-extrabold text-base text-foreground leading-tight">Nimje Gharchi Rasoi</span>
          <span className="text-[10px] font-bold text-primary tracking-wider uppercase">Authentic Homemade</span>
        </div>
      </Link>

      <div className="w-full max-w-md relative z-10 pt-16 sm:pt-0">
        <Card className="rounded-3xl shadow-xl border border-gray-200 bg-white/95 backdrop-blur-xl">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-foreground tracking-tight">Welcome Back!</h2>
              <p className="text-sm text-gray-500 mt-1.5">
                Login to manage your tiffin subscription and meals.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-start gap-3 text-destructive text-sm font-medium">
                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading || loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 font-semibold text-sm text-foreground shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              {googleLoading ? 'Connecting to Google...' : 'Continue with Google'}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-gray-400 font-semibold">Or login with email</span>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Email Address</label>
                <Input
                  type="email"
                  required
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-gray-700">Password</label>
                  <Link to="/forgot-password" className="text-xs text-primary font-medium hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                loading={loading}
                className="w-full h-11 text-sm font-bold rounded-xl mt-2 shadow-md shadow-primary/20"
              >
                Sign In
              </Button>
            </form>

            <p className="text-center text-xs text-gray-500 mt-6">
              Don't have an account yet?{' '}
              <Link to="/signup" className="text-primary font-bold hover:underline">
                Create Account
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
