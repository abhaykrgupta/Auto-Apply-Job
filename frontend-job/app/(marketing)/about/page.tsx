'use client';

import { Bot, Target, Shield, Heart, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="flex flex-col w-full bg-background">
      
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden bg-dot-pattern border-b border-border/30">
        <div className="hero-glow absolute inset-0 pointer-events-none opacity-40" />
        
        <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-6">Our Mission</p>
          <h1 className="text-[3rem] md:text-[4.5rem] font-bold tracking-[-0.04em] leading-[1.05] text-foreground max-w-3xl">
            Building the infrastructure<br />for the modern job search.
          </h1>
          <p className="mt-8 text-[1.125rem] leading-[1.6] text-muted-foreground max-w-xl">
            We believe that finding a job should be about your talent and potential, 
            not your ability to navigate repetitive forms and broken application portals.
          </p>
        </div>
      </section>

      {/* ── THE PROBLEM ─────────────────────────────────────── */}
      <section className="py-24 bg-background">
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-20 items-start">
            <div>
              <h2 className="text-[2rem] font-bold tracking-tight mb-8">The search is broken.</h2>
              <p className="text-[1.0625rem] text-muted-foreground leading-relaxed mb-6">
                In 2024, the average job seeker spends over 20 hours a week on manual applications. 
                Most of that time is wasted re-typing information into inconsistent ATS portals.
              </p>
              <p className="text-[1.0625rem] text-muted-foreground leading-relaxed">
                JobAgent was founded to reclaim that time. We've built an autonomous system that 
                handles the busywork, so you can focus on what actually matters: the interview.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { icon: <Target className="h-5 w-5 text-emerald-500" />, title: 'Mission-Led', desc: 'Our goal is to automate 1 billion applications by 2026.' },
                { icon: <Shield className="h-5 w-5 text-primary" />, title: 'Privacy-First', desc: 'Your data is vectorized and encrypted. We never sell your history.' },
                { icon: <Heart className="h-5 w-5 text-rose-500" />, title: 'User-Centric', desc: 'Built by engineers who were tired of the "black hole" of job apps.' },
                { icon: <Bot className="h-5 w-5 text-amber-500" />, title: 'Agentic Future', desc: 'We are pioneering the use of headless AI for career navigation.' },
              ].map((v, i) => (
                <div key={i} className="p-6 rounded-xl border border-border/40 bg-muted/20">
                  <div className="mb-4 h-9 w-9 rounded-lg bg-background flex items-center justify-center shadow-sm">
                    {v.icon}
                  </div>
                  <h3 className="font-bold mb-2">{v.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── VALUES ─────────────────────────────────────────── */}
      <section className="py-24 bg-muted/30 border-y border-border/30 bg-dot-pattern">
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-[2.25rem] font-bold tracking-tight mb-6">Built for the long term.</h2>
            <p className="text-muted-foreground">
              We aren't just building a tool; we're building a new way to interact 
              with the labor market.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { label: 'Integrity', val: 'No shortcuts. We build real browsers that follow site rules.' },
              { label: 'Transparency', val: 'You see exactly what the agent sees. Every log is public to you.' },
              { label: 'Innovation', val: 'Applying AI where it actually solves a human time problem.' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <h4 className="text-[0.8125rem] font-bold uppercase tracking-widest text-primary mb-4">{item.label}</h4>
                <p className="text-[1.0625rem] font-medium text-foreground leading-snug">{item.val}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section className="py-32 bg-background bg-dot-pattern">
        <div className="mx-auto max-w-7xl px-6 md:px-10 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-[2.5rem] md:text-[3.5rem] font-bold tracking-tight text-foreground mb-8">
              Join the future of work.
            </h2>
            <Link href="/dashboard">
              <button className="inline-flex items-center gap-2 rounded-md h-14 px-10 text-[1.0625rem] font-bold uppercase tracking-widest bg-foreground text-background border border-foreground/10 shadow-[0_4px_8px_0_rgba(0,0,0,0.25)] hover:bg-foreground/90 hover:-translate-y-px active:translate-y-0 transition-all duration-150">
                Start your journey <ArrowRight className="h-5 w-5 ml-1" />
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
