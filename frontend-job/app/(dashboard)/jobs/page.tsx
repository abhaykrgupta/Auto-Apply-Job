'use client';

import { useState, useMemo } from 'react';
import { useJobs } from '@/lib/hooks/use-jobs';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { Badge } from '@/components/ui/badge';
import { buttonVariants, Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Briefcase, ExternalLink, Wand2, Send, FileText, Search, Trash2, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { timeAgo, formatSalary } from '@/lib/utils/helpers';
import { cn } from '@/lib/utils';
import { TailoredResumeModal } from '@/components/resume/TailoredResumeModal';
import { CoverLetterModal } from '@/components/jobs/CoverLetterModal';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const ATS_COLORS: Record<string, string> = {
  greenhouse:     'bg-green-100 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-800 dark:text-green-300',
  lever:          'bg-blue-100 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300',
  workday:        'bg-orange-100 border-orange-200 text-orange-800 dark:bg-orange-900/30 dark:border-orange-800 dark:text-orange-300',
  ashby:          'bg-purple-100 border-purple-200 text-purple-800 dark:bg-purple-900/30 dark:border-purple-800 dark:text-purple-300',
  bamboohr:       'bg-teal-100 border-teal-200 text-teal-800 dark:bg-teal-900/30 dark:border-teal-800 dark:text-teal-300',
  smartrecruiters:'bg-indigo-100 border-indigo-200 text-indigo-800 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300',
  custom:         'bg-gray-100 border-gray-200 text-gray-700 dark:bg-gray-800/50 dark:border-gray-700 dark:text-gray-300',
  none:           'bg-red-100 border-red-200 text-red-700',
  unknown:        'bg-yellow-100 border-yellow-200 text-yellow-800',
};

export default function JobsPage() {
  const { data: jobs, isLoading } = useJobs();
  const [search, setSearch] = useState('');
  const [tailorJob, setTailorJob] = useState<{ id: string; title: string; company: string } | null>(null);
  const [coverLetterJob, setCoverLetterJob] = useState<{ id: string; title: string; company: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [dateFilter, setDateFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSizeMode, setPageSizeMode] = useState('15');
  const [customPageSize, setCustomPageSize] = useState('15');
  const qc = useQueryClient();

  const filteredJobs = useMemo(() => {
    if (!jobs) return [];
    
    // 1. Search text filter
    let result = jobs;
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter((j: any) =>
        j.title?.toLowerCase().includes(q) ||
        j.company?.toLowerCase().includes(q) ||
        j.location?.toLowerCase().includes(q)
      );
    }
    
    // 2. Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
      const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      result = result.filter((j: any) => {
        if (!j.createdAt) return false;
        const jobDate = new Date(j.createdAt);
        if (dateFilter === 'today') return jobDate >= todayStart;
        if (dateFilter === 'yesterday') return jobDate >= yesterdayStart && jobDate < todayStart;
        if (dateFilter === 'past_week') return jobDate >= weekStart;
        return true;
      });
    }
    
    return result;
  }, [jobs, search, dateFilter]);

  const pageSize = pageSizeMode === 'custom' ? (parseInt(customPageSize) || 15) : parseInt(pageSizeMode);
  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / pageSize));
  const paginatedJobs = filteredJobs.slice((page - 1) * pageSize, page * pageSize);

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

  const { mutate: deleteJob, isPending: deleting, variables: deletingId } = useMutation({
    mutationFn: async (jobId: string) => {
      const res = await fetch(`/api/jobs/${jobId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
    },
    onSuccess: () => {
      toast.success('Job removed');
      qc.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: () => toast.error('Failed to delete job'),
  });

  const { mutate: bulkDelete, isPending: bulkDeleting } = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await fetch('/api/jobs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) throw new Error('Bulk delete failed');
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(`${data.deleted} job${data.deleted !== 1 ? 's' : ''} removed`);
      setSelectedIds(new Set());
      qc.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: () => toast.error('Failed to delete jobs'),
  });

  const allJobIds: string[] = filteredJobs?.map((j: any) => j.id) ?? [];
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
          <p className="text-muted-foreground">
            {paginatedJobs.length} of {jobs?.length ?? 0} jobs
          </p>
        </div>
        <Link href="/search" className={cn(buttonVariants({ variant: 'outline' }), 'shrink-0')}>Search More</Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by title, company or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background/50 backdrop-blur-sm transition-all focus:bg-background"
          />
        </div>
        
        <Select value={dateFilter} onValueChange={(val) => setDateFilter(val ?? 'all')}>
          <SelectTrigger className="w-full sm:w-[180px] bg-background/50 backdrop-blur-sm transition-all focus:bg-background">
            <SelectValue placeholder="Date Posted" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="yesterday">Yesterday</SelectItem>
            <SelectItem value="past_week">Past Week</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!filteredJobs.length ? (
        <EmptyState
          icon={Briefcase}
          title={search ? 'No jobs match your search' : 'No jobs found yet'}
          description={search ? 'Try different keywords.' : 'Use the Search page to scrape job boards and discover new opportunities.'}
          action={!search ? <Link href="/search" className={cn(buttonVariants())}>Search Jobs</Link> : undefined}
        />
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className="p-4 text-left font-semibold text-muted-foreground w-12">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 cursor-pointer rounded border-muted-foreground/30 accent-primary"
                    aria-label="Select all jobs"
                  />
                </th>
                <th className="p-4 text-left font-semibold text-muted-foreground">Job Details</th>
                <th className="p-4 text-left font-semibold text-muted-foreground">Location</th>
                <th className="p-4 text-left font-semibold text-muted-foreground">Salary</th>
                <th className="p-4 text-left font-semibold text-muted-foreground">Source</th>
                <th className="p-4 text-left font-semibold text-muted-foreground">Posted</th>
                <th className="p-4 text-right font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedJobs.map((job: any) => (
                <tr key={job.id} className={cn('hover:bg-muted/30 transition-colors group', selectedIds.has(job.id) && 'bg-primary/5 hover:bg-primary/5')}>
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(job.id)}
                      onChange={() => toggleSelect(job.id)}
                      className="h-4 w-4 cursor-pointer rounded border-muted-foreground/30 accent-primary"
                      aria-label={`Select ${job.title}`}
                    />
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <a href={job.applyUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-1">
                        {job.title}
                      </a>
                      <span className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5 font-medium">
                        <Briefcase className="h-3.5 w-3.5 text-muted-foreground/70" />
                        {job.company}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground ring-1 ring-inset ring-border">
                      {job.location ?? 'Remote'}
                    </span>
                  </td>
                  <td className="p-4 text-muted-foreground font-medium text-xs">
                    {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}
                  </td>
                  <td className="p-4">
                    <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider border', ATS_COLORS[job.source?.toLowerCase()] ?? 'bg-muted border-border text-muted-foreground')}>
                      {job.source}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-muted-foreground font-medium whitespace-nowrap">
                    {timeAgo(job.createdAt)}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/50"
                        onClick={() => setTailorJob({ id: job.id, title: job.title, company: job.company })}
                        title="Tailor Resume"
                      >
                        <Wand2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/50"
                        onClick={() => setCoverLetterJob({ id: job.id, title: job.title, company: job.company })}
                        title="Generate Cover Letter"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <div className="w-px h-4 bg-border mx-1" />
                      <Button
                        size="sm"
                        onClick={() => applyJob(job.id)}
                        disabled={applying && applyingId === job.id}
                        className="h-8 px-3 gap-1.5 font-semibold text-xs shadow-sm"
                      >
                        {applying && applyingId === job.id ? <LoadingSpinner size="sm" fullPage={false} /> : <Send className="h-3.5 w-3.5" />}
                        <span className="hidden sm:inline">{applying && applyingId === job.id ? 'Applying' : 'Apply'}</span>
                      </Button>
                      <div className="w-px h-4 bg-border mx-1" />
                      <a
                        href={job.applyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open external job board"
                        className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'h-8 w-8 p-0 text-muted-foreground')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteJob(job.id)}
                        disabled={deleting && deletingId === job.id}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Remove job"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
          
          <div className="px-5 py-3 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/10">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Rows per page:</span>
              <Select value={pageSizeMode} onValueChange={(val) => { setPageSizeMode(val ?? '15'); setPage(1); }}>
                <SelectTrigger className="h-8 w-[80px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
              {pageSizeMode === 'custom' && (
                <Input
                  className="h-8 w-16 text-xs px-2 bg-background"
                  placeholder="#"
                  value={customPageSize}
                  onChange={(e) => { setCustomPageSize(e.target.value); setPage(1); }}
                  autoFocus
                />
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Page {page} of {totalPages}</span>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
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
            disabled={batchApplying || bulkDeleting}
            className="gap-2"
          >
            {batchApplying ? <LoadingSpinner size="sm" fullPage={false} /> : <Send className="h-4 w-4" />}
            Apply {selectedIds.size} Selected
          </Button>
          <Button
            variant="destructive"
            onClick={() => bulkDelete(Array.from(selectedIds))}
            disabled={bulkDeleting || batchApplying}
            className="gap-2"
          >
            {bulkDeleting ? <LoadingSpinner size="sm" fullPage={false} /> : <Trash2 className="h-4 w-4" />}
            Delete {selectedIds.size} Selected
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
