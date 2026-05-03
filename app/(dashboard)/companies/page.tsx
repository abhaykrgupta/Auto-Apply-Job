'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatsCard } from '@/components/shared/StatsCard';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { Building2, Zap, Plus, ExternalLink, RefreshCw, Briefcase, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { useState, type ChangeEvent } from 'react';
import { timeAgo } from '@/lib/utils/helpers';

const ATS_COLORS: Record<string, string> = {
  greenhouse: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  lever: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  workday: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  ashby: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  bamboohr: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  custom: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  none: 'bg-red-100 text-red-700',
  unknown: 'bg-yellow-100 text-yellow-800',
};

export default function CompaniesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [addUrl, setAddUrl] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const res = await fetch('/api/companies');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const { mutate: runDiscovery, isPending: isDiscovering } = useMutation({
    mutationFn: async (sources: string[]) => {
      const res = await fetch('/api/companies/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sources, skipAtsDetection: true }),
      });
      if (!res.ok) throw new Error('Discovery failed');
      return res.json();
    },
    onSuccess: (result: any) => {
      toast.success(`Done! Added ${result.newCompanies} new companies from ${result.total} discovered.`);
      qc.invalidateQueries({ queryKey: ['companies'] });
    },
    onError: () => toast.error('Discovery failed. Check logs.'),
  });

  const { mutate: autoDiscover, isPending: isAutoDiscovering } = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/companies/auto-discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sources: ['seed', 'yc', 'github', 'vc', 'wellfound'],
          skipAtsDetection: true,
        }),
      });
      if (!res.ok) throw new Error('Auto-discovery failed');
      return res.json();
    },
    onSuccess: (result: any) => {
      const durationSec = result.durationMs ? Math.round(result.durationMs / 1000) : 0;
      toast.success(
        `Auto-discovery done in ${durationSec}s — ${result.newCompanies} new companies added!`
      );
      qc.invalidateQueries({ queryKey: ['companies'] });
    },
    onError: () => toast.error('Auto-discovery failed. Check logs.'),
  });

  const { mutate: scrapeJobs, isPending: isScraping } = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/companies/scrape-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 20 }),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: (result: any) => {
      toast.success(`Scraped ${result.scraped} companies, found ${result.jobsFound} new jobs.`);
      qc.invalidateQueries({ queryKey: ['companies'] });
      qc.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: () => toast.error('Job scraping failed.'),
  });

  const { mutate: addManual, isPending: isAdding } = useMutation({
    mutationFn: async (url: string) => {
      const res = await fetch('/api/companies/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: (result: any) => {
      toast.success(`Added ${result.name} — ATS: ${result.atsType ?? 'detecting...'}`);
      setAddUrl('');
      qc.invalidateQueries({ queryKey: ['companies'] });
    },
    onError: () => toast.error('Could not detect company from that URL.'),
  });

  const companies: any[] = data?.companies ?? [];
  const stats: any = data?.stats ?? {};

  const filtered = companies.filter(
    (c: any) =>
      !search ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.source?.toLowerCase().includes(search.toLowerCase()) ||
      c.industry?.toLowerCase().includes(search.toLowerCase()) ||
      c.atsType?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Company Discovery</h2>
          <p className="text-muted-foreground">
            Auto-discover every startup & company — YC, GitHub, VC portfolios, and more
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => runDiscovery(['seed'])}
            disabled={isDiscovering}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isDiscovering ? 'animate-spin' : ''}`} />
            Load 50+ Known Companies
          </Button>
          <Button
            onClick={() => runDiscovery(['yc', 'github', 'vc', 'wellfound'])}
            disabled={isDiscovering}
            variant="outline"
            size="sm"
          >
            <Zap className="mr-2 h-4 w-4" />
            Auto-Discover Startups
          </Button>
          <Button
            onClick={() => autoDiscover()}
            disabled={isAutoDiscovering || isDiscovering}
            size="sm"
            variant="default"
          >
            <Zap className={`mr-2 h-4 w-4 ${isAutoDiscovering ? 'animate-pulse' : ''}`} />
            {isAutoDiscovering ? 'Discovering All Sources...' : 'Auto-Discover All'}
          </Button>
          <Button onClick={() => scrapeJobs()} disabled={isScraping} size="sm">
            <Briefcase className="mr-2 h-4 w-4" />
            {isScraping ? 'Scraping Jobs...' : 'Scrape All Jobs'}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <StatsCard title="Companies" value={stats.total ?? 0} icon={Building2} />
        <StatsCard title="With Jobs" value={stats.withJobs ?? 0} icon={Briefcase} variant="success" />
        <StatsCard title="Total Jobs" value={stats.totalJobs ?? 0} icon={Globe} variant="success" />
        <StatsCard title="This Week" value={stats.thisWeek ?? 0} icon={Zap} variant="warning" />
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
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ATS_COLORS[ats] ?? 'bg-gray-100 text-gray-800'}`}>
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
          <div className="flex gap-2">
            <Input
              placeholder="https://company.com  or  https://boards.greenhouse.io/company"
              value={addUrl}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setAddUrl(e.target.value)}
              className="flex-1"
            />
            <Button onClick={() => addManual(addUrl)} disabled={isAdding || !addUrl.trim()}>
              {isAdding ? 'Detecting...' : 'Add'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Paste any company website or job board URL — ATS is auto-detected.
          </p>
        </CardContent>
      </Card>

      {/* Search */}
      <Input
        placeholder="Search by name, industry, ATS, or source..."
        value={search}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
      />

      {/* Table */}
      {!filtered.length ? (
        <EmptyState
          icon={Building2}
          title="No companies yet"
          description="Click 'Load 50+ Known Companies' for instant coverage of top tech companies, or 'Auto-Discover Startups' to scrape YC, GitHub, and VC portfolios automatically."
          action={
            <Button onClick={() => runDiscovery(['seed'])} disabled={isDiscovering}>
              <Zap className="mr-2 h-4 w-4" />
              Load Known Companies
            </Button>
          }
        />
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="px-4 py-2 bg-muted text-xs text-muted-foreground border-b border-border">
            Showing {Math.min(filtered.length, 300)} of {filtered.length} companies
          </div>
          <table className="w-full text-sm">
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
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ATS_COLORS[company.atsType] ?? 'bg-gray-100 text-gray-800'}`}>
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
                    <span className={`font-semibold ${(company.activeJobsCount ?? 0) > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
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
      )}
    </div>
  );
}
