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
    let isMounted = true;

    async function handleAuth() {
      try {
        // 1. Check for query param or hash fragment errors
        const hash = window.location.hash;
        const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
        const errorDesc =
          searchParams.get('error_description') ||
          searchParams.get('error') ||
          hashParams.get('error_description') ||
          hashParams.get('error');

        if (errorDesc) {
          navigate(`/login?error=${encodeURIComponent(errorDesc)}`);
          return;
        }

        // 2. Exchange PKCE authorization code if present
        const code = searchParams.get('code');
        if (code) {
          const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeErr) {
            console.warn('exchangeCodeForSession error:', exchangeErr);
          }
        }

        // 3. Verify session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && isMounted) {
          setStatus('Account verified! Redirecting...');
          await refreshProfile();

          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .maybeSingle();

          const savedRedirect = sessionStorage.getItem('auth_redirect_after_login');
          if (savedRedirect) {
            sessionStorage.removeItem('auth_redirect_after_login');
            navigate(savedRedirect);
          } else if (profile?.role === 'admin') {
            navigate('/admin');
          } else {
            navigate('/dashboard');
          }
          return;
        }

        // 4. Listen for auth state change in case of implicit token parse
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
          if (currentSession?.user && isMounted) {
            subscription.unsubscribe();
            await refreshProfile();
            const { data: profile } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', currentSession.user.id)
              .maybeSingle();

            if (profile?.role === 'admin') {
              navigate('/admin');
            } else {
              navigate('/dashboard');
            }
          }
        });

        // 5. Fallback timer if session does not resolve in 5 seconds
        setTimeout(() => {
          if (isMounted) {
            navigate('/login');
          }
        }, 5000);
      } catch (err: any) {
        console.error('OAuth Callback handling error:', err);
        if (isMounted) {
          navigate(`/login?error=${encodeURIComponent(err.message || 'Authentication error')}`);
        }
      }
    }

    handleAuth();

    return () => {
      isMounted = false;
    };
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
