'use client';

import { useApplications } from '@/lib/hooks/use-applications';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { Badge } from '@/components/ui/badge';
import { buttonVariants, Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SendHorizontal, Download, Search, CheckSquare, ChevronDown, Play, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { timeAgo } from '@/lib/utils/helpers';
import { cn } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useState, useMemo } from 'react';

const STATUS_META: Record<string, { label: string; color: string }> = {
  pending:              { label: 'Queued',             color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
  applied:              { label: 'Applied',             color: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' },
  failed:               { label: 'Failed',              color: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' },
  manual_review:        { label: 'Needs Attention',     color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
  pending_confirmation: { label: 'Awaiting Review',     color: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300' },
  interviewing:         { label: 'Interviewing',        color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' },
  rejected:             { label: 'Rejected',            color: 'bg-gray-100 text-gray-700 dark:bg-gray-800/60 dark:text-gray-300' },
  accepted:             { label: 'Accepted',            color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
  cancelled:            { label: 'Cancelled',           color: 'bg-gray-100 text-gray-500 dark:bg-gray-800/40 dark:text-gray-400' },
};

const ALL_STATUSES = Object.keys(STATUS_META);

function statusLabel(s: string) { return STATUS_META[s]?.label ?? s.replace(/_/g, ' '); }
function statusColor(s: string) { return STATUS_META[s]?.color ?? 'bg-gray-100 text-gray-700'; }

function exportCSV(apps: any[]) {
  const headers = ['Job Title', 'Company', 'Status', 'Method', 'Applied Date', 'Source'];
  const rows = apps.map((a) => [
    `"${a.job?.title ?? ''}"`,
    `"${a.job?.company ?? ''}"`,
    statusLabel(a.application?.status ?? ''),
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
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkMenuOpen, setBulkMenuOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!applications) return [];
    let list = applications;
    if (statusFilter !== 'all') list = list.filter((a: any) => a.application?.status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((a: any) =>
        a.job?.title?.toLowerCase().includes(q) ||
        a.job?.company?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [applications, search, statusFilter]);

  const pendingCount = useMemo(
    () => applications?.filter((a: any) => a.application?.status === 'pending').length ?? 0,
    [applications]
  );

  const { mutate: processQueue, isPending: isProcessing } = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/queue/process', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to start queue');
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message ?? 'Queue started');
      qc.invalidateQueries({ queryKey: ['applications'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const { mutate: bulkUpdateStatus, isPending: bulkUpdating } = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      await Promise.all(ids.map(id =>
        fetch(`/api/applications/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        })
      ));
    },
    onSuccess: (_, { status }) => {
      toast.success(`${selectedIds.size} application${selectedIds.size !== 1 ? 's' : ''} marked as ${statusLabel(status)}`);
      setSelectedIds(new Set());
      setBulkMenuOpen(false);
      qc.invalidateQueries({ queryKey: ['applications'] });
    },
    onError: () => toast.error('Failed to update some applications'),
  });

  const { mutate: bulkDelete, isPending: bulkDeleting } = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map(id =>
        fetch(`/api/applications/${id}`, { method: 'DELETE' })
      ));
    },
    onSuccess: () => {
      toast.success(`${selectedIds.size} application${selectedIds.size !== 1 ? 's' : ''} deleted`);
      setSelectedIds(new Set());
      qc.invalidateQueries({ queryKey: ['applications'] });
    },
    onError: () => toast.error('Failed to delete some applications'),
  });

  const allIds = filtered.map((a: any) => a.application?.id).filter(Boolean);
  const allSelected = allIds.length > 0 && allIds.every((id: string) => selectedIds.has(id));

  function toggleSelectAll() {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(allIds));
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="p-4 md:p-8 space-y-5 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Applications</h2>
          <p className="text-muted-foreground">{applications?.length ?? 0} total applications</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {pendingCount > 0 && (
            <Button
              onClick={() => processQueue()}
              disabled={isProcessing}
              className="gap-2"
            >
              {isProcessing ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Starting...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Process Queue ({pendingCount})
                </>
              )}
            </Button>
          )}
          {applications && applications.length > 0 && (
            <Button variant="outline" onClick={() => exportCSV(applications)} className="gap-2">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
          )}
          <Link href="/jobs" className={cn(buttonVariants({ variant: 'outline' }))}>Browse Jobs</Link>
        </div>
      </div>

      {/* Filters */}
      {applications && applications.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by job title or company..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={v => { if (v) { setStatusFilter(v); setSelectedIds(new Set()); } }}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {ALL_STATUSES.map(s => (
                <SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {!filtered.length ? (
        <EmptyState
          icon={SendHorizontal}
          title={search || statusFilter !== 'all' ? 'No applications match' : 'No applications yet'}
          description={
            search || statusFilter !== 'all'
              ? 'Try clearing your filters to see all applications.'
              : 'Find jobs and apply to start tracking your applications here.'
          }
          action={
            !search && statusFilter === 'all'
              ? <Link href="/jobs" className={cn(buttonVariants())}>Browse Jobs</Link>
              : <Button variant="outline" onClick={() => { setSearch(''); setStatusFilter('all'); }}>Clear Filters</Button>
          }
        />
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="p-3 text-left font-medium w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 cursor-pointer accent-primary"
                      aria-label="Select all"
                    />
                  </th>
                  <th className="p-3 text-left font-medium">Job</th>
                  <th className="p-3 text-left font-medium">Company</th>
                  <th className="p-3 text-left font-medium">Status</th>
                  <th className="p-3 text-left font-medium hidden sm:table-cell">Method</th>
                  <th className="p-3 text-left font-medium hidden md:table-cell">Applied</th>
                  <th className="p-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item: any) => (
                  <tr
                    key={item.application.id}
                    className={cn(
                      'border-t border-border hover:bg-accent/50 transition-colors',
                      selectedIds.has(item.application.id) && 'bg-primary/5'
                    )}
                  >
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.application.id)}
                        onChange={() => toggleSelect(item.application.id)}
                        className="h-4 w-4 cursor-pointer accent-primary"
                      />
                    </td>
                    <td className="p-3 font-medium max-w-[200px] truncate">{item.job.title}</td>
                    <td className="p-3 text-muted-foreground">{item.job.company}</td>
                    <td className="p-3">
                      <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap', statusColor(item.application.status))}>
                        {statusLabel(item.application.status)}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground capitalize hidden sm:table-cell">
                      {item.application.method ?? 'auto'}
                    </td>
                    <td className="p-3 text-muted-foreground hidden md:table-cell">
                      {item.application.appliedAt ? timeAgo(item.application.appliedAt) : '—'}
                    </td>
                    <td className="p-3">
                      <Link
                        href={`/applications/${item.application.id}`}
                        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center gap-3 border-t border-border bg-background/95 backdrop-blur px-6 py-4 shadow-lg">
          <CheckSquare className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setBulkMenuOpen(v => !v)}
              disabled={bulkUpdating}
            >
              Mark as… <ChevronDown className="h-3.5 w-3.5" />
            </Button>
            {bulkMenuOpen && (
              <div className="absolute bottom-full mb-2 left-0 z-50 w-44 rounded-lg border border-border bg-background shadow-xl overflow-hidden">
                {['interviewing', 'rejected', 'accepted', 'manual_review'].map(s => (
                  <button
                    key={s}
                    className="w-full px-4 py-2.5 text-sm text-left hover:bg-accent transition-colors"
                    onClick={() => bulkUpdateStatus({ ids: Array.from(selectedIds), status: s })}
                  >
                    {statusLabel(s)}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
          >
            Clear
          </button>
          <Button
            variant="destructive"
            size="sm"
            className="gap-1.5"
            disabled={bulkDeleting}
            onClick={() => {
              if (confirm(`Are you sure you want to delete ${selectedIds.size} application(s)? This cannot be undone.`)) {
                bulkDelete(Array.from(selectedIds));
              }
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete Selected
          </Button>
        </div>
      )}
    </div>
  );
}
