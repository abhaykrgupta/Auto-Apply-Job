'use client';

import { motion } from 'framer-motion';
import { Target, Search, FileSignature, CheckCircle2, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ResumeAIPage() {
  const FADE_UP = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-100px" }
  };

  return (
    <div className="flex flex-col w-full overflow-hidden">
      <section className="pt-24 pb-16 md:pt-32 md:pb-24 bg-background text-center">
        <div className="container mx-auto max-w-4xl px-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-8"
          >
            <Bot className="h-4 w-4" /> 100% ATS Compatibility
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6"
          >
            The perfect resume.<br/>For every single application.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            JobAgent doesn't just parse your resume. It actively rewrites your bullet points to semantically match the exact requirements of each job posting.
          </motion.p>
        </div>
      </section>

      {/* Before / After Showcase */}
      <section className="py-24 bg-muted/10 border-y border-border/40">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            <motion.div {...FADE_UP} className="rounded-3xl border border-border bg-card p-8 flex flex-col relative opacity-80 grayscale-[30%]">
              <div className="absolute top-4 right-6 text-xs font-bold uppercase tracking-widest text-muted-foreground">Original</div>
              <h3 className="font-semibold mb-6">Software Engineer</h3>
              <ul className="space-y-4">
                <li className="text-sm text-muted-foreground flex gap-3">
                  <span className="text-destructive font-bold mt-0.5">×</span>
                  Built a web application using React and Node.js that improved performance.
                </li>
                <li className="text-sm text-muted-foreground flex gap-3">
                  <span className="text-destructive font-bold mt-0.5">×</span>
                  Managed a team of 3 developers to deliver projects on time.
                </li>
              </ul>
              <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
                <span className="text-sm font-semibold">ATS Match Score</span>
                <span className="text-sm font-bold text-destructive">42%</span>
              </div>
            </motion.div>

            <motion.div {...FADE_UP} transition={{ delay: 0.1 }} className="rounded-3xl border-2 border-primary bg-card p-8 flex flex-col relative shadow-2xl shadow-primary/10">
              <div className="absolute top-4 right-6 text-xs font-bold uppercase tracking-widest text-primary">Tailored by AI</div>
              <h3 className="font-semibold mb-6 text-foreground">Senior Frontend Engineer</h3>
              <ul className="space-y-4">
                <li className="text-sm text-foreground font-medium flex gap-3">
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                  Architected a highly scalable SPA utilizing React.js and Next.js, optimizing Core Web Vitals and reducing TTI by 40%.
                </li>
                <li className="text-sm text-foreground font-medium flex gap-3">
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                  Led agile development lifecycle for 3 engineers, successfully deploying the TypeScript microservices architecture under strict deadlines.
                </li>
              </ul>
              <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
                <span className="text-sm font-semibold">ATS Match Score</span>
                <span className="text-sm font-bold text-green-500">98%</span>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      <section className="py-24 bg-background">
        <div className="container mx-auto max-w-6xl px-4 grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            { icon: <Target className="h-6 w-6 text-primary" />, title: 'Semantic Keyword Matching', desc: 'Identifies core competencies required by the JD and seamlessly weaves them into your existing experience.' },
            { icon: <Search className="h-6 w-6 text-purple-500" />, title: 'Recruiter Readability', desc: 'Maintains a human, highly professional tone. No robotic keyword stuffing. Just clean, metric-driven impact.' },
            { icon: <FileSignature className="h-6 w-6 text-amber-500" />, title: 'Pixel-Perfect PDF Generation', desc: 'Outputs standard ATS-friendly PDF templates that parse flawlessly in Workday, Greenhouse, and Lever.' },
          ].map((feat, i) => (
            <motion.div key={i} {...FADE_UP} transition={{ delay: i * 0.1 }} className="text-center md:text-left">
              <div className="mx-auto md:mx-0 h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center mb-6">
                {feat.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{feat.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="py-24 bg-muted/10 border-t border-border/40 text-center">
        <div className="container mx-auto max-w-3xl px-4">
          <h2 className="text-3xl font-bold tracking-tight mb-6">See the AI in action.</h2>
          <Link href="/dashboard">
            <Button size="lg" className="h-12 px-8">Test the Resume Builder</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
