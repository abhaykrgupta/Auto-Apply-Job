import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  fullPage?: boolean;
}

export function LoadingSpinner({ className, size = 'md', fullPage = true }: LoadingSpinnerProps) {
  const sizeClasses = { sm: 'h-4 w-4 border-2', md: 'h-8 w-8 border-2', lg: 'h-12 w-12 border-3' };

  const spinner = (
    <div className={cn(
      'rounded-full border-muted border-t-primary animate-spin',
      sizeClasses[size],
      className
    )} />
  );

  if (!fullPage) return spinner;

  return (
    <div className="flex h-full min-h-[400px] items-center justify-center w-full">
      <div className="flex flex-col items-center gap-3">
        {spinner}
        <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>
      </div>
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
