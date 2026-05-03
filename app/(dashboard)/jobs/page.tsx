'use client';

import { useState } from 'react';
import { useJobs } from '@/lib/hooks/use-jobs';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { Badge } from '@/components/ui/badge';
import { buttonVariants, Button } from '@/components/ui/button';
import { Briefcase, ExternalLink, Wand2, Send } from 'lucide-react';
import Link from 'next/link';
import { timeAgo, formatSalary } from '@/lib/utils/helpers';
import { cn } from '@/lib/utils';
import { TailoredResumeModal } from '@/components/resume/TailoredResumeModal';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function JobsPage() {
  const { data: jobs, isLoading } = useJobs();
  const [tailorJob, setTailorJob] = useState<{ id: string; title: string; company: string } | null>(null);
  const qc = useQueryClient();

  const { mutate: applyJob, isPending: applying } = useMutation({
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

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">All Jobs</h2>
          <p className="text-muted-foreground">{jobs?.length ?? 0} jobs discovered</p>
        </div>
        <Link href="/search" className={cn(buttonVariants({ variant: 'outline' }))}>Search More</Link>
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
                <tr key={job.id} className="border-t border-border hover:bg-accent/50 transition-colors">
                  <td className="p-3">
                    <Link href={`/jobs/${job.id}`} className="font-medium hover:underline">
                      {job.title}
                    </Link>
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
                      <Link href={`/jobs/${job.id}`} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
                        Details
                      </Link>
                      <button
                        onClick={() => setTailorJob({ id: job.id, title: job.title, company: job.company })}
                        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1')}
                      >
                        <Wand2 className="h-3 w-3" />
                        Tailor
                      </button>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => applyJob(job.id)}
                        disabled={applying}
                        className="gap-1"
                      >
                        <Send className="h-3 w-3" />
                        Apply
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
    </div>
  );
}
