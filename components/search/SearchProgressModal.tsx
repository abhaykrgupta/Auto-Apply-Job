'use client';

import { useState, useEffect } from 'react';
import { Bot, Search, Zap, Globe, Shield, Database, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { icon: Globe, text: 'Connecting to global job networks...', subtext: 'Establishing secure proxy connections' },
  { icon: Shield, text: 'Bypassing anti-bot protections...', subtext: 'Using stealth browser fingerprints' },
  { icon: Search, text: 'Scanning Indeed & LinkedIn...', subtext: 'Filtering by your specific role and location' },
  { icon: Database, text: 'Extracting role requirements...', subtext: 'Parsing job descriptions with AI' },
  { icon: Bot, text: 'Matching with your profile...', subtext: 'Calculating compatibility scores' },
  { icon: Zap, text: 'Finalizing search results...', subtext: 'Almost there!' },
];

export function SearchProgressModal({ isOpen }: { isOpen: boolean }) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 3500);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md transition-all duration-500 animate-in fade-in">
      <div className="relative w-full max-w-lg p-8 text-center space-y-8">
        {/* Radar Animation */}
        <div className="relative mx-auto w-48 h-48">
          {/* Outer ripples */}
          <div className="absolute inset-0 rounded-full border border-primary/20 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]" />
          <div className="absolute inset-4 rounded-full border border-primary/30 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_1s_infinite]" />
          <div className="absolute inset-8 rounded-full border border-primary/40 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_2s_infinite]" />
          
          {/* Main radar circle */}
          <div className="absolute inset-0 rounded-full bg-primary/5 border-2 border-primary/20 overflow-hidden">
            {/* Spinning sweep */}
            <div className="absolute top-1/2 left-1/2 w-[200%] h-[200%] -translate-x-1/2 -translate-y-1/2 bg-gradient-to-tr from-primary/30 via-transparent to-transparent animate-[spin_4s_linear_infinite]" />
            
            {/* Scanning dots */}
            <div className="absolute top-1/4 left-1/3 w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" />
            <div className="absolute top-2/3 left-1/2 w-2 h-2 rounded-full bg-primary/60 animate-pulse delay-700" />
            <div className="absolute top-1/2 left-3/4 w-1 h-1 rounded-full bg-primary/30 animate-pulse delay-300" />
          </div>

          {/* Central Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary shadow-[0_0_30px_-5px_rgba(var(--primary),0.5)]">
              <Search className="h-8 w-8 text-primary-foreground animate-pulse" />
            </div>
          </div>
        </div>

        {/* Text Status */}
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-primary">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs font-bold uppercase tracking-widest">Active Search in Progress</span>
            </div>
            <h3 className="text-2xl font-bold tracking-tight transition-all duration-500">
              {STEPS[currentStep].text}
            </h3>
            <p className="text-sm text-muted-foreground transition-all duration-500">
              {STEPS[currentStep].subtext}
            </p>
          </div>

          {/* Step Indicators */}
          <div className="flex justify-center gap-1.5 pt-2">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-500",
                  i === currentStep ? "w-8 bg-primary" : i < currentStep ? "w-2 bg-primary/40" : "w-2 bg-muted"
                )}
              />
            ))}
          </div>
        </div>

        {/* Dynamic Background Elements */}
        <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-md blur-[120px] opacity-20">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary via-blue-500 to-purple-500 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
