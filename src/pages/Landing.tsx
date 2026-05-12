import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Fingerprint,
  MapPin,
  ShieldCheck,
  Clock,
  Users,
  Zap,
  Lock,
  Globe,
  BarChart3,
  ChevronRight,
  Smartphone,
  Server,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' },
  }),
};

const features = [
  {
    icon: Fingerprint,
    title: 'تحقق بيومتري',
    desc: 'FaceID / TouchID / بصمة الإصبع — لا يمكن لأي شخص تسجيل الحضور نيابةً عنك.',
    tone: 'text-electric bg-electric/10',
  },
  {
    icon: MapPin,
    title: 'سياج جغرافي (Geofence)',
    desc: 'يتحقق من موقعك بدقة 50 متر باستخدام خوارزمية Haversine. خارج النطاق = مرفوض.',
    tone: 'text-success bg-success/10',
  },
  {
    icon: ShieldCheck,
    title: 'مضاد للاحتيال',
    desc: 'كشف المواقع الوهمية، VPN، وفحص تزامن الوقت مع السيرفر — كل شيء يُعاد التحقق منه سيرفر-سايد.',
    tone: 'text-warning bg-warning/10',
  },
  {
    icon: Clock,
    title: 'طابع زمني سيرفري',
    desc: 'لا نثق بساعة الجوال أبداً. التوقيت الرسمي من السيرفر حصرياً لمنع "السفر عبر الزمن".',
    tone: 'text-purple-400 bg-purple-400/10',
  },
  {
    icon: Users,
    title: 'لوحة إدارة متقدمة',
    desc: 'ملخص يومي: حاضر/غائب، ساعات العمل، الإضافي (8 ساعات — قانون العمل الأردني).',
    tone: 'text-cyan-400 bg-cyan-400/10',
  },
  {
    icon: BarChart3,
    title: 'تقارير تلقائية',
    desc: 'حساب الساعات الإضافية والمسافة عن مركز العمل — جاهز للتصدير.',
    tone: 'text-pink-400 bg-pink-400/10',
  },
];

const techStack = [
  { icon: Zap, label: 'React + TypeScript' },
  { icon: Server, label: 'Supabase (PostgreSQL + Auth)' },
  { icon: Lock, label: 'WebAuthn Biometric' },
  { icon: Globe, label: 'Haversine Geofencing' },
  { icon: Smartphone, label: 'Responsive Mobile-First' },
];

export function LandingPage(): JSX.Element {
  return (
    <div className="min-h-screen overflow-hidden">
      {/* ──────────── HERO ──────────── */}
      <section className="relative flex min-h-[90vh] flex-col items-center justify-center px-4 text-center">
        {/* Glow background */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="absolute left-1/2 top-1/4 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-electric/20 blur-[120px]" />
          <div className="absolute right-0 top-0 h-[300px] w-[300px] rounded-full bg-electric/10 blur-[80px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="relative z-10"
        >
          {/* Logo / Scanner */}
          <div className="relative mx-auto mb-8 flex h-32 w-32 items-center justify-center">
            {/* Pulse rings */}
            <span
              aria-hidden
              className="absolute h-full w-full animate-pulse-ring rounded-full border border-electric/40"
            />
            <span
              aria-hidden
              className="absolute h-full w-full animate-pulse-ring rounded-full border border-electric/25"
              style={{ animationDelay: '700ms' }}
            />
            <div className="glass flex h-28 w-28 items-center justify-center rounded-full shadow-glow">
              <Fingerprint
                className="h-16 w-16 text-electric drop-shadow-[0_0_20px_rgba(0,112,243,0.5)]"
                strokeWidth={1.2}
              />
            </div>
          </div>

          <h1 className="mb-4 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            <span className="text-electric">بصمة</span>{' '}
            <span className="text-slate-100">Basma</span>
          </h1>
          <p className="mx-auto max-w-xl text-lg text-slate-400 sm:text-xl">
            نظام حضور وانصراف ذكي — بيومتري + جغرافي + مضاد للاحتيال.
            <br />
            <span className="text-slate-300">لا يمكن التلاعب. لا يمكن التزوير. لا أعذار.</span>
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link to="/signup" className="btn-primary px-6 py-3 text-base">
              ابدأ الآن مجاناً
              <ChevronRight className="h-4 w-4" />
            </Link>
            <Link to="/login" className="btn-ghost px-6 py-3 text-base">
              تسجيل الدخول
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ──────────── FEATURES ──────────── */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="mb-12 text-center"
        >
          <motion.h2
            variants={fadeUp}
            custom={0}
            className="text-3xl font-bold tracking-tight sm:text-4xl"
          >
            لماذا <span className="text-electric">بصمة</span>؟
          </motion.h2>
          <motion.p
            variants={fadeUp}
            custom={1}
            className="mt-3 text-slate-400"
          >
            ست طبقات حماية تجعل التلاعب مستحيلاً
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((f, i) => (
            <motion.div key={f.title} variants={fadeUp} custom={i + 2}>
              <GlassCard interactive className="h-full">
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${f.tone}`}
                  >
                    <f.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-100">{f.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-400">
                      {f.desc}
                    </p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ──────────── HOW IT WORKS ──────────── */}
      <section className="mx-auto max-w-4xl px-4 py-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="mb-12 text-center"
        >
          <motion.h2
            variants={fadeUp}
            custom={0}
            className="text-3xl font-bold tracking-tight sm:text-4xl"
          >
            كيف يعمل النظام؟
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="relative"
        >
          {/* Vertical line */}
          <div
            aria-hidden
            className="absolute left-6 top-0 h-full w-px bg-gradient-to-b from-electric/60 via-electric/20 to-transparent sm:left-1/2"
          />

          {[
            {
              step: '1',
              title: 'افتح التطبيق وادخل نطاق العمل',
              desc: 'النظام يتحقق تلقائياً من موقعك بدقة عالية.',
            },
            {
              step: '2',
              title: 'اضغط مطولاً على زر البصمة',
              desc: 'حلقة تقدم دائرية تمتلئ — بعد الاكتمال يظهر طلب التحقق البيومتري.',
            },
            {
              step: '3',
              title: 'تحقق بصمة / وجه',
              desc: 'FaceID أو بصمة الإصبع المدمجة — لا شيء يُرسل خارج جهازك.',
            },
            {
              step: '4',
              title: 'تأكيد سيرفري فوري',
              desc: 'السيرفر يعيد التحقق من الموقع + يسجل بطابع زمني رسمي. تم!',
            },
          ].map((item, i) => (
            <motion.div
              key={item.step}
              variants={fadeUp}
              custom={i + 1}
              className="relative mb-10 flex items-start gap-6 sm:gap-8"
            >
              <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-electric/40 bg-navy font-bold text-electric shadow-glow-sm">
                {item.step}
              </div>
              <div className="pt-1">
                <h3 className="text-lg font-semibold text-slate-100">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm text-slate-400">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ──────────── DEMO PREVIEW ──────────── */}
      <section className="mx-auto max-w-5xl px-4 py-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="text-center"
        >
          <motion.h2
            variants={fadeUp}
            custom={0}
            className="text-3xl font-bold tracking-tight sm:text-4xl"
          >
            معاينة حية
          </motion.h2>
          <motion.p
            variants={fadeUp}
            custom={1}
            className="mt-3 text-slate-400"
          >
            هكذا يبدو زر التسجيل على هاتف الموظف
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-12 max-w-sm"
        >
          {/* Mock phone frame */}
          <div className="glass relative overflow-hidden rounded-[2.5rem] border-2 border-white/10 p-6 shadow-glow">
            {/* Status bar */}
            <div className="mb-6 flex items-center justify-between text-[10px] text-slate-500">
              <span>9:41 AM</span>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                داخل النطاق
              </span>
            </div>

            {/* Scanner mock */}
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="relative flex h-44 w-44 items-center justify-center">
                <span
                  aria-hidden
                  className="absolute h-full w-full animate-pulse-ring rounded-full border border-electric/40"
                />
                <span
                  aria-hidden
                  className="absolute h-full w-full animate-pulse-ring rounded-full border border-electric/25"
                  style={{ animationDelay: '700ms' }}
                />
                <div className="glass flex h-40 w-40 items-center justify-center rounded-full shadow-glow">
                  <Fingerprint
                    className="h-20 w-20 text-electric drop-shadow-[0_0_18px_rgba(0,112,243,0.45)]"
                    strokeWidth={1.1}
                  />
                </div>
              </div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                اضغط مطولاً للدخول
              </p>
            </div>

            {/* Status card mock */}
            <div className="rounded-xl border border-success/20 bg-success/5 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-success" />
                  <span className="text-sm font-medium text-success">
                    داخل نطاق العمل
                  </span>
                </div>
                <span className="font-mono text-sm text-slate-300">12 م</span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ──────────── TECH STACK ──────────── */}
      <section className="mx-auto max-w-4xl px-4 py-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="text-center"
        >
          <motion.h2
            variants={fadeUp}
            custom={0}
            className="text-3xl font-bold tracking-tight sm:text-4xl"
          >
            مبني بأحدث التقنيات
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          {techStack.map((t, i) => (
            <motion.div
              key={t.label}
              variants={fadeUp}
              custom={i + 1}
              className="chip border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-300"
            >
              <t.icon className="h-4 w-4 text-electric" />
              {t.label}
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ──────────── CTA ──────────── */}
      <section className="mx-auto max-w-3xl px-4 pb-24 pt-10">
        <GlassCard className="text-center">
          <h2 className="text-2xl font-bold">جاهز لمنع التلاعب بالحضور؟</h2>
          <p className="mt-2 text-sm text-slate-400">
            ابدأ خلال دقائق — لا بطاقة ائتمان مطلوبة.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link to="/signup" className="btn-primary px-8 py-3 text-base">
              إنشاء حساب مجاني
              <ChevronRight className="h-4 w-4" />
            </Link>
            <Link to="/login" className="btn-ghost px-6 py-3">
              لديّ حساب بالفعل
            </Link>
          </div>
        </GlassCard>
      </section>

      {/* ──────────── FOOTER ──────────── */}
      <footer className="border-t border-white/5 py-8 text-center text-xs text-slate-600">
        <p>
          بصمة &copy; {new Date().getFullYear()} — نظام حضور بيومتري + جغرافي
          SaaS
        </p>
      </footer>
    </div>
  );
}
