import { getApplicationStats } from '@/lib/actions/applications';
import { getJobs } from '@/lib/actions/jobs';
import { StatsCard } from '@/components/shared/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase, CheckCircle, AlertCircle, XCircle, TrendingUp } from 'lucide-react';
import { timeAgo } from '@/lib/utils/helpers';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default async function DashboardPage() {
  let stats = { total: 0, applied: 0, failed: 0, manualReview: 0, interviewing: 0, accepted: 0, successRate: 0 };
  let recentJobs: any[] = [];

  try {
    stats = await getApplicationStats();
    recentJobs = (await getJobs()).slice(0, 5);
  } catch {
    // DB not configured yet
  }

  return (
    <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Welcome back</h2>
          <p className="text-sm text-muted-foreground mt-1">Here is your job application overview</p>
        </div>
        <Link href="/search" className={cn(buttonVariants())}>Find New Jobs</Link>
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
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
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
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {stats.total === 0 && (
        <Card className="rounded-xl border-dashed">
          <CardContent className="py-16 text-center">
            <Briefcase className="mx-auto mb-4 h-14 w-14 text-muted-foreground/40" />
            <h3 className="text-lg font-semibold">Get Started</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">
              Upload your resume, then search and apply to jobs automatically.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link href="/resume" className={cn(buttonVariants({ variant: 'outline' }))}>Upload Resume</Link>
              <Link href="/search" className={cn(buttonVariants())}>Search Jobs</Link>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
