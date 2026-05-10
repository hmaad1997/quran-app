import { useEffect } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { LocationProvider } from '@/providers/LocationProvider';
import { AdminDashboard } from '@/pages/AdminDashboard';
import { EmployeeDashboard } from '@/pages/EmployeeDashboard';
import { LoginPage } from '@/pages/Login';
import { SignupPage } from '@/pages/Signup';
import { useAuthStore } from '@/store/authStore';

export function App(): JSX.Element {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    void initialize().then((u) => {
      unsub = u;
    });
    return () => {
      unsub?.();
    };
  }, [initialize]);

  return (
    <BrowserRouter>
      <LocationProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          <Route
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<EmployeeDashboard />} />
            <Route
              path="admin"
              element={
                <ProtectedRoute requireRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </LocationProvider>
    </BrowserRouter>
  );
}
