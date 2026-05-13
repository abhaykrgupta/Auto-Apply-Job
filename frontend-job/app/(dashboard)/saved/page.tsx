'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Bookmark, BookmarkX, ExternalLink, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { timeAgo } from '@/lib/utils/helpers';
import { toast } from 'sonner';

function SalaryLine({ min, max, currency }: { min?: number | null; max?: number | null; currency?: string | null }) {
  if (!min && !max) return null;
  const fmt = (n: number) => n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${n}`;
  const text = min && max ? `${fmt(min)} – ${fmt(max)}` : min ? `${fmt(min)}+` : `up to ${fmt(max!)}`;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
      <DollarSign className="h-3 w-3" />{currency ?? 'USD'} {text}
    </span>
  );
}

export default function SavedJobsPage() {
  const qc = useQueryClient();

  const { data: saved, isLoading } = useQuery({
    queryKey: ['saved-jobs'],
    queryFn: async () => {
      const res = await fetch('/api/jobs/saved');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const { mutate: unsave } = useMutation({
    mutationFn: async (jobId: string) => {
      const res = await fetch(`/api/jobs/saved?jobId=${jobId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
    },
    onSuccess: () => {
      toast.success('Removed from saved jobs');
      qc.invalidateQueries({ queryKey: ['saved-jobs'] });
      qc.invalidateQueries({ queryKey: ['saved-jobs-ids'] });
    },
    onError: () => toast.error('Failed to remove job'),
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="mx-auto max-w-4xl p-6 md:p-8 space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Saved Jobs</h2>
        <p className="text-muted-foreground mt-1 text-sm">{saved?.length ?? 0} jobs in your watchlist</p>
      </div>

      {!saved?.length ? (
        <EmptyState
          icon={Bookmark}
          title="No saved jobs yet"
          description="Bookmark jobs from the Matches page to track them here."
          action={<a href="/matches" className={cn(buttonVariants())}>View Matches</a>}
        />
      ) : (
        <div className="space-y-3">
          {saved.map((row: any) => (
            <Card key={row.saved.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base truncate">{row.job.title}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {row.job.company} · {row.job.location ?? 'Remote'}
                    </p>
                    <div className="mt-2 flex items-center gap-3 flex-wrap">
                      <SalaryLine min={row.job.salaryMin} max={row.job.salaryMax} currency={row.job.salaryCurrency} />
                      <span className="text-xs text-muted-foreground">Saved {timeAgo(row.saved.savedAt)}</span>
                      {row.job.source && (
                        <span className="text-xs bg-muted px-2 py-0.5 rounded-full capitalize">{row.job.source}</span>
                      )}
                    </div>
                    {row.saved.note && (
                      <p className="mt-2 text-xs italic text-muted-foreground border-l-2 border-border pl-2">{row.saved.note}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <a
                      href={row.job.applyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5')}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Apply
                    </a>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-destructive hover:text-destructive"
                      onClick={() => unsave(row.job.id)}
                    >
                      <BookmarkX className="h-3.5 w-3.5" />
                      Remove
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
