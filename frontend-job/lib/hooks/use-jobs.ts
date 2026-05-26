'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

export interface JobFilters {
  search?:     string;
  status?:     string;
  source?:     string;
  country?:    string;
  location?:   string;
  datePosted?: string;
  limit?:      number;
  offset?:     number;
}

export function useJobs(filters: JobFilters = {}) {
  const params = new URLSearchParams();
  if (filters.search)     params.set('search',     filters.search);
  if (filters.status)     params.set('status',     filters.status);
  if (filters.source)     params.set('source',     filters.source);
  if (filters.country)    params.set('country',    filters.country);
  if (filters.location)   params.set('location',   filters.location);
  if (filters.datePosted) params.set('datePosted', filters.datePosted);
  if (filters.limit)      params.set('limit',      String(filters.limit));
  if (filters.offset)     params.set('offset',     String(filters.offset));

  const qs = params.toString();

  return useQuery({
    queryKey: ['jobs', filters],
    queryFn: async () => {
      const res = await fetch(`/api/jobs${qs ? `?${qs}` : ''}`);
      if (!res.ok) throw new Error('Failed to fetch jobs');
      const json = await res.json();
      // Normalize: backend may return flat array (old) or paginated object (new)
      if (Array.isArray(json)) {
        return { data: json as unknown[], total: json.length, limit: filters.limit ?? 50, offset: filters.offset ?? 0 };
      }
      return json as { data: unknown[]; total: number; limit: number; offset: number };
    },
    staleTime: 30_000,
  });
}

/** 300ms debounce — use this for search inputs to avoid hammering the API */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function useScrapeJobs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (filters: { role?: string; location?: string; boardUrls?: string[] }) => {
      const res = await fetch('/api/jobs/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters),
      });
      if (!res.ok) throw new Error('Failed to scrape jobs');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  });
}

export interface MatchFilters {
  role?:       string;
  location?:   string;
  remote?:     'any' | 'remote' | 'onsite' | 'hybrid';
  experience?: 'any' | 'fresher' | '1-2' | '2-3' | '3-5' | '5-7' | 'senior';
  datePosted?: 'any' | '1d' | '3d' | '7d' | '30d';
}

export function useMatchJobs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ resumeId, filters }: { resumeId: string; filters?: MatchFilters }) => {
      const res = await fetch('/api/jobs/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId, ...filters }),
      });
      if (!res.ok) throw new Error('Failed to match jobs');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['matches'] }),
  });
}
