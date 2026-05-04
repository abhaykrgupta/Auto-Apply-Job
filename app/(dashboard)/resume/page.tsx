'use client';

import { useState, useRef, type ChangeEvent, type KeyboardEvent } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  useResumes,
  useUploadResume,
  useToggleResumeActive,
  useUpdateResumeLabel,
  useDeleteResume,
} from '@/lib/hooks/use-resume';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  FileText,
  Upload,
  Pencil,
  Check,
  X,
  Trash2,
  Eye,
  Download,
  Power,
  PowerOff,
} from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { timeAgo } from '@/lib/utils/helpers';

export default function ResumePage() {
  const { data: resumes, isLoading } = useResumes();
  const { mutate: uploadResume, isPending: uploading } = useUploadResume();
  const { mutate: toggleActive } = useToggleResumeActive();
  const { mutate: updateLabel } = useUpdateResumeLabel();
  const { mutate: deleteResume } = useDeleteResume();

  const fileRef = useRef<HTMLInputElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('resume', file);
    uploadResume(formData, {
      onSuccess: () => toast.success('Resume uploaded and parsed!'),
      onError: () => toast.error('Upload failed. Check your OpenAI API key.'),
    });
    e.target.value = '';
  }

  function startEdit(resume: any) {
    setEditingId(resume.id);
    setEditValue(resume.label ?? resume.fileName.replace(/\.[^.]+$/, ''));
  }

  function commitEdit(id: string) {
    if (!editValue.trim()) { cancelEdit(); return; }
    updateLabel({ id, label: editValue.trim() }, {
      onSuccess: () => toast.success('Label updated'),
      onError: () => toast.error('Failed to update label'),
    });
    setEditingId(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValue('');
  }

  function handleToggle(resume: any) {
    const next = !resume.isActive;
    toggleActive({ id: resume.id, isActive: next }, {
      onSuccess: () => toast.success(next ? 'Resume activated' : 'Resume deactivated'),
      onError: () => toast.error('Failed to update'),
    });
  }

  function handleDelete(resume: any) {
    if (!confirm(`Delete "${resume.label ?? resume.fileName}"? This cannot be undone.`)) return;
    deleteResume(resume.id, {
      onSuccess: () => toast.success('Resume deleted'),
      onError: () => toast.error('Failed to delete'),
    });
  }

  if (isLoading) return <LoadingSpinner />;

  const activeCount = resumes?.filter((r: any) => r.isActive).length ?? 0;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Resume Manager</h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            {resumes?.length ?? 0} resume{resumes?.length !== 1 ? 's' : ''} &mdash; {activeCount} active for auto-apply
          </p>
        </div>
        <Button onClick={() => fileRef.current?.click()} disabled={uploading} className="shrink-0">
          <Upload className="mr-2 h-4 w-4" />
          {uploading ? 'Uploading...' : 'Upload Resume'}
        </Button>
        <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={handleUpload} />
      </div>

      {(resumes?.length ?? 0) > 1 && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
          <strong>Smart Selection active:</strong> when you apply to a job, the best matching resume is chosen automatically from your active resumes.
        </div>
      )}

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
            <Card
              key={resume.id}
              className={cn(
                'transition-all duration-150',
                resume.isActive ? 'ring-2 ring-primary shadow-sm' : 'opacity-60 border-dashed'
              )}
            >
              <CardHeader className="pb-2 space-y-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    {editingId === resume.id ? (
                      <div className="flex items-center gap-1 flex-1">
                        <Input
                          className="h-7 text-sm px-2"
                          value={editValue}
                          autoFocus
                          onChange={(e: ChangeEvent<HTMLInputElement>) => setEditValue(e.target.value)}
                          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                            if (e.key === 'Enter') commitEdit(resume.id);
                            if (e.key === 'Escape') cancelEdit();
                          }}
                        />
                        <button onClick={() => commitEdit(resume.id)} className="text-green-500 hover:text-green-600">
                          <Check className="h-4 w-4" />
                        </button>
                        <button onClick={cancelEdit} className="text-muted-foreground hover:text-foreground">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="font-semibold text-sm truncate">
                          {resume.label ?? resume.fileName.replace(/\.[^.]+$/, '')}
                        </span>
                        <button
                          onClick={() => startEdit(resume)}
                          className="text-muted-foreground hover:text-foreground shrink-0"
                          title="Edit label"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {resume.isActive ? (
                    <Badge className="bg-green-500/10 text-green-600 border border-green-500/20 shrink-0 text-xs">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground shrink-0 text-xs">
                      Inactive
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground pl-6">
                  {resume.fileName} &middot; Uploaded {timeAgo(resume.createdAt)}
                </p>
              </CardHeader>

              <CardContent className="space-y-3 pt-1">
                {resume.parsedData && (
                  <div className="space-y-2">
                    {(resume.parsedData.skills ?? []).length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Skills</p>
                        <div className="flex flex-wrap gap-1">
                          {(resume.parsedData.skills ?? []).slice(0, 8).map((skill: string) => (
                            <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                          ))}
                          {(resume.parsedData.skills?.length ?? 0) > 8 && (
                            <Badge variant="outline" className="text-xs">
                              +{resume.parsedData.skills.length - 8} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                    {(resume.parsedData.experience ?? []).length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Experience</p>
                        {(resume.parsedData.experience ?? []).slice(0, 2).map((exp: any, i: number) => (
                          <p key={i} className="text-xs text-muted-foreground truncate">
                            {exp.title} @ {exp.company}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <Button
                    size="sm"
                    variant={resume.isActive ? 'outline' : 'default'}
                    onClick={() => handleToggle(resume)}
                    className="gap-1.5"
                  >
                    {resume.isActive
                      ? <><PowerOff className="h-3 w-3" /> Deactivate</>
                      : <><Power className="h-3 w-3" /> Activate</>
                    }
                  </Button>

                  <a
                    href={`/resume/view?url=${encodeURIComponent(resume.fileUrl ?? '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}
                  >
                    <Eye className="h-3 w-3" /> View
                  </a>

                  <a
                    href={resume.fileUrl ?? '#'}
                    download
                    className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}
                  >
                    <Download className="h-3 w-3" /> Download
                  </a>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(resume)}
                    className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 ml-auto"
                  >
                    <Trash2 className="h-3 w-3" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
