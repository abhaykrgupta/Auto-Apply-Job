'use client';

import { useState, type ChangeEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useScrapeJobs } from '@/lib/hooks/use-jobs';
import { toast } from 'sonner';
import { Search, Plus, X, Zap } from 'lucide-react';

const ALL_SOURCES = [
  { id: 'remoteok', label: 'RemoteOK' },
  { id: 'weworkremotely', label: 'WeWorkRemotely' },
  { id: 'indeed', label: 'Indeed' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'glassdoor', label: 'Glassdoor' },
  { id: 'greenhouse', label: 'Greenhouse' },
  { id: 'lever', label: 'Lever' },
];

export default function SearchPage() {
  const { mutate: scrapeJobs, isPending } = useScrapeJobs();
  const [role, setRole] = useState('');
  const [location, setLocation] = useState('');
  const [remote, setRemote] = useState('any');
  const [boardUrls, setBoardUrls] = useState<string[]>(['']);
  const [selectedSources, setSelectedSources] = useState<string[]>(['remoteok', 'weworkremotely']);

  function toggleSource(id: string) {
    setSelectedSources((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  function addBoardUrl() {
    setBoardUrls([...boardUrls, '']);
  }

  function updateBoardUrl(i: number, val: string) {
    const updated = [...boardUrls];
    updated[i] = val;
    setBoardUrls(updated);
  }

  function removeBoardUrl(i: number) {
    setBoardUrls(boardUrls.filter((_, idx) => idx !== i));
  }

  function handleSearch() {
    const validUrls = boardUrls.filter((u) => u.trim().length > 0);
    const hasBoardUrls = validUrls.length > 0;
    const useSources = selectedSources.length > 0;

    if (!useSources && !hasBoardUrls) {
      toast.error('Select at least one source or add a board URL');
      return;
    }

    scrapeJobs(
      {
        role,
        location,
        remote,
        boardUrls: validUrls,
        sources: useSources ? selectedSources : undefined,
        query: role,
      } as any,
      {
        onSuccess: (data: any) => {
          const msg = data.saved !== undefined
            ? `Found ${data.unique ?? data.found} jobs, saved ${data.saved} new.`
            : `Scrape complete!`;
          toast.success(msg);
        },
        onError: () => toast.error('Scraping failed. Check logs.'),
      }
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Search Jobs</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Search 8+ job sources automatically — Indeed, LinkedIn, RemoteOK, and more
        </p>
      </div>

      <Card className="rounded-xl border border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle>Search Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <Label>Job Title / Role</Label>
              <Input
                className="h-10 mt-1"
                placeholder="e.g. Software Engineer"
                value={role}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setRole(e.target.value)}
              />
            </div>
            <div>
              <Label>Location (Optional)</Label>
              <Input
                className="h-10 mt-1"
                placeholder="e.g. San Francisco"
                value={location}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setLocation(e.target.value)}
              />
            </div>
            <div>
              <Label>Remote Preference</Label>
              <Select value={remote} onValueChange={(v) => setRemote(v ?? 'any')}>
                <SelectTrigger className="h-10 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="remote">Remote Only</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="onsite">On-site</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Source selector */}
      <Card className="rounded-xl border border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-4 w-4" /> Job Sources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Select which platforms to search. RemoteOK and WeWorkRemotely use free APIs (no scraping needed).
          </p>
          <div className="flex flex-wrap gap-2">
            {ALL_SOURCES.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => toggleSource(id)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  selectedSources.includes(id)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {selectedSources.length} source{selectedSources.length !== 1 ? 's' : ''} selected
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-xl border border-border bg-card shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Greenhouse / Lever Board URLs</CardTitle>
            <Button size="sm" variant="outline" onClick={addBoardUrl}>
              <Plus className="h-4 w-4 mr-1" /> Add URL
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Optionally add specific Greenhouse or Lever job board URLs to scrape directly.
          </p>
          {boardUrls.map((url, i) => (
            <div key={i} className="flex gap-2">
              <Input
                className="h-10"
                placeholder="https://boards.greenhouse.io/company or https://jobs.lever.co/company"
                value={url}
                onChange={(e: ChangeEvent<HTMLInputElement>) => updateBoardUrl(i, e.target.value)}
              />
              <Button size="icon" variant="ghost" onClick={() => removeBoardUrl(i)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Button
        onClick={handleSearch}
        disabled={isPending}
        className="h-10 px-8 text-sm font-medium w-full md:w-auto"
      >
        <Search className="mr-2 h-4 w-4" />
        {isPending ? 'Scraping...' : 'Start Auto-Search'}
      </Button>
    </div>
  );
}
