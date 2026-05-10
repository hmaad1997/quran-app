import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Fingerprint, Loader2, XCircle } from 'lucide-react';
import type { AttendancePhase } from '@/hooks/useAttendance';

export interface BiometricBtnProps {
  /** Controlled phase from useAttendance. */
  phase: AttendancePhase;
  /** Whether the button can actually fire (geofence + biometric prereqs). */
  disabled: boolean;
  /** Called once the long-press progress fills. */
  onTrigger: () => void;
  /** 'in' → green electric glow; 'out' → amber. */
  mode: 'in' | 'out';
  /** Duration the user must hold, in ms. */
  holdMs?: number;
}

/**
 * BiometricBtn
 * ------------
 * A large glassmorphic fingerprint scanner with:
 *   - pulse ring animation while idle,
 *   - circular SVG progress that fills on long-press,
 *   - haptic feedback on start (where available),
 *   - phase overlays (loading / success / error).
 *
 * Interaction: press and hold for `holdMs` (default 1.5 s). Releasing early
 * cancels. Only fires `onTrigger` when the ring completes.
 */
export function BiometricBtn({
  phase,
  disabled,
  onTrigger,
  mode,
  holdMs = 1500,
}: BiometricBtnProps): JSX.Element {
  const [progress, setProgress] = useState(0);
  const frameRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const firedRef = useRef(false);

  const stop = (): void => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    startRef.current = null;
    firedRef.current = false;
    setProgress(0);
  };

  useEffect(() => () => stop(), []);

  // Cancel progress if external conditions block us.
  useEffect(() => {
    if (disabled) stop();
  }, [disabled]);

  const tick = (now: number): void => {
    if (startRef.current === null) startRef.current = now;
    const elapsed = now - startRef.current;
    const pct = Math.min(1, elapsed / holdMs);
    setProgress(pct);
    if (pct >= 1 && !firedRef.current) {
      firedRef.current = true;
      onTrigger();
      stop();
      return;
    }
    frameRef.current = requestAnimationFrame(tick);
  };

  const begin = (): void => {
    if (disabled || phase !== 'idle') return;
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.(15);
    }
    frameRef.current = requestAnimationFrame(tick);
  };

  const showLoader =
    phase === 'verifying_time' ||
    phase === 'verifying_biometric' ||
    phase === 'submitting';
  const showSuccess = phase === 'success';
  const showError = phase === 'error';

  const accent = mode === 'in' ? 'text-electric' : 'text-warning';
  const ring = mode === 'in' ? 'stroke-electric' : 'stroke-warning';
  const shadow = mode === 'in' ? 'shadow-glow' : '';

  const radius = 92;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* Pulse rings (only while idle) */}
      {phase === 'idle' && !disabled && (
        <>
          <span
            aria-hidden
            className={`pointer-events-none absolute h-56 w-56 rounded-full border ${
              mode === 'in' ? 'border-electric/40' : 'border-warning/40'
            } animate-pulse-ring`}
          />
          <span
            aria-hidden
            style={{ animationDelay: '700ms' }}
            className={`pointer-events-none absolute h-56 w-56 rounded-full border ${
              mode === 'in' ? 'border-electric/25' : 'border-warning/25'
            } animate-pulse-ring`}
          />
        </>
      )}

      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        disabled={disabled || phase !== 'idle'}
        onPointerDown={begin}
        onPointerUp={stop}
        onPointerLeave={stop}
        onPointerCancel={stop}
        onContextMenu={(e) => e.preventDefault()}
        aria-label={mode === 'in' ? 'تسجيل دخول' : 'تسجيل خروج'}
        className={`glass relative flex h-56 w-56 items-center justify-center rounded-full ${shadow} disabled:opacity-60 disabled:shadow-none`}
      >
        {/* Circular progress ring */}
        <svg
          className="absolute inset-0 -rotate-90"
          viewBox="0 0 200 200"
          aria-hidden
        >
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            className="stroke-white/10"
            strokeWidth="4"
          />
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            className={`${ring} transition-[stroke-dashoffset] duration-75`}
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            strokeLinecap="round"
          />
        </svg>

        <AnimatePresence mode="wait">
          {showLoader ? (
            <motion.div
              key="loader"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className={`flex flex-col items-center gap-2 ${accent}`}
            >
              <Loader2 className="h-14 w-14 animate-spin" />
              <span className="text-xs text-slate-300">
                {phase === 'verifying_time' && 'تحقق من الوقت...'}
                {phase === 'verifying_biometric' && 'تحقق بيومتري...'}
                {phase === 'submitting' && 'إرسال...'}
              </span>
            </motion.div>
          ) : showSuccess ? (
            <motion.div
              key="ok"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-1 text-success"
            >
              <CheckCircle2 className="h-16 w-16" />
              <span className="text-sm font-semibold">تم التسجيل</span>
            </motion.div>
          ) : showError ? (
            <motion.div
              key="err"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-1 text-danger"
            >
              <XCircle className="h-16 w-16" />
              <span className="text-sm font-semibold">فشل العملية</span>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`flex flex-col items-center gap-2 ${accent}`}
            >
              <Fingerprint
                className="h-20 w-20 drop-shadow-[0_0_18px_rgba(0,112,243,0.45)]"
                strokeWidth={1.25}
              />
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-slate-300">
                {mode === 'in' ? 'اضغط مطولاً للدخول' : 'اضغط مطولاً للخروج'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      <p className="mt-4 text-center text-xs text-slate-500">
        استمر بالضغط حتى اكتمال الحلقة
      </p>
    </div>
  );
}
