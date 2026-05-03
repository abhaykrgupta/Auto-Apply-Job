import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  trend?: string;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'error';
}

const variantConfig = {
  default:  { icon: 'bg-primary/10 text-primary', trend: 'text-primary' },
  success:  { icon: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',  trend: 'text-green-600 dark:text-green-400' },
  warning:  { icon: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400', trend: 'text-yellow-600 dark:text-yellow-400' },
  error:    { icon: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',    trend: 'text-red-600 dark:text-red-400' },
};

export function StatsCard({ title, value, subtitle, trend, icon: Icon, variant = 'default' }: StatsCardProps) {
  const cfg = variantConfig[variant];

  return (
    <div className="rounded-xl border border-border bg-card p-4 md:p-6 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
          <p className="mt-2 text-2xl md:text-3xl font-bold tracking-tight text-foreground">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <p className={cn('mt-1 text-xs font-semibold', cfg.trend)}>{trend}</p>
          )}
        </div>
        <div className={cn('shrink-0 rounded-xl p-2.5', cfg.icon)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
