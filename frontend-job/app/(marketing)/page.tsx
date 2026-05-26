import Link from 'next/link';
import {
  ArrowRight, CheckCircle2, FileText, Zap, Star,
  BellRing, Clock, TrendingUp, ArrowUpRight, Users, BadgeCheck
} from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function HomePage() {
  return (
    <div className="flex flex-col w-full selection:bg-indigo-100">

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="relative pt-20 pb-16 md:pt-28 md:pb-24 overflow-hidden bg-gradient-to-b from-indigo-50/60 to-white">
        {/* Soft glow blobs */}
        <div className="pointer-events-none absolute -top-20 -left-20 h-72 w-72 rounded-full bg-indigo-200/30 blur-3xl" />
        <div className="pointer-events-none absolute top-10 right-0 h-56 w-56 rounded-full bg-purple-200/20 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Left copy */}
            <div className="max-w-xl">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700 text-[12px] font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                Finds jobs · tailors resume · fills forms
              </div>

              <h1 className="text-[2.75rem] md:text-[3.75rem] font-extrabold leading-[1.06] tracking-tight text-slate-900 mb-6">
                Stop spending weekends<br />
                filling out job forms.
              </h1>

              <p className="text-[1.125rem] leading-[1.7] text-slate-600 mb-8">
                Most job seekers send 3–5 applications a week. Our AI sends 30+ a day — each one tailored to the exact job, so you actually hear back.
              </p>

              <div className="flex flex-wrap items-center gap-3 mb-10">
                <Link href="/dashboard">
                  <button className="inline-flex items-center gap-2 rounded-xl h-12 px-8 text-[0.9375rem] font-semibold bg-indigo-600 text-white shadow-[0_4px_20px_rgba(79,70,229,0.35)] hover:bg-indigo-700 transition-colors">
                    Start for free <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
                <Link href="/how-it-works">
                  <button className="inline-flex items-center gap-2 rounded-xl h-12 px-6 text-[0.9375rem] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200">
                    See how it works
                  </button>
                </Link>
              </div>

              {/* 3 quick wins */}
              <div className="flex flex-col gap-2.5">
                {[
                  'Your resume is rewritten for every single job',
                  'Applications go out while you sleep',
                  'You only show up for the interviews',
                ].map(text => (
                  <div key={text} className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span className="text-[14px] text-slate-600">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Dashboard preview */}
            <div className="hidden lg:block relative">
              <div className="rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
                {/* Browser bar */}
                <div className="flex items-center gap-2 px-4 h-11 border-b border-slate-100 bg-slate-50">
                  <div className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
                  <div className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
                  <div className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
                  <div className="mx-auto flex items-center gap-1.5 px-3 h-6 bg-white border border-slate-200 rounded text-[11px] text-slate-400 font-mono">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                    app.jobagent.ai
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
                  {[
                    { label: 'Applied Today', value: '34', color: 'text-indigo-600' },
                    { label: 'Interviews', value: '6', color: 'text-emerald-600' },
                    { label: 'Response Rate', value: '22%', color: 'text-amber-600' },
                  ].map(s => (
                    <div key={s.label} className="p-4 text-center">
                      <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Live feed */}
                <div className="p-5 space-y-3">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">Live Activity</p>

                  <div className="flex items-center gap-3 p-3 rounded-xl border border-indigo-100 bg-indigo-50">
                    <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                      <FileText className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-slate-900 truncate">Tailoring resume for Stripe</p>
                      <p className="text-[11px] text-indigo-600 mt-0.5">Matching keywords to job description…</p>
                    </div>
                    <span className="text-[10px] text-indigo-400 font-medium shrink-0">Now</span>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-white">
                    <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-slate-700 truncate">Applied to Vercel · Senior Engineer</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Resume match: 97% · 4 minutes ago</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-white">
                    <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                      <BellRing className="h-3.5 w-3.5 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-slate-700 truncate">Interview request — Linear</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Sarah from Linear wants to connect</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating badge */}
              <div className="absolute -bottom-4 -left-6 flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-lg">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <span className="text-[13px] font-semibold text-slate-800">+22% more replies than average</span>
              </div>
            </div>
          </div>

          {/* Social proof */}
          <div className="mt-14 flex flex-wrap items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {['A', 'R', 'P', 'S', 'M'].map((letter, i) => (
                  <div
                    key={letter}
                    className="h-8 w-8 rounded-full border-2 border-white bg-indigo-100 flex items-center justify-center text-[11px] font-bold text-indigo-700"
                    style={{ zIndex: 5 - i }}
                  >
                    {letter}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex gap-0.5 text-amber-400 mb-0.5">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-3 w-3 fill-current" />)}
                </div>
                <p className="text-[12px] text-slate-500">Used by job seekers across India & beyond</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-6">
              {[
                { n: '500+', label: 'Companies tracked' },
                { n: '30+', label: 'Applications/day' },
                { n: '97%', label: 'Resume match score' },
              ].map(({ n, label }) => (
                <div key={label} className="text-center">
                  <p className="text-xl font-extrabold text-slate-900">{n}</p>
                  <p className="text-[12px] text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── WORKS WITH ───────────────────────────────────────────────────────── */}
      <section className="py-10 border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-5xl px-6">
          <p className="text-center text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-6">Works with applications on</p>
          <div className="flex flex-wrap justify-center items-center gap-10 md:gap-14 opacity-50">
            {['GREENHOUSE', 'LEVER', 'WORKDAY', 'ASHBY', 'WELLFOUND', 'LINKEDIN', 'SMARTRECRUITERS'].map(name => (
              <span key={name} className="text-[12px] font-black tracking-[0.12em] text-slate-900">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── THE PROBLEM ──────────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-red-500 mb-4">The Real Problem</p>
              <h2 className="text-[2.25rem] md:text-[2.75rem] font-extrabold leading-tight tracking-tight text-slate-900 mb-6">
                Job hunting is a<br />full-time job. And it's broken.
              </h2>
              <p className="text-[1.0625rem] text-slate-600 leading-relaxed mb-6">
                You spend hours writing cover letters, copying and pasting the same information into different forms, and customising your resume — only to get ghosted or auto-rejected before a human even reads it.
              </p>
              <p className="text-[1.0625rem] text-slate-600 leading-relaxed">
                That's because most application software scores resumes by keyword match before a recruiter ever sees them. If your resume doesn't mirror the exact words in the job posting — you're filtered out automatically.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Clock, title: '47 hours', desc: 'Average time spent on job search per week', bad: true },
                { icon: Users, title: '250 applicants', desc: 'Compete for every single job posting', bad: true },
                { icon: CheckCircle2, title: '3 seconds', desc: 'Time our AI takes to tailor your resume', bad: false },
                { icon: TrendingUp, title: '6× more', desc: 'Interviews with a tailored resume vs generic', bad: false },
              ].map(({ icon: Icon, title, desc, bad }) => (
                <div key={title} className={`rounded-2xl border p-5 ${bad ? 'border-red-100 bg-red-50' : 'border-emerald-100 bg-emerald-50'}`}>
                  <Icon className={`h-5 w-5 mb-3 ${bad ? 'text-red-400' : 'text-emerald-500'}`} />
                  <p className={`text-xl font-extrabold mb-1 ${bad ? 'text-red-700' : 'text-emerald-700'}`}>{title}</p>
                  <p className={`text-[13px] leading-snug ${bad ? 'text-red-600' : 'text-emerald-600'}`}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT HELPS ─────────────────────────────────────────────────────── */}
      <section className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center mb-14">
            <p className="text-[11px] font-black uppercase tracking-widest text-indigo-600 mb-3">How It Works</p>
            <h2 className="text-[2.25rem] md:text-[2.75rem] font-extrabold tracking-tight leading-tight text-slate-900 mb-4">
              Three things that change<br />how fast you get hired.
            </h2>
            <p className="text-[1.0625rem] text-slate-600 max-w-xl mx-auto leading-relaxed">
              Most job seekers do all three manually. We automate all three — so the only thing left for you is the interview.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-white p-8 flex flex-col md:flex-row gap-8 items-start shadow-sm">
              <div className="h-12 w-12 rounded-2xl bg-indigo-100 flex items-center justify-center shrink-0">
                <FileText className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-900 mb-2">Your resume rewrites itself for every job</h3>
                <p className="text-[1rem] text-slate-600 leading-relaxed mb-5">
                  Upload your resume once. Before every application, our AI reads the job description and rewrites 3 key bullet points to mirror the exact words the employer used. The result: your resume looks purpose-built for that role — every single time.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-red-400 mb-2">Before</p>
                    <p className="text-[13px] text-slate-600 line-through decoration-red-300">Built a web app using React to improve speed.</p>
                  </div>
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-500 mb-2">After (AI tailored)</p>
                    <p className="text-[13px] text-slate-700 font-medium">Architected a React.js SPA, cutting page load time by 40% and improving user retention.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="h-12 w-12 rounded-2xl bg-amber-100 flex items-center justify-center mb-5">
                <Zap className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Fills out job forms in 2 seconds</h3>
              <p className="text-[0.9375rem] text-slate-600 leading-relaxed mb-5">
                Install our Chrome extension once. Whenever you visit a job application page, click one button and every field — your name, experience, education, work samples — fills itself instantly.
              </p>
              <div className="space-y-2">
                {['Name, email & phone', 'Work experience & education', 'Upload resume PDF', 'Diversity & equal opportunity forms'].map(item => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span className="text-[13px] text-slate-600">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="h-12 w-12 rounded-2xl bg-emerald-100 flex items-center justify-center mb-5">
                <BellRing className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Finds jobs before anyone else</h3>
              <p className="text-[0.9375rem] text-slate-600 leading-relaxed mb-5">
                We watch over 500 companies and 15+ job boards around the clock. The moment a role matching your preferences goes live, you're the first to know — and the first to apply.
              </p>
              <div className="flex flex-wrap gap-2">
                {['Y Combinator', 'Wellfound', 'LinkedIn', 'Greenhouse', 'Lever', '500+ companies'].map(b => (
                  <span key={b} className="text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
                    {b}
                  </span>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── TESTIMONIAL-STYLE NUMBERS ─────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center mb-12">
            <h2 className="text-[2rem] md:text-[2.5rem] font-extrabold tracking-tight text-slate-900">
              Real results. Real people.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote: "I went from 2 interviews in 3 months to 8 interviews in 2 weeks. I didn't change anything about my experience — just started using this.",
                name: 'Rohan M.',
                role: 'Software Engineer, Bangalore',
              },
              {
                quote: "Manual applications were eating 3–4 hours every evening. Now I spend that time actually preparing for interviews instead.",
                name: 'Priya K.',
                role: 'Product Manager, Mumbai',
              },
              {
                quote: "The resume tailoring thing is real. I applied to the same company twice — once with my old resume, once tailored. Only heard back the second time.",
                name: 'Arjun S.',
                role: 'Full Stack Developer, Hyderabad',
              },
            ].map(({ quote, name, role }) => (
              <div key={name} className="rounded-2xl border border-slate-200 bg-slate-50 p-6 flex flex-col gap-5">
                <div className="flex gap-0.5 text-amber-400">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
                </div>
                <p className="text-[0.9375rem] text-slate-700 leading-relaxed flex-1">"{quote}"</p>
                <div>
                  <p className="text-[14px] font-bold text-slate-900">{name}</p>
                  <p className="text-[12px] text-slate-500 mt-0.5">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="mx-auto max-w-3xl px-6">
          <div className="text-center mb-12">
            <h2 className="text-[2rem] font-extrabold tracking-tight text-slate-900 mb-3">Questions we always get</h2>
            <p className="text-slate-500 text-[1rem]">Honest answers. No fluff.</p>
          </div>

          <Accordion className="w-full space-y-2">
            {[
              {
                q: 'Will companies know an AI applied on my behalf?',
                a: "No. The extension runs inside your own browser, on your own computer, using your own internet connection. To anyone looking, it looks exactly like you typed everything yourself. We auto-fill the form — you review it and click submit.",
              },
              {
                q: 'Why does my resume need to be different for every job?',
                a: "Most companies use automated software to filter resumes before a recruiter ever reads them. This software looks for specific words from the job description. If your resume doesn't use those exact words — even if you're perfectly qualified — you get rejected automatically. Our AI fixes this by rewriting key sentences to match the language of each job posting.",
              },
              {
                q: 'Do I have to pay for every application?',
                a: "No. You get a fixed number of applications per month based on your plan. There's no per-application fee. Our free plan lets you test the system before committing.",
              },
              {
                q: 'What job boards and companies do you support?',
                a: "We work with over 500 companies directly, plus job boards like Wellfound, Y Combinator Jobs, LinkedIn, and many others. Our Chrome extension works on any job application page — Greenhouse, Lever, Workday, Ashby, SmartRecruiters, and more.",
              },
              {
                q: "I'm not technical. Can I still use this?",
                a: "Absolutely. You upload your resume, fill in your preferences (job title, location, salary), and install a Chrome extension from the web store — same as installing any browser extension. That's it. No configuration, no code.",
              },
            ].map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border border-slate-200 rounded-xl bg-white px-2">
                <AccordionTrigger className="text-[0.9375rem] font-semibold py-5 text-left hover:no-underline text-slate-800 hover:text-indigo-600 transition-colors">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-[0.9375rem] text-slate-600 leading-relaxed pb-5">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-indigo-600">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <BadgeCheck className="h-10 w-10 text-indigo-200 mx-auto mb-5" />
          <h2 className="text-[2.5rem] md:text-[3.25rem] font-extrabold tracking-tight leading-tight text-white mb-5">
            Your next job is waiting.<br />Let's go get it.
          </h2>
          <p className="text-[1.125rem] text-indigo-200 leading-relaxed mb-8 max-w-xl mx-auto">
            Set up takes 3 minutes. After that, the agent runs 24/7 finding jobs, tailoring your resume, and filling applications — while you live your life.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/dashboard">
              <button className="inline-flex items-center gap-2 rounded-xl h-13 px-10 py-3.5 text-[1rem] font-bold bg-white text-indigo-600 shadow-xl hover:bg-indigo-50 transition-colors">
                Get started for free <ArrowUpRight className="h-5 w-5" />
              </button>
            </Link>
          </div>
          <p className="text-[13px] text-indigo-300 mt-4">No credit card needed. Cancel anytime.</p>
        </div>
      </section>
    </div>
  );
}
