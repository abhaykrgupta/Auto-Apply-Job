'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useResumes, useUploadResume } from '@/lib/hooks/use-resume';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { FileText, Upload, CheckCircle } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { timeAgo } from '@/lib/utils/helpers';

export default function ResumePage() {
  const { data: resumes, isLoading } = useResumes();
  const { mutate: uploadResume, isPending } = useUploadResume();
  const fileRef = useRef<HTMLInputElement>(null);

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('resume', file);

    uploadResume(formData, {
      onSuccess: () => toast.success('Resume uploaded and parsed!'),
      onError: () => toast.error('Upload failed. Check your OpenAI API key.'),
    });
  }

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Resume Manager</h2>
          <p className="text-muted-foreground">Upload and manage your resumes</p>
        </div>
        <Button onClick={() => fileRef.current?.click()} disabled={isPending}>
          <Upload className="mr-2 h-4 w-4" />
          {isPending ? 'Uploading...' : 'Upload Resume'}
        </Button>
        <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={handleUpload} />
      </div>

      {!resumes?.length ? (
        <EmptyState
          icon={FileText}
          title="No resumes uploaded"
          description="Upload your resume to get started. We'll parse it with AI to extract your skills and experience."
          action={
            <Button onClick={() => fileRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" /> Upload Resume
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {resumes.map((resume: any) => (
            <Card key={resume.id} className={resume.isActive ? 'ring-2 ring-primary' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-base">{resume.fileName}</CardTitle>
                  </div>
                  {resume.isActive && (
                    <Badge className="bg-green-500 text-white">
                      <CheckCircle className="mr-1 h-3 w-3" /> Active
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Uploaded {timeAgo(resume.createdAt)}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {resume.parsedData && (
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Skills</p>
                      <div className="flex flex-wrap gap-1">
                        {(resume.parsedData.skills ?? []).slice(0, 6).map((skill: string) => (
                          <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                        ))}
                        {(resume.parsedData.skills?.length ?? 0) > 6 && (
                          <Badge variant="outline" className="text-xs">+{resume.parsedData.skills.length - 6} more</Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Experience</p>
                      {(resume.parsedData.experience ?? []).slice(0, 2).map((exp: any, i: number) => (
                        <p key={i} className="text-xs text-muted-foreground">{exp.title} @ {exp.company}</p>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <a href={resume.fileUrl} target="_blank" rel="noopener noreferrer" type="application/pdf" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>View</a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
