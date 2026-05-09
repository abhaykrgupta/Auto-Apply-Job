import { cn } from '@/lib/utils';

import { Bot } from 'lucide-react';

interface LoadingSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  fullPage?: boolean;
}

export function LoadingSpinner({ className, size = 'md', fullPage = true }: LoadingSpinnerProps) {
  const sizeClasses = { sm: 'h-4 w-4 border-2', md: 'h-8 w-8 border-[3px]', lg: 'h-12 w-12 border-[3px]' };

  if (fullPage) {
    return (
      <div className="flex h-full min-h-[400px] w-full flex-col items-center justify-center gap-6">
        <div className="relative flex items-center justify-center">
          {/* Outer spinning rings */}
          <div className="absolute h-20 w-20 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <div className="absolute h-16 w-16 rounded-full border-2 border-transparent border-b-primary/50 border-r-primary/50 animate-[spin_1.5s_linear_infinite_reverse]" />
          {/* Inner pulsing icon */}
          <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30">
            <Bot className="h-6 w-6 text-primary-foreground animate-pulse" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="text-sm font-medium tracking-wide text-foreground">
            Job Agent AI
          </p>
          <p className="text-xs text-muted-foreground animate-pulse">
            Processing...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <div className={cn("absolute inset-0 rounded-full border-primary/20", sizeClasses[size])} />
      <div className={cn("rounded-full border-primary border-t-transparent animate-spin", sizeClasses[size])} />
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-3 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="h-3 bg-muted rounded-full w-1/3" />
          <div className="h-8 bg-muted rounded-full w-1/2" />
          <div className="h-3 bg-muted rounded-full w-1/4" />
        </div>
        <div className="h-10 w-10 bg-muted rounded-xl" />
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-6 py-4 border-b border-border animate-pulse">
      <div className="h-4 bg-muted rounded-full flex-1" />
      <div className="h-4 bg-muted rounded-full w-24" />
      <div className="h-4 bg-muted rounded-full w-20" />
      <div className="h-6 bg-muted rounded-full w-16" />
    </div>
  );
}
