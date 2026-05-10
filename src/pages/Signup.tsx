import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, UserPlus } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export function SignupPage(): JSX.Element {
  const signUp = useAuthStore((s) => s.signUp);
  const loading = useAuthStore((s) => s.loading);
  const nav = useNavigate();

  const [form, setForm] = useState({ email: '', password: '', fullName: '' });
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setErr(null);
    const { error } = await signUp(form.email, form.password, form.fullName);
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
        <h1 className="mb-1 text-2xl font-bold">إنشاء حساب</h1>
        <p className="mb-6 text-sm text-slate-400">ابدأ باستخدام بصمة</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs text-slate-400">الاسم الكامل</span>
            <input
              required
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              className="field"
              placeholder="اسمك الكامل"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs text-slate-400">البريد الإلكتروني</span>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="field"
              placeholder="you@company.com"
              dir="ltr"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs text-slate-400">كلمة المرور</span>
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="field"
              placeholder="8 أحرف على الأقل"
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
              <UserPlus className="h-4 w-4" />
            )}
            إنشاء الحساب
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          لديك حساب؟{' '}
          <Link to="/login" className="text-electric hover:underline">
            تسجيل الدخول
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
