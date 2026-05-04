'use client';

import { useState } from 'react';
import { useJobs } from '@/lib/hooks/use-jobs';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { Badge } from '@/components/ui/badge';
import { buttonVariants, Button } from '@/components/ui/button';
import { Briefcase, ExternalLink, Wand2, Send, FileText } from 'lucide-react';
import Link from 'next/link';
import { timeAgo, formatSalary } from '@/lib/utils/helpers';
import { cn } from '@/lib/utils';
import { TailoredResumeModal } from '@/components/resume/TailoredResumeModal';
import { CoverLetterModal } from '@/components/jobs/CoverLetterModal';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function JobsPage() {
  const { data: jobs, isLoading } = useJobs();
  const [tailorJob, setTailorJob] = useState<{ id: string; title: string; company: string } | null>(null);
  const [coverLetterJob, setCoverLetterJob] = useState<{ id: string; title: string; company: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const qc = useQueryClient();

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
    onSuccess: (_, jobId) => {
      toast.success('Application queued! Check Applications page.');
      qc.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const { mutate: batchApply, isPending: batchApplying } = useMutation({
    mutationFn: async (jobIds: string[]) => {
      toast.info(`Queuing ${jobIds.length} applications...`);
      const res = await fetch('/api/jobs/batch-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobIds }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Batch apply failed');
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(`${data.queued} job${data.queued !== 1 ? 's' : ''} queued!${data.failed ? ` (${data.failed} failed)` : ''}`);
      setSelectedIds(new Set());
      qc.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const allJobIds: string[] = jobs?.map((j: any) => j.id) ?? [];
  const allSelected = allJobIds.length > 0 && allJobIds.every((id) => selectedIds.has(id));
  const someSelected = selectedIds.size > 0;

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allJobIds));
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="p-4 md:p-8 space-y-6 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">All Jobs</h2>
          <p className="text-muted-foreground">{jobs?.length ?? 0} jobs discovered</p>
        </div>
        <Link href="/search" className={cn(buttonVariants({ variant: 'outline' }), 'shrink-0')}>Search More</Link>
      </div>

      {!jobs?.length ? (
        <EmptyState
          icon={Briefcase}
          title="No jobs found yet"
          description="Use the Search page to scrape job boards and discover new opportunities."
          action={<Link href="/search" className={cn(buttonVariants())}>Search Jobs</Link>}
        />
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="p-3 text-left font-medium w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 cursor-pointer accent-primary"
                    aria-label="Select all jobs"
                  />
                </th>
                <th className="p-3 text-left font-medium">Role</th>
                <th className="p-3 text-left font-medium">Company</th>
                <th className="p-3 text-left font-medium">Location</th>
                <th className="p-3 text-left font-medium">Salary</th>
                <th className="p-3 text-left font-medium">Source</th>
                <th className="p-3 text-left font-medium">Posted</th>
                <th className="p-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job: any) => (
                <tr key={job.id} className={cn('border-t border-border hover:bg-accent/50 transition-colors', selectedIds.has(job.id) && 'bg-accent/30')}>
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(job.id)}
                      onChange={() => toggleSelect(job.id)}
                      className="h-4 w-4 cursor-pointer accent-primary"
                      aria-label={`Select ${job.title}`}
                    />
                  </td>
                  <td className="p-3">
                    <a href={job.applyUrl} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline">
                      {job.title}
                    </a>
                  </td>
                  <td className="p-3 text-muted-foreground">{job.company}</td>
                  <td className="p-3 text-muted-foreground">{job.location ?? 'Remote'}</td>
                  <td className="p-3 text-muted-foreground">
                    {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}
                  </td>
                  <td className="p-3">
                    <Badge variant="outline">{job.source}</Badge>
                  </td>
                  <td className="p-3 text-muted-foreground">{timeAgo(job.createdAt)}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setTailorJob({ id: job.id, title: job.title, company: job.company })}
                        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1')}
                      >
                        <Wand2 className="h-3 w-3" />
                        Tailor
                      </button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCoverLetterJob({ id: job.id, title: job.title, company: job.company })}
                        className="gap-1"
                      >
                        <FileText className="h-3 w-3" />
                        Letter
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => applyJob(job.id)}
                        disabled={applying && applyingId === job.id}
                        className="gap-1"
                      >
                        {applying && applyingId === job.id ? <LoadingSpinner size="sm" fullPage={false} /> : <Send className="h-3 w-3" />}
                        {applying && applyingId === job.id ? 'Applying...' : 'Apply'}
                      </Button>
                      <a
                        href={job.applyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open job posting"
                        className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </div>
      )}

      {tailorJob && (
        <TailoredResumeModal
          jobId={tailorJob.id}
          jobTitle={tailorJob.title}
          company={tailorJob.company}
          onClose={() => setTailorJob(null)}
        />
      )}

      {coverLetterJob && (
        <CoverLetterModal
          jobId={coverLetterJob.id}
          jobTitle={coverLetterJob.title}
          company={coverLetterJob.company}
          onClose={() => setCoverLetterJob(null)}
        />
      )}

      {someSelected && (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center gap-4 border-t border-border bg-background/95 backdrop-blur px-6 py-4 shadow-lg">
          <span className="text-sm text-muted-foreground">{selectedIds.size} job{selectedIds.size !== 1 ? 's' : ''} selected</span>
          <Button
            onClick={() => batchApply(Array.from(selectedIds))}
            disabled={batchApplying}
            className="gap-2"
          >
            {batchApplying ? <LoadingSpinner size="sm" fullPage={false} /> : <Send className="h-4 w-4" />}
            Apply {selectedIds.size} Selected Job{selectedIds.size !== 1 ? 's' : ''}
          </Button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
