import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Fingerprint, Loader2, LogIn, Mail, Lock } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export function LoginPage(): JSX.Element {
  const signIn = useAuthStore((s) => s.signIn);
  const loading = useAuthStore((s) => s.loading);
  const nav = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setErr(null);
    const { error } = await signIn(email, password);
    if (error) setErr(error);
    else nav('/', { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass w-full max-w-md p-8"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="relative mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-electric to-electric-600 shadow-glow">
            <Fingerprint className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">بصمة</h1>
          <p className="mt-1 text-sm text-slate-400">
            تسجيل حضور بيومتري وجغرافي
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs text-slate-400">
              <Mail className="h-3.5 w-3.5" />
              البريد الإلكتروني
            </span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field"
              placeholder="you@company.com"
              dir="ltr"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs text-slate-400">
              <Lock className="h-3.5 w-3.5" />
              كلمة المرور
            </span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field"
              placeholder="••••••••"
              dir="ltr"
            />
          </label>

          {err && (
            <p className="rounded-lg border border-danger/30 bg-danger/10 p-2.5 text-xs text-danger">
              {err}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogIn className="h-4 w-4" />
            )}
            تسجيل الدخول
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          لا تملك حساب؟{' '}
          <Link to="/signup" className="text-electric hover:underline">
            إنشاء حساب جديد
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
