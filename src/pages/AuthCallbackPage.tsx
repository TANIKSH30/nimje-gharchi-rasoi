import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshProfile } = useAuth();
  const [status, setStatus] = useState('Authenticating and preparing your account...');

  useEffect(() => {
    async function handleAuth() {
      try {
        const errorDesc = searchParams.get('error_description') || searchParams.get('error');
        if (errorDesc) {
          navigate(`/login?error=${encodeURIComponent(errorDesc)}`);
          return;
        }

        const code = searchParams.get('code');
        if (code) {
          await supabase.auth.exchangeCodeForSession(code);
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await refreshProfile();
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profile?.role === 'admin') {
            navigate('/admin');
          } else {
            navigate('/dashboard');
          }
        } else {
          navigate('/login');
        }
      } catch (err: any) {
        console.error('OAuth Callback handling error:', err);
        navigate(`/login?error=${encodeURIComponent(err.message || 'Authentication error')}`);
      }
    }

    handleAuth();
  }, [navigate, searchParams, refreshProfile]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#FCFBF8]">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <h3 className="text-lg font-bold text-foreground">Completing Sign In</h3>
        <p className="text-xs text-gray-500">{status}</p>
      </div>
    </div>
  );
}
