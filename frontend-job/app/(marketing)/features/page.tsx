'use client';

import { motion } from 'framer-motion';
import { 
  FileText, Search, Zap, LineChart, BrainCircuit, ShieldCheck 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function FeaturesPage() {
  const FADE_UP = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-100px" }
  };

  const features = [
    {
      id: 'ai-matching',
      icon: <Search className="h-6 w-6 text-purple-500" />,
      title: 'AI Job Matching',
      desc: 'Our AI scans LinkedIn, Indeed, and greenhouse boards 24/7. It understands your background and only queues jobs that match your strict salary, location, and seniority parameters.',
      align: 'left'
    },
    {
      id: 'resume-tailoring',
      icon: <FileText className="h-6 w-6 text-primary" />,
      title: 'Resume Tailoring & ATS Optimization',
      desc: 'Never submit a generic resume again. For every single application, JobAgent rewrites your bullet points to semantically match the job description, ensuring a 90%+ ATS score without keyword stuffing.',
      align: 'right'
    },
    {
      id: 'auto-apply',
      icon: <Zap className="h-6 w-6 text-green-500" />,
      title: 'Zero-Click Auto Apply',
      desc: 'Headless Chrome instances navigate complex Workday and Lever portals. The AI answers screening questions (e.g., "Do you require sponsorship?") using your predefined profile data.',
      align: 'left'
    },
    {
      id: 'tracking',
      icon: <LineChart className="h-6 w-6 text-amber-500" />,
      title: 'Autonomous Application Tracking',
      desc: 'Connect your Gmail. JobAgent automatically detects interview requests and rejections, updating your Kanban board in real-time so you always know your funnel metrics.',
      align: 'right'
    }
  ];

  return (
    <div className="flex flex-col w-full overflow-hidden">
      <section className="pt-24 pb-16 md:pt-32 md:pb-24 bg-background text-center">
        <div className="container mx-auto max-w-4xl px-4">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6"
          >
            The engine behind your next offer.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            JobAgent replaces 4 separate tools with one autonomous intelligence layer that runs your entire job search.
          </motion.p>
        </div>
      </section>

      <section className="py-24 bg-muted/10">
        <div className="container mx-auto max-w-6xl px-4 md:px-8 space-y-32">
          {features.map((feat, i) => (
            <div key={feat.id} className={`flex flex-col gap-12 lg:gap-24 items-center ${feat.align === 'right' ? 'lg:flex-row-reverse' : 'lg:flex-row'}`}>
              
              <motion.div {...FADE_UP} className="flex-1 space-y-6">
                <div className="h-12 w-12 rounded-xl bg-background border border-border shadow-sm flex items-center justify-center">
                  {feat.icon}
                </div>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{feat.title}</h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {feat.desc}
                </p>
                <ul className="space-y-3 pt-4">
                  {[1, 2, 3].map(j => (
                    <li key={j} className="flex items-center gap-3 text-sm font-medium">
                      <ShieldCheck className="h-4 w-4 text-primary" /> Enterprise-grade reliability
                    </li>
                  ))}
                </ul>
              </motion.div>
              
              <motion.div {...FADE_UP} transition={{ delay: 0.2 }} className="flex-1 w-full relative">
                <div className="aspect-[4/3] rounded-2xl border border-border/50 bg-background/50 backdrop-blur shadow-2xl p-6 flex flex-col relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Mock UI lines */}
                  <div className="flex gap-2 mb-6">
                    <div className="h-3 w-3 rounded-full bg-border" />
                    <div className="h-3 w-3 rounded-full bg-border" />
                    <div className="h-3 w-3 rounded-full bg-border" />
                  </div>
                  <div className="space-y-4 flex-1">
                    <div className="h-8 w-3/4 bg-muted rounded-md" />
                    <div className="h-24 w-full bg-muted/50 rounded-md" />
                    <div className="h-8 w-1/2 bg-muted/30 rounded-md" />
                  </div>
                  
                  <div className="absolute bottom-6 right-6 px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-full shadow-lg flex items-center gap-2">
                    <BrainCircuit className="h-3 w-3 animate-pulse" /> Active
                  </div>
                </div>
              </motion.div>

            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-background text-center border-t border-border/40">
        <div className="container mx-auto max-w-4xl px-4">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">Experience the automation.</h2>
          <Link href="/dashboard">
            <Button size="lg" className="h-12 px-8 text-base">Get Started Now</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
