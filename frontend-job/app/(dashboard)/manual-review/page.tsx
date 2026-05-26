'use client';

import { useApplications } from '@/lib/hooks/use-applications';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ClipboardList, ExternalLink, Trash2 } from 'lucide-react';
import { timeAgo } from '@/lib/utils/helpers';
import { toast } from 'sonner';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export default function ManualReviewPage() {
  const { data: applications, isLoading } = useApplications();
  const manualApps = applications?.filter((a: any) => a.application.status === 'manual_review') ?? [];
  const [clearing, setClearing] = useState(false);
  const qc = useQueryClient();

  async function clearAll() {
    if (!manualApps.length) return;
    setClearing(true);
    try {
      const res = await fetch('/api/applications/clear-manual-review', { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      toast.success('Manual review queue cleared');
      qc.invalidateQueries({ queryKey: ['applications'] });
    } catch {
      toast.error('Failed to clear queue');
    } finally {
      setClearing(false);
    }
  }

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Manual Review</h2>
          <p className="text-muted-foreground">{manualApps.length} jobs need your attention</p>
        </div>
        {manualApps.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={clearAll}
            disabled={clearing}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {clearing ? 'Clearing...' : 'Clear All'}
          </Button>
        )}
      </div>

      {!manualApps.length ? (
        <EmptyState
          icon={ClipboardList}
          title="Nothing to review"
          description="Jobs that couldn't be auto-applied will appear here for you to apply manually."
        />
      ) : (
        <div className="space-y-4">
          {manualApps.map((item: any) => (
            <Card key={item.application.id}>
              <CardContent className="p-6 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{item.job.title}</h3>
                    <Badge variant="outline" className="text-yellow-600 border-yellow-600">Manual Required</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.job.company} • {item.job.location ?? 'Remote'}</p>
                  {item.application.errorMessage && (
                    <p className="text-xs text-red-500 mt-1">Note: {item.application.errorMessage}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">Queued {timeAgo(item.application.createdAt)}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <a href={item.job.applyUrl} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants())}>
                    <ExternalLink className="mr-2 h-4 w-4" /> Apply Now
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
