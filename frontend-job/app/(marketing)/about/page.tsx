import { ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="flex flex-col w-full selection:bg-indigo-100">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="pt-20 pb-16 md:pt-32 md:pb-24 bg-gradient-to-b from-indigo-50/50 to-white">
        <div className="mx-auto max-w-4xl px-6 md:px-10 text-center">
          <h1 className="text-[3rem] md:text-[4.5rem] font-extrabold tracking-tight leading-[1.02] text-slate-900 max-w-4xl mx-auto">
            Built by someone<br />who was tired of applying.
          </h1>
          <p className="mt-6 text-[1.125rem] leading-[1.7] text-slate-600 max-w-2xl mx-auto">
            I spent three months applying to jobs — spending hours every week copying the same info into different forms, tailoring cover letters nobody read, and refreshing my inbox. Most applications went nowhere. I knew I was a good fit. The process just wasn't built for that.
          </p>
          <p className="mt-4 text-[1.125rem] leading-[1.7] text-slate-600 max-w-2xl mx-auto">
            So I built a tool for myself. It filled the forms. It matched my resume to the job posting. It tracked everything. After a week of using it, I had three times as many interviews. I shared it with friends — same result. That's when it became JobAgent.
          </p>
        </div>
      </section>

      {/* ── THE PROBLEM ─────────────────────────────────────── */}
      <section className="py-20 bg-white border-y border-slate-200">
        <div className="mx-auto max-w-5xl px-6 md:px-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
            <div>
              <h2 className="text-[2.25rem] font-bold tracking-tight mb-6 text-slate-900">Why most applications go nowhere.</h2>
              <div className="space-y-5 text-[1.0625rem] text-slate-600 leading-relaxed">
                <p>
                  Companies receive hundreds of applications per job. To handle the volume, they use software that automatically scores your resume based on keyword match. If your resume doesn't use the same words as the job description — even if you're perfectly qualified — it gets filtered before a human reads it.
                </p>
                <p>
                  At the same time, manually applying to enough jobs to land one is a full-time job in itself. Most people just don't have the time.
                </p>
                <p>
                  JobAgent solves both problems: it automatically rewrites your resume to match each job posting, and it fills out the form so fast that applying takes seconds instead of 20 minutes.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { title: 'You always review first', desc: 'We never submit anything without you seeing it. We fill the form — you click Submit.' },
                { title: 'Your data stays yours', desc: 'The extension runs in your own browser. We never store your passwords or login sessions.' },
                { title: 'Built for real job seekers', desc: 'Not for recruiters, not for companies. Built for the person actually applying.' },
                { title: 'No spam applications', desc: "We don't blindly apply everywhere. You choose the jobs — we just make applying 10× faster." },
              ].map((v, i) => (
                <div key={i} className="p-6 rounded-[1.25rem] border border-slate-200 bg-slate-50 shadow-sm hover:shadow-md transition-shadow">
                  <div className="mb-4 h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                  <h3 className="font-bold text-slate-900 mb-2 text-sm">{v.title}</h3>
                  <p className="text-[0.875rem] text-slate-500 leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── WHAT WE ACTUALLY BELIEVE ──────────────────────── */}
      <section className="py-20 bg-slate-50">
        <div className="mx-auto max-w-5xl px-6 md:px-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-[2.25rem] font-bold tracking-tight mb-4 text-slate-900">A few things we actually believe.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'Getting hired is a numbers game — and that\'s fixable', val: 'The more tailored applications you send, the more interviews you get. Most people can only send 5–10 a week by hand. We help you send 30+ without lowering the bar on quality.' },
              { label: 'Your resume isn\'t bad — it just doesn\'t match the job', val: "You're not under-qualified. You're just using different words than the job posting. We fix that for every single application, automatically." },
              { label: 'People should spend their energy on interviews, not forms', val: 'You\'re good at your job. Demonstrating that in an interview takes energy. Spending that same energy filling out Workday for the 40th time is a waste.' },
            ].map((item, i) => (
              <div key={i} className="flex flex-col p-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
                <CheckCircle2 className="h-6 w-6 text-indigo-500 mb-5" />
                <h4 className="text-[0.9375rem] font-bold text-slate-900 mb-3 leading-snug">{item.label}</h4>
                <p className="text-[0.875rem] text-slate-600 leading-relaxed">{item.val}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section className="py-24 bg-white border-t border-slate-200">
        <div className="mx-auto max-w-7xl px-6 md:px-10 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-[2.25rem] md:text-[3rem] font-bold tracking-tight text-slate-900 mb-4">
              Try it — it takes 3 minutes to set up.
            </h2>
            <p className="text-slate-500 text-[1rem] mb-8 leading-relaxed">
              Upload your resume, tell us what you're looking for, install the extension. That's it. The agent starts finding and applying to matching jobs the same day.
            </p>
            <Link href="/dashboard">
              <button className="inline-flex items-center gap-2 rounded-lg h-12 px-8 text-[0.9375rem] font-semibold bg-indigo-600 text-white shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] hover:bg-indigo-700 transition-colors">
                Get started free <ArrowRight className="h-4 w-4 ml-1" />
              </button>
            </Link>
            <p className="text-[13px] text-slate-400 mt-3">No credit card needed.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
