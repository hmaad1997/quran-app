import { motion } from 'framer-motion';
import { MapPin, ShieldAlert, ShieldCheck, Navigation } from 'lucide-react';
import { formatDistance } from '@/lib/format';
import { GlassCard } from './GlassCard';

export interface StatusCardProps {
  inside: boolean;
  distance: number | null;
  mock: boolean;
  mockReasons?: string[];
  workplaceName?: string | null;
}

export function StatusCard({
  inside,
  distance,
  mock,
  mockReasons = [],
  workplaceName,
}: StatusCardProps): JSX.Element {
  const danger = mock || !inside;
  const Icon = mock ? ShieldAlert : inside ? ShieldCheck : MapPin;

  return (
    <GlassCard className="relative overflow-hidden">
      <div
        aria-hidden
        className={`pointer-events-none absolute -inset-1 rounded-2xl opacity-40 blur-2xl transition ${
          danger ? 'bg-danger/20' : 'bg-success/20'
        }`}
      />

      <div className="relative flex items-center gap-4">
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
            danger
              ? 'bg-danger/15 text-danger'
              : 'bg-success/15 text-success'
          }`}
        >
          <Icon className="h-6 w-6" />
        </motion.div>

        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wider text-slate-400">
            الحالة الحالية
          </p>
          <p
            className={`truncate text-lg font-semibold ${
              danger ? 'text-danger' : 'text-success'
            }`}
          >
            {mock
              ? 'موقع مشبوه — الإجراء مرفوض'
              : inside
                ? 'داخل نطاق العمل'
                : 'خارج نطاق العمل'}
          </p>
          {workplaceName && (
            <p className="mt-0.5 truncate text-xs text-slate-400">
              {workplaceName}
            </p>
          )}
        </div>

        <div className="shrink-0 text-right">
          <div className="flex items-center justify-end gap-1 text-xs text-slate-400">
            <Navigation className="h-3.5 w-3.5" />
            <span>المسافة</span>
          </div>
          <p className="font-mono text-lg font-semibold text-slate-100">
            {formatDistance(distance)}
          </p>
        </div>
      </div>

      {mock && mockReasons.length > 0 && (
        <div className="relative mt-4 rounded-xl border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
          <p className="font-semibold">تنبيهات الأمان:</p>
          <ul className="mt-1 list-disc space-y-0.5 pe-4">
            {mockReasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      )}
    </GlassCard>
  );
}
