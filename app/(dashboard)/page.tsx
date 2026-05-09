import { StatsCard } from '@/components/shared/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase, CheckCircle, AlertCircle, XCircle, TrendingUp, ArrowRight, FileText, Search, Zap } from 'lucide-react';
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
    <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Welcome back</h2>
          <p className="text-sm text-muted-foreground mt-1">Here is your job application overview</p>
        </div>
        <Link href="/search" className={cn(buttonVariants(), 'shrink-0')}>Find New Jobs</Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard title="Total Applications" value={stats.total} icon={Briefcase} />
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
          subtitle="Needs attention"
          icon={AlertCircle}
          variant="warning"
        />
        <StatsCard
          title="Failed"
          value={stats.failed}
          subtitle="Retry available"
          icon={XCircle}
          variant="error"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="rounded-xl">
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
                <span className="flex-1 text-sm">{label}</span>
                <span className="text-sm font-semibold">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>Recent Jobs Found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentJobs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No jobs yet. Start by searching for jobs.</p>
            ) : (
              recentJobs.map((job: any) => (
                <a
                  key={job.id}
                  href={job.applyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg p-3 hover:bg-accent transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">{job.title}</p>
                    <p className="text-xs text-muted-foreground">{job.company}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{job.source}</Badge>
                    <span className="text-xs text-muted-foreground">{timeAgo(job.createdAt)}</span>
                  </div>
                </a>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            {stats.total === 0 ? 'Get Started — 3 Steps' : 'Quick Actions'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                  'group flex flex-col gap-2 rounded-xl border p-4 transition-all hover:shadow-md',
                  done
                    ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30'
                    : 'border-border hover:border-primary/40'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className={cn(
                    'h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold',
                    done ? 'bg-green-500 text-white' : 'bg-primary/10 text-primary'
                  )}>
                    {done ? <CheckCircle className="h-4 w-4" /> : step}
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </Link>
            ))}
          </div>
          {stats.manualReview > 0 && (
            <Link href="/manual-review" className="mt-4 flex items-center justify-between rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-3 hover:bg-amber-100 dark:hover:bg-amber-950 transition-colors group">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  {stats.manualReview} application{stats.manualReview !== 1 ? 's' : ''} need your attention
                </span>
              </div>
              <ArrowRight className="h-4 w-4 text-amber-600 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
