'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { StatsCard } from '@/components/shared/StatsCard';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  Building2, Zap, Plus, ExternalLink, RefreshCw,
  Briefcase, Globe, CheckCircle2, Loader2, AlertCircle, ChevronRight,
  ChevronLeft, Sparkles, Search
} from 'lucide-react';
import { toast } from 'sonner';
import { useState, type ChangeEvent } from 'react';
import { timeAgo } from '@/lib/utils/helpers';
import { cn } from '@/lib/utils';

// ─── ATS colours ─────────────────────────────────────────────────────────────
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

      {/* Stats row */}
      <div className="flex mb-4">
        <div className="w-full rounded-xl bg-white/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-800 p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Companies Processed</p>
            <p className="text-xs text-muted-foreground mt-1">Jobs will be tallied after completion</p>
          </div>
          <p className="text-3xl font-black tabular-nums text-slate-700 dark:text-slate-300 leading-none">
            {scraped} <span className="text-lg font-semibold text-muted-foreground">/ {total}</span>
          </p>
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
  const [locationPref, setLocationPref] = useState('any');
  const [isAdding,  setIsAdding]  = useState(false);

  const [page, setPage] = useState(1);
  const [pageSizeMode, setPageSizeMode] = useState('15');
  const [customPageSize, setCustomPageSize] = useState('15');

  const pageSize = pageSizeMode === 'custom' ? (parseInt(customPageSize) || 15) : parseInt(pageSizeMode);

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginatedCompanies = filtered.slice((page - 1) * pageSize, page * pageSize);

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
    const total = Math.min(companyCount || 10, 20);
    const progressInterval = setInterval(() => {
      if (fakeScraped < total - 1) {
        fakeScraped++;
        setScrapeStats({ scraped: fakeScraped, jobsFound: 0, total });
      }
    }, 800);

    try {
      const res = await fetch('/api/companies/scrape-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          limit: 20, 
          query: roleQuery.trim(),
          experience: experience === 'custom' ? customExp.trim() : experience,
          locationPref
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
        <div>
          <h2 className="text-2xl font-bold">Company Discovery</h2>
          <p className="text-muted-foreground mt-1">
            Auto-discover every startup & company — YC, GitHub, VC portfolios, and more
          </p>
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
        </div>
      </div>

      {/* Target Job Scraper Configuration */}
      <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 p-5 shadow-sm relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
        
        <div className="flex flex-col md:flex-row md:items-center gap-4 relative z-10">
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                <Briefcase className="h-4 w-4" />
              </div>
              <h3 className="font-semibold text-foreground">Target Job Extraction</h3>
              <Badge variant="secondary" className="text-[10px] uppercase tracking-wider ml-1 bg-background/50 backdrop-blur-sm">Live ATS Scrape</Badge>
            </div>
            <p className="text-xs text-muted-foreground">Configure your target role to automatically scrape matching jobs from the discovered companies.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Job Title (or leave blank for profile preferences)"
                value={roleQuery}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setRoleQuery(e.target.value)}
                className="h-10 pl-9 w-full bg-background/50 backdrop-blur-sm transition-all focus:bg-background"
              />
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto">
              <Select value={experience} onValueChange={(val) => setExperience(val ?? 'any')}>
                <SelectTrigger className="h-10 w-full sm:w-32 bg-background/50 backdrop-blur-sm transition-all focus:bg-background">
                  <SelectValue placeholder="Experience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Exp</SelectItem>
                  <SelectItem value="fresher">Fresher</SelectItem>
                  <SelectItem value="1-2">1–2 Years</SelectItem>
                  <SelectItem value="2-3">2–3 Years</SelectItem>
                  <SelectItem value="3-5">3–5 Years</SelectItem>
                  <SelectItem value="5-7">5–7 Years</SelectItem>
                  <SelectItem value="senior">Senior (7+)</SelectItem>
                  <SelectItem value="custom">Custom...</SelectItem>
                </SelectContent>
              </Select>

              {experience === 'custom' && (
                <Input
                  className="h-10 w-20 bg-background/50 backdrop-blur-sm px-2"
                  placeholder="Yrs..."
                  value={customExp}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setCustomExp(e.target.value)}
                  autoFocus
                />
              )}
              
              <Select value={locationPref} onValueChange={(val) => setLocationPref(val ?? 'any')}>
                <SelectTrigger className="h-10 w-full sm:w-28 bg-background/50 backdrop-blur-sm transition-all focus:bg-background">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Loc</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="onsite">On-site</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={scrapeJobs}
              disabled={isScraping || discovering || companies.length === 0}
              className="h-10 w-full sm:w-auto shadow-sm hover:shadow-md transition-all"
            >
              {isScraping ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
              {isScraping ? 'Scraping 20 Companies…' : 'Start Target Scrape'}
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
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden mt-6">
          <div className="px-5 py-3 bg-muted/30 text-xs text-muted-foreground border-b border-border flex items-center justify-between">
            <span className="font-medium">Showing {paginatedCompanies.length} of {filtered.length} companies</span>
            {isScraping && (
              <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-950/30 px-2 py-1 rounded-full">
                <Loader2 className="h-3 w-3 animate-spin" /> Scraping jobs…
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-sm">
              <thead className="bg-muted/40 border-b border-border">
                <tr>
                  <th className="p-4 text-left font-semibold text-muted-foreground">Company</th>
                  <th className="p-4 text-left font-semibold text-muted-foreground">ATS</th>
                  <th className="p-4 text-left font-semibold text-muted-foreground">Source</th>
                  <th className="p-4 text-left font-semibold text-muted-foreground">Jobs</th>
                  <th className="p-4 text-left font-semibold text-muted-foreground">Funding</th>
                  <th className="p-4 text-left font-semibold text-muted-foreground">Discovered</th>
                  <th className="p-4 text-right font-semibold text-muted-foreground pr-5">Links</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedCompanies.map((company: any) => (
                  <tr key={company.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {company.logoUrl ? (
                          <img src={company.logoUrl} alt="" className="h-7 w-7 rounded-md object-cover ring-1 ring-border shadow-sm bg-white" />
                        ) : (
                          <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center ring-1 ring-border shadow-sm text-muted-foreground/50">
                            <Building2 className="h-3.5 w-3.5" />
                          </div>
                        )}
                        <div className="flex flex-col">
                          <p className="font-semibold text-foreground line-clamp-1">{company.name}</p>
                          {company.industry && (
                            <p className="text-xs text-muted-foreground font-medium mt-0.5">{company.industry}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {company.atsType ? (
                        <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider border', ATS_COLORS[company.atsType] ?? 'bg-muted border-border text-muted-foreground')}>
                          {company.atsType}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/50 font-medium">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{company.source}</Badge>
                    </td>
                    <td className="p-4">
                      <span className={cn('inline-flex items-center justify-center min-w-[28px] h-6 rounded-md text-xs font-bold ring-1 ring-inset', (company.activeJobsCount ?? 0) > 0 ? 'bg-green-50 text-green-700 ring-green-200 dark:bg-green-950/30 dark:text-green-400 dark:ring-green-800' : 'bg-muted text-muted-foreground ring-border')}>
                        {company.activeJobsCount ?? 0}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-muted-foreground font-medium">{company.fundingStage ?? '—'}</td>
                    <td className="p-4 text-xs text-muted-foreground font-medium whitespace-nowrap">
                      {company.discoveredAt ? timeAgo(company.discoveredAt) : '—'}
                    </td>
                    <td className="p-4 text-right pr-5">
                      <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        {company.website && (
                          <a href={company.website} target="_blank" rel="noopener noreferrer"
                            className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'h-8 w-8 p-0 text-muted-foreground hover:text-foreground')} title="Website">
                            <Globe className="h-4 w-4" />
                          </a>
                        )}
                        {company.atsUrl && (
                          <a href={company.atsUrl} target="_blank" rel="noopener noreferrer"
                            className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/5')} title="Job Board">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
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
    </div>
  );
}
