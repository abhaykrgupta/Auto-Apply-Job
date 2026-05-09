'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Copy, Check, X, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Props {
  jobId: string;
  jobTitle: string;
  company: string;
  onClose: () => void;
}

export function CoverLetterModal({ jobId, jobTitle, company, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  const { mutate: generate, isPending, data } = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/jobs/${jobId}/cover-letter`, { method: 'POST' });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed');
      return res.json();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function copyText() {
    if (!data?.coverLetter) return;
    navigator.clipboard.writeText(data.coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard!');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border p-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-primary" />
              <h2 className="text-base font-semibold">AI Cover Letter</h2>
            </div>
            <p className="text-sm text-muted-foreground">{jobTitle} · {company}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-accent transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {!data && !isPending && (
            <div className="text-center py-8 space-y-3">
              <p className="text-sm text-muted-foreground">GPT-4o will write a tailored cover letter using your resume and this job description.</p>
              <Button onClick={() => generate()} className="gap-2">
                <FileText className="h-4 w-4" /> Generate Cover Letter
              </Button>
            </div>
          )}

          {isPending && (
            <div className="flex items-center justify-center py-12 gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Writing your cover letter...</span>
            </div>
          )}

          {data?.coverLetter && (
            <div className="space-y-4">
              <div className="rounded-xl bg-muted p-4 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                {data.coverLetter}
              </div>
              <div className="flex gap-2">
                <Button onClick={copyText} variant="outline" className="gap-2 flex-1">
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied!' : 'Copy to Clipboard'}
                </Button>
                <Button onClick={() => generate()} variant="ghost" className="gap-2">
                  Regenerate
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
