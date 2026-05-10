import { motion } from 'framer-motion';
import { Clock, LogIn as LogInIcon, LogOut as LogOutIcon } from 'lucide-react';
import { BiometricBtn } from '@/components/ui/BiometricBtn';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatusCard } from '@/components/ui/StatusCard';
import { useAttendance } from '@/hooks/useAttendance';
import { formatTime } from '@/lib/format';
import { useAuthStore } from '@/store/authStore';
import { useLocationStore } from '@/store/locationStore';

export function EmployeeDashboard(): JSX.Element {
  const profile = useAuthStore((s) => s.profile);
  const workplace = useAuthStore((s) => s.workplace);

  const inside = useLocationStore((s) => s.insideGeofence);
  const distance = useLocationStore((s) => s.distanceToWorkplace);
  const mock = useLocationStore((s) => s.mock);
  const mockReasons = useLocationStore((s) => s.mockReasons);

  const {
    phase,
    canClock,
    blockedReason,
    nextAction,
    clock,
    todayLogs,
    error,
  } = useAttendance();

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'صباح الخير';
    if (h < 18) return 'مساء الخير';
    return 'مساء الخير';
  })();

  return (
    <div className="grid gap-6 md:grid-cols-5">
      {/* Left: clock action */}
      <section className="md:col-span-3 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <p className="text-sm text-slate-400">{greeting} 👋</p>
          <h1 className="text-2xl font-bold tracking-tight">
            {profile?.full_name ?? profile?.email}
          </h1>
        </motion.div>

        <StatusCard
          inside={inside}
          distance={distance}
          mock={mock}
          mockReasons={mockReasons}
          workplaceName={workplace?.name ?? null}
        />

        <GlassCard className="flex flex-col items-center gap-6 py-10">
          <BiometricBtn
            phase={phase}
            disabled={!canClock}
            onTrigger={() => void clock()}
            mode={nextAction}
          />

          {blockedReason && (
            <p className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-1.5 text-xs text-warning">
              {blockedReason}
            </p>
          )}

          {error && phase === 'error' && (
            <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-1.5 text-xs text-danger">
              {error}
            </p>
          )}
        </GlassCard>
      </section>

      {/* Right: today's log */}
      <aside className="md:col-span-2">
        <GlassCard className="h-full">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-electric" />
            <h2 className="text-sm font-semibold">سجل اليوم</h2>
          </div>

          {todayLogs.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              لا يوجد تسجيلات لهذا اليوم بعد
            </p>
          ) : (
            <ul className="space-y-2">
              {todayLogs.map((log) => (
                <li
                  key={log.id}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                        log.type === 'in'
                          ? 'bg-success/15 text-success'
                          : 'bg-warning/15 text-warning'
                      }`}
                    >
                      {log.type === 'in' ? (
                        <LogInIcon className="h-4 w-4" />
                      ) : (
                        <LogOutIcon className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {log.type === 'in' ? 'دخول' : 'خروج'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {log.location_snapshot.distance_m} م عن المركز
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm">
                      {formatTime(log.timestamp)}
                    </p>
                    <p
                      className={`text-[10px] ${
                        log.is_verified ? 'text-success' : 'text-danger'
                      }`}
                    >
                      {log.is_verified ? '✓ موثّق' : '✗ غير موثّق'}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      </aside>
    </div>
  );
}
