import { StatsCard } from '@/components/shared/StatsCard';
import { Badge } from '@/components/ui/badge';
import { Briefcase, CheckCircle, AlertCircle, TrendingUp, ArrowRight, FileText, Search, Zap, Clock, Activity } from 'lucide-react';
import { timeAgo } from '@/lib/utils/helpers';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  let stats = { total: 0, applied: 0, failed: 0, manualReview: 0, interviewing: 0, accepted: 0, successRate: 0 };
  let recentJobs: any[] = [];

  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const [statsRes, jobsRes] = await Promise.all([
      fetch(`${backendUrl}/api/applications/stats`),
      fetch(`${backendUrl}/api/jobs`)
    ]);
    if (statsRes.ok) stats = await statsRes.json();
    if (jobsRes.ok) {
      const jobs = await jobsRes.json();
      recentJobs = jobs.slice(0, 5);
    }
  } catch {}

  const pipeline = [
    { label: 'Interviewing', value: stats.interviewing, color: 'bg-violet-500', max: Math.max(stats.total, 1) },
    { label: 'Applied',      value: stats.applied,      color: 'bg-emerald-500', max: Math.max(stats.total, 1) },
    { label: 'Manual Review',value: stats.manualReview, color: 'bg-amber-400',   max: Math.max(stats.total, 1) },
    { label: 'Accepted',     value: stats.accepted,     color: 'bg-green-500',   max: Math.max(stats.total, 1) },
  ];

  const actions = [
    {
      step: '01',
      icon: FileText,
      title: 'Upload Your Resume',
      desc: 'Let the bot learn your background — parses in seconds',
      href: '/resume',
      done: false,
    },
    {
      step: '02',
      icon: Search,
      title: 'Search for Jobs',
      desc: 'Scrape live listings from LinkedIn, Indeed, and 6 more boards',
      href: '/search',
      done: recentJobs.length > 0,
    },
    {
      step: '03',
      icon: Zap,
      title: 'Enable Auto-Apply',
      desc: 'Turn on the bot in Settings — applies while you sleep',
      href: '/settings',
      done: stats.applied > 0,
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-6 md:px-8 py-8 space-y-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="text-[28px] font-bold tracking-tight leading-none">Overview</h2>
          <p className="text-[14px] text-foreground/45 mt-2">Your autonomous job agent pipeline.</p>
        </div>
        <Link
          href="/search"
          className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-foreground text-background text-[13px] font-semibold hover:bg-foreground/88 active:scale-[0.98] transition-all duration-150 shrink-0"
        >
          Find New Jobs
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard title="Hours Saved"    value={Math.floor((stats.total * 20) / 60)} subtitle="Estimated by AI"      icon={Clock}        variant="success" />
        <StatsCard title="Total Sourced"  value={stats.total}                          icon={Briefcase} />
        <StatsCard title="Auto-Applied"   value={stats.applied}   subtitle={`${stats.successRate}% success rate`}  icon={CheckCircle}  variant="success" />
        <StatsCard title="Manual Review"  value={stats.manualReview} subtitle="Attention required"  icon={AlertCircle}  variant="warning" />
      </div>

      {/* Manual review alert */}
      {stats.manualReview > 0 && (
        <Link
          href="/manual-review"
          className="flex items-center justify-between rounded-2xl border border-amber-200/70 dark:border-amber-800/50 bg-amber-50/60 dark:bg-amber-950/20 px-5 py-4 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center shrink-0">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-[14px] font-medium text-amber-800 dark:text-amber-300">
              {stats.manualReview} application{stats.manualReview !== 1 ? 's' : ''} need your attention
            </span>
          </div>
          <ArrowRight className="h-4 w-4 text-amber-500 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      )}

      {/* Two-column: Pipeline + Live feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Pipeline */}
        <div>
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="h-4 w-4 text-foreground/40" />
            <h3 className="text-[14px] font-semibold text-foreground/70">Pipeline</h3>
          </div>
          <div className="space-y-4">
            {pipeline.map(({ label, value, color, max }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[13px] font-medium text-foreground/65">{label}</span>
                  <span className="text-[14px] font-bold text-foreground">{value}</span>
                </div>
                <div className="h-1.5 rounded-full bg-border/40 overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-700', color)}
                    style={{ width: max > 0 ? `${Math.min((value / max) * 100, 100)}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live ops feed */}
        <div>
          <div className="flex items-center gap-2 mb-5">
            <Activity className="h-4 w-4 text-foreground/40" />
            <h3 className="text-[14px] font-semibold text-foreground/70">Live Operations</h3>
          </div>
          {recentJobs.length === 0 ? (
            <p className="text-[13px] text-foreground/40 py-4">System idle. Start a search to begin operations.</p>
          ) : (
            <div className="space-y-2.5">
              {recentJobs.map((job: any) => (
                <div key={job.id} className="flex items-start gap-3 rounded-xl px-3.5 py-3 bg-muted/40 hover:bg-muted/60 transition-colors">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0 animate-pulse" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium leading-snug text-foreground/80">
                      {job.title} <span className="text-foreground/45 font-normal">at {job.company}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-[10px] uppercase tracking-wide font-medium">{job.source}</Badge>
                      <span className="text-[11px] text-foreground/35">{timeAgo(job.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Getting started / Quick actions */}
      <div>
        <h3 className="text-[14px] font-semibold text-foreground/70 mb-5">
          {stats.total === 0 ? 'Get started — 3 steps' : 'Quick actions'}
        </h3>
        <div className="space-y-2">
          {actions.map(({ step, icon: Icon, title, desc, href, done }) => (
            <Link
              key={step}
              href={href}
              className={cn(
                'group flex items-center gap-5 rounded-2xl border px-5 py-4 transition-all duration-150',
                done
                  ? 'border-emerald-200/60 dark:border-emerald-800/40 bg-emerald-50/40 dark:bg-emerald-950/15'
                  : 'border-border/50 bg-card hover:border-foreground/20 hover:bg-muted/30'
              )}
            >
              <div className={cn(
                'h-10 w-10 rounded-xl flex items-center justify-center shrink-0 text-[12px] font-bold transition-colors',
                done ? 'bg-emerald-500 text-white' : 'bg-muted text-foreground/50 group-hover:bg-foreground/8'
              )}>
                {done ? <CheckCircle className="h-4.5 w-4.5" /> : <Icon className="h-4.5 w-4.5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-foreground/85 leading-none">{title}</p>
                <p className="text-[13px] text-foreground/45 mt-1 font-normal leading-relaxed">{desc}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {done && <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Done</span>}
                <ArrowRight className={cn('h-4 w-4 transition-transform group-hover:translate-x-0.5', done ? 'text-emerald-500' : 'text-foreground/30')} />
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
