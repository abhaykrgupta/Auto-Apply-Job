'use client';

import { useState, useRef, useCallback, type ChangeEvent, type KeyboardEvent, type DragEvent } from 'react';
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
  CloudUpload,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { timeAgo } from '@/lib/utils/helpers';

// ── Upload Modal ─────────────────────────────────────────────────────────────

function UploadModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { mutate: uploadResume, isPending: uploading } = useUploadResume();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ACCEPTED = ['.pdf', '.doc', '.docx', '.txt'];
  const MAX_MB = 10;

  function validateFile(file: File): string | null {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ACCEPTED.includes(ext)) return `Unsupported format. Use PDF, DOC, DOCX, or TXT.`;
    if (file.size > MAX_MB * 1024 * 1024) return `File too large (max ${MAX_MB} MB).`;
    return null;
  }

  function pickFile(file: File) {
    const err = validateFile(file);
    if (err) { setError(err); setSelectedFile(null); return; }
    setError(null);
    setSelectedFile(file);
  }

  const onDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) pickFile(file);
  }, []);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) pickFile(file);
    e.target.value = '';
  }

  function handleUpload() {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append('resume', selectedFile);
    uploadResume(formData, {
      onSuccess: () => {
        setDone(true);
        setTimeout(() => { handleClose(); }, 1400);
        toast.success('Resume uploaded and parsed!');
      },
      onError: () => {
        setError('Upload failed. Check your OpenAI API key in Settings.');
      },
    });
  }

  function handleClose() {
    if (uploading) return;
    setSelectedFile(null);
    setDone(false);
    setError(null);
    setDragOver(false);
    onClose();
  }

  function formatBytes(bytes: number) {
    return bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(0)} KB`
      : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Subtle backdrop */}
      <div className="absolute inset-0 bg-black/20" onClick={handleClose} />

      {/* Modal */}
      <div className="relative w-full max-w-[480px] rounded-2xl border border-border bg-card shadow-2xl shadow-black/15 animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <CloudUpload className="h-[18px] w-[18px] text-primary" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-foreground leading-tight">Upload Resume</h2>
              <p className="text-[12px] text-muted-foreground mt-0.5">PDF, DOC, DOCX — max {MAX_MB} MB</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={uploading}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-foreground/40 hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          {/* Success state */}
          {done ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="h-14 w-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-emerald-500" />
              </div>
              <p className="text-[15px] font-bold text-foreground">Uploaded successfully!</p>
              <p className="text-[13px] text-muted-foreground">AI is parsing your resume…</p>
            </div>
          ) : (
            <>
              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => !selectedFile && fileRef.current?.click()}
                className={cn(
                  'relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer select-none',
                  selectedFile
                    ? 'border-primary/40 bg-primary/4 cursor-default py-6'
                    : dragOver
                      ? 'border-primary bg-primary/6 py-10'
                      : 'border-border hover:border-primary/50 hover:bg-muted/40 py-10'
                )}
              >
                {selectedFile ? (
                  <div className="flex items-center gap-4 px-4 w-full">
                    <div className="h-11 w-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-foreground truncate">{selectedFile.name}</p>
                      <p className="text-[12px] text-muted-foreground mt-0.5">{formatBytes(selectedFile.size)}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setError(null); }}
                      className="h-7 w-7 rounded-lg flex items-center justify-center text-foreground/40 hover:text-foreground hover:bg-muted transition-colors shrink-0"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className={cn(
                      'h-12 w-12 rounded-2xl flex items-center justify-center mb-4 transition-colors duration-200',
                      dragOver ? 'bg-primary/15' : 'bg-muted'
                    )}>
                      <Upload className={cn('h-5 w-5 transition-colors', dragOver ? 'text-primary' : 'text-foreground/40')} />
                    </div>
                    <p className="text-[14px] font-semibold text-foreground">
                      {dragOver ? 'Drop it here' : 'Drag & drop your resume'}
                    </p>
                    <p className="text-[12px] text-muted-foreground mt-1">
                      or{' '}
                      <span className="text-primary font-semibold underline underline-offset-2">browse files</span>
                    </p>
                  </>
                )}
              </div>

              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                className="hidden"
                onChange={handleFileChange}
              />

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/6 px-3.5 py-2.5">
                  <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <p className="text-[13px] text-destructive font-medium leading-snug">{error}</p>
                </div>
              )}

              {/* Formats */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-muted-foreground font-medium">Supported:</span>
                {['PDF', 'DOC', 'DOCX', 'TXT'].map((f) => (
                  <span key={f} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-muted border border-border text-foreground/60 uppercase tracking-wide">
                    {f}
                  </span>
                ))}
              </div>

              {/* What happens */}
              <div className="rounded-xl bg-muted/50 border border-border px-4 py-3 space-y-2">
                <p className="text-[11px] font-bold text-foreground/55 uppercase tracking-[0.1em]">What happens next</p>
                {[
                  'AI extracts your skills, experience & education',
                  'Creates an embedding for job matching',
                  'Resume is ready for auto-apply',
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/50 shrink-0" />
                    <span className="text-[12px] text-muted-foreground">{step}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!done && (
          <div className="flex items-center justify-end gap-2 px-6 pb-5 pt-1">
            <Button variant="outline" size="sm" onClick={handleClose} disabled={uploading}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="min-w-[120px] gap-2"
            >
              {uploading
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading…</>
                : <><CloudUpload className="h-3.5 w-3.5" /> Upload Resume</>
              }
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Resume Page ──────────────────────────────────────────────────────────────

export default function ResumePage() {
  const { data: resumes, isLoading } = useResumes();
  const { mutate: uploadResume, isPending: uploading } = useUploadResume();
  const { mutate: toggleActive } = useToggleResumeActive();
  const { mutate: updateLabel } = useUpdateResumeLabel();
  const { mutate: deleteResume } = useDeleteResume();

  const fileRef = useRef<HTMLInputElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
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
    <>
      <UploadModal open={modalOpen} onClose={() => setModalOpen(false)} />

      <div className="mx-auto max-w-7xl p-6 md:p-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Resume Manager</h2>
            <p className="text-muted-foreground text-sm mt-1">
              {resumes?.length ?? 0} resume{resumes?.length !== 1 ? 's' : ''} &mdash; {activeCount} active for auto-apply
            </p>
          </div>
          <Button onClick={() => setModalOpen(true)} disabled={uploading} className="shrink-0">
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
              <Button onClick={() => setModalOpen(true)}>
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
    </>
  );
}
