'use client';

import { Upload, SlidersHorizontal, Brain, Pencil, Send, LineChart, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { ReactNode } from 'react';

const STEPS: { n: string; icon: ReactNode; title: string; desc: string; detail: string[] }[] = [
  { 
    n: '01', 
    icon: <Upload className="h-5 w-5" />, 
    title: 'Profile Ingestion', 
    desc: 'Drag and drop your standard PDF resume. Our parsing engine instantly extracts your history into a structured memory bank.',
    detail: ['JSON structure extraction', 'Skill vectorization', 'Career timeline mapping']
  },
  { 
    n: '02', 
    icon: <SlidersHorizontal className="h-5 w-5" />, 
    title: 'Search Governance', 
    desc: 'Tell the agent exactly what you want. Set your target titles, salary floor, remote policy, and preferred company size.',
    detail: ['Filter exact titles', 'Remote/Hybrid logic', 'Minimum salary threshold']
  },
  { 
    n: '03', 
    icon: <Brain className="h-5 w-5" />, 
    title: 'Semantic Discovery', 
    desc: 'The agent actively monitors 40+ job boards 24/7. It identifies roles that align with your exact parameters.',
    detail: ['LinkedIn/Greenhouse/Lever', '40+ job board scrapers', 'Real-time role alerts']
  },
  { 
    n: '04', 
    icon: <Pencil className="h-5 w-5" />, 
    title: 'Atomic Tailoring', 
    desc: 'For every single application, the AI clones your base resume and rewrites bullet points to match recruiters expectations.',
    detail: ['Keyword alignment', 'Tone mirroring', 'ATS score optimization']
  },
  { 
    n: '05', 
    icon: <Send className="h-5 w-5" />, 
    title: 'Submission Engine', 
    desc: 'Using localized browsers, the agent navigates portals, fills out forms, and submits your tailored PDF.',
    detail: ['Headless auto-fill', 'Demographic logic', 'Anti-bot navigation']
  },
  { 
    n: '06', 
    icon: <LineChart className="h-5 w-5" />, 
    title: 'Pipeline Management', 
    desc: 'The agent reads interview requests in your inbox and automatically advances your Kanban status.',
    detail: ['Inbox sync', 'Auto Kanban updates', 'Response tracking']
  }
];

export default function HowItWorksPage() {
  return (
    <div className="flex flex-col w-full bg-background">
      
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden bg-dot-pattern border-b border-border/30">
        <div className="hero-glow absolute inset-0 pointer-events-none opacity-40" />
        
        <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-6">Engineered Automation</p>
          <h1 className="text-[3rem] md:text-[4.5rem] font-bold tracking-[-0.04em] leading-[1.05] text-foreground max-w-3xl">
            A completely autonomous<br />job search pipeline.
          </h1>
          <p className="mt-8 text-[1.125rem] leading-[1.6] text-muted-foreground max-w-xl">
            We've broken down the job search into six atomic components, 
            each handled by a specialized sub-agent working in parallel.
          </p>
        </div>
      </section>

      {/* ── STEPS GRID ─────────────────────────────────────── */}
      <section className="py-24 bg-background">
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {STEPS.map((step) => (
              <div key={step.n} className="flex flex-col group">
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-[1.5rem] font-black text-primary/20 select-none tracking-tight">{step.n}</span>
                  <div className="h-px flex-1 bg-border/40" />
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    {step.icon}
                  </div>
                </div>
                
                <h3 className="text-[1.25rem] font-bold tracking-tight text-foreground mb-4">{step.title}</h3>
                <p className="text-[0.9375rem] leading-[1.7] text-muted-foreground mb-8">
                  {step.desc}
                </p>
                
                <div className="mt-auto pt-6 border-t border-border/20">
                  <ul className="space-y-2">
                    {step.detail.map((d, i) => (
                      <li key={i} className="flex items-center gap-2 text-[0.8125rem] text-muted-foreground/70 font-medium">
                        <div className="h-1 w-1 rounded-full bg-primary/40" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ARCHITECTURE CALLOUT ───────────────────────────── */}
      <section className="py-24 bg-muted/30 border-y border-border/30 bg-dot-pattern">
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-[2rem] md:text-[2.75rem] font-bold tracking-tight leading-[1.1] text-foreground mb-6">
                Why we built a<br />headless submission engine.
              </h2>
              <p className="text-[1.0625rem] text-muted-foreground leading-relaxed mb-8">
                Standard scrapers break when they hit complex Workday or Lever portals. 
                JobAgent uses localized, headless browsers that mimic human interaction, 
                solving CAPTCHAs and screening questions in real-time.
              </p>
              <Link href="/dashboard">
                <button className="inline-flex items-center gap-2 rounded-md h-11 px-7 text-[0.875rem] font-bold uppercase tracking-wider bg-foreground text-background border border-foreground/10 shadow-[0_2px_4px_0_rgba(0,0,0,0.2)] hover:bg-foreground/90 hover:-translate-y-px active:translate-y-0 transition-all duration-150">
                  Start for free <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
            </div>
            <div className="relative aspect-video rounded-2xl border border-border/60 bg-background/50 overflow-hidden shadow-2xl backdrop-blur-sm">
              <div className="absolute inset-0 p-8 font-mono text-[11px] text-primary/70 leading-relaxed overflow-hidden">
                {`[INIT] Booting headless instance...
[OK] Session established (San Francisco, CA)
[SCAN] Navigating to greenhouse.io/stripe/senior-eng
[ANALYSIS] Job Description parsed (Score: 94.2)
[TAILOR] Rewriting 'React' bullet points...
[FORM] Filling 'Years of Experience': 6
[FORM] Filling 'GitHub URL': https://github.com/abhay
[SUBMIT] Application dispatched successfully.
[LOG] Waiting 300s before next instance...`}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section className="py-32 bg-background bg-dot-pattern">
        <div className="mx-auto max-w-7xl px-6 md:px-10 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-[2.5rem] md:text-[3.5rem] font-bold tracking-tight text-foreground mb-8">
              Hand over your search.
            </h2>
            <Link href="/dashboard">
              <button className="inline-flex items-center gap-2 rounded-md h-14 px-10 text-[1.0625rem] font-bold uppercase tracking-widest bg-foreground text-background border border-foreground/10 shadow-[0_4px_8px_0_rgba(0,0,0,0.25)] hover:bg-foreground/90 hover:-translate-y-px active:translate-y-0 transition-all duration-150">
                Deploy your agent <ArrowRight className="h-5 w-5 ml-1" />
              </button>
            </Link>
            <p className="mt-8 text-sm text-muted-foreground">Setup takes less than 2 minutes. No credit card required.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
