'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { StatsCard } from '@/components/shared/StatsCard';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  Building2, Zap, Plus, ExternalLink, RefreshCw,
  Briefcase, Globe, CheckCircle2, Loader2, AlertCircle, ChevronRight,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { useState, type ChangeEvent } from 'react';
import { timeAgo } from '@/lib/utils/helpers';
import { cn } from '@/lib/utils';

// ─── ATS colours ─────────────────────────────────────────────────────────────
const ATS_COLORS: Record<string, string> = {
  greenhouse:     'bg-green-100  text-green-800  dark:bg-green-900  dark:text-green-200',
  lever:          'bg-blue-100   text-blue-800   dark:bg-blue-900   dark:text-blue-200',
  workday:        'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  ashby:          'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  bamboohr:       'bg-teal-100   text-teal-800   dark:bg-teal-900   dark:text-teal-200',
  smartrecruiters:'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  custom:         'bg-gray-100   text-gray-700   dark:bg-gray-800   dark:text-gray-300',
  none:           'bg-red-100    text-red-700',
  unknown:        'bg-yellow-100 text-yellow-800',
};

// ─── Discovery sources config ─────────────────────────────────────────────────
const SOURCES = [
  { key: 'seed',      label: 'Known Companies', emoji: '🏢', desc: '50+ top tech companies' },
  { key: 'yc',        label: 'Y Combinator',    emoji: '🚀', desc: 'YC portfolio startups' },
  { key: 'github',    label: 'GitHub Trending', emoji: '⭐', desc: 'Trending open-source companies' },
  { key: 'vc',        label: 'VC Portfolios',   emoji: '💼', desc: 'a16z, Sequoia, Accel, etc.' },
  { key: 'wellfound', label: 'Wellfound',        emoji: '🔍', desc: 'Startup job board' },
] as const;

type SourceKey = typeof SOURCES[number]['key'];
type SourceStatus = 'idle' | 'running' | 'done' | 'error';

// ─── Skeleton page loader — mirrors exact layout ──────────────────────────────

function CompaniesPageSkeleton() {
  return (
    <div className="p-4 md:p-8 space-y-6 pb-16 animate-pulse">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 rounded-lg" />
          <Skeleton className="h-4 w-80 rounded-md" />
        </div>
        <div className="flex flex-wrap gap-2">
          {[140, 130, 140, 120].map((w, i) => (
            <Skeleton key={i} className="h-9 rounded-md" style={{ width: w }} />
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 md:p-6 shadow-sm space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-3 w-16 rounded-md" />
                <Skeleton className="h-8 w-12 rounded-md" />
              </div>
              <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
            </div>
          </div>
        ))}
      </div>

      {/* ATS breakdown */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <Skeleton className="h-4 w-24 rounded-md" />
        <div className="flex gap-2 flex-wrap">
          {[60, 80, 55, 70, 65, 50].map((w, i) => (
            <Skeleton key={i} className="h-6 rounded-full" style={{ width: w }} />
          ))}
        </div>
      </div>

      {/* Add manually card */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <Skeleton className="h-4 w-40 rounded-md" />
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1 rounded-md" />
          <Skeleton className="h-10 w-20 rounded-md" />
        </div>
      </div>

      {/* Search */}
      <Skeleton className="h-10 w-full rounded-md" />

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-2 border-b border-border bg-muted">
          <Skeleton className="h-3 w-40 rounded-md" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead className="bg-muted/50">
              <tr>
                {['Company', 'ATS', 'Source', 'Jobs', 'Funding', 'Discovered', 'Links'].map(h => (
                  <th key={h} className="p-3 text-left">
                    <Skeleton className="h-3 rounded-md" style={{ width: h.length * 7 }} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-5 rounded shrink-0" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-3.5 w-28 rounded-md" />
                        <Skeleton className="h-2.5 w-16 rounded-md" />
                      </div>
                    </div>
                  </td>
                  <td className="p-3"><Skeleton className="h-5 w-20 rounded-full" /></td>
                  <td className="p-3"><Skeleton className="h-5 w-14 rounded-full" /></td>
                  <td className="p-3"><Skeleton className="h-4 w-8 rounded-md" /></td>
                  <td className="p-3"><Skeleton className="h-3 w-16 rounded-md" /></td>
                  <td className="p-3"><Skeleton className="h-3 w-20 rounded-md" /></td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Skeleton className="h-6 w-6 rounded" />
                      <Skeleton className="h-6 w-6 rounded" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Discovery progress card ──────────────────────────────────────────────────

function DiscoveryProgressCard({
  progress,
  results,
}: {
  progress: Record<SourceKey, SourceStatus>;
  results: Record<SourceKey, number>;
}) {
  const total = Object.values(results).reduce((s, n) => s + n, 0);
  const allDone = SOURCES.every(s => progress[s.key] === 'done' || progress[s.key] === 'error');
  const doneCount = SOURCES.filter(s => progress[s.key] === 'done' || progress[s.key] === 'error').length;
  const overallPct = Math.round((doneCount / SOURCES.length) * 100);

  return (
    <div className={cn(
      'rounded-2xl border p-5 transition-all duration-500',
      allDone
        ? 'border-green-300 dark:border-green-700 bg-gradient-to-br from-green-50 to-emerald-50/60 dark:from-green-950/30 dark:to-emerald-950/20'
        : 'border-primary/30 bg-gradient-to-br from-primary/5 to-violet-500/5 dark:from-primary/10 dark:to-violet-500/10',
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full shadow-sm',
            allDone ? 'bg-green-500' : 'bg-primary',
          )}>
            {allDone
              ? <CheckCircle2 className="h-4 w-4 text-white" />
              : <Sparkles className="h-4 w-4 text-white animate-pulse" />}
          </div>
          <div>
            <p className="text-sm font-semibold">
              {allDone ? 'Discovery complete' : 'Discovering companies…'}
            </p>
            {allDone && (
              <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                {total} new companies added
              </p>
            )}
          </div>
        </div>
        {!allDone && (
          <span className="text-xs font-bold tabular-nums text-primary">
            {overallPct}%
          </span>
        )}
      </div>

      {/* Overall progress bar */}
      {!allDone && (
        <div className="mb-4 h-1.5 w-full rounded-full bg-primary/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
            style={{ width: `${overallPct}%` }}
          />
        </div>
      )}

      {/* Per-source rows */}
      <div className="space-y-3">
        {SOURCES.map((s, idx) => {
          const st = progress[s.key];
          const n  = results[s.key];
          return (
            <div key={s.key} className="flex items-center gap-3">
              {/* Emoji */}
              <div className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm',
                st === 'idle'    && 'bg-muted text-muted-foreground/50',
                st === 'running' && 'bg-primary/10 ring-1 ring-primary/30',
                st === 'done'    && 'bg-green-100 dark:bg-green-900/30',
                st === 'error'   && 'bg-red-100 dark:bg-red-900/30',
              )}>
                {s.emoji}
              </div>

              {/* Label + bar */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1 gap-2">
                  <span className={cn(
                    'text-xs font-medium truncate',
                    st === 'idle' ? 'text-muted-foreground' : 'text-foreground',
                  )}>
                    {s.label}
                    {st === 'running' && (
                      <span className="ml-1.5 inline-flex gap-0.5">
                        {[0,1,2].map(d => (
                          <span key={d} className="inline-block h-1 w-1 rounded-full bg-primary animate-bounce"
                            style={{ animationDelay: `${d * 150}ms` }} />
                        ))}
                      </span>
                    )}
                  </span>
                  <span className={cn(
                    'text-xs font-semibold shrink-0',
                    st === 'done'    && 'text-green-600 dark:text-green-400',
                    st === 'error'   && 'text-red-500',
                    st === 'running' && 'text-primary',
                    st === 'idle'    && 'text-muted-foreground/50',
                  )}>
                    {st === 'done'  && `+${n}`}
                    {st === 'error' && 'Failed'}
                    {st === 'running' && s.desc}
                    {st === 'idle' && s.desc}
                  </span>
                </div>
                <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                  <div className={cn(
                    'h-full rounded-full transition-all duration-700',
                    st === 'idle'    && 'w-0',
                    st === 'running' && 'w-3/5 bg-primary',
                    st === 'done'    && 'w-full bg-green-500',
                    st === 'error'   && 'w-full bg-red-400',
                  )} />
                </div>
              </div>

              {/* Status icon */}
              <div className="w-5 shrink-0 flex justify-center">
                {st === 'running' && <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />}
                {st === 'done'    && <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
                {st === 'error'   && <AlertCircle  className="h-3.5 w-3.5 text-red-400" />}
                {st === 'idle'    && <ChevronRight  className="h-3.5 w-3.5 text-muted-foreground/30" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Scrape progress card ─────────────────────────────────────────────────────

function ScrapeProgressCard({ scraped, jobsFound, total }: { scraped: number; jobsFound: number; total: number }) {
  const pct = total > 0 ? Math.min(Math.round((scraped / total) * 100), 97) : 5;

  return (
    <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-sky-50/60 dark:from-blue-950/30 dark:to-sky-950/20 p-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-blue-500 shadow-lg shadow-blue-500/30">
          <Briefcase className="h-4 w-4 text-white" />
          <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-400 border-2 border-white dark:border-blue-950 animate-pulse" />
        </div>
        <div>
          <p className="text-sm font-semibold">Scraping job boards</p>
          <p className="text-xs text-muted-foreground">Fetching live listings from each ATS…</p>
        </div>
        <span className="ml-auto text-sm font-bold tabular-nums text-blue-600 dark:text-blue-400">
          {pct}%
        </span>
      </div>

      {/* Big counters */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-xl bg-white/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-800 p-3">
          <p className="text-2xl font-black tabular-nums text-blue-600 dark:text-blue-300 leading-none">
            {jobsFound.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">jobs found</p>
        </div>
        <div className="rounded-xl bg-white/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-800 p-3">
          <p className="text-2xl font-black tabular-nums text-slate-700 dark:text-slate-300 leading-none">
            {scraped} <span className="text-sm font-semibold text-muted-foreground">/ {total}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">companies</p>
        </div>
      </div>

      {/* Glowing progress bar */}
      <div className="relative h-2.5 w-full rounded-full bg-blue-100 dark:bg-blue-900/50 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-sky-400 transition-all duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
        {/* Shimmer sweep */}
        <div
          className="absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_1.5s_ease-in-out_infinite]"
          style={{ left: `calc(${pct}% - 2rem)` }}
        />
      </div>
      <p className="mt-2.5 text-xs text-muted-foreground">
        This may take a minute — boards are scraped live via public APIs
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const IDLE_PROGRESS = Object.fromEntries(SOURCES.map(s => [s.key, 'idle'])) as Record<SourceKey, SourceStatus>;
const IDLE_RESULTS  = Object.fromEntries(SOURCES.map(s => [s.key, 0]))    as Record<SourceKey, number>;

export default function CompaniesPage() {
  const qc = useQueryClient();
  const [search,  setSearch]  = useState('');
  const [addUrl,  setAddUrl]  = useState('');
  const [roleQuery, setRoleQuery] = useState('');
  const [experience, setExperience] = useState('any');
  const [customExp, setCustomExp] = useState('');
  const [isAdding,  setIsAdding]  = useState(false);

  // Discovery state — per-source
  const [discovering,    setDiscovering]    = useState(false);
  const [discProgress,   setDiscProgress]   = useState<Record<SourceKey, SourceStatus>>(IDLE_PROGRESS);
  const [discResults,    setDiscResults]    = useState<Record<SourceKey, number>>(IDLE_RESULTS);
  const [discDone,       setDiscDone]       = useState(false);

  // Scraping state
  const [isScraping,   setIsScraping]   = useState(false);
  const [scrapeStats,  setScrapeStats]  = useState<{ scraped: number; jobsFound: number; total: number } | null>(null);
  const [scrapeResult, setScrapeResult] = useState<{ scraped: number; jobsFound: number; errors: number } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const res = await fetch('/api/companies');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const companies: any[] = data?.companies ?? [];
  const stats: any       = data?.stats ?? {};

  const filtered = companies.filter((c: any) =>
    !search ||
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.source?.toLowerCase().includes(search.toLowerCase()) ||
    c.industry?.toLowerCase().includes(search.toLowerCase()) ||
    c.atsType?.toLowerCase().includes(search.toLowerCase())
  );

  // ── Run discovery source-by-source for live progress ─────────────────────
  async function runDiscovery(sourcesToRun: SourceKey[]) {
    setDiscovering(true);
    setDiscDone(false);
    setDiscResults(IDLE_RESULTS);
    const initialProgress = { ...IDLE_PROGRESS };
    sourcesToRun.forEach(s => { initialProgress[s] = 'idle'; });
    // Mark non-selected as skipped (keep idle)
    setDiscProgress(initialProgress);

    let totalNew = 0;
    for (const source of sourcesToRun) {
      setDiscProgress(prev => ({ ...prev, [source]: 'running' }));
      try {
        const res = await fetch('/api/companies/discover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sources: [source], skipAtsDetection: true }),
        });
        const data = await res.json();
        const n = data.newCompanies ?? 0;
        totalNew += n;
        setDiscResults(prev => ({ ...prev, [source]: n }));
        setDiscProgress(prev => ({ ...prev, [source]: 'done' }));
      } catch {
        setDiscProgress(prev => ({ ...prev, [source]: 'error' }));
      }
    }

    setDiscDone(true);
    setDiscovering(false);
    toast.success(`Discovery done — ${totalNew} new companies added`);
    qc.invalidateQueries({ queryKey: ['companies'] });
  }

  // ── Scrape jobs from company ATSs ─────────────────────────────────────────
  async function scrapeJobs() {
    const companyCount = companies.filter((c: any) => c.scrapingEnabled !== false && c.atsUrl).length;
    setIsScraping(true);
    setScrapeResult(null);
    setScrapeStats({ scraped: 0, jobsFound: 0, total: Math.min(companyCount, 20) });

    // Simulate incremental progress while the real request runs
    let fakeScraped = 0;
    let fakeJobs = 0;
    const total = Math.min(companyCount || 10, 20);
    const progressInterval = setInterval(() => {
      if (fakeScraped < total - 1) {
        fakeScraped++;
        fakeJobs += Math.floor(Math.random() * 4);
        setScrapeStats({ scraped: fakeScraped, jobsFound: fakeJobs, total });
      }
    }, 800);

    try {
      const res = await fetch('/api/companies/scrape-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          limit: 50, 
          query: roleQuery,
          experience: experience === 'custom' ? customExp : experience
        }),
      });
      clearInterval(progressInterval);
      if (!res.ok) throw new Error('Failed');
      const result = await res.json();
      setScrapeResult(result);
      setScrapeStats(null);
      toast.success(`Scraped ${result.scraped} companies — found ${result.jobsFound} new jobs`);
      qc.invalidateQueries({ queryKey: ['companies'] });
      qc.invalidateQueries({ queryKey: ['jobs'] });
    } catch {
      clearInterval(progressInterval);
      setScrapeStats(null);
      toast.error('Job scraping failed. Check server logs.');
    } finally {
      setIsScraping(false);
    }
  }

  // ── Add manual ────────────────────────────────────────────────────────────
  async function addManual() {
    if (!addUrl.trim()) return;
    setIsAdding(true);
    try {
      const res = await fetch('/api/companies/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: addUrl }),
      });
      if (!res.ok) throw new Error('Failed');
      const result = await res.json();
      toast.success(`Added ${result.name} — ATS: ${result.atsType ?? 'unknown'}`);
      setAddUrl('');
      qc.invalidateQueries({ queryKey: ['companies'] });
    } catch {
      toast.error('Could not detect company from that URL.');
    } finally {
      setIsAdding(false);
    }
  }

  if (isLoading) return <CompaniesPageSkeleton />;

  const showDiscoveryCard = discovering || discDone;
  const showScrapeCard    = isScraping && scrapeStats;

  return (
    <div className="p-4 md:p-8 space-y-6 pb-16">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <div>
            <h2 className="text-2xl font-bold">Company Discovery</h2>
            <p className="text-muted-foreground">
              Auto-discover every startup & company — YC, GitHub, VC portfolios, and more
            </p>
          </div>
          
          {/* Experience Level Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground mr-1 uppercase tracking-wider">Experience:</span>
            {[
              { value: 'any',      label: 'Any' },
              { value: 'fresher',  label: 'Fresher' },
              { value: '1-2',      label: '1–2 yrs' },
              { value: '2-3',      label: '2–3 yrs' },
              { value: '3-5',      label: '3–5 yrs' },
              { value: '5-7',      label: '5–7 yrs' },
              { value: 'senior',   label: 'Senior (7+)' },
              { value: 'custom',   label: '✏ Custom' },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setExperience(value)}
                className={cn(
                  'px-2.5 py-1 rounded-md text-[10px] font-bold uppercase transition-all border',
                  experience === value
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20'
                    : 'bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-primary'
                )}
              >
                {label}
              </button>
            ))}
            {experience === 'custom' && (
              <Input
                className="h-6 w-24 text-[10px] px-2 py-0"
                placeholder="Years..."
                value={customExp}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setCustomExp(e.target.value)}
                autoFocus
              />
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => runDiscovery(['seed'])}
            disabled={discovering || isScraping}
            variant="outline"
            size="sm"
          >
            {discovering && discProgress['seed'] === 'running'
              ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              : <Building2 className="mr-2 h-4 w-4" />}
            Load Known Companies
          </Button>
          <Button
            onClick={() => runDiscovery(['yc', 'github', 'vc', 'wellfound'])}
            disabled={discovering || isScraping}
            variant="outline"
            size="sm"
          >
            {discovering
              ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              : <Zap className="mr-2 h-4 w-4" />}
            Discover Startups
          </Button>
          <Button
            onClick={() => runDiscovery(['seed', 'yc', 'github', 'vc', 'wellfound'])}
            disabled={discovering || isScraping}
            size="sm"
          >
            {discovering
              ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              : <Zap className="mr-2 h-4 w-4" />}
            {discovering ? 'Discovering…' : 'Auto-Discover All'}
          </Button>
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1 border border-border shadow-sm">
            <Input
              placeholder="Job Title (e.g. Engineer)"
              value={roleQuery}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setRoleQuery(e.target.value)}
              className="h-8 w-44 bg-transparent border-none focus-visible:ring-0 shadow-none text-xs"
            />
            <Button
              onClick={scrapeJobs}
              disabled={isScraping || discovering || companies.length === 0}
              size="sm"
              variant="secondary"
              className="h-7 text-xs px-3 shadow-none bg-background hover:bg-muted"
            >
              {isScraping
                ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                : <Briefcase className="mr-1.5 h-3 w-3" />}
              {isScraping ? 'Scraping…' : 'Scrape Jobs'}
            </Button>
          </div>
        </div>
      </div>

      {/* Live discovery progress card */}
      {showDiscoveryCard && (
        <DiscoveryProgressCard progress={discProgress} results={discResults} />
      )}

      {/* Live scrape progress card */}
      {showScrapeCard && (
        <ScrapeProgressCard
          scraped={scrapeStats.scraped}
          jobsFound={scrapeStats.jobsFound}
          total={scrapeStats.total}
        />
      )}

      {/* Scrape done result */}
      {!isScraping && scrapeResult && (
        <Card className="border-green-200 dark:border-green-800 bg-green-50/60 dark:bg-green-950/20">
          <CardContent className="p-4 flex items-center gap-4">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                Scrape complete — {scrapeResult.jobsFound} new jobs found across {scrapeResult.scraped} companies
              </p>
              {scrapeResult.errors > 0 && (
                <p className="text-xs text-muted-foreground mt-0.5">{scrapeResult.errors} companies failed — check server logs</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <StatsCard title="Companies"  value={stats.total    ?? 0} icon={Building2} />
        <StatsCard title="With Jobs"  value={stats.withJobs ?? 0} icon={Briefcase} variant="success" />
        <StatsCard title="Total Jobs" value={stats.totalJobs ?? 0} icon={Globe}    variant="success" />
        <StatsCard title="This Week"  value={stats.thisWeek ?? 0} icon={Zap}       variant="warning" />
        <StatsCard title="Easy Apply" value={stats.easyApply ?? 0} icon={RefreshCw} variant="success" />
      </div>

      {/* ATS breakdown */}
      {stats.byAts && Object.keys(stats.byAts).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">ATS Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.byAts as Record<string, number>)
                .sort(([, a], [, b]) => b - a)
                .map(([ats, count]) => (
                  <div key={ats} className="flex items-center gap-1">
                    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', ATS_COLORS[ats] ?? 'bg-gray-100 text-gray-800')}>
                      {ats}
                    </span>
                    <span className="text-xs text-muted-foreground font-semibold">{count}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add manually */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Company Manually
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 items-center">
            <Input
              placeholder="https://company.com  or  https://boards.greenhouse.io/company"
              value={addUrl}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setAddUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addManual()}
              className="flex-1 h-10"
            />
            <Button className="h-10 shrink-0" onClick={addManual} disabled={isAdding || !addUrl.trim()}>
              {isAdding ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Detecting…</> : 'Add'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Paste any company website or job board URL — ATS is auto-detected (Greenhouse, Lever, Ashby, Workday…)
          </p>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Input
          placeholder="Search by name, industry, ATS, or source…"
          value={search}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          className="h-10 pl-9"
        />
        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      </div>

      {/* Table / empty */}
      {!filtered.length ? (
        <EmptyState
          icon={Building2}
          title="No companies yet"
          description={
            search
              ? 'No companies match your search.'
              : "Click 'Load Known Companies' to instantly load 50+ top tech companies, or 'Auto-Discover All' to scrape YC, GitHub, and VC portfolios."
          }
          action={
            !search ? (
              <Button onClick={() => runDiscovery(['seed'])} disabled={discovering}>
                <Zap className="mr-2 h-4 w-4" /> Load Known Companies
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setSearch('')}>Clear Search</Button>
            )
          }
        />
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="px-4 py-2 bg-muted text-xs text-muted-foreground border-b border-border flex items-center justify-between">
            <span>Showing {Math.min(filtered.length, 300)} of {filtered.length} companies</span>
            {isScraping && (
              <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium">
                <Loader2 className="h-3 w-3 animate-spin" /> Scraping jobs…
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-3 text-left font-medium">Company</th>
                  <th className="p-3 text-left font-medium">ATS</th>
                  <th className="p-3 text-left font-medium">Source</th>
                  <th className="p-3 text-left font-medium">Jobs</th>
                  <th className="p-3 text-left font-medium">Funding</th>
                  <th className="p-3 text-left font-medium">Discovered</th>
                  <th className="p-3 text-left font-medium">Links</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 300).map((company: any) => (
                  <tr key={company.id} className="border-t border-border hover:bg-accent/40 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {company.logoUrl && (
                          <img src={company.logoUrl} alt="" className="h-5 w-5 rounded object-cover" />
                        )}
                        <div>
                          <p className="font-medium">{company.name}</p>
                          {company.industry && (
                            <p className="text-xs text-muted-foreground">{company.industry}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      {company.atsType ? (
                        <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', ATS_COLORS[company.atsType] ?? 'bg-gray-100 text-gray-800')}>
                          {company.atsType}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-xs">{company.source}</Badge>
                    </td>
                    <td className="p-3">
                      <span className={cn('font-semibold text-sm', (company.activeJobsCount ?? 0) > 0 ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground')}>
                        {company.activeJobsCount ?? 0}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">{company.fundingStage ?? '—'}</td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {company.discoveredAt ? timeAgo(company.discoveredAt) : '—'}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        {company.website && (
                          <a href={company.website} target="_blank" rel="noopener noreferrer"
                            className="rounded p-1 hover:bg-muted transition-colors text-muted-foreground" title="Website">
                            <Globe className="h-3.5 w-3.5" />
                          </a>
                        )}
                        {company.atsUrl && (
                          <a href={company.atsUrl} target="_blank" rel="noopener noreferrer"
                            className="rounded p-1 hover:bg-muted transition-colors text-muted-foreground" title="Job Board">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
