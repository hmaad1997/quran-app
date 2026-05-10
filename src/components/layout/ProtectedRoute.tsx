import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuthStore } from '@/store/authStore';

interface Props {
  children: ReactNode;
  requireRole?: 'admin' | 'employee';
}

export function ProtectedRoute({ children, requireRole }: Props): JSX.Element {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const initialized = useAuthStore((s) => s.initialized);
  const loc = useLocation();

  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-400">
        جاري التحميل...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: loc }} />;
  }

  if (requireRole && profile?.role !== requireRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
