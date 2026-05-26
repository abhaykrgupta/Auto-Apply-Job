import { CheckCircle2, X, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function PricingPage() {
  return (
    <div className="flex flex-col w-full selection:bg-indigo-100">
      {/* ── HEADER ── */}
      <section className="pt-20 pb-16 md:pt-28 md:pb-24 bg-gradient-to-b from-indigo-50/50 to-white text-center">
        <div className="container mx-auto max-w-4xl px-4">
          <h1 className="text-[3rem] md:text-[4.5rem] font-extrabold tracking-tight mb-6 leading-[1.05] text-slate-900">
            Simple pricing.<br />No hidden fees.
          </h1>
          <p className="text-[1.125rem] text-slate-600 max-w-xl mx-auto">
            Start free and see how it works. Upgrade when you're ready to go all in on your job search.
          </p>
        </div>
      </section>

      {/* ── PRICING CARDS ── */}
      <section className="py-16 bg-white border-y border-slate-200">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-center">
            
            {/* Free Tier */}
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-8 flex flex-col hover:shadow-md transition-shadow">
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-1 text-slate-900">Starter</h3>
                <p className="text-sm text-slate-500">Try it out before you commit.</p>
                <div className="mt-6 flex items-baseline text-4xl font-extrabold tracking-tight text-slate-900">
                  $0<span className="text-lg font-medium text-slate-400 ml-2">/mo</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {['10 AI auto-fills per month', 'Basic resume parsing', 'Standard ATS scoring', 'Manual job tracking'].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-slate-300 shrink-0 mt-0.5" />
                    <span className="text-sm font-medium text-slate-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href="/login" className="w-full">
                <button className="w-full h-11 text-[0.9375rem] font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition-colors">
                  Start for free
                </button>
              </Link>
            </div>

            {/* Pro Tier (Indigo Highlight) */}
            <div className="rounded-[1.5rem] border-2 border-indigo-500 bg-white p-8 flex flex-col relative shadow-[0_20px_50px_rgba(79,70,229,0.1)]">
              <div className="absolute top-0 right-6 -translate-y-1/2 bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm">
                Most Popular
              </div>
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-1 text-slate-900">Pro Agent</h3>
                <p className="text-sm text-slate-500">For when you're actively job hunting.</p>
                <div className="mt-6 flex items-baseline text-4xl font-extrabold tracking-tight text-slate-900">
                  $29<span className="text-lg font-medium text-slate-500 ml-2">/mo</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {['Unlimited Chrome Extension auto-fills', 'Resume tailored for every job you apply to', 'AI match score before you apply', 'Application status auto-tracked', 'Priority support'].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                    <span className="text-sm font-medium text-slate-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href="/dashboard" className="w-full">
                <button className="w-full h-11 rounded-lg text-[0.9375rem] font-semibold bg-indigo-600 text-white shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] hover:bg-indigo-700 transition-colors">
                  Upgrade to Pro
                </button>
              </Link>
              <p className="text-center text-[11px] text-slate-400 mt-3">Cancel anytime. No questions asked.</p>
            </div>

          </div>
        </div>
      </section>

      {/* ── QUICK FAQ ── */}
      <section className="py-16 bg-white border-y border-slate-200">
        <div className="container mx-auto max-w-3xl px-4">
          <h2 className="text-xl font-bold text-slate-900 mb-8 text-center">A few things people ask about pricing</h2>
          <div className="space-y-6">
            {[
              { q: 'Can I cancel anytime?', a: 'Yes. Cancel from your account settings at any time — no questions, no friction. You keep access until the end of your billing period.' },
              { q: "What counts as an 'auto-fill'?", a: 'Each time you click the extension button on a job application and it fills the form for you, that counts as one auto-fill. Browsing jobs and viewing match scores does not count.' },
              { q: 'Does the free plan really work?', a: 'Yes — 10 auto-fills per month is enough to test the system properly. Most people upgrade after they see their first interview come in.' },
            ].map(({ q, a }) => (
              <div key={q} className="border-b border-slate-100 pb-6 last:border-0 last:pb-0">
                <p className="text-[15px] font-semibold text-slate-900 mb-2">{q}</p>
                <p className="text-[14px] text-slate-500 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURE COMPARISON ── */}
      <section className="py-24 bg-slate-50 border-b border-slate-200">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Everything you get</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-[1fr_120px_120px] gap-x-4 gap-y-0 text-sm">
            {/* Header */}
            <div className="hidden md:block font-semibold text-slate-500 pb-3 border-b border-slate-200">Feature</div>
            <div className="hidden md:block font-bold text-center pb-3 border-b border-slate-200 text-slate-900">Starter</div>
            <div className="hidden md:block font-bold text-center text-indigo-600 pb-3 border-b border-slate-200">Pro</div>

            {/* Rows */}
            {[
              { name: 'Monthly auto-fills', free: '10', pro: 'Unlimited' },
              { name: 'Chrome Extension', free: true, pro: true },
              { name: 'Resume tailored per job', free: false, pro: true },
              { name: 'Greenhouse / Lever / Workday support', free: false, pro: true },
              { name: 'AI match score', free: false, pro: true },
              { name: 'Application tracking', free: 'Basic', pro: 'Full history' },
            ].map((row, i) => (
              <div key={i} className="contents group">
                <div className="py-3 md:py-4 border-b border-slate-200 font-medium group-hover:bg-white px-2 rounded-l-md transition-colors flex items-center justify-between md:justify-start text-slate-700">
                  <span>{row.name}</span>
                  {/* Mobile labels */}
                  <span className="md:hidden text-slate-400 text-xs">{row.free === true ? 'Starter' : ''}</span>
                </div>
                <div className="py-3 md:py-4 border-b border-slate-200 flex items-center justify-center group-hover:bg-white transition-colors">
                  {typeof row.free === 'boolean' 
                    ? (row.free ? <CheckCircle2 className="h-4 w-4 text-slate-300" /> : <X className="h-4 w-4 text-slate-200" />) 
                    : <span className="text-slate-500 font-medium">{row.free}</span>}
                </div>
                <div className="py-3 md:py-4 border-b border-slate-200 flex items-center justify-center group-hover:bg-indigo-50/50 px-2 rounded-r-md transition-colors bg-indigo-50/30 md:bg-transparent">
                  {typeof row.pro === 'boolean' 
                    ? (row.pro ? <CheckCircle2 className="h-4 w-4 text-indigo-500" /> : <X className="h-4 w-4 text-slate-200" />) 
                    : <span className="font-bold text-indigo-600">{row.pro}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 text-center bg-white">
        <div className="container mx-auto max-w-xl px-4">
          <h2 className="text-[1.75rem] font-extrabold text-slate-900 mb-3">
            Start free. Upgrade when you're ready.
          </h2>
          <p className="text-slate-500 text-[0.9375rem] mb-7 leading-relaxed">
            No credit card required to get started. The free plan is a real plan — not a watered-down preview.
          </p>
          <Link href="/dashboard">
            <button className="inline-flex items-center gap-2 rounded-xl h-12 px-8 text-[0.9375rem] font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
              Get started free <ArrowRight className="h-4 w-4" />
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
