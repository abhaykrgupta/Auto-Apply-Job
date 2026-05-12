import { ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="flex flex-col w-full selection:bg-indigo-100">
      
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="pt-20 pb-16 md:pt-32 md:pb-24 bg-gradient-to-b from-indigo-50/50 to-white">
        <div className="mx-auto max-w-7xl px-6 md:px-10 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-600 mb-6">Our Mission</p>
          <h1 className="text-[3rem] md:text-[4.5rem] font-extrabold tracking-tight leading-[1.02] text-slate-900 max-w-4xl mx-auto">
            Your time, reclaimed.
          </h1>
          <p className="mt-6 text-[1.125rem] leading-[1.6] text-slate-600 max-w-2xl mx-auto">
            We believe that finding a job should be about your talent and potential, 
            not your ability to navigate repetitive forms and broken Workday portals.
          </p>
        </div>
      </section>

      {/* ── THE PROBLEM ─────────────────────────────────────── */}
      <section className="py-20 bg-white border-y border-slate-200">
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
            <div>
              <h2 className="text-[2.25rem] font-bold tracking-tight mb-6 text-slate-900">The search is fundamentally broken.</h2>
              <div className="space-y-5 text-[1.0625rem] text-slate-600 leading-relaxed">
                <p>
                  In 2024, the average job seeker spends over 20 hours a week on manual applications. 
                  Most of that time is wasted re-typing identical information into inconsistent ATS portals, 
                  only to be auto-rejected by keyword filters.
                </p>
                <p>
                  JobAgent was founded to reclaim that time. We realized that auto-applying with generic bots 
                  doesn't work. To actually get hired, you need precision.
                </p>
                <p>
                  That's why we built a Chrome Extension that lives in your browser. It fills the forms perfectly, 
                  rewrites your resume dynamically to match the ATS, and gives you back control over your career. 
                  No server-side scrapers. No generic spam. Just a massive unfair advantage.
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { title: 'Mission-Led', desc: 'Our goal is to save 1 billion hours of human busywork by 2026.' },
                { title: 'Privacy-First', desc: 'Your data lives in your browser extension. We never sell your history.' },
                { title: 'User-Centric', desc: 'Built by engineers who were tired of the "black hole" of job apps.' },
                { title: 'No Shortcuts', desc: 'We don\'t use brute-force bots. We use precision heuristics.' },
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

      {/* ── VALUES ─────────────────────────────────────────── */}
      <section className="py-20 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-[2.25rem] font-bold tracking-tight mb-4 text-slate-900">Built for the long term.</h2>
            <p className="text-slate-600 text-lg">
              We aren't just building a tool; we're building a new way to interact 
              with the labor market.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
            {[
              { label: 'Integrity', val: 'No shortcuts. Our extension acts as a co-pilot, letting you review every application before it is submitted.' },
              { label: 'Transparency', val: 'You see exactly what the agent sees. There is no black-box AI submitting forms blindly on your behalf.' },
              { label: 'Efficiency', val: 'We use zero-token parsing and deterministic mappings to make your application process instant and free of hallucinations.' },
            ].map((item, i) => (
              <div key={i} className="flex flex-col p-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
                <CheckCircle2 className="h-6 w-6 text-indigo-500 mb-5" />
                <h4 className="text-[1rem] font-bold text-slate-900 mb-2">{item.label}</h4>
                <p className="text-[0.9375rem] text-slate-600 leading-relaxed">{item.val}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section className="py-24 bg-white border-t border-slate-200">
        <div className="mx-auto max-w-7xl px-6 md:px-10 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-[2.25rem] md:text-[3rem] font-bold tracking-tight text-slate-900 mb-6">
              Join the future of work.
            </h2>
            <Link href="/dashboard">
              <button className="inline-flex items-center gap-2 rounded-lg h-12 px-8 text-[0.9375rem] font-semibold bg-indigo-600 text-white shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] hover:bg-indigo-700 transition-colors">
                Start your journey <ArrowRight className="h-4 w-4 ml-1" />
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
