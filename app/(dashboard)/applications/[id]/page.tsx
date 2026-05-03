'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ArrowLeft, ExternalLink, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  pending:       'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  applied:       'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  failed:        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  manual_review: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  interviewing:  'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  rejected:      'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  accepted:      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

const statuses = ['pending', 'applied', 'failed', 'manual_review', 'interviewing', 'rejected', 'accepted'];

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['application', id],
    queryFn: async () => {
      const res = await fetch(`/api/applications/${id}`);
      if (!res.ok) throw new Error('Not found');
      return res.json();
    },
  });

  const { mutate: updateStatus, isPending } = useMutation({
    mutationFn: async (status: string) => {
      const res = await fetch(`/api/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Update failed');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Status updated');
      qc.invalidateQueries({ queryKey: ['application', id] });
      qc.invalidateQueries({ queryKey: ['applications'] });
    },
    onError: () => toast.error('Failed to update status'),
  });

  if (isLoading) return <LoadingSpinner />;
  if (!data) return <div className="p-8 text-muted-foreground">Application not found.</div>;

  const { application, job } = data;

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">{job.title}</h1>
          <p className="text-sm text-muted-foreground">{job.company} · {job.location ?? 'Remote'}</p>
        </div>
        <a href={job.applyUrl} target="_blank" rel="noopener noreferrer" className="ml-auto">
          <Button variant="outline" size="sm" className="gap-1.5">
            <ExternalLink className="h-3.5 w-3.5" /> View Job
          </Button>
        </a>
      </div>

      {/* Status card */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">Current Status</p>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColors[application.status] ?? ''}`}>
            {application.status.replace('_', ' ')}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Method</p>
            <p className="font-medium capitalize">{application.method}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Applied</p>
            <p className="font-medium">{application.appliedAt ? new Date(application.appliedAt).toLocaleDateString() : '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Attempts</p>
            <p className="font-medium">{application.attempts ?? 1}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Created</p>
            <p className="font-medium">{new Date(application.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        {application.notes && (
          <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">{application.notes}</div>
        )}
      </div>

      {/* Update status */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-3">
        <p className="text-sm font-semibold">Update Status</p>
        <div className="flex flex-wrap gap-2">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => updateStatus(s)}
              disabled={isPending || application.status === s}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition-all ${
                application.status === s
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border hover:border-primary hover:text-primary'
              }`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
