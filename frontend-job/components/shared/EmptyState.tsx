import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-20 text-center px-6', className)}>
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/70">
        <Icon className="h-6 w-6 text-foreground/35" />
      </div>
      <h3 className="text-[16px] font-semibold text-foreground tracking-tight">{title}</h3>
      <p className="mt-2 max-w-[280px] text-[13px] text-foreground/45 leading-relaxed font-normal">{description}</p>
      {action && <div className="mt-7">{action}</div>}
    </div>
  );
}
