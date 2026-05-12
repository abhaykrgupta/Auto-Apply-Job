import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ArrowRight, CheckCircle2, FileText, Search,
  Zap, LineChart, Star, Loader2, ArrowUpRight
} from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function HomePage() {
  return (
    <div className="flex flex-col w-full selection:bg-indigo-100">

      {/* ── HERO (Airy & Calming) ─────────────────────────────────────────────── */}
      <section className="relative pt-20 pb-16 md:pt-28 md:pb-24 overflow-hidden bg-gradient-to-b from-indigo-50/50 to-white">
        <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-12 lg:gap-0 items-center">

            {/* Left: Text block */}
            <div className="pb-8 lg:pb-0 max-w-xl">
              <h1 className="text-[3rem] md:text-[4rem] lg:text-[4.5rem] font-extrabold leading-[1.05] tracking-tight text-slate-900 mb-6">
                The last time you'll
                fill out a Workday form.
              </h1>

              <p className="text-[1.125rem] leading-[1.6] text-slate-600 max-w-md mb-10">
                Stop getting auto-rejected. We rewrite your resume for every job and submit the application for you—while you sleep.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <Link href="/dashboard">
                  <button className="inline-flex items-center gap-2 rounded-lg h-12 px-8 text-[0.9375rem] font-semibold bg-indigo-600 text-white shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] hover:bg-indigo-700 transition-colors">
                    Start applying for free <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
                <Link href="/how-it-works">
                  <Button
                    variant="ghost"
                    className="h-12 px-6 text-[0.9375rem] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                  >
                    See how it works
                  </Button>
                </Link>
              </div>

              {/* Social proof */}
              <div className="mt-10 flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[12, 14, 17, 21].map(seed => (
                    <img
                      key={seed}
                      src={`https://api.dicebear.com/7.x/notionists/svg?seed=${seed}`}
                      className="h-8 w-8 rounded-full border-2 border-white bg-slate-100 shadow-sm"
                      alt="User avatar"
                    />
                  ))}
                </div>
                <div className="flex flex-col justify-center">
                  <div className="flex gap-0.5 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-current" />
                    ))}
                  </div>
                  <span className="text-[11px] font-medium text-slate-500 mt-0.5">Over 10,000 engineers hired.</span>
                </div>
              </div>
            </div>

            {/* Right: Realistic UI preview */}
            <div className="hidden lg:block relative">
              <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl shadow-2xl overflow-hidden">
                {/* Titlebar */}
                <div className="flex items-center gap-2 px-4 h-12 border-b border-slate-200 bg-slate-50/80">
                  <div className="h-3 w-3 rounded-full bg-[#FF5F57]" />
                  <div className="h-3 w-3 rounded-full bg-[#FEBC2E]" />
                  <div className="h-3 w-3 rounded-full bg-[#28C840]" />
                  <div className="mx-auto flex items-center gap-2 px-3 h-7 bg-white border border-slate-200 rounded-md text-[11px] text-slate-500 font-mono tracking-tight shadow-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                    app.jobagent.ai / active-tasks
                  </div>
                </div>

                {/* Dashboard content */}
                <div className="p-6 bg-white/80 space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-bold tracking-tight text-slate-900">Live Application Pipeline</p>
                      <p className="text-[12px] text-slate-500 mt-0.5">3 Chrome Extensions Active</p>
                    </div>
                  </div>

                  {/* Activity row 1 */}
                  <div className="flex items-center gap-4 p-3.5 rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
                    <div className="h-9 w-9 rounded-full bg-white flex items-center justify-center shrink-0 border border-slate-200">
                      <FileText className="h-4 w-4 text-slate-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold leading-tight truncate text-slate-900">Tailoring resume for Stripe</p>
                      <p className="text-[11px] text-indigo-600 mt-1">Injecting "React" & "System Design"...</p>
                    </div>
                    <Loader2 className="h-4 w-4 text-indigo-600 animate-spin shrink-0" />
                  </div>

                  {/* Activity row 2 */}
                  <div className="flex items-center gap-4 p-3.5 rounded-xl border border-slate-100 bg-white">
                    <div className="h-9 w-9 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold leading-tight truncate text-slate-700">Applied to Vercel (Senior Eng)</p>
                      <p className="text-[11px] text-slate-400 mt-1">ATS match: 97% · Submitted 4m ago</p>
                    </div>
                  </div>

                  {/* Activity row 3 */}
                  <div className="flex items-center gap-4 p-3.5 rounded-xl border border-slate-100 bg-white">
                    <div className="h-9 w-9 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                      <Search className="h-4 w-4 text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold leading-tight truncate text-slate-700">Scanning Greenhouse for Figma</p>
                      <p className="text-[11px] text-slate-400 mt-1">Queued · Executing in 2m</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LOGO STRIP ─────────────────────────────────────── */}
      <section className="py-10 border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <div className="flex flex-wrap justify-center items-center gap-10 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-300">
            {['STRIPE', 'VERCEL', 'FIGMA', 'NOTION', 'LINEAR'].map(name => (
              <span key={name} className="text-[14px] font-black tracking-[0.15em] text-slate-900">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES — BENTO BOX LAYOUT ─────────── */}
      <section className="pt-20 pb-20 bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <div className="max-w-2xl mb-16">
            <h2 className="text-[2.5rem] md:text-[3.25rem] font-bold tracking-tight leading-[1.05] text-slate-900 mb-4">
              Every part of your job search,<br />
              <span className="text-slate-500 font-medium">automated flawlessly.</span>
            </h2>
            <p className="text-[1.125rem] text-slate-600 leading-relaxed">
              We replaced four separate subscriptions with a single, highly-engineered Chrome Extension that runs your entire job hunt.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Bento Box 1 */}
            <div className="md:col-span-2 rounded-[2rem] border border-slate-200 bg-slate-50 p-8 md:p-10 flex flex-col justify-between overflow-hidden relative shadow-sm hover:shadow-md transition-shadow">
              <div className="relative z-10 max-w-md mb-8">
                <div className="mb-6 h-10 w-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center">
                  <FileText className="h-5 w-5 text-indigo-600" />
                </div>
                <h3 className="text-2xl font-bold tracking-tight mb-3 text-slate-900">We tailor your resume instantly.</h3>
                <p className="text-[1rem] text-slate-600 leading-relaxed">
                  We dynamically rewrite 3 bullet points on your PDF to perfectly mirror the job description's exact keywords. To the ATS, you look like a 100% perfect match.
                </p>
              </div>
              <div className="relative -mr-12 -mb-10 mt-auto p-6 rounded-tl-2xl border border-slate-200 bg-white shadow-lg">
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Original Bullet</span>
                  <ArrowRight className="h-4 w-4 text-slate-300" />
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">ATS Optimized</span>
                </div>
                <div className="space-y-4">
                  <p className="text-sm text-slate-500 line-through decoration-red-400/50">Built a web app using React to improve speed.</p>
                  <p className="text-sm font-medium text-slate-900">Architected a scalable SPA utilizing React.js, optimizing Core Web Vitals and reducing TTI by 40%.</p>
                </div>
              </div>
            </div>

            {/* Bento Box 2 */}
            <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-8 flex flex-col relative shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-6 h-10 w-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center">
                <Zap className="h-5 w-5 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold tracking-tight mb-3 text-slate-900">We click apply.</h3>
              <p className="text-[0.9375rem] text-slate-600 leading-relaxed mb-8">
                Our Chrome Extension injects directly into Workday. It answers screening questions, selects EEOC radio buttons, and uploads your PDF.
              </p>
              <div className="mt-auto space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200 shadow-sm">
                  <span className="text-xs font-semibold text-slate-700">Visa Sponsorship?</span>
                  <span className="text-xs font-bold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-1 rounded">No</span>
                </div>
              </div>
            </div>

            {/* Bento Box 3 */}
            <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-8 flex flex-col shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-6 h-10 w-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center">
                <Search className="h-5 w-5 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold tracking-tight mb-3 text-slate-900">We find the jobs.</h3>
              <p className="text-[0.9375rem] text-slate-600 leading-relaxed mb-6">
                Set your salary floor and remote preferences. We monitor LinkedIn, Lever, and 40+ boards 24/7.
              </p>
              <div className="flex flex-wrap gap-2 mt-auto">
                {['LinkedIn', 'Greenhouse', 'Lever', 'Workday'].map(b => (
                  <span key={b} className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-white border border-slate-200 px-2.5 py-1.5 rounded-md shadow-sm">
                    {b}
                  </span>
                ))}
              </div>
            </div>

            {/* Bento Box 4 */}
            <div className="md:col-span-2 rounded-[2rem] border border-slate-200 bg-slate-50 p-8 md:p-10 flex flex-col md:flex-row items-center gap-10 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex-1">
                <div className="mb-6 h-10 w-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center">
                  <LineChart className="h-5 w-5 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold tracking-tight mb-3 text-slate-900">Total Inbox Sync.</h3>
                <p className="text-[1rem] text-slate-600 leading-relaxed">
                  We monitor your inbox for interview requests and rejections, automatically moving cards across your Kanban board.
                </p>
              </div>
              <div className="w-full md:w-64 h-28 rounded-xl border border-slate-200 bg-white p-4 flex flex-col justify-center gap-3 shadow-sm">
                <div className="h-2 w-1/3 bg-indigo-500 rounded-full" />
                <div className="h-10 w-full rounded-lg bg-slate-50 border border-slate-100 flex items-center px-3 gap-3">
                  <div className="h-4 w-4 rounded-full bg-indigo-100 flex items-center justify-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="h-1.5 w-3/4 bg-slate-200 rounded-full" />
                    <div className="h-1 w-1/2 bg-slate-100 rounded-full" />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────── */}
      <section className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="mx-auto max-w-4xl px-6 md:px-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-4">
              Frequently asked questions
            </h2>
          </div>
          
          <Accordion className="w-full" type="single" collapsible>
            {[
              { q: 'How do you bypass Workday and Greenhouse bot protection?', a: 'We don\'t use server-side scrapers. We use a Chrome Extension that lives in your active browser. Because the traffic comes from your real IP address and uses your existing login sessions, Cloudflare and ATS firewalls never block it.' },
              { q: 'Will recruiters know an AI applied for me?', a: 'No. The application is written in your voice using your historical data. We don\'t "auto-submit"—we "auto-fill" the page in 1 second and let you review it before you click submit. It looks 100% human.' },
              { q: 'How does the ATS keyword injection work?', a: 'When you click "Fill", we send the job description to our backend. We dynamically rewrite 3 bullet points on your PDF resume to perfectly mirror the job description\'s exact keywords, compile a new PDF, and inject it into the upload field instantly.' },
            ].map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-slate-200">
                <AccordionTrigger className="text-[1rem] font-semibold py-5 text-left hover:no-underline text-slate-800 hover:text-indigo-600 transition-colors">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-[0.9375rem] text-slate-600 leading-relaxed pb-6">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ── CTA ─────────────────── */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-6 md:px-10 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-[2.75rem] md:text-[3.5rem] font-bold tracking-tight leading-[1.05] text-slate-900 mb-6">
              Stop applying.<br />Start interviewing.
            </h2>
            <p className="text-[1.125rem] text-slate-500 leading-relaxed mb-8">
              Join thousands of engineers who handed their job search to our Chrome Extension and got their life back.
            </p>
            <div className="flex flex-col items-center justify-center gap-3">
              <Link href="/dashboard">
                <button className="inline-flex items-center gap-2 rounded-lg h-12 px-10 text-[1rem] font-semibold tracking-wide bg-indigo-600 text-white shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] hover:bg-indigo-700 transition-colors">
                  Hire your AI Recruiter <ArrowUpRight className="h-5 w-5" />
                </button>
              </Link>
              <p className="text-xs font-medium text-slate-400 mt-2">Takes 2 minutes. Cancel anytime.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
