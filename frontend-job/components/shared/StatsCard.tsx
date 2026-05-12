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
  default:  { icon: 'bg-primary/10 text-primary',                                                        trend: 'text-primary' },
  success:  { icon: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',      trend: 'text-emerald-600 dark:text-emerald-400' },
  warning:  { icon: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',              trend: 'text-amber-600 dark:text-amber-400' },
  error:    { icon: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',                     trend: 'text-red-600 dark:text-red-400' },
};

export function StatsCard({ title, value, subtitle, trend, icon: Icon, variant = 'default' }: StatsCardProps) {
  const cfg = variantConfig[variant];
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/50 bg-card px-5 py-5 hover:border-border/80 transition-colors duration-200">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-foreground/55 truncate">{title}</p>
        <div className={cn('rounded-xl p-2', cfg.icon)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div>
        <p className="text-[32px] font-bold tracking-tight leading-none text-foreground">{value}</p>
        {subtitle && <p className="mt-1.5 text-[12px] text-foreground/45 font-normal">{subtitle}</p>}
        {trend && <p className={cn('mt-1.5 text-[12px] font-semibold', cfg.trend)}>{trend}</p>}
      </div>
    </div>
  );
}
