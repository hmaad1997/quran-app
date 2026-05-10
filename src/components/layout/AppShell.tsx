import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, ShieldCheck, Users } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export function AppShell(): JSX.Element {
  const profile = useAuthStore((s) => s.profile);
  const signOut = useAuthStore((s) => s.signOut);
  const nav = useNavigate();

  const isAdmin = profile?.role === 'admin';

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-white/5 bg-navy/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-electric to-electric-600 shadow-glow-sm">
              <ShieldCheck className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold tracking-wide">BASMA</span>
          </Link>

          <nav className="flex items-center gap-1">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `chip ${
                  isActive
                    ? 'border-electric/50 bg-electric/10 text-electric'
                    : 'border-white/10 bg-white/[0.03] text-slate-300'
                }`
              }
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              لوحتي
            </NavLink>
            {isAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `chip ${
                    isActive
                      ? 'border-electric/50 bg-electric/10 text-electric'
                      : 'border-white/10 bg-white/[0.03] text-slate-300'
                  }`
                }
              >
                <Users className="h-3.5 w-3.5" />
                الإدارة
              </NavLink>
            )}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-xs text-slate-400">
                {profile?.full_name ?? profile?.email ?? '...'}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-electric">
                {profile?.role ?? '—'}
              </p>
            </div>
            <button
              type="button"
              onClick={async () => {
                await signOut();
                nav('/login', { replace: true });
              }}
              className="btn-ghost px-3 py-2"
              aria-label="تسجيل الخروج"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
