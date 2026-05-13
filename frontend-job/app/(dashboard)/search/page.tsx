'use client';

import { useState, type ChangeEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useScrapeJobs } from '@/lib/hooks/use-jobs';
import { toast } from 'sonner';
import { Search, Plus, X, Zap, Bookmark, Play } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SearchProgressModal } from '@/components/search/SearchProgressModal';

const GLOBAL_SOURCES = [
  { id: 'remoteok', label: 'RemoteOK' },
  { id: 'weworkremotely', label: 'WeWorkRemotely' },
  { id: 'indeed', label: 'Indeed' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'glassdoor', label: 'Glassdoor' },
  { id: 'greenhouse', label: 'Greenhouse' },
  { id: 'lever', label: 'Lever' },
];

const INDIA_SOURCES = [
  { id: 'naukri', label: 'Naukri' },
  { id: 'internshala', label: 'Internshala' },
  { id: 'foundit', label: 'Foundit' },
  { id: 'timesjobs', label: 'TimesJobs' },
  { id: 'shine', label: 'Shine' },
  { id: 'freshersworld', label: 'Freshersworld' },
];

const ALL_SOURCES = [...GLOBAL_SOURCES, ...INDIA_SOURCES];

export default function SearchPage() {
  const { mutate: scrapeJobs, isPending } = useScrapeJobs();
  const [role, setRole] = useState('');
  const [location, setLocation] = useState('');
  const [remote, setRemote] = useState('any');
  const [datePosted, setDatePosted] = useState('all');
  const [experience, setExperience] = useState('any');
  const [customExp, setCustomExp] = useState('');
  const [boardUrls, setBoardUrls] = useState<string[]>(['']);
  const [selectedSources, setSelectedSources] = useState<string[]>(['remoteok', 'weworkremotely']);
  const [savingName, setSavingName] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);

  const qc = useQueryClient();

  const { data: savedSearchesList = [] } = useQuery<any[]>({
    queryKey: ['saved-searches'],
    queryFn: () => fetch('/api/saved-searches').then((r) => r.json()),
  });

  const { mutate: saveSearch, isPending: isSaving } = useMutation({
    mutationFn: async (name: string) => {
      const validUrls = boardUrls.filter((u) => u.trim().length > 0);
      const body = {
        name,
        role,
        location,
        remote,
        sources: selectedSources,
        experience: experience === 'any' ? null : experience === 'custom' ? customExp.trim() : experience,
        datePosted,
        boardUrls: validUrls,
      };
      const res = await fetch('/api/saved-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Save failed');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Search saved!');
      setSavingName('');
      setShowSaveInput(false);
      qc.invalidateQueries({ queryKey: ['saved-searches'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const { mutate: deleteSearch } = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch('/api/saved-searches', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Delete failed');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['saved-searches'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function loadSavedSearch(s: any) {
    if (s.role) setRole(s.role);
    if (s.location) setLocation(s.location);
    if (s.remote) setRemote(s.remote);
    if (s.datePosted) setDatePosted(s.datePosted);
    if (s.sources && Array.isArray(s.sources)) setSelectedSources(s.sources);
    if (s.boardUrls && Array.isArray(s.boardUrls) && s.boardUrls.length > 0) {
      setBoardUrls(s.boardUrls);
    }
    if (s.experience) {
      const knownValues = ['any', 'fresher', '1-2', '2-3', '3-5', '5-7', 'senior'];
      if (knownValues.includes(s.experience)) {
        setExperience(s.experience);
      } else {
        setExperience('custom');
        setCustomExp(s.experience);
      }
    }
  }

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

    const expValue = experience === 'custom' ? customExp.trim() : experience === 'any' ? undefined : experience;

    scrapeJobs(
      {
        role,
        location,
        remote,
        boardUrls: validUrls,
        sources: useSources ? selectedSources : undefined,
        query: role,
        datePosted: datePosted === 'all' ? undefined : datePosted,
        experience: expValue,
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
    <div className="mx-auto max-w-7xl p-6 md:p-8 space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Search Jobs</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Search 8+ job sources automatically — Indeed, LinkedIn, RemoteOK, and more.
        </p>
      </div>

      {/* Saved Searches */}
      {(savedSearchesList.length > 0 || role.trim()) && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground shrink-0">
            <Bookmark className="h-3.5 w-3.5" />
            <span>Saved:</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto flex-1 min-w-0 pb-0.5">
            {savedSearchesList.map((s: any) => (
              <div
                key={s.id}
                className="flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-1 text-sm shrink-0"
              >
                <span className="max-w-[160px] truncate">{s.name}</span>
                <button
                  onClick={() => { loadSavedSearch(s); toast.info(`Loaded "${s.name}"`); }}
                  className="ml-1 rounded p-0.5 hover:text-primary transition-colors"
                  title="Load this search"
                >
                  <Play className="h-3 w-3" />
                </button>
                <button
                  onClick={() => deleteSearch(s.id)}
                  className="rounded p-0.5 hover:text-destructive transition-colors"
                  title="Delete"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
          {role.trim() && (
            <div className="flex items-center gap-2 shrink-0">
              {showSaveInput ? (
                <>
                  <Input
                    className="h-8 w-40 text-sm"
                    placeholder="Search name..."
                    value={savingName}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSavingName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && savingName.trim()) saveSearch(savingName.trim()); }}
                    autoFocus
                  />
                  <Button
                    size="sm"
                    disabled={!savingName.trim() || isSaving}
                    onClick={() => saveSearch(savingName.trim())}
                  >
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setShowSaveInput(false); setSavingName(''); }}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowSaveInput(true)}>
                  <Bookmark className="h-3.5 w-3.5" /> Save Search
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      <Card className="rounded-xl border border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle>Search Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Job Title / Role</Label>
              <Input
                placeholder="e.g. Software Engineer"
                value={role}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setRole(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Location (Optional)</Label>
              <Input
                placeholder="e.g. San Francisco"
                value={location}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setLocation(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Remote Preference</Label>
              <Select value={remote} onValueChange={(v) => setRemote(v ?? 'any')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="remote">Remote Only</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="onsite">On-site</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Date Posted</Label>
              <Select value={datePosted} onValueChange={(v) => setDatePosted(v ?? 'all')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Time</SelectItem>
                  <SelectItem value="1d">Past 24 Hours</SelectItem>
                  <SelectItem value="2d">Past 48 Hours</SelectItem>
                  <SelectItem value="7d">Past Week</SelectItem>
                  <SelectItem value="30d">Past Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Experience Level */}
          <div className="space-y-2">
            <Label>Experience Level</Label>
            <div className="flex flex-wrap gap-2">
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
                  type="button"
                  onClick={() => setExperience(value)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    experience === value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {experience === 'custom' && (
              <Input
                className="mt-2 max-w-xs"
                placeholder="e.g. 4 years, 6-8 yrs, 10+"
                value={customExp}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setCustomExp(e.target.value)}
              />
            )}
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

          {/* Global sources */}
          <div className="flex flex-wrap gap-2">
            {GLOBAL_SOURCES.map(({ id, label }) => (
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

          {/* India platforms */}
          <div className="mt-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              🇮🇳 India Platforms
            </p>
            <div className="flex flex-wrap gap-2">
              {INDIA_SOURCES.map(({ id, label }) => (
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
            <div key={i} className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Board URL {boardUrls.length > 1 ? i + 1 : ''}</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://boards.greenhouse.io/company or https://jobs.lever.co/company"
                  value={url}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => updateBoardUrl(i, e.target.value)}
                />
                <Button size="icon" variant="ghost" onClick={() => removeBoardUrl(i)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Button
        onClick={handleSearch}
        disabled={isPending}
        className="h-10 px-8 text-sm font-medium w-full"
      >
        <Search className="mr-2 h-4 w-4" />
        {isPending ? 'Scraping...' : 'Start Auto-Search'}
      </Button>

      <SearchProgressModal isOpen={isPending} />
    </div>
  );
}
