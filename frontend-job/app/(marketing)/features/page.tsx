import {
  FileText, Search, Zap, LineChart, Globe2,
  BellRing, ShieldCheck, ArrowRight, CheckCircle,
  Sparkles, Clock, Target, RefreshCw, BarChart3, Mail
} from 'lucide-react';
import Link from 'next/link';

const features = [
  {
    icon: FileText,
    tag: 'Smart Resume',
    title: 'Your resume rewrites itself — for every job.',
    desc: "Upload your resume once. Before every application, our AI reads the job description and silently rewrites your 3 most relevant bullet points to match the exact words the employer used. You go from \"maybe a fit\" to \"clearly the right person\".",
    points: [
      'Matches keywords from each job posting automatically',
      'Keeps your voice and tone — never sounds robotic',
      'New PDF created in under 3 seconds',
    ],
    color: 'border-indigo-100 bg-gradient-to-br from-indigo-50 to-white',
    iconBg: 'bg-indigo-100 text-indigo-600',
    wide: true,
  },
  {
    icon: Zap,
    tag: 'One-Click Apply',
    title: 'Fill any job form in 2 seconds.',
    desc: "Install our Chrome extension once. Every time you visit a job application page, click one button and every field fills itself — name, phone, experience, education, salary expectations, even diversity questions. You review it and click submit.",
    points: [
      'Works on 500+ company career portals',
      'Uploads your tailored resume PDF automatically',
      'Handles tricky multi-step application forms',
    ],
    color: 'border-amber-100 bg-gradient-to-br from-amber-50 to-white',
    iconBg: 'bg-amber-100 text-amber-600',
    wide: false,
  },
  {
    icon: Globe2,
    tag: 'Job Discovery',
    title: 'We find fresh jobs before the crowd does.',
    desc: "We monitor 500+ companies and 15+ job boards 24/7. The moment a role matching your job title, location, or salary appears — you know before most people even wake up. First to apply means first to be noticed.",
    points: [
      'Y Combinator, Wellfound, LinkedIn & more',
      'Indian startups: Swiggy, CRED, Razorpay, Zepto',
      'Instant alerts via Telegram or email',
    ],
    color: 'border-emerald-100 bg-gradient-to-br from-emerald-50 to-white',
    iconBg: 'bg-emerald-100 text-emerald-600',
    wide: false,
  },
  {
    icon: Target,
    tag: 'Smart Matching',
    title: "See exactly how well you match a job — before you apply.",
    desc: "Our AI scores every job against your actual experience and skills. You get a match percentage and an honest breakdown of your strengths and gaps — so you apply where you'll actually get responses, not just where you wish you would.",
    points: [
      'Match score out of 100 for every job',
      'Highlights your strongest selling points',
      'Flags skills gaps so you can prepare',
    ],
    color: 'border-violet-100 bg-gradient-to-br from-violet-50 to-white',
    iconBg: 'bg-violet-100 text-violet-600',
    wide: true,
  },
  {
    icon: BarChart3,
    tag: 'Application Tracker',
    title: 'Know exactly where every application stands.',
    desc: "Every application is tracked automatically — applied, interview scheduled, offer received, rejected. See your full funnel at a glance. Know which companies respond most and where in the process you're strongest.",
    points: [
      'Full application history in one place',
      'Tracks status across all job boards',
      'See which job types get the best responses',
    ],
    color: 'border-rose-100 bg-gradient-to-br from-rose-50 to-white',
    iconBg: 'bg-rose-100 text-rose-600',
    wide: false,
  },
  {
    icon: BellRing,
    tag: 'Job Alerts',
    title: 'Get notified the second the right job is posted.',
    desc: "Set your dream job criteria once — job title, location, salary range, remote/hybrid preference. We'll ping you the moment something matching goes live. No more refreshing job boards every morning.",
    points: [
      'Telegram or email alerts in real time',
      'Custom filters: salary, location, seniority',
      'Daily or instant — your choice',
    ],
    color: 'border-teal-100 bg-gradient-to-br from-teal-50 to-white',
    iconBg: 'bg-teal-100 text-teal-600',
    wide: false,
  },
];

const numbers = [
  { value: '500+', label: 'Companies monitored' },
  { value: '30+', label: 'Applications sent per day' },
  { value: '3 sec', label: 'Resume tailored per job' },
  { value: '22%', label: 'Average response rate' },
];

export default function FeaturesPage() {
  return (
    <div className="flex flex-col w-full bg-background">

      {/* ── Hero ── */}
      <section className="relative pt-20 pb-16 md:pt-28 md:pb-20 overflow-hidden bg-gradient-to-b from-indigo-50/40 to-white">
        <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-indigo-200/30 blur-3xl" />
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700 text-[12px] font-semibold mb-7">
            <Sparkles className="h-3.5 w-3.5" />
            Everything included — one plan
          </div>
          <h1 className="text-[2.75rem] md:text-[3.75rem] font-extrabold tracking-tight leading-[1.06] text-slate-900 mb-6">
            Every tool your job search needs.<br />
            <span className="text-indigo-600">All in one place.</span>
          </h1>
          <p className="text-[1.0625rem] text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Instead of juggling a resume builder, a job board, an application tracker, and a Chrome extension from different companies — we built them all together so they work as one seamless system.
          </p>
        </div>
      </section>

      {/* ── Numbers ── */}
      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-4xl px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-200">
            {numbers.map(({ value, label }) => (
              <div key={label} className="flex flex-col items-center py-8 gap-1">
                <span className="text-[2.25rem] font-extrabold text-slate-900 tracking-tight">{value}</span>
                <span className="text-[12px] font-medium text-slate-500 text-center">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className={`rounded-2xl border ${f.color} p-7 md:p-8 flex flex-col ${f.wide ? 'md:col-span-2' : ''}`}
              >
                <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 mb-4 block">{f.tag}</span>

                <div className="flex items-start gap-4 mb-4">
                  <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 ${f.iconBg}`}>
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h2 className="text-[1.0625rem] md:text-[1.125rem] font-bold text-slate-900 leading-snug pt-2">{f.title}</h2>
                </div>

                <p className="text-[0.9375rem] text-slate-600 leading-relaxed mb-5 flex-1">{f.desc}</p>

                <ul className="space-y-2">
                  {f.points.map((p) => (
                    <li key={p} className="flex items-start gap-2.5 text-[13px] text-slate-700">
                      <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Privacy note ── */}
      <section className="border-y border-slate-200 bg-slate-50 py-12">
        <div className="mx-auto max-w-4xl px-6 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <div className="h-12 w-12 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-[15px] font-bold text-slate-900">Your data stays yours.</p>
            <p className="text-[13px] text-slate-500 mt-1 max-w-lg">
              The Chrome extension runs inside your own browser on your own device. We never store passwords, login tokens, or access your accounts. Everything runs as you — privately.
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 text-center">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="text-[2rem] md:text-[2.5rem] font-extrabold tracking-tight text-slate-900 mb-4">
            Ready to start getting more interviews?
          </h2>
          <p className="text-slate-500 text-[1rem] mb-8 leading-relaxed">
            Set up takes 3 minutes. The agent runs 24/7 after that. You just prepare for interviews.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl h-12 px-8 text-[0.9375rem] font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
          >
            Get Started Free <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="text-[13px] text-slate-400 mt-3">No credit card needed.</p>
        </div>
      </section>
    </div>
  );
}
