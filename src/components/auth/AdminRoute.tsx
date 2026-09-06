import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

interface AdminRouteProps {
  children: React.ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { user, profile, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FCFBF8]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-gray-500">Verifying administrator authorization...</p>
        </div>
      </div>
    );
  }

  // 1. If not logged in -> redirect to login
  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // 2. If logged in but NOT admin -> Show Access Denied barrier
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FCFBF8] p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-red-100 shadow-xl text-center space-y-4">
          <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert size={28} />
          </div>
          <h2 className="text-2xl font-black text-foreground">Access Restricted</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            The requested page requires administrative privileges. Your account (
            <span className="font-semibold text-foreground">{user.email}</span>) does not have access to the Admin Dashboard.
          </p>
          <div className="pt-2">
            <Button asChild className="rounded-xl font-bold w-full">
              <a href="/dashboard">
                <ArrowLeft size={16} className="mr-2" />
                Return to Customer Dashboard
              </a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
