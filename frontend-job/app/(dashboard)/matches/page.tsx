'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useResumes } from '@/lib/hooks/use-resume';
import { useMatchJobs, type MatchFilters } from '@/lib/hooks/use-jobs';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Star, Zap, Layers, Bookmark, BookmarkCheck, DollarSign, SlidersHorizontal, TrendingUp, ExternalLink, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useState, useMemo } from 'react';

// ── Score badge ──────────────────────────────────────────────────────────────
function ScoreBadge({ score }: { score: number }) {
  const cls =
    score >= 80 ? 'bg-green-500 text-white' :
    score >= 60 ? 'bg-yellow-500 text-white' :
                  'bg-gray-400 text-white';
  const label =
    score >= 80 ? '🔥 Strong match' :
    score >= 60 ? '👍 Good match'   :
                  '⚡ Possible';
  return <Badge className={cn(cls, 'shrink-0')}>{Math.round(score)}% · {label}</Badge>;
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

// ── Score thresholds for filter buttons ──────────────────────────────────────
const FILTERS = [
  { label: 'All',       min: 0  },
  { label: '60%+',      min: 60 },
  { label: '75%+',      min: 75 },
  { label: '85%+ 🔥',  min: 85 },
] as const;

type SortKey = 'score' | 'date' | 'company';

export default function MatchesPage() {
  const { data: resumes } = useResumes();
  const activeResume = resumes?.find((r: any) => r.isActive) ?? resumes?.[0];
  const { mutate: matchJobs, isPending: isMatching } = useMatchJobs();
  const qc = useQueryClient();

  const [minScore, setMinScore]   = useState(0);
  const [sortKey,  setSortKey]    = useState<SortKey>('score');
  const [saving,   setSaving]     = useState<string | null>(null);
  const [lowScoreJob, setLowScoreJob] = useState<{ id: string; score: number; title: string } | null>(null);
  const [bulkMin,  setBulkMin]    = useState(75); // min score for bulk apply

  // ── AI match filters (user-controlled) ───────────────────────────────────
  const [showFilters, setShowFilters] = useState(false);
  const [filterRole,       setFilterRole]       = useState('');
  const [filterLocation,   setFilterLocation]   = useState('');
  const [filterRemote,     setFilterRemote]     = useState<MatchFilters['remote']>('any');
  const [filterExperience, setFilterExperience] = useState<MatchFilters['experience']>('any');
  const [filterDatePosted, setFilterDatePosted] = useState<MatchFilters['datePosted']>('any');

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data: matches, isLoading } = useQuery({
    queryKey: ['matches', activeResume?.id],
    queryFn: async () => {
      if (!activeResume?.id) return [];
      const res = await fetch(`/api/jobs/matches?resumeId=${activeResume.id}`);
      if (!res.ok) throw new Error('Failed to load matches');
      return res.json();
    },
    enabled: !!activeResume?.id,
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

  // ── Mutations ──────────────────────────────────────────────────────────────
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

  const { mutate: bulkApply, isPending: isBulkApplying } = useMutation({
    mutationFn: async () => {
      if (!activeResume?.id) throw new Error('Upload a resume first');
      const res = await fetch('/api/jobs/bulk-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId: activeResume.id, minMatchScore: bulkMin }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Bulk apply failed');
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(data.queued > 0 ? data.message : 'No jobs met the score threshold.');
      qc.invalidateQueries({ queryKey: ['matches'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function toggleSave(jobId: string) {
    const isSaved = savedJobIds?.includes(jobId);
    setSaving(jobId);
    try {
      if (isSaved) {
        await fetch(`/api/jobs/saved?jobId=${jobId}`, { method: 'DELETE' });
        toast.success('Removed from saved');
      } else {
        await fetch('/api/jobs/saved', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId }),
        });
        toast.success('Saved to watchlist');
      }
      refetchSaved();
    } finally {
      setSaving(null);
    }
  }

  function runMatching() {
    if (!activeResume?.id) { toast.error('Upload a resume first'); return; }
    const filters: MatchFilters = {};
    if (filterRole.trim())                          filters.role       = filterRole.trim();
    if (filterLocation.trim())                      filters.location   = filterLocation.trim();
    if (filterRemote     && filterRemote     !== 'any') filters.remote     = filterRemote;
    if (filterExperience && filterExperience !== 'any') filters.experience = filterExperience;
    if (filterDatePosted && filterDatePosted !== 'any') filters.datePosted = filterDatePosted;
    matchJobs({ resumeId: activeResume.id, filters }, {
      onSuccess: () => toast.success('Matching complete!'),
      onError:   () => toast.error('Matching failed. Check your OpenAI API key.'),
    });
  }

  // ── Filtered + sorted list ─────────────────────────────────────────────────
  const displayed = useMemo(() => {
    if (!matches) return [];
    return [...matches]
      .filter((m: any) => m.match.score >= minScore)
      .sort((a: any, b: any) => {
        if (sortKey === 'score')   return b.match.score - a.match.score;
        if (sortKey === 'company') return a.job.company.localeCompare(b.job.company);
        if (sortKey === 'date')    return new Date(b.job.postedAt ?? 0).getTime() - new Date(a.job.postedAt ?? 0).getTime();
        return 0;
      });
  }, [matches, minScore, sortKey]);

  // ── Stats bar ──────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    if (!matches?.length) return null;
    const strong = matches.filter((m: any) => m.match.score >= 80).length;
    const good   = matches.filter((m: any) => m.match.score >= 60 && m.match.score < 80).length;
    const avg    = Math.round(matches.reduce((s: number, m: any) => s + m.match.score, 0) / matches.length);
    return { strong, good, avg, total: matches.length };
  }, [matches]);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="p-4 md:p-8 space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">AI Matched Jobs</h2>
          <p className="text-muted-foreground">
            {stats
              ? `${stats.total} jobs ranked · avg ${stats.avg}% match`
              : 'Jobs ranked by how well they match your resume'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button onClick={() => setShowFilters(v => !v)} variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {showFilters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
          <Button onClick={runMatching} disabled={isMatching} variant="outline">
            <Zap className="mr-2 h-4 w-4" />
            {isMatching ? 'Matching...' : 'Run AI Match'}
          </Button>
          <Button
            onClick={() => bulkApply()}
            disabled={isBulkApplying || !displayed.length}
            title={`Auto-apply to all jobs with ${bulkMin}%+ match score`}
          >
            {isBulkApplying
              ? <LoadingSpinner size="sm" fullPage={false} className="mr-2" />
              : <Layers className="mr-2 h-4 w-4" />}
            {isBulkApplying ? 'Applying...' : `Bulk Apply ${bulkMin}%+`}
          </Button>
        </div>
      </div>

      {/* ── AI Match filter panel ── */}
      {showFilters && (
        <Card className="border-dashed">
          <CardContent className="p-4 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">AI Match Filters — only jobs matching these criteria will be scored</p>

            {/* Role + Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Role / Job title</label>
                <Input
                  placeholder="e.g. Software Engineer"
                  value={filterRole}
                  onChange={e => setFilterRole(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Location</label>
                <Input
                  placeholder="e.g. India, New York, Remote"
                  value={filterLocation}
                  onChange={e => setFilterLocation(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>

            {/* Remote preference */}
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Work type</label>
              <div className="flex flex-wrap gap-1.5">
                {(['any', 'remote', 'hybrid', 'onsite'] as const).map(v => (
                  <button
                    key={v}
                    onClick={() => setFilterRemote(v)}
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-medium border capitalize transition-colors',
                      filterRemote === v
                        ? 'bg-primary text-white border-primary'
                        : 'border-border text-muted-foreground hover:border-foreground/40'
                    )}
                  >
                    {v === 'any' ? 'Any' : v === 'onsite' ? 'On-site' : v.charAt(0).toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Experience level */}
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Experience level</label>
              <div className="flex flex-wrap gap-1.5">
                {([
                  { value: 'any',     label: 'Any'      },
                  { value: 'fresher', label: 'Fresher'  },
                  { value: '1-2',     label: '1–2 yrs'  },
                  { value: '2-3',     label: '2–3 yrs'  },
                  { value: '3-5',     label: '3–5 yrs'  },
                  { value: '5-7',     label: '5–7 yrs'  },
                  { value: 'senior',  label: 'Senior'   },
                ] as const).map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setFilterExperience(value)}
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-medium border transition-colors',
                      filterExperience === value
                        ? 'bg-primary text-white border-primary'
                        : 'border-border text-muted-foreground hover:border-foreground/40'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date posted */}
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Date posted</label>
              <div className="flex flex-wrap gap-1.5">
                {([
                  { value: 'any', label: 'Any time' },
                  { value: '1d',  label: 'Today'    },
                  { value: '3d',  label: '3 days'   },
                  { value: '7d',  label: '7 days'   },
                  { value: '30d', label: '30 days'  },
                ] as const).map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setFilterDatePosted(value)}
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-medium border transition-colors',
                      filterDatePosted === value
                        ? 'bg-primary text-white border-primary'
                        : 'border-border text-muted-foreground hover:border-foreground/40'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Stats summary ── */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <CardContent className="p-4 flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.strong}</p>
                <p className="text-xs text-green-600/80">Strong matches (80%+)</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
            <CardContent className="p-4 flex items-center gap-3">
              <Star className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{stats.good}</p>
                <p className="text-xs text-yellow-600/80">Good matches (60–79%)</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Zap className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.avg}%</p>
                <p className="text-xs text-muted-foreground">Average match score</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Filters + sort bar ── */}
      {!!matches?.length && (
        <div className="flex flex-wrap items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="flex gap-1">
            {FILTERS.map(f => (
              <button
                key={f.min}
                onClick={() => setMinScore(f.min)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-semibold border transition-colors',
                  minScore === f.min
                    ? 'bg-primary text-white border-primary'
                    : 'border-border text-muted-foreground hover:border-foreground/40'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            <span>Sort:</span>
            {(['score', 'date', 'company'] as SortKey[]).map(k => (
              <button
                key={k}
                onClick={() => setSortKey(k)}
                className={cn(
                  'capitalize px-2 py-1 rounded border transition-colors',
                  sortKey === k ? 'border-primary text-primary' : 'border-border hover:border-foreground/40'
                )}
              >
                {k}
              </button>
            ))}
          </div>
          {/* Bulk apply min score selector */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground border-l pl-3 ml-1">
            <span>Bulk min:</span>
            {[60, 70, 75, 80, 85].map(v => (
              <button
                key={v}
                onClick={() => setBulkMin(v)}
                className={cn(
                  'px-1.5 py-0.5 rounded border text-xs transition-colors',
                  bulkMin === v ? 'border-primary text-primary font-bold' : 'border-border hover:border-foreground/40'
                )}
              >
                {v}%
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Job list ── */}
      {!matches?.length ? (
        <EmptyState
          icon={Star}
          title="No matches yet"
          description="Click 'Run AI Match' to score all discovered jobs against your resume. Make sure you've uploaded a resume first."
          action={<Button onClick={runMatching} disabled={isMatching}><Zap className="mr-2 h-4 w-4" />Run AI Match</Button>}
        />
      ) : !displayed.length ? (
        <EmptyState
          icon={SlidersHorizontal}
          title={`No jobs above ${minScore}% match`}
          description="Lower the score filter to see more results."
          action={<Button variant="outline" onClick={() => setMinScore(0)}>Show all</Button>}
        />
      ) : (
        <div className="space-y-3">
          {displayed.map((m: any) => {
            const isSaved = savedJobIds?.includes(m.job.id);
            const isApplying = applying && applyingId === m.job.id;
            return (
              <Card key={m.match.id} className={cn(
                'hover:shadow-md transition-all duration-150',
                m.match.score >= 80 && 'border-green-200 dark:border-green-800/50'
              )}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Title row */}
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-base font-semibold truncate">{m.job.title}</h3>
                        <ScoreBadge score={m.match.score} />
                        <SourceBadge source={m.job.source} />
                      </div>

                      {/* Company + salary */}
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <p className="text-sm text-muted-foreground">
                          {m.job.company} · {m.job.location ?? 'Remote'}
                        </p>
                        <SalaryBadge min={m.job.salaryMin} max={m.job.salaryMax} currency={m.job.salaryCurrency} />
                      </div>

                      {/* Score bar */}
                      <div className="mb-3">
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all',
                              m.match.score >= 80 ? 'bg-green-500' :
                              m.match.score >= 60 ? 'bg-yellow-500' : 'bg-gray-400'
                            )}
                            style={{ width: `${m.match.score}%` }}
                          />
                        </div>
                      </div>

                      {/* Strengths / gaps */}
                      <div className="grid grid-cols-2 gap-3 mb-2">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Strengths</p>
                          <ul className="space-y-0.5">
                            {(m.match.strengths ?? []).slice(0, 3).map((s: string, i: number) => (
                              <li key={i} className="text-xs text-green-600 dark:text-green-400 truncate">✓ {s}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Gaps</p>
                          <ul className="space-y-0.5">
                            {(m.match.weaknesses ?? []).slice(0, 3).map((w: string, i: number) => (
                              <li key={i} className="text-xs text-yellow-600 dark:text-yellow-400 truncate">⚠ {w}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {m.match.recommendation && (
                        <p className="text-xs italic text-muted-foreground line-clamp-2">{m.match.recommendation}</p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col gap-2 shrink-0">
                      <a
                        href={m.job.applyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5')}
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> View
                      </a>
                      <Button
                        onClick={() => {
                          if (m.match.score < 65) {
                            setLowScoreJob({ id: m.job.id, score: Math.round(m.match.score), title: m.job.title });
                          } else {
                            applyJob(m.job.id);
                          }
                        }}
                        disabled={isApplying}
                        variant="outline"
                        size="sm"
                      >
                        {isApplying ? 'Queuing...' : 'Auto-Apply'}
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

      {/* ── Low score warning dialog ── */}
      {lowScoreJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/40">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="font-semibold text-sm">Low Match Score</p>
                <p className="text-xs text-muted-foreground">Only {lowScoreJob.score}% match</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              <span className="font-medium text-foreground">{lowScoreJob.title}</span> is only a <span className="font-bold text-yellow-600">{lowScoreJob.score}%</span> match. Applying to low-match jobs reduces your response rate.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setLowScoreJob(null)}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white"
                onClick={() => { applyJob(lowScoreJob.id); setLowScoreJob(null); }}
              >
                Apply Anyway
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
