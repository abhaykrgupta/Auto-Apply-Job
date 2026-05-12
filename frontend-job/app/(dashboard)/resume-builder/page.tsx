'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Plus, Upload, Eye, Pencil, Trash2, FileText, Rocket, X, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HtmlPreview } from '@/components/resume-builder/HtmlPreview';
import { defaultResumeData, type ResumeData } from '@/components/resume-builder/types';
import { format } from 'date-fns';

interface Project { id: string; name: string; templateId: string; status: string; data: any; createdAt: string; updatedAt: string; }

export default function ResumeBuilderPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [previewProject, setPreviewProject] = useState<Project | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/resume-builder/init', { method: 'POST' }).then(() => loadProjects());
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/resume-builder');
      const data = await res.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch { toast.error('Failed to load projects'); }
    finally { setLoading(false); }
  };

  const createNew = async () => {
    setCreating(true);
    try {
      // Clear any previous imports
      sessionStorage.removeItem('resumeBuilderDraft');
      router.push(`/resume-builder/new`);
    } catch { toast.error('Failed to create resume'); setCreating(false); }
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('resume', file);
      const res = await fetch('/api/resume/parse?dryRun=true', { method: 'POST', body: formData });
      const parsed = await res.json();
      if (!res.ok) throw new Error(parsed.error || 'Parse failed');
      if (parsed.parseWarning) toast.warning(parsed.parseWarning, { duration: 8000 });

      // Map parsed data to ResumeData structure
      const pd = parsed.parsedData || {};
      const resumeData: ResumeData = {
        ...defaultResumeData,
        personal: {
          name: pd.name || '',
          email: pd.email || '',
          phone: pd.phone || '',
          location: pd.location || '',
          linkedin: pd.linkedin || '',
          github: pd.github || '',
          website: pd.website || pd.portfolio || '',
          headline: pd.headline || pd.title || '',
        },
        summary: { text: pd.summary || '' },
        experience: (pd.experience || []).map((e: any, i: number) => ({
          id: String(i),
          company: e.company || '',
          title: e.title || e.role || '',
          location: e.location || '',
          startDate: e.startDate || e.start || '',
          endDate: e.endDate || e.end || '',
          current: e.current === true || (!e.endDate && !e.end),
          // parser returns bullets[] directly; fall back to achievements[] then description string
          bullets: Array.isArray(e.bullets) && e.bullets.length > 0
            ? e.bullets
            : Array.isArray(e.achievements) && e.achievements.length > 0
              ? e.achievements
              : e.description ? [e.description] : [],
        })),
        education: (pd.education || []).map((e: any, i: number) => ({
          id: String(i),
          school: e.school || e.institution || '',
          degree: e.degree || '',
          field: e.field || '',
          startDate: e.startDate || '',
          endDate: e.endDate || e.graduationDate || '',
          gpa: e.gpa || '',
        })),
        skills: {
          technical: pd.skills || [],
          soft: pd.softSkills || [],
          languages: pd.languages || [],
          certifications: pd.certifications || [],
        },
        projects: (pd.projects || []).map((p: any, i: number) => ({
          id: String(i),
          name: p.name || '',
          description: p.description || '',
          url: p.url || '',
          technologies: p.technologies || [],
          bullets: Array.isArray(p.bullets) ? p.bullets : [],
        })),
      };

      // Don't save to database yet! Store in session storage and go to builder
      sessionStorage.setItem('resumeBuilderDraft', JSON.stringify({
        name: file.name.replace('.pdf', ''),
        data: resumeData
      }));
      
      toast.success('Resume imported! Your content is now in the builder.');
      router.push(`/resume-builder/new`);
    } catch (e: any) { toast.error(e.message || 'Upload failed'); setUploading(false); }
  };

  const deleteProject = async (id: string) => {
    if (!confirm('Delete this resume project?')) return;
    try {
      await fetch(`/api/resume-builder/${id}`, { method: 'DELETE' });
      setProjects(p => p.filter(x => x.id !== id));
      toast.success('Deleted');
    } catch { toast.error('Delete failed'); }
  };

  const renameProject = async (id: string, currentName: string) => {
    const newName = window.prompt('Rename your resume:', currentName);
    if (!newName || newName === currentName) return;
    try {
      await fetch(`/api/resume-builder/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      });
      setProjects(prev => prev.map(p => p.id === id ? { ...p, name: newName } : p));
      toast.success('Renamed');
    } catch { toast.error('Failed to rename'); }
  };

  return (
    <div className="page-container">
      <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ''; }} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Resume Builder</h1>
          <p className="text-muted-foreground mt-1">Design ATS-optimized resumes with live preview across 15 professional templates · Import an existing PDF to pre-fill your content</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setShowImportModal(true)} disabled={uploading} title="Extracts all content from your PDF and imports it into the builder for editing">
            <Upload className="h-4 w-4 mr-2" />Import PDF
          </Button>
          <Button onClick={createNew} disabled={creating}>
            <Plus className="h-4 w-4 mr-2" />{creating ? 'Creating...' : 'Create New'}
          </Button>
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">No resumes yet</h3>
          <p className="text-muted-foreground mt-1 mb-6">Create from scratch or import an existing PDF — your content will be extracted and pre-filled into the builder</p>
          <Button onClick={createNew}><Plus className="h-4 w-4 mr-2" />Create Resume</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {projects.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.06 }} className="group relative border border-border rounded-xl bg-card overflow-hidden hover:border-primary/40 transition-all hover:shadow-md">
                {/* Template color strip */}
                <div className="h-1.5 w-full" style={{ backgroundColor: '#4f46e5' }} />
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 
                        className="font-semibold text-sm truncate flex items-center gap-1.5 cursor-pointer hover:text-primary transition-colors group/name"
                        onClick={() => renameProject(p.id, p.name)}
                        title="Click to rename"
                      >
                        {p.name}
                        <Pencil className="h-3 w-3 opacity-0 group-hover/name:opacity-100 transition-opacity" />
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5 capitalize">{p.templateId} template</p>
                    </div>
                    <Badge variant={p.status === 'deployed' ? 'default' : 'secondary'} className="text-[10px] ml-2 shrink-0">
                      {p.status === 'deployed' ? <><Rocket className="h-2.5 w-2.5 mr-1" />Deployed</> : 'Draft'}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mb-4">Updated {format(new Date(p.updatedAt), 'MMM d, yyyy')}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => setPreviewProject(p)}><Eye className="h-3.5 w-3.5 mr-1.5" />Preview</Button>
                    <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => router.push(`/resume-builder/${p.id}`)}><Pencil className="h-3.5 w-3.5 mr-1.5" />Edit</Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      title="Download PDF"
                      onClick={() => {
                        const a = document.createElement('a');
                        a.href = `/api/resume-builder/${p.id}/download`;
                        a.download = `${p.name.replace(/\s+/g, '-')}.pdf`;
                        a.click();
                      }}
                    >
                      <Download className="h-3.5 w-3.5 text-primary" />
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0 hover:text-destructive hover:border-destructive" onClick={() => deleteProject(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Preview Modal */}
      <AnimatePresence>
        {previewProject && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPreviewProject(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-sm text-gray-900">{previewProject.name}</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-[10px]"
                    onClick={() => {
                      const a = document.createElement('a');
                      a.href = `/api/resume-builder/${previewProject.id}/download`;
                      a.download = `${previewProject.name.replace(/\s+/g, '-')}.pdf`;
                      a.click();
                    }}
                  >
                    <Download className="h-3 w-3 mr-1" />Download PDF
                  </Button>
                </div>
                <button onClick={() => setPreviewProject(null)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
              </div>
              <div className="overflow-y-auto max-h-[calc(90vh-52px)]">
                <div style={{ transform: 'scale(0.75)', transformOrigin: 'top center', width: '133%', marginLeft: '-16.5%' }}>
                  <HtmlPreview data={previewProject.data as ResumeData || defaultResumeData} templateId={previewProject.templateId} />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Import / Uploading Modal */}
        {showImportModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
              {!uploading && (
                <button onClick={() => setShowImportModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              )}
              
              <div className="text-center">
                {uploading ? (
                  <div className="flex flex-col items-center py-8">
                    <Loader2 className="h-12 w-12 text-primary animate-spin mb-6" />
                    <h3 className="font-semibold text-xl text-gray-900 mb-2">Importing your resume</h3>
                    <p className="text-sm text-muted-foreground max-w-[280px]">Extracting text and parsing structure with AI. This will just take a moment...</p>
                  </div>
                ) : (
                  <div className="py-4">
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                      <Upload className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-xl text-gray-900 mb-2">Import Existing Resume</h3>
                    <p className="text-sm text-muted-foreground mb-8">Upload your current resume (PDF, DOCX). We will use AI to extract your content and pre-fill the builder for you.</p>
                    
                    <div 
                      className="border-2 border-dashed border-gray-200 rounded-xl p-8 hover:bg-gray-50 hover:border-primary/50 transition-colors cursor-pointer"
                      onClick={() => fileRef.current?.click()}
                    >
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm font-medium text-gray-700">Click to browse or drag and drop</p>
                      <p className="text-xs text-muted-foreground mt-1">PDF, DOC, DOCX up to 10MB</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
