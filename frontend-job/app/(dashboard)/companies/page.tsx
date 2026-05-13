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
  ChevronLeft, Sparkles, Search, Filter, MapPin, Layers, X, GraduationCap
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
  { key: 'seed',       label: 'Known Companies',  emoji: '🏢', desc: '150+ top tech companies' },
  { key: 'yc',         label: 'Y Combinator',     emoji: '🚀', desc: 'YC portfolio startups' },
  { key: 'github',     label: 'GitHub Trending',  emoji: '⭐', desc: 'Trending open-source companies' },
  { key: 'vc',         label: 'VC Portfolios',    emoji: '💼', desc: 'a16z, Sequoia, Accel, etc.' },
  { key: 'wellfound',  label: 'Wellfound',        emoji: '🔍', desc: 'Startup job board' },
  { key: 'inc42',      label: 'Inc42',            emoji: '🇮🇳', desc: 'India startup tracker — 100+ companies' },
  { key: 'india-vcs',  label: 'India VCs',        emoji: '🦁', desc: 'Peak XV, Blume, Kalaari, 3one4 & more' },
  { key: 'nasscom',    label: 'Nasscom',          emoji: '💡', desc: 'India tech ecosystem — NASSCOM certified' },
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
            <p className={cn(
              'text-xs font-medium',
              allDone ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground',
            )}>
              {allDone
                ? `${total} new companies added`
                : `Up to 50 new per run — run again to get the next batch`}
            </p>
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
  const [search,      setSearch]      = useState('');
  const [filterAts,   setFilterAts]   = useState('all');
  const [filterSource,setFilterSource] = useState('all');
  const [filterCountry, setFilterCountry] = useState('all');
  const [addUrl,  setAddUrl]  = useState('');
  const [roleQuery, setRoleQuery] = useState('');
  const [experience, setExperience] = useState('any');
  const [customExp, setCustomExp] = useState('');
  const [locationPref, setLocationPref] = useState('any');
  const [scrapeCountry, setScrapeCountry] = useState('all');
  const [isAdding,  setIsAdding]  = useState(false);

  const [page, setPage] = useState(1);
  const [pageSizeMode, setPageSizeMode] = useState('15');
  const [customPageSize, setCustomPageSize] = useState('15');

  const pageSize = pageSizeMode === 'custom' ? (parseInt(customPageSize) || 15) : parseInt(pageSizeMode);

  // Discovery state — per-source
  const [discovering,      setDiscovering]      = useState(false);
  const [activeDiscGroup,  setActiveDiscGroup]  = useState<'seed' | 'india' | 'global' | 'all' | null>(null);
  const [discProgress,     setDiscProgress]     = useState<Record<SourceKey, SourceStatus>>(IDLE_PROGRESS);
  const [discResults,      setDiscResults]      = useState<Record<SourceKey, number>>(IDLE_RESULTS);
  const [discDone,         setDiscDone]         = useState(false);

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
    staleTime: 5 * 60 * 1000,   // treat as fresh for 5 minutes — no background re-fetch
    refetchOnWindowFocus: false,  // don't re-fetch when user switches tabs
    refetchInterval: false,       // no polling at all — user triggers refresh via buttons
  });

  const companies: any[] = data?.companies ?? [];
  const stats: any       = data?.stats ?? {};

  const filtered = companies.filter((c: any) => {
    if (search && !(
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.source?.toLowerCase().includes(search.toLowerCase()) ||
      c.industry?.toLowerCase().includes(search.toLowerCase()) ||
      c.atsType?.toLowerCase().includes(search.toLowerCase()) ||
      c.location?.toLowerCase().includes(search.toLowerCase())
    )) return false;
    if (filterAts !== 'all' && (c.atsType ?? 'unknown') !== filterAts) return false;
    if (filterSource !== 'all' && c.source !== filterSource) return false;
    if (filterCountry !== 'all') {
      const loc = (c.location ?? '').toLowerCase();
      const countryMap: Record<string, string[]> = {
        india:     ['india', 'bangalore', 'mumbai', 'delhi', 'hyderabad', 'pune', 'chennai', 'gurgaon', 'noida', 'kolkata'],
        us:        ['united states', 'usa', 'san francisco', 'new york', 'seattle', 'austin', 'boston', 'chicago', 'los angeles'],
        uk:        ['united kingdom', 'uk', 'london', 'manchester', 'edinburgh'],
        germany:   ['germany', 'berlin', 'munich', 'hamburg', 'frankfurt'],
        singapore: ['singapore'],
        canada:    ['canada', 'toronto', 'vancouver', 'montreal'],
        australia: ['australia', 'sydney', 'melbourne', 'brisbane'],
        remote:    ['remote', 'worldwide', 'global'],
      };
      const keywords = countryMap[filterCountry] ?? [];
      if (!keywords.some(k => loc.includes(k))) return false;
    }
    return true;
  });

  // Derive unique ATS types and sources for filter dropdowns
  const atsOptions = Array.from(new Set(companies.map((c: any) => c.atsType ?? 'unknown'))).sort() as string[];
  const sourceOptions = Array.from(new Set(companies.map((c: any) => c.source).filter(Boolean))).sort() as string[];

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginatedCompanies = filtered.slice((page - 1) * pageSize, page * pageSize);

  // ── Run discovery source-by-source for live progress ─────────────────────
  async function runDiscovery(
    sourcesToRun: SourceKey[],
    group: 'seed' | 'india' | 'global' | 'all',
  ) {
    setDiscovering(true);
    setActiveDiscGroup(group);
    setDiscDone(false);
    setDiscResults(IDLE_RESULTS);
    const initialProgress = { ...IDLE_PROGRESS };
    sourcesToRun.forEach(s => { initialProgress[s] = 'idle'; });
    setDiscProgress(initialProgress);

    let totalNew = 0;
    for (const source of sourcesToRun) {
      setDiscProgress(prev => ({ ...prev, [source]: 'running' }));
      try {
        // 90s timeout per source — Playwright scrapers (India VCs) can be slow
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 90_000);
        try {
          const res = await fetch('/api/companies/discover', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sources: [source], skipAtsDetection: true }),
            signal: controller.signal,
          });
          const data = await res.json();
          const n = data.newCompanies ?? 0;
          totalNew += n;
          setDiscResults(prev => ({ ...prev, [source]: n }));
          setDiscProgress(prev => ({ ...prev, [source]: 'done' }));
        } finally {
          clearTimeout(timer);
        }
      } catch {
        setDiscProgress(prev => ({ ...prev, [source]: 'error' }));
      }
    }

    setDiscDone(true);
    setDiscovering(false);
    setActiveDiscGroup(null);
    toast.success(`Discovery done — ${totalNew} new companies added`);
    qc.invalidateQueries({ queryKey: ['companies'] });
  }

  // ── Scrape jobs from company ATSs (real-time SSE progress) ──────────────────
  async function scrapeJobs() {
    const companyCount = companies.filter((c: any) => c.scrapingEnabled !== false && c.atsUrl).length;
    const total = Math.min(companyCount || 10, 20);
    setIsScraping(true);
    setScrapeResult(null);
    setScrapeStats({ scraped: 0, jobsFound: 0, total });

    const body = JSON.stringify({
      limit: 20,
      query: roleQuery.trim(),
      experience: experience === 'custom' ? customExp.trim() : experience,
      locationPref,
      country: scrapeCountry === 'all' ? undefined : scrapeCountry,
    });

    try {
      const res = await fetch('/api/companies/scrape-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
        body,
      });

      if (!res.ok) throw new Error('Failed');

      // Read SSE stream for real-time progress
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let scraped = 0, jobsFound = 0, errors = 0;

      if (reader) {
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            if (line.startsWith('data:')) {
              try {
                const payload = JSON.parse(line.slice(5).trim());
                if (payload.jobsFound !== undefined) {
                  scraped = payload.done ?? scraped;
                  jobsFound += payload.jobsFound ?? 0;
                  setScrapeStats({ scraped, jobsFound, total: payload.total ?? total });
                }
                if (payload.error) errors++;
              } catch { /* ignore parse errors */ }
            }
            if (line.startsWith('event: done')) {
              // stream ended
            }
          }
        }
      }

      setScrapeResult({ scraped, jobsFound, errors });
      setScrapeStats(null);
      toast.success(`Scraped ${scraped} companies — found ${jobsFound} new jobs`);
      qc.invalidateQueries({ queryKey: ['companies'] });
      qc.invalidateQueries({ queryKey: ['jobs'] });
    } catch {
      setScrapeStats(null);
      toast.error('Job scraping failed. Check server logs.');
    } finally {
      setIsScraping(false);
    }
  }

  // ── Fetch real jobs from Adzuna + JSearch APIs ─────────────────────────────
  const [isFetchingApis, setIsFetchingApis] = useState(false);

  async function fetchRealJobs() {
    if (!roleQuery.trim()) {
      toast.error('Enter a job title / role first in the Target Job Extraction section.');
      return;
    }
    setIsFetchingApis(true);
    try {
      const res = await fetch('/api/jobs/fetch-from-apis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: roleQuery.trim(),
          country: scrapeCountry === 'all' ? 'us' : scrapeCountry,
          remoteOnly: locationPref === 'remote',
          datePosted: 'week',
        }),
      });
      if (!res.ok) throw new Error('API call failed');
      const result = await res.json();
      const total = result.totalInserted ?? 0;
      if (total === 0) {
        toast.info('No new jobs found via APIs — either APIs are not configured or no matches. Add ADZUNA_APP_ID + JSEARCH_API_KEY to .env.local');
      } else {
        toast.success(`Fetched ${total} real jobs via APIs (Adzuna + JSearch)`);
      }
      qc.invalidateQueries({ queryKey: ['jobs'] });
    } catch {
      toast.error('API job fetch failed. Check ADZUNA_APP_ID and JSEARCH_API_KEY in .env.local');
    } finally {
      setIsFetchingApis(false);
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
            Auto-discover every startup & company — YC, GitHub, VC portfolios, India ecosystem & more
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => runDiscovery(['seed'], 'seed')}
            disabled={discovering || isScraping}
            variant="outline"
            size="sm"
          >
            {activeDiscGroup === 'seed'
              ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              : <Building2 className="mr-2 h-4 w-4" />}
            {activeDiscGroup === 'seed' ? 'Loading…' : 'Load Known Companies'}
          </Button>
          <Button
            onClick={() => runDiscovery(['inc42', 'india-vcs', 'nasscom'], 'india')}
            disabled={discovering || isScraping}
            variant="outline"
            size="sm"
            className="border-orange-400/50 text-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-950/30"
          >
            {activeDiscGroup === 'india'
              ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              : <span className="mr-1.5">🇮🇳</span>}
            {activeDiscGroup === 'india' ? 'Discovering…' : 'Discover India'}
          </Button>
          <Button
            onClick={() => runDiscovery(['yc', 'github', 'vc', 'wellfound'], 'global')}
            disabled={discovering || isScraping}
            variant="outline"
            size="sm"
          >
            {activeDiscGroup === 'global'
              ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              : <Zap className="mr-2 h-4 w-4" />}
            {activeDiscGroup === 'global' ? 'Discovering…' : 'Discover Global'}
          </Button>
          <Button
            onClick={() => runDiscovery(['seed', 'yc', 'github', 'vc', 'wellfound', 'inc42', 'india-vcs', 'nasscom'], 'all')}
            disabled={discovering || isScraping}
            size="sm"
          >
            {activeDiscGroup === 'all'
              ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              : <Sparkles className="mr-2 h-4 w-4" />}
            {activeDiscGroup === 'all' ? 'Discovering…' : 'Auto-Discover All'}
          </Button>
        </div>
      </div>

      {/* Target Job Scraper Configuration */}
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-violet-500/5 shadow-sm overflow-hidden">
        {/* Header strip */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-primary/10 bg-primary/5">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/15 text-primary">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-foreground">Target Job Extraction</h3>
                <Badge variant="secondary" className="text-[9px] uppercase tracking-wider px-1.5 py-0">Live ATS Scrape</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Set filters below then hit Scrape — only matching companies will be hit</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <Button
              onClick={fetchRealJobs}
              disabled={isFetchingApis || isScraping || discovering}
              size="sm"
              variant="outline"
              className="shadow-sm hover:shadow-md transition-all"
            >
              {isFetchingApis ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Globe className="mr-2 h-3.5 w-3.5" />}
              {isFetchingApis ? 'Fetching…' : 'Fetch via APIs'}
            </Button>
            <Button
              onClick={scrapeJobs}
              disabled={isScraping || isFetchingApis || discovering || companies.length === 0}
              size="sm"
              className="shadow-sm hover:shadow-md transition-all"
            >
              {isScraping ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Zap className="mr-2 h-3.5 w-3.5" />}
              {isScraping ? 'Scraping…' : 'Start Scrape'}
            </Button>
          </div>
        </div>

        {/* Filter grid */}
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Job Title */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase className="h-3 w-3" /> Job Title
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="e.g. Software Engineer"
                value={roleQuery}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setRoleQuery(e.target.value)}
                className="h-9 pl-8 text-sm bg-background/70"
              />
            </div>
          </div>

          {/* Experience */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap className="h-3 w-3" /> Experience
            </label>
            <div className="flex gap-1.5">
              <Select value={experience} onValueChange={(val) => setExperience(val ?? 'any')}>
                <SelectTrigger className="h-9 flex-1 text-sm bg-background/70">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any level</SelectItem>
                  <SelectItem value="fresher">Fresher / Entry</SelectItem>
                  <SelectItem value="1-2">1–2 Years</SelectItem>
                  <SelectItem value="2-3">2–3 Years</SelectItem>
                  <SelectItem value="3-5">3–5 Years</SelectItem>
                  <SelectItem value="5-7">5–7 Years</SelectItem>
                  <SelectItem value="senior">Senior (7+)</SelectItem>
                  <SelectItem value="custom">Custom…</SelectItem>
                </SelectContent>
              </Select>
              {experience === 'custom' && (
                <Input
                  className="h-9 w-16 px-2 text-sm bg-background/70 shrink-0"
                  placeholder="Yrs"
                  value={customExp}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setCustomExp(e.target.value)}
                  autoFocus
                />
              )}
            </div>
          </div>

          {/* Country */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="h-3 w-3" /> Country
            </label>
            <Select value={scrapeCountry} onValueChange={(val) => setScrapeCountry(val ?? 'all')}>
              <SelectTrigger className="h-9 w-full text-sm bg-background/70">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">🌍 All Countries</SelectItem>
                <SelectItem value="india">🇮🇳 India</SelectItem>
                <SelectItem value="us">🇺🇸 USA</SelectItem>
                <SelectItem value="uk">🇬🇧 UK</SelectItem>
                <SelectItem value="germany">🇩🇪 Germany</SelectItem>
                <SelectItem value="singapore">🇸🇬 Singapore</SelectItem>
                <SelectItem value="canada">🇨🇦 Canada</SelectItem>
                <SelectItem value="australia">🇦🇺 Australia</SelectItem>
                <SelectItem value="remote">🌐 Remote / Global</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Work Type */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="h-3 w-3" /> Work Type
            </label>
            <Select value={locationPref} onValueChange={(val) => setLocationPref(val ?? 'any')}>
              <SelectTrigger className="h-9 w-full text-sm bg-background/70">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any type</SelectItem>
                <SelectItem value="remote">Remote</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
                <SelectItem value="onsite">On-site</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active filter chips + mobile CTA */}
        <div className="px-4 pb-4 flex flex-wrap items-center gap-2">
          {roleQuery && (
            <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary border border-primary/20 rounded-full px-2.5 py-1 font-medium">
              <Briefcase className="h-3 w-3" /> {roleQuery}
              <button onClick={() => setRoleQuery('')} className="ml-0.5 hover:text-primary/70"><X className="h-3 w-3" /></button>
            </span>
          )}
          {experience !== 'any' && (
            <span className="inline-flex items-center gap-1 text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-full px-2.5 py-1 font-medium">
              <GraduationCap className="h-3 w-3" /> {experience === 'custom' ? `${customExp} yrs` : experience}
              <button onClick={() => setExperience('any')} className="ml-0.5"><X className="h-3 w-3" /></button>
            </span>
          )}
          {scrapeCountry !== 'all' && (
            <span className="inline-flex items-center gap-1 text-xs bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 rounded-full px-2.5 py-1 font-medium">
              <MapPin className="h-3 w-3" />
              {({ india:'🇮🇳 India', us:'🇺🇸 USA', uk:'🇬🇧 UK', germany:'🇩🇪 Germany', singapore:'🇸🇬 Singapore', canada:'🇨🇦 Canada', australia:'🇦🇺 Australia', remote:'🌐 Remote' } as Record<string,string>)[scrapeCountry] ?? scrapeCountry}
              <button onClick={() => setScrapeCountry('all')} className="ml-0.5"><X className="h-3 w-3" /></button>
            </span>
          )}
          {locationPref !== 'any' && (
            <span className="inline-flex items-center gap-1 text-xs bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 rounded-full px-2.5 py-1 font-medium">
              <Layers className="h-3 w-3" /> {locationPref}
              <button onClick={() => setLocationPref('any')} className="ml-0.5"><X className="h-3 w-3" /></button>
            </span>
          )}
          {/* Mobile CTA */}
          <div className="sm:hidden ml-auto flex items-center gap-2">
            <Button
              onClick={fetchRealJobs}
              disabled={isFetchingApis || isScraping || discovering}
              size="sm"
              variant="outline"
            >
              {isFetchingApis ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Globe className="mr-1.5 h-3.5 w-3.5" />}
              APIs
            </Button>
            <Button
              onClick={scrapeJobs}
              disabled={isScraping || isFetchingApis || discovering || companies.length === 0}
              size="sm"
            >
              {isScraping ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Zap className="mr-1.5 h-3.5 w-3.5" />}
              {isScraping ? 'Scraping…' : 'Scrape'}
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
        <StatsCard title="Jobs This Week" value={stats.thisWeek ?? 0} icon={Zap}       variant="warning" />
        <StatsCard title="Easy Apply Jobs" value={stats.easyApply ?? 0} icon={RefreshCw} variant="success" />
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

      {/* Search + Filters bar */}
      <div className="rounded-xl border border-border bg-card shadow-sm p-3 space-y-3">
        {/* Top row: search + active filter count */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search companies by name, industry, ATS, or source…"
              value={search}
              onChange={(e: ChangeEvent<HTMLInputElement>) => { setSearch(e.target.value); setPage(1); }}
              className="h-9 pl-9 w-full text-sm"
            />
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium hidden sm:block">Filters</span>
            {(filterAts !== 'all' || filterSource !== 'all' || filterCountry !== 'all') && (
              <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-[10px] tabular-nums">
                {[filterAts !== 'all', filterSource !== 'all', filterCountry !== 'all'].filter(Boolean).length}
              </Badge>
            )}
          </div>
        </div>

        {/* Bottom row: 3 labeled dropdowns + clear */}
        <div className="flex flex-wrap sm:flex-nowrap gap-2">
          {/* ATS Type */}
          <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-0.5 flex items-center gap-1">
              <Layers className="h-2.5 w-2.5" /> ATS Type
            </span>
            <Select value={filterAts} onValueChange={v => { setFilterAts(v ?? 'all'); setPage(1); }}>
              <SelectTrigger className={cn('h-8 text-xs', filterAts !== 'all' && 'border-primary/50 text-primary bg-primary/5')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ATS types</SelectItem>
                {atsOptions.map(a => (
                  <SelectItem key={a} value={a}>
                    {a.charAt(0).toUpperCase() + a.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Source */}
          <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-0.5 flex items-center gap-1">
              <Building2 className="h-2.5 w-2.5" /> Source
            </span>
            <Select value={filterSource} onValueChange={v => { setFilterSource(v ?? 'all'); setPage(1); }}>
              <SelectTrigger className={cn('h-8 text-xs', filterSource !== 'all' && 'border-primary/50 text-primary bg-primary/5')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sources</SelectItem>
                {sourceOptions.map(s => (
                  <SelectItem key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Country */}
          <div className="flex flex-col gap-1 flex-1 min-w-[130px]">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-0.5 flex items-center gap-1">
              <MapPin className="h-2.5 w-2.5" /> Country
            </span>
            <Select value={filterCountry} onValueChange={v => { setFilterCountry(v ?? 'all'); setPage(1); }}>
              <SelectTrigger className={cn('h-8 text-xs', filterCountry !== 'all' && 'border-orange-400/50 text-orange-600 dark:text-orange-400 bg-orange-500/5')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All countries</SelectItem>
                <SelectItem value="india">🇮🇳 India</SelectItem>
                <SelectItem value="us">🇺🇸 USA</SelectItem>
                <SelectItem value="uk">🇬🇧 UK</SelectItem>
                <SelectItem value="germany">🇩🇪 Germany</SelectItem>
                <SelectItem value="singapore">🇸🇬 Singapore</SelectItem>
                <SelectItem value="canada">🇨🇦 Canada</SelectItem>
                <SelectItem value="australia">🇦🇺 Australia</SelectItem>
                <SelectItem value="remote">🌍 Remote / Global</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clear button — only when filters active */}
          {(filterAts !== 'all' || filterSource !== 'all' || filterCountry !== 'all' || search) && (
            <div className="flex flex-col gap-1 shrink-0">
              <span className="text-[10px] opacity-0 select-none">clear</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-xs text-muted-foreground hover:text-destructive gap-1"
                onClick={() => { setSearch(''); setFilterAts('all'); setFilterSource('all'); setFilterCountry('all'); setPage(1); }}
              >
                <X className="h-3 w-3" /> Clear all
              </Button>
            </div>
          )}
        </div>

        {/* Active filter chips */}
        {(filterAts !== 'all' || filterSource !== 'all' || filterCountry !== 'all') && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {filterAts !== 'all' && (
              <span className="inline-flex items-center gap-1 text-[11px] bg-primary/10 text-primary border border-primary/20 rounded-full px-2 py-0.5">
                ATS: {filterAts}
                <button onClick={() => { setFilterAts('all'); setPage(1); }}><X className="h-2.5 w-2.5" /></button>
              </span>
            )}
            {filterSource !== 'all' && (
              <span className="inline-flex items-center gap-1 text-[11px] bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-full px-2 py-0.5">
                Source: {filterSource}
                <button onClick={() => { setFilterSource('all'); setPage(1); }}><X className="h-2.5 w-2.5" /></button>
              </span>
            )}
            {filterCountry !== 'all' && (
              <span className="inline-flex items-center gap-1 text-[11px] bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 rounded-full px-2 py-0.5">
                Country: {filterCountry}
                <button onClick={() => { setFilterCountry('all'); setPage(1); }}><X className="h-2.5 w-2.5" /></button>
              </span>
            )}
          </div>
        )}
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
              <Button onClick={() => runDiscovery(['seed'], 'seed')} disabled={discovering}>
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
