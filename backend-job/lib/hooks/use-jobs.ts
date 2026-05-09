'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useJobs() {
  return useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const res = await fetch('/api/jobs');
      if (!res.ok) throw new Error('Failed to fetch jobs');
      return res.json();
    },
  });
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

export function useMatchJobs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (resumeId: string) => {
      const res = await fetch('/api/jobs/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId }),
      });
      if (!res.ok) throw new Error('Failed to match jobs');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['matches'] }),
  });
}
