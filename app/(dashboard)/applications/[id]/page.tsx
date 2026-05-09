'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import {
  ArrowLeft, ExternalLink, CheckCircle2, XCircle, Clock,
  AlertTriangle, Info, Bot, Camera, FileText, Settings,
  ChevronRight, Loader2, Ban, Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useState } from 'react';

// ── Status config ──────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode; desc: string }> = {
  pending: {
    label: 'Pending', color: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950', border: 'border-amber-200 dark:border-amber-800',
    icon: <Clock className="h-4 w-4" />,
    desc: 'Application created and waiting to be processed by the bot.',
  },
  applied: {
    label: 'Applied', color: 'text-green-700 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-950', border: 'border-green-200 dark:border-green-800',
    icon: <CheckCircle2 className="h-4 w-4" />,
    desc: 'Form was filled and submitted successfully.',
  },
  failed: {
    label: 'Failed', color: 'text-red-700 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950', border: 'border-red-200 dark:border-red-800',
    icon: <XCircle className="h-4 w-4" />,
    desc: 'The bot encountered an error and could not submit.',
  },
  manual_review: {
    label: 'Manual Review', color: 'text-blue-700 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950', border: 'border-blue-200 dark:border-blue-800',
    icon: <AlertTriangle className="h-4 w-4" />,
    desc: 'Needs your attention — either auto-apply is off, the form is complex, or confirmation is required.',
  },
  pending_confirmation: {
    label: 'Awaiting Confirmation', color: 'text-violet-700 dark:text-violet-400',
    bg: 'bg-violet-50 dark:bg-violet-950', border: 'border-violet-200 dark:border-violet-800',
    icon: <AlertTriangle className="h-4 w-4" />,
    desc: 'Bot filled the form. Review it and submit manually, or turn off "Require Confirmation" in Settings.',
  },
  interviewing: {
    label: 'Interviewing', color: 'text-purple-700 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-950', border: 'border-purple-200 dark:border-purple-800',
    icon: <CheckCircle2 className="h-4 w-4" />,
    desc: 'You have an active interview process for this role.',
  },
  rejected: {
    label: 'Rejected', color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950', border: 'border-red-200 dark:border-red-800',
    icon: <XCircle className="h-4 w-4" />,
    desc: 'Application was not selected.',
  },
  accepted: {
    label: 'Accepted 🎉', color: 'text-emerald-700 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950', border: 'border-emerald-200 dark:border-emerald-800',
    icon: <CheckCircle2 className="h-4 w-4" />,
    desc: 'Offer received!',
  },
  cancelled: {
    label: 'Cancelled', color: 'text-gray-700 dark:text-gray-400',
    bg: 'bg-gray-50 dark:bg-gray-950', border: 'border-gray-200 dark:border-gray-800',
    icon: <Ban className="h-4 w-4" />,
    desc: 'Application was cancelled by you.',
  },
};

const ALL_STATUSES = ['pending', 'applied', 'failed', 'manual_review', 'interviewing', 'rejected', 'accepted', 'cancelled'];

// ── Log level config ───────────────────────────────────────────────────────

const LOG_ICON: Record<string, React.ReactNode> = {
  info:  <Info className="h-3.5 w-3.5 text-blue-500" />,
  warn:  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />,
  error: <XCircle className="h-3.5 w-3.5 text-red-500" />,
};

// ── Screenshot panel ───────────────────────────────────────────────────────

function ScreenshotViewer({ applicationId, screenshotPath }: { applicationId: string; screenshotPath?: string }) {
  const [active, setActive] = useState<'start' | 'filled' | 'final'>('start');
  const stages = [
    { key: 'start' as const,  label: 'Page Loaded',    url: `/screenshots/${applicationId}-start.png` },
    { key: 'filled' as const, label: 'Form Filled',    url: `/screenshots/${applicationId}-filled.png` },
    { key: 'final' as const,  label: 'After Submit',   url: `/screenshots/${applicationId}-final.png` },
  ];

  if (!screenshotPath) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-3">
          <Camera className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Bot Screenshots</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-10 rounded-lg bg-muted/30 border border-dashed border-border">
          <Camera className="h-8 w-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">No screenshots yet</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Screenshots are taken when the bot visits the application page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Camera className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Bot Screenshots</h3>
        <span className="text-xs text-muted-foreground ml-auto">What the bot actually saw</span>
      </div>

      {/* Stage tabs */}
      <div className="flex gap-1 p-1 bg-muted/40 rounded-lg">
        {stages.map(s => (
          <button
            key={s.key}
            onClick={() => setActive(s.key)}
            className={cn(
              'flex-1 py-1.5 text-xs font-medium rounded-md transition-all',
              active === s.key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Screenshot image */}
      {stages.filter(s => s.key === active).map(s => (
        <div key={s.key} className="rounded-lg overflow-hidden border border-border bg-muted/20">
          <img
            src={s.url}
            alt={s.label}
            className="w-full object-top object-cover max-h-80"
            style={{ display: 'none' }}
            onLoad={e => { (e.target as HTMLImageElement).style.display = 'block'; }}
            onError={e => {
              const img = e.target as HTMLImageElement;
              img.style.display = 'none';
              const ph = document.createElement('div');
              ph.className = 'flex flex-col items-center justify-center py-10 text-sm text-muted-foreground gap-2';
              ph.innerHTML = '<span style="font-size:1.5rem">📷</span><span>Screenshot not available for this stage</span>';
              img.parentElement?.appendChild(ph);
            }}
          />
          <div className="px-3 py-2 border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{s.label}</span>
            <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
              Open full size <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

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
    refetchInterval: (query) => {
      // Auto-refresh while pending so user sees live updates
      const status = query.state.data?.application?.status;
      return status === 'pending' ? 3000 : false;
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

  const { mutate: cancelApplication, isPending: isCancelling } = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/applications/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Cancel failed');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Application cancelled');
      qc.invalidateQueries({ queryKey: ['application', id] });
      qc.invalidateQueries({ queryKey: ['applications'] });
    },
    onError: () => toast.error('Failed to cancel application'),
  });

  if (isLoading) return <LoadingSpinner />;
  if (!data) return <div className="p-8 text-muted-foreground">Application not found.</div>;

  const { application, job, logs = [] } = data;
  const status = STATUS_CONFIG[application.status] ?? STATUS_CONFIG['pending'];
  const isManualReviewNeeded = ['manual_review', 'pending_confirmation'].includes(application.status);

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-5 pb-16">

      {/* ── Header ── */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 shrink-0 mt-0.5">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">{job.title}</h1>
          <p className="text-sm text-muted-foreground">{job.company} · {job.location ?? 'Remote'}</p>
        </div>
        <a href={job.applyUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
            <ExternalLink className="h-3.5 w-3.5" /> View Job
          </Button>
        </a>
      </div>

      {/* ── Status banner ── */}
      <div className={cn('rounded-xl border p-4 flex items-start gap-3', status.bg, status.border)}>
        <div className={cn('mt-0.5 shrink-0', status.color)}>{status.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('text-sm font-semibold', status.color)}>{status.label}</span>
            {application.status === 'pending' && (
              <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                <Loader2 className="h-3 w-3 animate-spin" /> Processing…
              </span>
            )}
          </div>
          <p className={cn('text-xs mt-0.5 leading-relaxed', status.color, 'opacity-80')}>{status.desc}</p>
          {application.errorMessage && (
            <p className="text-xs mt-1 font-medium text-red-600 dark:text-red-400">
              Reason: {application.errorMessage}
            </p>
          )}
        </div>
        {isManualReviewNeeded && (
          <button
            onClick={() => router.push('/settings')}
            className={cn('shrink-0 flex items-center gap-1 text-xs font-semibold', status.color, 'hover:underline')}
          >
            <Settings className="h-3 w-3" /> Settings <ChevronRight className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* ── What bot did warning ── */}
      {isManualReviewNeeded && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 p-4 flex gap-3">
          <Bot className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed space-y-1">
            <p className="font-semibold text-sm">Form was NOT submitted automatically</p>
            <p>To enable the bot to fill and submit forms automatically, go to <strong>Settings → Auto-Apply</strong> and:</p>
            <ul className="list-disc list-inside space-y-0.5 ml-1">
              <li>Turn <strong>Enable Auto-Apply</strong> ON</li>
              <li>Turn <strong>Require Confirmation</strong> OFF</li>
            </ul>
          </div>
        </div>
      )}

      {/* ── Application meta ── */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Application Details</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          {[
            { label: 'Method',   value: application.method ?? 'auto' },
            { label: 'Attempts', value: application.attemptCount ?? 1 },
            { label: 'Applied',  value: application.appliedAt ? new Date(application.appliedAt).toLocaleDateString() : '—' },
            { label: 'Created',  value: new Date(application.createdAt).toLocaleDateString() },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
              <p className="font-medium capitalize">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bot activity log ── */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bot className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Bot Activity Log</h3>
          <span className="ml-auto text-xs text-muted-foreground">{logs.length} steps</span>
        </div>

        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Bot className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No activity recorded yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Logs will appear here once the bot starts processing</p>
          </div>
        ) : (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[13px] top-0 bottom-0 w-px bg-border" />
            <div className="space-y-4">
              {logs.map((log: any, i: number) => (
                <div key={log.id ?? i} className="flex gap-3 relative">
                  <div className="h-7 w-7 rounded-full bg-card border border-border flex items-center justify-center shrink-0 z-10">
                    {LOG_ICON[log.level] ?? <Info className="h-3.5 w-3.5 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-sm leading-relaxed text-foreground">{log.message}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {log.createdAt ? new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}
                    </p>
                  </div>
                </div>
              ))}
              {/* Final dot */}
              <div className="flex gap-3 relative">
                <div className={cn(
                  'h-7 w-7 rounded-full border-2 flex items-center justify-center shrink-0 z-10',
                  application.status === 'applied'
                    ? 'border-green-500 bg-green-50 dark:bg-green-950'
                    : application.status === 'failed'
                      ? 'border-red-500 bg-red-50 dark:bg-red-950'
                      : 'border-border bg-muted'
                )}>
                  {application.status === 'applied'
                    ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                    : application.status === 'failed'
                      ? <XCircle className="h-4 w-4 text-red-500" />
                      : <Clock className="h-4 w-4 text-muted-foreground" />}
                </div>
                <div className="flex-1 pt-0.5">
                  <p className="text-sm font-medium">{status.label}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Screenshots ── */}
      <ScreenshotViewer applicationId={id} screenshotPath={application.screenshotPath} />

      {/* ── Retry button for failed apps ── */}
      {application.status === 'failed' && (
        <div className="rounded-xl border border-border bg-card p-5 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">Retry Application</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Re-queue this application for the bot to try again</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateStatus('pending')}
            disabled={isPending}
            className="shrink-0 gap-1.5"
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Retry
          </Button>
        </div>
      )}

      {/* ── Cancel Application ── */}
      {['pending', 'failed', 'manual_review', 'pending_confirmation'].includes(application.status) && (
        <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/30 p-5 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-red-700 dark:text-red-400">Cancel Application</h3>
            <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-0.5">Remove this job from the queue and stop the bot from processing it.</p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (confirm('Are you sure you want to cancel this application?')) {
                cancelApplication();
              }
            }}
            disabled={isCancelling}
            className="shrink-0 gap-1.5"
          >
            {isCancelling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Ban className="h-3.5 w-3.5" />}
            Cancel
          </Button>
        </div>
      )}

      {/* ── Update status ── */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h3 className="text-sm font-semibold">Update Status Manually</h3>
        <p className="text-xs text-muted-foreground">Override the bot's status — useful when you applied manually or got a response.</p>
        <div className="flex flex-wrap gap-2">
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => updateStatus(s)}
              disabled={isPending || application.status === s}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-medium border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                application.status === s
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                  : 'border-border bg-card hover:border-primary hover:bg-primary/5 hover:text-primary disabled:opacity-40 cursor-pointer'
              )}
            >
              {s === 'manual_review' ? 'Needs Attention' : s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
