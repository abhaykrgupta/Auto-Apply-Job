'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ArrowRight, CheckCircle2, FileText, Search,
  Zap, LineChart, Star, Loader2
} from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

import { ReactNode } from 'react';

const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

const fadeUp = (delay = 0) => ({});

const FEATURE_CARDS: { icon: ReactNode; bg: string; title: string; desc: string }[] = [
  { icon: <Zap className="h-5 w-5 text-emerald-500" />, bg: 'bg-emerald-500/10', title: 'Zero-Click Auto Apply', desc: 'Headless browsers fill out Workday and Lever portals including screening questions, uploading your tailored PDF.' },
  { icon: <LineChart className="h-5 w-5 text-amber-500" />, bg: 'bg-amber-500/10', title: 'Autonomous Tracking', desc: 'Your inbox is monitored. Interview requests automatically advance your Kanban status — no manual updates ever.' },
  { icon: <CheckCircle2 className="h-5 w-5 text-primary" />, bg: 'bg-primary/10', title: 'ATS Score Guarantee', desc: 'Every submission is pre-validated against ATS parsing rules. We only apply when the score exceeds your threshold.' },
];

export default function HomePage() {
  return (
    <div className="flex flex-col w-full">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative pt-20 pb-0 md:pt-28 overflow-hidden bg-background bg-dot-pattern">
        {/* Restrained top-only gradient glow */}
        <div className="hero-glow absolute inset-0 pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-10">
          {/* Two-column asymmetric hero */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-8 lg:gap-0 items-end">

            {/* Left: Text block */}
            <div className="pb-16 lg:pb-24 max-w-xl">
              <h1 className="text-[2.75rem] md:text-[3.75rem] lg:text-[4.25rem] font-bold leading-[1.05] tracking-[-0.035em] text-foreground mb-6">
                The last time you'll
                fill out a Workday form.
              </h1>

              <p className="text-[1.0625rem] leading-[1.75] text-muted-foreground max-w-md mb-10">
                JobAgent discovers matching roles, rewrites your resume
                for every ATS, and submits applications autonomously —
                24 hours a day.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <Link href="/dashboard">
                  <button className="inline-flex items-center gap-2 rounded-md h-11 px-7 text-[0.875rem] font-bold uppercase tracking-wider bg-foreground text-background border border-foreground/10 shadow-[0_2px_4px_0_rgba(0,0,0,0.2)] hover:bg-foreground/90 hover:-translate-y-px active:translate-y-0 transition-all duration-150">
                    Deploy your agent <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
                <Link href="/how-it-works">
                  <Button
                    variant="ghost"
                    className="h-10 px-4 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  >
                    See how it works
                  </Button>
                </Link>
              </div>

              {/* Social proof — minimal */}
              <div className="mt-10 flex items-center gap-3">
                <div className="flex -space-x-1.5">
                  {[12, 14, 17, 21].map(seed => (
                    <img
                      key={seed}
                      src={`https://api.dicebear.com/7.x/notionists/svg?seed=${seed}`}
                      className="h-7 w-7 rounded-full border-2 border-background bg-muted"
                      alt=""
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="flex gap-0.5 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-current" />
                    ))}
                  </div>
                  <span>10,000+ job seekers automated</span>
                </div>
              </div>
            </div>

            {/* Right: Realistic UI preview — attached to bottom */}
            <div className="hidden lg:block relative">
              {/* The "window" */}
              <div className="rounded-t-2xl border border-b-0 border-border/60 bg-card shadow-[0_-8px_40px_-8px_oklch(0_0_0/10%),0_0_0_1px_oklch(0.88_0.008_255)] overflow-hidden">
                {/* Titlebar */}
                <div className="flex items-center gap-2 px-4 h-11 border-b border-border/50 bg-muted/30">
                  <div className="h-3 w-3 rounded-full bg-[#FF5F57]" />
                  <div className="h-3 w-3 rounded-full bg-[#FEBC2E]" />
                  <div className="h-3 w-3 rounded-full bg-[#28C840]" />
                  <div className="mx-auto flex items-center gap-1.5 px-3 h-6 bg-background border border-border/60 rounded text-[11px] text-muted-foreground font-mono tracking-tight">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 live-pulse" />
                    app.jobagent.ai / dashboard
                  </div>
                </div>

                {/* Dashboard content */}
                <div className="p-5 bg-background/60 space-y-3">
                  {/* Header row */}
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <p className="text-sm font-semibold tracking-tight">Live Operations</p>
                      <p className="text-[11px] text-muted-foreground">3 headless instances running</p>
                    </div>
                    <span className="text-[11px] font-semibold text-green-600 bg-green-500/10 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 live-pulse" /> Active
                    </span>
                  </div>

                  {/* Activity row 1 — in progress */}
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-card">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold leading-tight truncate">Tailoring resume → Stripe</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Matching "React" · "TypeScript" · "System Design"</p>
                    </div>
                    <Loader2 className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />
                  </div>

                  {/* Activity row 2 — done */}
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-muted/20">
                    <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium leading-tight truncate text-muted-foreground">Applied → Vercel · Senior Eng</p>
                      <p className="text-[11px] text-muted-foreground/60 mt-0.5">ATS score 97% · Submitted 4m ago</p>
                    </div>
                  </div>

                  {/* Activity row 3 — queued */}
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-muted/20">
                    <div className="h-8 w-8 rounded-full bg-primary/6 flex items-center justify-center shrink-0">
                      <Search className="h-4 w-4 text-primary/60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium leading-tight truncate text-muted-foreground">Scanning Greenhouse → Figma, Linear</p>
                      <p className="text-[11px] text-muted-foreground/60 mt-0.5">Queued · Checking every 15 min</p>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {[
                      { label: 'Applied', value: '312', sub: 'this month' },
                      { label: 'Interviews', value: '14', sub: 'confirmed' },
                      { label: 'Hours saved', value: '96h', sub: 'reclaimed' }
                    ].map(s => (
                      <div key={s.label} className="rounded-lg border border-border/40 bg-muted/20 p-2.5">
                        <p className="text-base font-bold tracking-tight">{s.value}</p>
                        <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{s.label}<br /><span className="opacity-60">{s.sub}</span></p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LOGO STRIP ─────────────────────────────────────── */}
      <section className="py-14 border-y border-border/30 bg-muted/20 bg-dot-pattern">
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50 mb-8 text-center">
            Securing interviews at world-class companies
          </p>
          <div className="flex flex-wrap justify-center items-center gap-10 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-300">
            {['STRIPE', 'VERCEL', 'FIGMA', 'NOTION', 'LINEAR'].map(name => (
              <span key={name} className="text-[13px] font-bold tracking-[0.12em] text-foreground/80">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES — asymmetric stacked layout ─────────── */}
      <section className="pt-28 pb-24 bg-background border-b border-border/30 bg-dot-pattern">
        <div className="mx-auto max-w-7xl px-6 md:px-10">

          {/* Section label */}
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-primary/70 mb-5">
            Platform capabilities
          </p>

          <h2 className="text-[2.25rem] md:text-[3rem] font-bold tracking-[-0.03em] leading-[1.1] text-foreground max-w-2xl mb-20">
            Every part of your job search,<br />
            <span className="text-muted-foreground font-medium">automated and optimized.</span>
          </h2>

          {/* Feature 1: Full-width with right visual */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="feature-card rounded-2xl p-8 lg:p-10 flex flex-col justify-between min-h-[280px]">
              <div>
                <div className="mb-6 h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-xl font-semibold tracking-[-0.02em] mb-3">AI Resume Tailoring</h3>
                <p className="text-[0.9375rem] text-muted-foreground leading-relaxed max-w-sm">
                  For every application, your bullet points are rewritten to mirror the job description's exact language — naturally, without stuffing.
                </p>
              </div>
              <div className="mt-8 space-y-2">
                {['ATS Match: 97%', 'Keywords extracted: 23', 'Rewrite time: 4.2s'].map(l => (
                  <div key={l} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                    {l}
                  </div>
                ))}
              </div>
            </div>

            <div className="feature-card rounded-2xl p-8 lg:p-10 flex flex-col justify-between min-h-[280px]">
              <div>
                <div className="mb-6 h-9 w-9 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <Search className="h-5 w-5 text-violet-500" />
                </div>
                <h3 className="text-xl font-semibold tracking-[-0.02em] mb-3">Universal Job Discovery</h3>
                <p className="text-[0.9375rem] text-muted-foreground leading-relaxed max-w-sm">
                  Monitors LinkedIn, Greenhouse, Lever, and 40+ job boards simultaneously. You see a role the moment it's posted.
                </p>
              </div>
              <div className="mt-8 flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium bg-muted px-2.5 py-1 rounded-md">LinkedIn</span>
                <span className="text-xs text-muted-foreground font-medium bg-muted px-2.5 py-1 rounded-md">Greenhouse</span>
                <span className="text-xs text-muted-foreground font-medium bg-muted px-2.5 py-1 rounded-md">+38 more</span>
              </div>
            </div>
          </div>

          {/* Second row: responsive grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURE_CARDS.map((f, i) => (
              <div
                key={i}
                className={`feature-card rounded-2xl p-7 bg-background/80 backdrop-blur-sm ${i === 2 ? 'md:col-span-2 lg:col-span-1' : ''}`}
              >
                <div className={`mb-5 h-9 w-9 rounded-lg ${f.bg} flex items-center justify-center`}>
                  {f.icon}
                </div>
                <h3 className="text-base font-semibold tracking-[-0.015em] mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS — numbered, left-aligned ───────── */}
      <section className="py-24 bg-muted/40 border-y border-border/30 bg-dot-pattern">
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-[18rem_1fr] gap-16 items-start">
            {/* Left: sticky label */}
            <div className="lg:sticky lg:top-12">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-primary/70 mb-4">
                How it works
              </p>
              <h2 className="text-3xl font-bold tracking-[-0.025em] leading-[1.15] text-foreground">
                Set it once.<br />Let it run forever.
              </h2>
            </div>

            {/* Right: steps */}
            <div className="space-y-0 divide-y divide-border/40">
              {[
                { n: '01', title: 'Upload your profile', desc: 'Upload your base resume. The AI extracts your career history, skills, and preferences into a structured memory.' },
                { n: '02', title: 'Configure parameters', desc: 'Set your target titles, salary range, remote policy, and minimum company size. The agent learns your standards.' },
                { n: '03', title: 'Activate the agent', desc: 'Headless instances go live, scraping 40+ job boards and filtering against your exact criteria around the clock.' },
                { n: '04', title: 'Show up to interviews', desc: 'The AI tailors, applies, and tracks. Your only job is to respond to the interview requests that land in your inbox.' },
              ].map((step, i) => (
                <div
                  key={i}
                  className="flex gap-12 py-12 first:pt-0 last:pb-0"
                >
                  <span className="text-[3.5rem] font-black text-primary/15 leading-none select-none shrink-0">{step.n}</span>
                  <div>
                    <h3 className="text-[1.125rem] font-bold tracking-tight mb-2.5">{step.title}</h3>
                    <p className="text-[1rem] text-muted-foreground leading-relaxed max-w-lg">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS — staggered, not uniform ────────── */}
      <section className="py-28 bg-background border-b border-border/30 bg-dot-pattern">
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <h2 className="text-[2rem] md:text-[2.5rem] font-bold tracking-[-0.03em] text-foreground mb-16 max-w-lg">
            From engineers who stopped applying manually.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {[
              { quote: 'I was spending 3 hours a day on Workday forms. JobAgent applied to 400 jobs while I slept. Had 6 interviews by Friday.', author: 'Sarah J.', role: 'Senior Frontend Engineer' },
              { quote: 'The tailoring is scary good. It rewrites my bullet points to match the recruiter\'s exact language. My response rate tripled.', author: 'Michael T.', role: 'Product Manager, ex-Google' },
              { quote: 'Feels like an elite Chief of Staff running my entire search. The UI is beautiful and the automation just works.', author: 'David L.', role: 'Full Stack Developer' },
            ].map((t, i) => (
              <div
                key={i}
                className={`flex flex-col ${i === 2 ? 'md:col-span-2 lg:col-span-1' : ''}`}
              >
                <div className="flex gap-0.5 mb-6">
                  {[...Array(5)].map((_, j) => <Star key={j} className="h-3 w-3 fill-primary text-primary/20" />)}
                </div>
                <p className="text-[1.125rem] leading-relaxed text-foreground font-medium mb-8">"{t.quote}"</p>
                <div className="flex items-center gap-3 mt-auto">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {t.author[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold leading-tight">{t.author}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ — left-heavy layout ───────────────────────── */}
      <section className="py-20 border-t border-border/30 bg-muted/40 bg-dot-pattern">
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-[18rem_1fr] gap-16">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-primary/70 mb-4">FAQ</p>
              <h2 className="text-2xl font-bold tracking-[-0.025em] text-foreground leading-snug">
                Questions about<br />the platform.
              </h2>
            </div>
            <div>
              <Accordion className="w-full">
                {[
                  { q: 'How does the AI bypass ATS systems?', a: 'The AI analyzes the semantic structure of the job description to identify core competencies. It then rewrites your bullet points to naturally incorporate those exact terms — ensuring high parse scores without stuffing.' },
                  { q: 'Can it fill out complex Workday and Greenhouse forms?', a: 'Yes. Headless browsers navigate portal forms using your stored profile data. The agent answers screening questions, uploads your tailored PDF, and submits — exactly as a human would.' },
                  { q: 'Will recruiters know an AI applied for me?', a: 'No. The application is written in your voice using your historical data. Every submission appears entirely organic to the recruiter and the ATS.' },
                  { q: 'How many applications can it send per day?', a: 'On the Pro plan, there is no hard cap. The agent\'s rate is governed by your quality filters — it only applies when the ATS match score exceeds your configured threshold.' },
                ].map((item, i) => (
                  <AccordionItem key={i} value={`item-${i}`}>
                    <AccordionTrigger className="text-[0.9375rem] font-medium py-5 text-left hover:no-underline">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA — restrained, typographic ─────────────────── */}
      <section className="py-32 bg-background bg-dot-pattern">
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <div className="max-w-2xl">
            <h2 className="text-[2.5rem] md:text-[3.5rem] font-bold tracking-[-0.035em] leading-[1.08] text-foreground mb-6">
              Ready to stop applying<br />and start interviewing?
            </h2>
            <p className="text-[1.0625rem] text-muted-foreground leading-relaxed mb-10 max-w-md">
              Join thousands of engineers who handed their job search to an agent and got their life back.
            </p>
            <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/dashboard">
                <button className="inline-flex items-center gap-2 rounded-md h-12 px-8 text-[0.9375rem] font-bold uppercase tracking-wider bg-foreground text-background border border-foreground/10 shadow-[0_4px_6px_0_rgba(0,0,0,0.25)] hover:bg-foreground/90 hover:-translate-y-px active:translate-y-0 transition-all duration-150">
                  Start for free <ArrowRight className="h-5 w-5" />
                </button>
              </Link>
              <span className="text-sm text-muted-foreground ml-4">No credit card · Setup in 2 minutes</span>
            </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
