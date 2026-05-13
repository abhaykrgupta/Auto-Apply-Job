import {
  Briefcase, CheckCircle, AlertCircle, TrendingUp, ArrowRight,
  FileText, Search, Zap, Activity, XCircle,
  Sparkles, Trophy, Bot,
} from 'lucide-react';
import { timeAgo } from '@/lib/utils/helpers';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { applications, jobs, resumes, profile } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default async function DashboardPage() {
  const session   = await auth();
  const userId    = session?.user?.id;
  const firstName = session?.user?.name?.split(' ')[0] ?? 'there';

  let stats = {
    total: 0, applied: 0, failed: 0, manualReview: 0,
    interviewing: 0, accepted: 0, pending: 0, successRate: 0,
  };
  let recentJobs: any[] = [];
  let hasResume = false;

  if (userId) {
    const [userProfile] = await db.select().from(profile).where(eq(profile.userId, userId)).limit(1);

    if (userProfile) {
      const [resume] = await db
        .select({ id: resumes.id })
        .from(resumes)
        .where(eq(resumes.profileId, userProfile.id))
        .limit(1);
      hasResume = !!resume;

      if (resume) {
        const appRows = await db.select().from(applications).where(eq(applications.resumeId, resume.id));
        stats.total        = appRows.length;
        stats.applied      = appRows.filter(a => a.status === 'applied').length;
        stats.failed       = appRows.filter(a => a.status === 'failed').length;
        stats.manualReview = appRows.filter(a => a.status === 'manual_review').length;
        stats.interviewing = appRows.filter(a => a.status === 'interviewing').length;
        stats.accepted     = appRows.filter(a => a.status === 'accepted').length;
        stats.pending      = appRows.filter(a => a.status === 'pending').length;
        stats.successRate  = stats.total > 0 ? Math.round((stats.applied / stats.total) * 100) : 0;
      }
    }

    recentJobs = await db.select().from(jobs).orderBy(desc(jobs.createdAt)).limit(6);
  }

  const isNewUser = stats.total === 0 && !hasResume;

  const pipeline = [
    { label: 'Applied',       value: stats.applied,       dot: 'bg-emerald-500', bar: 'bg-emerald-500/80' },
    { label: 'Interviewing',  value: stats.interviewing,  dot: 'bg-violet-500',  bar: 'bg-violet-500/80'  },
    { label: 'Accepted',      value: stats.accepted,      dot: 'bg-green-500',   bar: 'bg-green-500/80'   },
    { label: 'Manual Review', value: stats.manualReview,  dot: 'bg-amber-500',   bar: 'bg-amber-500/80'   },
    { label: 'Failed',        value: stats.failed,        dot: 'bg-red-400',     bar: 'bg-red-400/70'     },
    { label: 'Pending',       value: stats.pending,       dot: 'bg-foreground/25', bar: 'bg-foreground/15' },
  ];

  const actions = [
    {
      step: '01',
      icon: FileText,
      title: 'Upload Resume',
      desc: 'The agent learns your background and parses it in seconds',
      href: '/resume',
      done: hasResume,
    },
    {
      step: '02',
      icon: Search,
      title: 'Discover Jobs',
      desc: 'Scrape live listings from YC, Wellfound, Greenhouse and 10+ boards',
      href: '/search',
      done: recentJobs.length > 0,
    },
    {
      step: '03',
      icon: Zap,
      title: 'Enable Auto-Apply',
      desc: 'Turn on the agent in Settings — it applies while you sleep',
      href: '/settings',
      done: stats.applied > 0,
    },
  ];

  const SOURCE_COLORS: Record<string, string> = {
    greenhouse:      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    lever:           'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    ashby:           'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
    workday:         'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    linkedin:        'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
    indeed:          'bg-blue-100 text-blue-700',
    custom:          'bg-muted text-foreground/55',
  };

  return (
    <div className="mx-auto max-w-5xl px-6 md:px-8 py-8 space-y-7">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold text-foreground/60 uppercase tracking-[0.14em] mb-1.5">
            {getGreeting()}
          </p>
          <h1 className="text-[26px] font-bold tracking-tight text-foreground leading-none">
            {firstName}&apos;s Overview
          </h1>
          <p className="text-[13px] text-foreground/50 mt-1.5 font-normal">
            {isNewUser
              ? 'Complete 3 quick steps to activate your job agent.'
              : `${stats.total} application${stats.total !== 1 ? 's' : ''} tracked · ${stats.successRate}% success rate`}
          </p>
        </div>
        <Link
          href="/search"
          className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-foreground text-background text-[13px] font-semibold hover:bg-foreground/85 active:scale-[0.98] transition-all duration-150 shrink-0 self-start sm:self-auto shadow-sm"
        >
          <Search className="h-3.5 w-3.5" />
          Find Jobs
        </Link>
      </div>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

        {/* Total Applied */}
        <div className="rounded-xl border border-border bg-card px-4 py-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-foreground/65 uppercase tracking-[0.1em]">Total</span>
            <div className="h-7 w-7 rounded-lg bg-foreground/6 flex items-center justify-center">
              <Briefcase className="h-3.5 w-3.5 text-foreground/50" />
            </div>
          </div>
          <p className="text-[28px] font-bold tracking-tight text-foreground leading-none">{stats.total}</p>
          <p className="text-[11px] text-foreground/60 mt-1.5 font-medium">applications sent</p>
        </div>

        {/* Auto-Applied */}
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/20 px-4 py-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-emerald-700/60 dark:text-emerald-400/60 uppercase tracking-[0.1em]">Applied</span>
            <div className="h-7 w-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <p className="text-[28px] font-bold tracking-tight text-emerald-700 dark:text-emerald-300 leading-none">{stats.applied}</p>
          <p className="text-[11px] text-emerald-600/60 dark:text-emerald-400/50 mt-1.5 font-medium">auto-submitted</p>
        </div>

        {/* Interviews */}
        <div className="rounded-xl border border-violet-200 dark:border-violet-800/50 bg-violet-50 dark:bg-violet-950/20 px-4 py-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-violet-700/60 dark:text-violet-400/60 uppercase tracking-[0.1em]">Interviews</span>
            <div className="h-7 w-7 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
              <Trophy className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
            </div>
          </div>
          <p className="text-[28px] font-bold tracking-tight text-violet-700 dark:text-violet-300 leading-none">{stats.interviewing}</p>
          <p className="text-[11px] text-violet-600/60 dark:text-violet-400/50 mt-1.5 font-medium">
            {stats.accepted > 0 ? `${stats.accepted} accepted` : 'in progress'}
          </p>
        </div>

        {/* Manual Review */}
        <div className={cn(
          'rounded-xl border px-4 py-4 shadow-sm transition-colors',
          stats.manualReview > 0
            ? 'border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/20'
            : 'border-border bg-card'
        )}>
          <div className="flex items-center justify-between mb-3">
            <span className={cn(
              'text-[11px] font-bold uppercase tracking-[0.1em]',
              stats.manualReview > 0 ? 'text-amber-700/60 dark:text-amber-400/60' : 'text-foreground/65'
            )}>
              Review
            </span>
            <div className={cn(
              'h-7 w-7 rounded-lg flex items-center justify-center',
              stats.manualReview > 0 ? 'bg-amber-100 dark:bg-amber-900/40' : 'bg-foreground/6'
            )}>
              <AlertCircle className={cn(
                'h-3.5 w-3.5',
                stats.manualReview > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground/65'
              )} />
            </div>
          </div>
          <p className={cn(
            'text-[28px] font-bold tracking-tight leading-none',
            stats.manualReview > 0 ? 'text-amber-700 dark:text-amber-300' : 'text-foreground'
          )}>
            {stats.manualReview}
          </p>
          <p className={cn(
            'text-[11px] mt-1.5 font-medium',
            stats.manualReview > 0 ? 'text-amber-600/60 dark:text-amber-400/50' : 'text-foreground/60'
          )}>
            need attention
          </p>
        </div>
      </div>

      {/* ── Alert banner ── */}
      {stats.manualReview > 0 && (
        <Link
          href="/manual-review"
          className="flex items-center justify-between rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/15 px-4 py-3 hover:bg-amber-100/60 dark:hover:bg-amber-950/25 transition-colors group shadow-sm"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
            <span className="text-[13px] font-semibold text-amber-800 dark:text-amber-300">
              {stats.manualReview} application{stats.manualReview !== 1 ? 's' : ''} waiting for your review
            </span>
          </div>
          <ArrowRight className="h-4 w-4 text-amber-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
        </Link>
      )}

      {/* ── Pipeline + Latest Jobs ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Pipeline */}
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
            <TrendingUp className="h-3.5 w-3.5 text-foreground/60" />
            <h3 className="text-[12px] font-bold text-foreground/55 uppercase tracking-[0.1em]">Pipeline</h3>
          </div>

          <div className="px-5 py-4">
            {stats.total === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center mb-3">
                  <Bot className="h-5 w-5 text-foreground/25" />
                </div>
                <p className="text-[13px] font-medium text-foreground/50">No applications yet</p>
                <p className="text-[12px] text-foreground/55 mt-1">Enable auto-apply to start tracking</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {pipeline
                  .filter(p => p.value > 0 || p.label === 'Applied')
                  .map(({ label, value, dot, bar }) => (
                    <div key={label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={cn('h-2 w-2 rounded-full shrink-0', dot)} />
                          <span className="text-[13px] font-medium text-foreground/65">{label}</span>
                        </div>
                        <span className="text-[13px] font-bold tabular-nums text-foreground">{value}</span>
                      </div>
                      <div className="h-[5px] rounded-full bg-border overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all duration-700', bar)}
                          style={{ width: stats.total > 0 ? `${Math.min((value / stats.total) * 100, 100)}%` : '0%' }}
                        />
                      </div>
                    </div>
                  ))
                }
                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <span className="text-[12px] font-medium text-foreground/65">{stats.total} total</span>
                  <span className="text-[12px] font-bold text-emerald-600 dark:text-emerald-400">{stats.successRate}% success</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Latest Jobs */}
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-foreground/60" />
              <h3 className="text-[12px] font-bold text-foreground/55 uppercase tracking-[0.1em]">Latest Jobs</h3>
            </div>
            <Link href="/jobs" className="text-[12px] font-semibold text-foreground/60 hover:text-primary transition-colors">
              View all →
            </Link>
          </div>

          <div className="px-3 py-3">
            {recentJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center mb-3">
                  <Search className="h-5 w-5 text-foreground/25" />
                </div>
                <p className="text-[13px] font-medium text-foreground/50">No jobs discovered yet</p>
                <p className="text-[12px] text-foreground/55 mt-1">Run a search to populate listings</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {recentJobs.map((job: any) => (
                  <div
                    key={job.id}
                    className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-muted/60 transition-colors"
                  >
                    {/* Company initial */}
                    <div className="h-7 w-7 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0 text-[11px] font-bold text-foreground/50 uppercase">
                      {job.company?.[0] ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-foreground/85 truncate leading-tight">{job.title}</p>
                      <p className="text-[11px] text-foreground/65 font-medium truncate mt-0.5">{job.company}</p>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <span className={cn(
                        'text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide',
                        SOURCE_COLORS[job.source] ?? 'bg-muted text-foreground/50'
                      )}>
                        {job.source}
                      </span>
                      <span className="text-[10px] font-medium text-foreground/55">{timeAgo(job.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Getting started / Quick actions ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-3.5 w-3.5 text-foreground/60" />
          <h3 className="text-[12px] font-bold text-foreground/55 uppercase tracking-[0.1em]">
            {isNewUser ? 'Get Started — 3 Steps' : 'Quick Actions'}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {actions.map(({ step, icon: Icon, title, desc, href, done }) => (
            <Link
              key={step}
              href={href}
              className={cn(
                'group relative flex flex-col gap-3 rounded-xl border px-4 py-4 transition-all duration-150 shadow-sm overflow-hidden',
                done
                  ? 'border-emerald-200 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-950/15 hover:border-emerald-300'
                  : 'border-border bg-card hover:border-foreground/25 hover:shadow-md'
              )}
            >
              {/* Step number */}
              <span className={cn(
                'absolute top-3.5 right-3.5 text-[10px] font-black tabular-nums',
                done ? 'text-emerald-400/70' : 'text-foreground/15'
              )}>
                {step}
              </span>

              {/* Icon */}
              <div className={cn(
                'h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                done
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-muted text-foreground/50 group-hover:bg-foreground/8'
              )}>
                {done
                  ? <CheckCircle className="h-[18px] w-[18px]" />
                  : <Icon className="h-[18px] w-[18px]" />
                }
              </div>

              {/* Text */}
              <div>
                <p className="text-[13px] font-bold text-foreground/85 leading-tight">{title}</p>
                <p className="text-[12px] text-foreground/65 mt-1.5 leading-relaxed">{desc}</p>
              </div>

              {/* CTA */}
              <div className="flex items-center gap-1.5 mt-auto">
                {done ? (
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    Done ✓
                  </span>
                ) : (
                  <span className="text-[12px] font-semibold text-foreground/60 group-hover:text-foreground/65 transition-colors flex items-center gap-1">
                    Open <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
