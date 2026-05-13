'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useResumes } from '@/lib/hooks/use-resume';
import { useMatchJobs } from '@/lib/hooks/use-jobs';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Star, Zap, Layers, Bookmark, BookmarkCheck, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useState } from 'react';

function ScoreBadge({ score }: { score: number }) {
  const cls = score >= 80 ? 'bg-green-500 text-white' : score >= 60 ? 'bg-yellow-500 text-white' : 'bg-gray-500 text-white';
  return <Badge className={cls}>{Math.round(score)}% Match</Badge>;
}

function SalaryBadge({ min, max, currency }: { min?: number | null; max?: number | null; currency?: string | null }) {
  if (!min && !max) return null;
  const fmt = (n: number) => n >= 1000 ? `${Math.round(n / 1000)}k` : String(n);
  const text = min && max ? `${fmt(min)}–${fmt(max)}` : min ? `${fmt(min)}+` : `up to ${fmt(max!)}`;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
      <DollarSign className="h-3 w-3" />{currency ?? 'USD'} {text}
    </span>
  );
}

function SourceBadge({ source }: { source?: string }) {
  if (!source) return null;
  const colors: Record<string, string> = {
    greenhouse: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    lever:      'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    ashby:      'bg-violet-100 text-violet-800',
    linkedin:   'bg-sky-100 text-sky-800',
    indeed:     'bg-amber-100 text-amber-800',
    custom:     'bg-gray-100 text-gray-700 dark:bg-gray-800/60 dark:text-gray-300',
  };
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium capitalize', colors[source] ?? colors.custom)}>
      {source}
    </span>
  );
}

export default function MatchesPage() {
  const { data: resumes } = useResumes();
  const activeResume = resumes?.find((r: any) => r.isActive) ?? resumes?.[0];
  const { mutate: matchJobs, isPending: isMatching } = useMatchJobs();
  const qc = useQueryClient();
  const [saving, setSaving] = useState<string | null>(null);

  const { mutate: applyJob, isPending: applying, variables: applyingId } = useMutation({
    mutationFn: async (jobId: string) => {
      const res = await fetch(`/api/jobs/${jobId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Apply failed');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Application queued! Check Applications page.');
      qc.invalidateQueries({ queryKey: ['matches'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const { data: savedJobIds, refetch: refetchSaved } = useQuery<string[]>({
    queryKey: ['saved-jobs-ids'],
    queryFn: async () => {
      const res = await fetch('/api/jobs/saved');
      if (!res.ok) return [];
      const data = await res.json();
      return data.map((r: any) => r.job.id);
    },
  });

  const { data: matches, isLoading } = useQuery({
    queryKey: ['matches', activeResume?.id],
    queryFn: async () => {
      if (!activeResume?.id) return [];
      const res = await fetch(`/api/jobs/matches?resumeId=${activeResume.id}`);
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    enabled: !!activeResume?.id,
  });

  const { mutate: bulkApply, isPending: isBulkApplying } = useMutation({
    mutationFn: async () => {
      if (!activeResume?.id) throw new Error('Upload a resume first');
      const res = await fetch('/api/jobs/bulk-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId: activeResume.id }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Bulk apply failed');
      return res.json();
    },
    onSuccess: (data) => {
      if (data.queued > 0) {
        toast.success(data.message);
        qc.invalidateQueries({ queryKey: ['matches'] });
      } else {
        toast.info(data.message);
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function toggleSave(jobId: string) {
    const isSaved = savedJobIds?.includes(jobId);
    setSaving(jobId);
    try {
      if (isSaved) {
        await fetch(`/api/jobs/saved?jobId=${jobId}`, { method: 'DELETE' });
        toast.success('Removed from saved jobs');
      } else {
        await fetch('/api/jobs/saved', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobId }) });
        toast.success('Job saved to watchlist');
      }
      refetchSaved();
    } catch {
      toast.error('Failed to update saved jobs');
    } finally {
      setSaving(null);
    }
  }

  function runMatching() {
    if (!activeResume?.id) { toast.error('Upload a resume first'); return; }
    matchJobs(activeResume.id, {
      onSuccess: () => toast.success('Matching complete!'),
      onError:   () => toast.error('Matching failed. Check OpenAI API key.'),
    });
  }

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">AI Matched Jobs</h2>
          <p className="text-muted-foreground">Jobs ranked by compatibility score</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button onClick={() => bulkApply()} disabled={isBulkApplying || !matches?.length} variant="secondary">
            {isBulkApplying ? <LoadingSpinner size="sm" fullPage={false} className="mr-2" /> : <Layers className="mr-2 h-4 w-4" />}
            {isBulkApplying ? 'Starting...' : 'Bulk Auto-Apply'}
          </Button>
          <Button onClick={runMatching} disabled={isMatching}>
            <Zap className="mr-2 h-4 w-4" />
            {isMatching ? 'Matching...' : 'Run AI Match'}
          </Button>
        </div>
      </div>

      {!matches?.length ? (
        <EmptyState
          icon={Star}
          title="No matches yet"
          description="Click 'Run AI Match' to score all discovered jobs against your resume."
          action={<Button onClick={runMatching} disabled={isMatching}>Run AI Match</Button>}
        />
      ) : (
        <div className="space-y-4">
          {matches.map((m: any) => {
            const isSaved = savedJobIds?.includes(m.job.id);
            return (
              <Card key={m.match.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-lg font-semibold truncate">{m.job.title}</h3>
                        <ScoreBadge score={m.match.score} />
                        <SourceBadge source={m.job.source} />
                      </div>
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <p className="text-sm text-muted-foreground">
                          {m.job.company} · {m.job.location ?? 'Remote'}
                        </p>
                        <SalaryBadge min={m.job.salaryMin} max={m.job.salaryMax} currency={m.job.salaryCurrency} />
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-xs font-medium mb-1 text-muted-foreground">Strengths</p>
                          <ul className="space-y-1">
                            {(m.match.strengths ?? []).map((s: string, i: number) => (
                              <li key={i} className="text-xs text-green-600 dark:text-green-400">✓ {s}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs font-medium mb-1 text-muted-foreground">Gaps</p>
                          <ul className="space-y-1">
                            {(m.match.weaknesses ?? []).map((w: string, i: number) => (
                              <li key={i} className="text-xs text-yellow-600 dark:text-yellow-400">⚠ {w}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      {m.match.recommendation && (
                        <p className="text-sm italic text-muted-foreground">{m.match.recommendation}</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 shrink-0 min-w-[90px]">
                      <a href={m.job.applyUrl} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ size: 'sm' }))}>
                        View Job
                      </a>
                      <Button onClick={() => applyJob(m.job.id)} disabled={applying && applyingId === m.job.id} variant="outline" size="sm">
                        {applying && applyingId === m.job.id ? 'Applying...' : 'Auto-Apply'}
                      </Button>
                      <Button
                        onClick={() => toggleSave(m.job.id)}
                        disabled={saving === m.job.id}
                        variant="ghost"
                        size="sm"
                        className={cn('gap-1', isSaved && 'text-primary')}
                      >
                        {isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                        {isSaved ? 'Saved' : 'Save'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
