'use client';

import { useApplications } from '@/lib/hooks/use-applications';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { SendHorizontal } from 'lucide-react';
import Link from 'next/link';
import { getStatusColor, timeAgo } from '@/lib/utils/helpers';
import { cn } from '@/lib/utils';

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
        <Link href="/jobs" className={cn(buttonVariants({ variant: 'outline' }), 'shrink-0')}>Browse Jobs</Link>
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
