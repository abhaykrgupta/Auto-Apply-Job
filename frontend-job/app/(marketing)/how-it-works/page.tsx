import { ArrowRight, FileText, Puzzle, MousePointerClick, Zap, CheckCircle2, ShieldCheck, Sparkles, Clock } from 'lucide-react';
import Link from 'next/link';

const steps = [
  {
    n: '01',
    icon: FileText,
    title: 'Upload your resume',
    desc: "Drag and drop your existing resume — PDF or Word document. Our system reads your entire work history, skills, and education in seconds. This is the only time you ever have to touch your resume.",
    detail: 'Takes about 30 seconds.',
    color: 'bg-indigo-100 text-indigo-600 border-indigo-200',
  },
  {
    n: '02',
    icon: Puzzle,
    title: 'Tell us what you\'re looking for',
    desc: "Enter your preferred job title, location, salary range, and whether you want remote, hybrid, or in-office roles. That's all the setup required. No complicated filters or technical configuration.",
    detail: 'Takes about 2 minutes.',
    color: 'bg-violet-100 text-violet-600 border-violet-200',
  },
  {
    n: '03',
    icon: MousePointerClick,
    title: 'Install the Chrome extension',
    desc: "Add our extension from the Chrome Web Store — exactly like any other extension. It sits quietly in your browser. When you visit a job application page, a small button appears. Click it and the form fills itself.",
    detail: 'Install takes 20 seconds.',
    color: 'bg-amber-100 text-amber-600 border-amber-200',
  },
  {
    n: '04',
    icon: Zap,
    title: 'Click apply — your resume auto-tailors itself',
    desc: "The moment you click apply on any job, our AI reads the job description in the background and rewrites 3 bullet points on your resume to perfectly mirror the employer's exact language. A freshly tailored PDF is injected into the upload field automatically.",
    detail: 'Your resume is ready in under 3 seconds.',
    color: 'bg-emerald-100 text-emerald-600 border-emerald-200',
  },
  {
    n: '05',
    icon: CheckCircle2,
    title: 'You review and hit submit',
    desc: "We never submit applications without you seeing them first. The form is filled, your tailored resume is attached, and you can see exactly what's being sent. You click submit. Done. Your dashboard logs the application automatically.",
    detail: 'Every application is tracked in your dashboard.',
    color: 'bg-teal-100 text-teal-600 border-teal-200',
  },
];

export default function HowItWorksPage() {
  return (
    <div className="flex flex-col w-full bg-background">

      {/* ── Hero ── */}
      <section className="relative pt-20 pb-16 md:pt-28 md:pb-20 overflow-hidden bg-gradient-to-b from-slate-50 to-white">
        <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-indigo-100/50 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700 text-[12px] font-semibold mb-7">
            <Sparkles className="h-3.5 w-3.5" />
            Simple. Fast. Effective.
          </div>
          <h1 className="text-[2.75rem] md:text-[3.75rem] font-extrabold tracking-tight leading-[1.06] text-slate-900 mb-6">
            Up and running<br />in under 5 minutes.
          </h1>
          <p className="text-[1.0625rem] text-slate-600 max-w-2xl mx-auto leading-relaxed">
            No complicated setup. No technical knowledge needed. You upload your resume, tell us what you want, and the system handles everything from there.
          </p>
        </div>
      </section>

      {/* ── Steps ── */}
      <section className="py-16 md:py-24 border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-5xl px-6 md:px-10">
          <div className="flex flex-col lg:flex-row gap-14 items-start">

            {/* Sticky sidebar */}
            <div className="lg:w-[260px] shrink-0 lg:sticky lg:top-28">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">How it works</p>
              <h2 className="text-[1.75rem] font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
                Five steps.<br />Then it runs itself.
              </h2>
              <p className="text-[14px] text-slate-500 leading-relaxed mb-8">
                The whole thing runs inside your own browser. No servers timing out, no waiting, no configuration. Set it up once and apply to jobs every day without lifting a finger.
              </p>
              <div className="flex items-center gap-2 text-[13px] text-slate-500 mb-6">
                <Clock className="h-4 w-4 text-indigo-500" />
                <span>Total setup time: <strong className="text-slate-800">under 5 minutes</strong></span>
              </div>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl h-10 px-5 text-[13px] font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-md"
              >
                Start now <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Steps list */}
            <div className="flex-1 flex flex-col gap-3">
              {steps.map((step, i) => (
                <div key={step.n} className="relative flex gap-5 rounded-2xl border border-slate-200 bg-white p-5 md:p-6 hover:border-indigo-200 hover:shadow-sm transition-all duration-200">
                  <div className="flex flex-col items-center shrink-0 pt-0.5">
                    <div className={`h-10 w-10 rounded-xl border flex items-center justify-center ${step.color}`}>
                      <step.icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
                    </div>
                    {i < steps.length - 1 && (
                      <div className="w-px flex-1 bg-gradient-to-b from-slate-200 to-transparent mt-2 min-h-[24px]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 block mb-1.5">Step {step.n}</span>
                    <h3 className="text-[16px] font-bold text-slate-900 mb-2 leading-snug">{step.title}</h3>
                    <p className="text-[14px] text-slate-500 leading-relaxed mb-3">{step.desc}</p>
                    <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                      {step.detail}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Why extension not a robot ── */}
      <section className="py-20 md:py-24">
        <div className="mx-auto max-w-5xl px-6 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4">Why It Works</p>
              <h2 className="text-[1.75rem] md:text-[2.25rem] font-extrabold tracking-tight leading-tight text-slate-900 mb-5">
                Why a Chrome extension<br />and not a robot?
              </h2>
              <p className="text-[0.9375rem] text-slate-600 leading-relaxed mb-6">
                Many "auto-apply" tools run on cloud computers far away. Companies know this and block them immediately — that's why most automation tools stop working after a few weeks.
              </p>
              <p className="text-[0.9375rem] text-slate-600 leading-relaxed mb-8">
                Our extension runs right inside your browser, on your device, using your internet connection. To the job application system, it looks exactly like you typed everything yourself. It can never be blocked.
              </p>
              <div className="flex flex-col gap-3">
                {[
                  { label: 'Cloud bots', desc: 'Blocked immediately by most job sites', bad: true },
                  { label: 'Other automation tools', desc: 'Detected and flagged within days', bad: true },
                  { label: 'Our Chrome extension', desc: 'Runs as you — works forever', bad: false },
                ].map((row) => (
                  <div
                    key={row.label}
                    className={`flex items-center gap-4 rounded-xl border px-4 py-3 ${row.bad ? 'border-slate-200 bg-slate-50' : 'border-emerald-200 bg-emerald-50'}`}
                  >
                    <span className={`text-[13px] font-bold w-40 shrink-0 ${row.bad ? 'text-slate-400' : 'text-emerald-700'}`}>{row.label}</span>
                    <span className={`text-[13px] ${row.bad ? 'text-slate-400' : 'text-emerald-600 font-medium'}`}>{row.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual: the flow */}
            <div className="rounded-2xl border border-slate-200 bg-slate-900 overflow-hidden shadow-2xl">
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/10">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
                <span className="ml-3 text-[11px] font-mono text-white/30">What happens when you click "Fill"</span>
              </div>
              <div className="p-6 space-y-4 font-mono text-[13px]">
                {[
                  { step: '1.', text: 'Extension reads the job description on the page', color: 'text-blue-300' },
                  { step: '2.', text: 'AI rewrites your resume bullets to match it', color: 'text-violet-300' },
                  { step: '3.', text: 'Fresh PDF resume is generated in 3 seconds', color: 'text-amber-300' },
                  { step: '4.', text: 'All form fields are filled from your profile', color: 'text-emerald-300' },
                  { step: '5.', text: 'Resume PDF is attached to the upload field', color: 'text-emerald-300' },
                  { step: '✓', text: 'You review and click Submit', color: 'text-emerald-400 font-bold' },
                ].map(({ step, text, color }) => (
                  <div key={step} className="flex gap-3">
                    <span className={`${color} shrink-0`}>{step}</span>
                    <span className="text-white/70">{text}</span>
                  </div>
                ))}
                <div className="mt-4 pt-4 border-t border-white/10 text-emerald-400/80 text-[12px]">
                  Total time: ~4 seconds per application
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Privacy note ── */}
      <section className="py-12 border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-3xl px-6 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <div className="h-12 w-12 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-[15px] font-bold text-slate-900">Your passwords are never stored.</p>
            <p className="text-[13px] text-slate-500 mt-1">The extension uses your existing browser session. We never see your passwords, login credentials, or any private account data.</p>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 text-center">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="text-[2rem] md:text-[2.5rem] font-extrabold tracking-tight text-slate-900 mb-4">
            Try it yourself — free.
          </h2>
          <p className="text-slate-500 text-[1rem] mb-8 leading-relaxed">
            Create your account, upload your resume, install the extension. The whole setup takes less than 5 minutes — then start applying today.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl h-12 px-8 text-[0.9375rem] font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
          >
            Get Started Free <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="text-[13px] text-slate-400 mt-3">No credit card needed. No complicated setup.</p>
        </div>
      </section>
    </div>
  );
}
