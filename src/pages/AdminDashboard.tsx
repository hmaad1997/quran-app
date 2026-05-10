import { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, Clock, UserCheck, UserX } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { supabase } from '@/lib/supabase';
import { formatDistance, formatHours, formatTime } from '@/lib/format';
import type { DailyAttendanceSummary } from '@/types/database';
import { useAuthStore } from '@/store/authStore';

export function AdminDashboard(): JSX.Element {
  const orgId = useAuthStore((s) => s.profile?.org_id);
  const [day, setDay] = useState<string>(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [rows, setRows] = useState<DailyAttendanceSummary[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    let cancelled = false;
    setLoading(true);

    void (async () => {
      const start = new Date(`${day}T00:00:00.000Z`).toISOString();
      const end = new Date(`${day}T23:59:59.999Z`).toISOString();

      const { data, error } = await supabase
        .from('daily_attendance_summary')
        .select('*')
        .eq('org_id', orgId)
        .gte('work_day', start)
        .lte('work_day', end)
        .order('full_name');

      if (!cancelled) {
        if (error) {
          // eslint-disable-next-line no-console
          console.error('[admin]', error);
          setRows([]);
        } else {
          setRows((data ?? []) as DailyAttendanceSummary[]);
        }
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [orgId, day]);

  const stats = useMemo(() => {
    const present = rows.filter(
      (r) => r.status === 'present' || r.status === 'completed',
    ).length;
    const absent = rows.length - present;
    const overtime = rows.reduce((acc, r) => acc + (r.overtime_hours ?? 0), 0);
    const total = rows.reduce((acc, r) => acc + (r.total_hours ?? 0), 0);
    return { present, absent, overtime, total };
  }, [rows]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">لوحة الإدارة</h1>
          <p className="text-sm text-slate-400">
            ملخص الحضور اليومي — قانون العمل الأردني (8 ساعات / يوم)
          </p>
        </div>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-400">التاريخ</span>
          <input
            type="date"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            className="field w-auto py-2"
            dir="ltr"
          />
        </label>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<UserCheck className="h-5 w-5" />}
          label="حاضر"
          value={stats.present.toString()}
          tone="success"
        />
        <StatCard
          icon={<UserX className="h-5 w-5" />}
          label="غائب"
          value={stats.absent.toString()}
          tone="danger"
        />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label="إجمالي الساعات"
          value={formatHours(stats.total)}
          tone="electric"
        />
        <StatCard
          icon={<BadgeCheck className="h-5 w-5" />}
          label="إضافي"
          value={formatHours(stats.overtime)}
          tone="warning"
        />
      </section>

      <GlassCard className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-white/5 text-xs uppercase tracking-wider text-slate-400">
                <Th>الموظف</Th>
                <Th>الحالة</Th>
                <Th>دخول</Th>
                <Th>خروج</Th>
                <Th>المسافة</Th>
                <Th>ساعات العمل</Th>
                <Th>إضافي</Th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-sm text-slate-500">
                    جاري التحميل...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-sm text-slate-500">
                    لا توجد بيانات للتاريخ المحدد
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr
                    key={r.user_id}
                    className="border-b border-white/5 text-sm last:border-0 hover:bg-white/[0.02]"
                  >
                    <Td>
                      <div>
                        <p className="font-medium">{r.full_name ?? '—'}</p>
                        <p className="text-[11px] text-slate-500">{r.email}</p>
                      </div>
                    </Td>
                    <Td>
                      <StatusChip status={r.status} />
                    </Td>
                    <Td className="font-mono">{formatTime(r.clock_in)}</Td>
                    <Td className="font-mono">{formatTime(r.clock_out)}</Td>
                    <Td className="font-mono">{formatDistance(r.distance_m)}</Td>
                    <Td className="font-mono">{formatHours(r.total_hours)}</Td>
                    <Td
                      className={`font-mono ${
                        r.overtime_hours > 0 ? 'text-warning' : 'text-slate-500'
                      }`}
                    >
                      {formatHours(r.overtime_hours)}
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }): JSX.Element {
  return <th className="px-4 py-3 text-right font-semibold">{children}</th>;
}

function Td({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}): JSX.Element {
  return <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>;
}

function StatusChip({
  status,
}: {
  status: DailyAttendanceSummary['status'];
}): JSX.Element {
  const map = {
    present: { label: 'في الدوام', cls: 'border-success/30 bg-success/10 text-success' },
    completed: { label: 'مكتمل', cls: 'border-electric/30 bg-electric/10 text-electric' },
    absent: { label: 'غائب', cls: 'border-danger/30 bg-danger/10 text-danger' },
  } as const;
  const { label, cls } = map[status];
  return <span className={`chip ${cls}`}>{label}</span>;
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: 'success' | 'danger' | 'electric' | 'warning';
}): JSX.Element {
  const toneMap = {
    success: 'bg-success/10 text-success',
    danger: 'bg-danger/10 text-danger',
    electric: 'bg-electric/10 text-electric',
    warning: 'bg-warning/10 text-warning',
  } as const;

  return (
    <GlassCard>
      <div className="flex items-center gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${toneMap[tone]}`}
        >
          {icon}
        </div>
        <div>
          <p className="text-xs text-slate-400">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </div>
    </GlassCard>
  );
}
