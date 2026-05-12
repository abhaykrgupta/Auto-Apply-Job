'use client';

import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { CheckCircle2, X } from 'lucide-react';
import Link from 'next/link';

export default function PricingPage() {
  const FADE_UP = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true }
  };

  return (
    <div className="flex flex-col w-full">
      {/* ── HEADER ── */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-24 bg-muted/10 border-b border-border/40 text-center">
        <div className="container mx-auto max-w-4xl px-4">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6"
          >
            Simple, transparent pricing.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-muted-foreground"
          >
            Invest in your career. Let the AI do the heavy lifting.
          </motion.p>
        </div>
      </section>

      {/* ── PRICING CARDS ── */}
      <section className="py-24 bg-background">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            
            {/* Free Tier */}
            <motion.div {...FADE_UP} className="rounded-3xl border border-border bg-card p-8 md:p-10 flex flex-col">
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-2">Starter</h3>
                <p className="text-muted-foreground">Perfect for passive job seekers.</p>
                <div className="mt-6 flex items-baseline text-5xl font-extrabold">
                  $0<span className="text-xl font-medium text-muted-foreground ml-2">/mo</span>
                </div>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {['10 AI auto-applications per month', 'Basic resume parsing', 'Standard ATS scoring', 'Manual job tracking'].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-muted-foreground shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href="/login">
                <Button variant="outline" className="w-full h-12 text-base font-medium">Get Started</Button>
              </Link>
            </motion.div>

            {/* Pro Tier */}
            <motion.div {...FADE_UP} transition={{ delay: 0.1 }} className="rounded-3xl border-2 border-primary bg-card p-8 md:p-10 flex flex-col relative shadow-2xl shadow-primary/10 scale-100 md:scale-105">
              <div className="absolute top-0 right-8 -translate-y-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                Most Popular
              </div>
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-2 text-primary">Pro Agent</h3>
                <p className="text-muted-foreground">For serious candidates actively interviewing.</p>
                <div className="mt-6 flex items-baseline text-5xl font-extrabold">
                  $29<span className="text-xl font-medium text-muted-foreground ml-2">/mo</span>
                </div>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {['Unlimited AI auto-applications', 'Advanced Resume Tailoring (Bypass ATS)', 'Zero-click auto apply', 'Email inbox synchronization', 'Priority headless browser queues'].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    <span className="font-medium">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href="/dashboard">
                <Button className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 shadow-md">
                  Upgrade to Pro
                </Button>
              </Link>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── FEATURE COMPARISON ── */}
      <section className="py-24 bg-muted/10 border-t border-border/40">
        <div className="container mx-auto max-w-4xl px-4">
          <h2 className="text-3xl font-bold tracking-tight text-center mb-16">Compare features</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-4 px-4 font-semibold w-1/2">Features</th>
                  <th className="py-4 px-4 font-semibold text-center w-1/4">Starter</th>
                  <th className="py-4 px-4 font-semibold text-center w-1/4 text-primary">Pro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { name: 'Monthly Applications', free: '10', pro: 'Unlimited' },
                  { name: 'AI Resume Tailoring', free: false, pro: true },
                  { name: 'Universal Job Discovery', free: true, pro: true },
                  { name: 'Workday/Greenhouse Bypass', free: false, pro: true },
                  { name: 'Email Inbox Sync', free: false, pro: true },
                  { name: 'Dashboard Analytics', free: 'Basic', pro: 'Advanced' },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-4 text-sm font-medium">{row.name}</td>
                    <td className="py-4 px-4 text-center">
                      {typeof row.free === 'boolean' 
                        ? (row.free ? <CheckCircle2 className="h-4 w-4 mx-auto text-muted-foreground" /> : <X className="h-4 w-4 mx-auto text-muted-foreground/30" />) 
                        : <span className="text-sm text-muted-foreground">{row.free}</span>}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {typeof row.pro === 'boolean' 
                        ? (row.pro ? <CheckCircle2 className="h-4 w-4 mx-auto text-primary" /> : <X className="h-4 w-4 mx-auto text-muted-foreground/30" />) 
                        : <span className="text-sm font-semibold text-primary">{row.pro}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
