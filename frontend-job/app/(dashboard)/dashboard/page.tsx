import { StatsCard } from '@/components/shared/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase, CheckCircle, AlertCircle, XCircle, TrendingUp, ArrowRight, FileText, Search, Zap, Clock, Activity } from 'lucide-react';
import { timeAgo } from '@/lib/utils/helpers';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
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
  } catch {
    // DB not configured yet or backend down
  }

  return (
    <div className="mx-auto max-w-7xl p-6 md:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
          <p className="text-sm text-muted-foreground mt-1">Monitor your autonomous job agent and pipeline.</p>
        </div>
        <Link href="/search" className={cn(buttonVariants(), 'shrink-0 shadow-sm')}>Find New Jobs</Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard 
          title="Hours Saved" 
          value={Math.floor((stats.total * 20) / 60)} 
          subtitle="Estimated time saved by AI" 
          icon={Clock} 
          variant="success" 
        />
        <StatsCard title="Total Sourced" value={stats.total} icon={Briefcase} />
        <StatsCard
          title="Auto-Applied"
          value={stats.applied}
          subtitle={`${stats.successRate}% success rate`}
          icon={CheckCircle}
          variant="success"
        />
        <StatsCard
          title="Manual Review"
          value={stats.manualReview}
          subtitle="Attention required"
          icon={AlertCircle}
          variant="warning"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="rounded-xl shadow-sm border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Pipeline Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Interviewing', value: stats.interviewing, color: 'bg-purple-500' },
              { label: 'Applied', value: stats.applied, color: 'bg-green-500' },
              { label: 'Manual Review', value: stats.manualReview, color: 'bg-yellow-500' },
              { label: 'Accepted', value: stats.accepted, color: 'bg-emerald-500' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center gap-3">
                <div className={`h-2 w-2 rounded-full ${color}`} />
                <span className="flex-1 text-sm font-medium text-muted-foreground">{label}</span>
                <span className="text-sm font-semibold">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary animate-pulse" />
              Live Operations Log
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentJobs.length === 0 ? (
              <p className="text-sm text-muted-foreground">System idle. Initiate a search to begin operations.</p>
            ) : (
              recentJobs.map((job: any) => (
                <div
                  key={job.id}
                  className="flex items-start gap-3 rounded-lg p-3 bg-muted/30 border border-transparent hover:border-border/50 transition-colors"
                >
                  <div className="h-2 w-2 rounded-full bg-primary mt-1.5 animate-pulse shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug">
                      Identified <span className="text-foreground">{job.title}</span> at {job.company}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-[10px] font-normal uppercase tracking-wider">{job.source}</Badge>
                      <span className="text-xs text-muted-foreground">{timeAgo(job.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="rounded-xl shadow-sm border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            {stats.total === 0 ? 'Get Started — 3 Steps' : 'Quick Actions'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                step: '1',
                icon: FileText,
                title: 'Upload Your Resume',
                desc: 'Parse your existing resume so the bot knows your background',
                href: '/resume',
                done: false,
              },
              {
                step: '2',
                icon: Search,
                title: 'Search for Jobs',
                desc: 'Scrape live listings from LinkedIn, Indeed, and 6 more sources',
                href: '/search',
                done: recentJobs.length > 0,
              },
              {
                step: '3',
                icon: Zap,
                title: 'Enable Auto-Apply',
                desc: 'Turn on the bot in Settings to apply automatically while you sleep',
                href: '/settings',
                done: stats.applied > 0,
              },
            ].map(({ step, icon: Icon, title, desc, href, done }) => (
              <Link
                key={step}
                href={href}
                className={cn(
                  'group flex flex-col gap-2 rounded-xl border p-5 transition-all hover:shadow-md bg-card',
                  done
                    ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20'
                    : 'border-border/60 hover:border-primary/40'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className={cn(
                    'h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold shadow-sm',
                    done ? 'bg-green-500 text-white' : 'bg-primary/10 text-primary'
                  )}>
                    {done ? <CheckCircle className="h-4 w-4" /> : step}
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="mt-2">
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{desc}</p>
                </div>
              </Link>
            ))}
          </div>
          {stats.manualReview > 0 && (
            <Link href="/manual-review" className="mt-5 flex items-center justify-between rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-4 hover:bg-amber-100/50 dark:hover:bg-amber-950/40 transition-colors group shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  {stats.manualReview} application{stats.manualReview !== 1 ? 's' : ''} need your attention
                </span>
              </div>
              <ArrowRight className="h-4 w-4 text-amber-600 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
