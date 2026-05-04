'use client';

import { useApplications } from '@/lib/hooks/use-applications';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { Badge } from '@/components/ui/badge';
import { buttonVariants, Button } from '@/components/ui/button';
import { SendHorizontal, Download } from 'lucide-react';
import Link from 'next/link';
import { getStatusColor, timeAgo } from '@/lib/utils/helpers';
import { cn } from '@/lib/utils';

function exportCSV(apps: any[]) {
  const headers = ['Job Title', 'Company', 'Status', 'Method', 'Applied Date', 'Source'];
  const rows = apps.map((a) => [
    `"${a.job?.title ?? ''}"`,
    `"${a.job?.company ?? ''}"`,
    a.application?.status ?? '',
    a.application?.method ?? '',
    a.application?.appliedAt ? new Date(a.application.appliedAt).toLocaleDateString() : '',
    a.job?.source ?? '',
  ]);
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `applications-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ApplicationsPage() {
  const { data: applications, isLoading } = useApplications();

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Applications</h2>
          <p className="text-muted-foreground">{applications?.length ?? 0} total applications</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {applications && applications.length > 0 && (
            <Button
              variant="outline"
              onClick={() => exportCSV(applications)}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          )}
          <Link href="/jobs" className={cn(buttonVariants({ variant: 'outline' }))}>Browse Jobs</Link>
        </div>
      </div>

      {!applications?.length ? (
        <EmptyState
          icon={SendHorizontal}
          title="No applications yet"
          description="Find jobs and apply to start tracking your applications here."
          action={<Link href="/jobs" className={cn(buttonVariants())}>Browse Jobs</Link>}
        />
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="p-3 text-left font-medium">Job</th>
                <th className="p-3 text-left font-medium">Company</th>
                <th className="p-3 text-left font-medium">Status</th>
                <th className="p-3 text-left font-medium">Method</th>
                <th className="p-3 text-left font-medium">Applied</th>
                <th className="p-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((item: any) => (
                <tr key={item.application.id} className="border-t border-border hover:bg-accent/50 transition-colors">
                  <td className="p-3 font-medium">{item.job.title}</td>
                  <td className="p-3 text-muted-foreground">{item.job.company}</td>
                  <td className="p-3">
                    <span className={cn('rounded-full px-2 py-1 text-xs font-medium', getStatusColor(item.application.status))}>
                      {item.application.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground capitalize">{item.application.method ?? '-'}</td>
                  <td className="p-3 text-muted-foreground">
                    {item.application.appliedAt ? timeAgo(item.application.appliedAt) : '-'}
                  </td>
                  <td className="p-3">
                    <Link href={`/applications/${item.application.id}`} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>Details</Link>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
