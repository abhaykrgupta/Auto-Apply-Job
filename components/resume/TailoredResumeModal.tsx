'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Wand2, X, ArrowRight, TrendingUp, CheckCircle } from 'lucide-react';

interface Props {
  jobId: string;
  jobTitle: string;
  company: string;
  onClose: () => void;
}

export function TailoredResumeModal({ jobId, jobTitle, company, onClose }: Props) {
  const [result, setResult] = useState<any>(null);

  const { mutate: tailor, isPending } = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/jobs/${jobId}/tailor`, { method: 'POST' });
      if (!res.ok) throw new Error('Tailoring failed');
      return res.json();
    },
    onSuccess: (data) => {
      setResult(data.tailored);
      toast.success('Resume tailored successfully!');
    },
    onError: () => toast.error('Failed to tailor resume. Check your OpenAI key.'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-background border border-border shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-purple-500" />
              AI Resume Tailor
            </h2>
            <p className="text-sm text-muted-foreground">
              {jobTitle} at {company}
            </p>
          </div>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-muted transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {!result ? (
            <div className="text-center py-8 space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Wand2 className="h-8 w-8 text-purple-500" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Tailor Your Resume</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                  AI will rewrite your resume bullets using exact keywords from this job description to maximize ATS score.
                </p>
              </div>
              <Button onClick={() => tailor()} disabled={isPending} size="lg">
                {isPending ? (
                  <>
                    <Wand2 className="mr-2 h-4 w-4 animate-pulse" />
                    Tailoring Resume...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Tailor Now (GPT-4o)
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Match boost */}
              {result.matchBoost > 0 && (
                <div className="flex items-center gap-3 rounded-lg bg-green-50 dark:bg-green-900/20 p-4 border border-green-200 dark:border-green-800">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-700 dark:text-green-400">
                      Estimated +{result.matchBoost}% match score boost
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-500">Apply these changes before submitting</p>
                  </div>
                </div>
              )}

              {/* New summary */}
              {result.summary && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Tailored Professional Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed">{result.summary}</p>
                  </CardContent>
                </Card>
              )}

              {/* Bullet rewrites */}
              {result.tailoredBullets?.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Rewritten Bullets ({result.tailoredBullets.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {result.tailoredBullets.map((b: any, i: number) => (
                      <div key={i} className="space-y-1 text-sm">
                        <p className="line-through text-muted-foreground">{b.original}</p>
                        <div className="flex gap-2">
                          <ArrowRight className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
                          <p className="text-foreground font-medium">{b.tailored}</p>
                        </div>
                        <p className="text-xs text-muted-foreground pl-6">{b.reason}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Skills */}
              {result.skillsToHighlight?.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Highlight These Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {result.skillsToHighlight.map((s: string) => (
                      <Badge key={s} variant="default" className="bg-green-600">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {result.skillsToAdd?.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Consider Adding</p>
                  <div className="flex flex-wrap gap-2">
                    {result.skillsToAdd.map((s: string) => (
                      <Badge key={s} variant="outline">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Cover letter hint */}
              {result.coverLetterHint && (
                <Card className="border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20">
                  <CardContent className="pt-4">
                    <p className="text-sm font-medium text-purple-700 dark:text-purple-400 mb-1">Cover Letter Angle</p>
                    <p className="text-sm text-purple-600 dark:text-purple-300">{result.coverLetterHint}</p>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-2 pt-2">
                <Button onClick={() => setResult(null)} variant="outline" className="flex-1">
                  Retailor
                </Button>
                <Button onClick={onClose} className="flex-1">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
