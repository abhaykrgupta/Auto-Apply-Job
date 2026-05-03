'use client';

import { useQuery } from '@tanstack/react-query';
import { useResumes } from '@/lib/hooks/use-resume';
import { useMatchJobs } from '@/lib/hooks/use-jobs';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Star, Zap } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function MatchesPage() {
  const { data: resumes } = useResumes();
  const activeResume = resumes?.find((r: any) => r.isActive) ?? resumes?.[0];
  const { mutate: matchJobs, isPending: isMatching } = useMatchJobs();

  const { data: matches, isLoading } = useQuery({
    queryKey: ['matches', activeResume?.id],
    queryFn: async () => {
      if (!activeResume?.id) return [];
      const res = await fetch(`/api/jobs/matches?resumeId=${activeResume.id}`);
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    enabled: !!activeResume?.id,
  });

  function runMatching() {
    if (!activeResume?.id) {
      toast.error('Upload a resume first');
      return;
    }
    matchJobs(activeResume.id, {
      onSuccess: () => toast.success('Matching complete!'),
      onError: () => toast.error('Matching failed. Check OpenAI API key.'),
    });
  }

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Matched Jobs</h2>
          <p className="text-muted-foreground">Jobs ranked by AI compatibility score</p>
        </div>
        <Button onClick={runMatching} disabled={isMatching}>
          <Zap className="mr-2 h-4 w-4" />
          {isMatching ? 'Matching...' : 'Run AI Match'}
        </Button>
      </div>

      {!matches?.length ? (
        <EmptyState
          icon={Star}
          title="No matches yet"
          description="Click 'Run AI Match' to score all discovered jobs against your resume."
          action={<Button onClick={runMatching} disabled={isMatching}>Run AI Match</Button>}
        />
      ) : (
        <div className="space-y-4">
          {matches.map((m: any) => (
            <Card key={m.match.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{m.job.title}</h3>
                      <Badge className={m.match.score >= 80 ? 'bg-green-500 text-white' : m.match.score >= 60 ? 'bg-yellow-500 text-white' : 'bg-gray-500 text-white'}>
                        {Math.round(m.match.score)}% Match
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      {m.job.company} • {m.job.location ?? 'Remote'}
                    </p>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-xs font-medium mb-1">Strengths</p>
                        <ul className="space-y-1">
                          {(m.match.strengths ?? []).map((s: string, i: number) => (
                            <li key={i} className="text-xs text-green-600 dark:text-green-400">✓ {s}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-medium mb-1">Gaps</p>
                        <ul className="space-y-1">
                          {(m.match.weaknesses ?? []).map((w: string, i: number) => (
                            <li key={i} className="text-xs text-yellow-600 dark:text-yellow-400">⚠ {w}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    {m.match.recommendation && (
                      <p className="text-sm italic text-muted-foreground">{m.match.recommendation}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Link href={`/jobs/${m.job.id}`} className={cn(buttonVariants({ size: 'sm' }))}>View Job</Link>
                    <Link href={`/jobs/${m.job.id}/apply`} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>Apply</Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
