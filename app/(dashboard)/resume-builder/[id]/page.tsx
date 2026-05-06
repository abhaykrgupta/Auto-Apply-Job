'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft, Rocket, Download, LayoutTemplate,
  Check, Loader2, ChevronRight, Eye, PenLine, Sparkles, AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BuilderForm } from '@/components/resume-builder/BuilderForm';
import { HtmlPreview } from '@/components/resume-builder/HtmlPreview';
import { TemplatePicker } from '@/components/resume-builder/TemplatePicker';
import { defaultResumeData, type ResumeData } from '@/components/resume-builder/types';
import { getTemplate } from '@/components/resume-builder/templates/templateList';
import { cn } from '@/lib/utils';

type RightTab = 'preview' | 'templates' | 'tailor';

// Auto-scales A4 resume to fit the available panel width on any screen size
function ResumePreviewPanel({ data, templateId }: { data: ResumeData; templateId: string }) {
  const A4_W = 794;
  const A4_H = 1123;
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      const avail = entry.contentRect.width - 32; // subtract padding
      setScale(Math.min(1, avail / A4_W));
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-900 p-4">
      <div className="flex flex-col items-center gap-3 w-full">
        {/* Page label */}
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 self-center">
          <span className="w-2 h-2 rounded-sm bg-slate-400/60" />
          A4 Preview · Page breaks shown as dashed lines
        </div>
        {/* Outer div shrinks to the scaled size so scroll is correct */}
        <div style={{ width: A4_W * scale, minHeight: A4_H * scale, position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: A4_W,
              transformOrigin: 'top left',
              transform: `scale(${scale})`,
              backgroundColor: '#fff',
              minHeight: A4_H,
            }}
            className="shadow-2xl ring-1 ring-black/8"
          >
            <HtmlPreview data={data} templateId={templateId} />
            {/* A4 page break indicator lines every 1123px */}
            {[1, 2, 3].map(page => (
              <div
                key={page}
                style={{
                  position: 'absolute',
                  top: A4_H * page,
                  left: 0,
                  right: 0,
                  pointerEvents: 'none',
                  zIndex: 10,
                }}
              >
                <div style={{ borderTop: '2px dashed rgba(99,102,241,0.5)', position: 'relative' }}>
                  <span style={{
                    position: 'absolute', top: -9, right: 8,
                    fontSize: 9, color: 'rgba(99,102,241,0.7)',
                    background: '#fff', padding: '0 4px', fontFamily: 'sans-serif',
                  }}>
                    Page {page + 1}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BuilderPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [project, setProject] = useState<any>(null);
  const [data, setData] = useState<ResumeData>(defaultResumeData);
  const [templateId, setTemplateId] = useState('classic');
  const [projectName, setProjectName] = useState('Untitled Resume');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [rightTab, setRightTab] = useState<RightTab>('preview');
  const [deploying, setDeploying] = useState(false);
  const [deployed, setDeployed] = useState(false);
  const [downloading, setDownloading] = useState(false);
  // Mobile: which panel is active
  const [mobilePanel, setMobilePanel] = useState<'form' | 'preview' | 'templates' | 'tailor'>('form');
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // AI Tailor state
  const [jobDesc, setJobDesc] = useState('');
  const [tailoring, setTailoring] = useState(false);
  const [tailorResult, setTailorResult] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/resume-builder/${id}`)
      .then(r => r.json())
      .then(p => {
        if (p.error) { toast.error('Project not found'); router.push('/resume-builder'); return; }
        setProject(p);
        setData((p.data && Object.keys(p.data).length > 0) ? p.data : defaultResumeData);
        setTemplateId(p.templateId || 'classic');
        setProjectName(p.name || 'Untitled Resume');
        setDeployed(p.status === 'deployed');
      });
  }, [id]);

  const save = useCallback(async (newData: ResumeData, newTemplateId: string, newName: string) => {
    setSaveStatus('saving');
    try {
      await fetch(`/api/resume-builder/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: newData, templateId: newTemplateId, name: newName }),
      });
      setSaveStatus('saved');
    } catch { setSaveStatus('unsaved'); }
  }, [id]);

  const scheduleAutoSave = useCallback((newData: ResumeData, tId: string, name: string) => {
    setSaveStatus('unsaved');
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(newData, tId, name), 1500);
  }, [save]);

  const handleDataChange = (newData: ResumeData) => {
    setData(newData);
    scheduleAutoSave(newData, templateId, projectName);
  };

  const handleTemplateChange = (newTemplateId: string) => {
    setTemplateId(newTemplateId);
    scheduleAutoSave(data, newTemplateId, projectName);
    // Switch back to preview so user instantly sees the change
    setRightTab('preview');
  };

  const handleNameChange = (newName: string) => {
    setProjectName(newName);
    scheduleAutoSave(data, templateId, newName);
  };

  // Warn user before navigating away with unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (saveStatus === 'unsaved' || saveStatus === 'saving') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [saveStatus]);

  // Cmd+S / Ctrl+S to save immediately
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        clearTimeout(saveTimer.current);
        save(data, templateId, projectName).then(() => toast.success('Saved'));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [data, templateId, projectName, save]);

  const downloadPdf = async () => {
    setDownloading(true);
    try {
      await save(data, templateId, projectName);
      const a = document.createElement('a');
      a.href = `/api/resume-builder/${id}/download`;
      a.download = `${projectName.replace(/\s+/g, '-')}.pdf`;
      a.click();
    } catch { toast.error('Download failed'); }
    finally { setDownloading(false); }
  };

  const deploy = async () => {
    setDeploying(true);
    try {
      await save(data, templateId, projectName);
      const res = await fetch(`/api/resume-builder/${id}/deploy`, { method: 'POST' });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Deploy failed');
      setDeployed(true);
      toast.success('Resume Deployed! You can now use this for Auto-Applying to jobs.', { duration: 6000 });
    } catch (e: any) { toast.error(e.message || 'Deploy failed'); }
    finally { setDeploying(false); }
  };

  const tailorToJob = async () => {
    if (!jobDesc.trim()) { toast.error('Paste a job description first'); return; }
    setTailoring(true);
    setTailorResult(null);
    try {
      const res = await fetch('/api/resume-builder/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'tailor', data: { resumeData: data, jobDescription: jobDesc } }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setTailorResult(json.result);
    } catch (e: any) { toast.error(e.message || 'Tailor failed'); }
    finally { setTailoring(false); }
  };

  const applyTailoredSummary = () => {
    if (!tailorResult?.summary) return;
    handleDataChange({ ...data, summary: { text: tailorResult.summary } });
    toast.success('Tailored summary applied!');
  };

  const applyTailoredBullets = () => {
    if (!tailorResult?.tailoredBullets?.length) return;
    const bulletMap: Record<string, string> = {};
    tailorResult.tailoredBullets.forEach((b: any) => { bulletMap[b.original] = b.tailored; });
    const newExp = data.experience.map(exp => ({
      ...exp,
      bullets: exp.bullets.map(b => bulletMap[b] ?? b),
    }));
    handleDataChange({ ...data, experience: newExp });
    toast.success('Tailored bullets applied!');
  };

  const currentTemplate = getTemplate(templateId);

  // Resume must have at minimum: a name + email + at least one experience or education entry
  const isResumeReady =
    data.personal.name.trim().length > 0 &&
    data.personal.email.trim().length > 0 &&
    (data.experience.length > 0 || data.education.length > 0);

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading resume builder...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">

      {/* ── Top Bar ─────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-border bg-card/80 backdrop-blur-sm shrink-0 shadow-sm">
        {/* Back */}
        <button
          onClick={() => router.push('/resume-builder')}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Resumes</span>
        </button>

        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />

        {/* Editable project name */}
        <input
          value={projectName}
          onChange={e => handleNameChange(e.target.value)}
          className="flex-1 min-w-0 bg-transparent text-sm font-semibold focus:outline-none border-b border-transparent focus:border-primary/40 pb-0.5 transition-colors"
          placeholder="Resume name..."
        />

        {/* Save status pill — hidden on xs to save space */}
        <div className={cn(
          'hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full shrink-0 transition-all',
          saveStatus === 'saving' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400' :
          saveStatus === 'saved'  ? 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400' :
                                    'bg-muted text-muted-foreground'
        )}>
          {saveStatus === 'saving' && <Loader2 className="h-3 w-3 animate-spin" />}
          {saveStatus === 'saved'  && <Check className="h-3 w-3" />}
          {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved' : 'Unsaved'}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Button variant="outline" size="sm" onClick={downloadPdf} disabled={downloading} className="h-8 text-xs px-2.5">
            {downloading
              ? <Loader2 className="h-3.5 w-3.5 sm:mr-1.5 animate-spin" />
              : <Download className="h-3.5 w-3.5 sm:mr-1.5" />}
            <span className="hidden sm:inline">{downloading ? 'Generating…' : 'Download PDF'}</span>
          </Button>

          <Button
            size="sm"
            onClick={() => {
              if (!isResumeReady) {
                toast.error('Complete your resume first — add your name, email, and at least one experience or education entry.');
                return;
              }
              deploy();
            }}
            disabled={deploying}
            title={!isResumeReady ? 'Fill in your name, email, and at least one experience or education entry first' : undefined}
            className={cn(
              'h-8 text-xs px-2.5 transition-all',
              !isResumeReady
                ? 'opacity-40 cursor-not-allowed'
                : deployed
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : ''
            )}
          >
            {deploying
              ? <Loader2 className="h-3.5 w-3.5 sm:mr-1.5 animate-spin" />
              : <Rocket className="h-3.5 w-3.5 sm:mr-1.5" />}
            <span className="hidden sm:inline">{deploying ? 'Deploying…' : deployed ? 'Re-Deploy' : 'Use for Auto-Apply'}</span>
          </Button>
        </div>
      </div>

      {/* ── Mobile bottom tab bar ───────────────────── */}
      <div className="flex md:hidden border-b border-border bg-card shrink-0 overflow-x-auto">
        {([
          { id: 'form', label: 'Edit', icon: PenLine },
          { id: 'preview', label: 'Preview', icon: Eye },
          { id: 'templates', label: 'Templates', icon: LayoutTemplate },
          { id: 'tailor', label: 'AI Tailor', icon: Sparkles },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setMobilePanel(id as any)}
            className={cn(
              'flex-1 min-w-[72px] flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors whitespace-nowrap',
              (mobilePanel as string) === id ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Main Split (desktop) / Panel (mobile) ───── */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT — Form panel: always visible on desktop, conditionally on mobile */}
        <div className={cn(
          'flex flex-col border-r border-border bg-card overflow-hidden',
          'md:w-[400px] xl:w-[440px] md:shrink-0',
          // Mobile: show/hide based on mobilePanel
          mobilePanel === 'form' ? 'flex w-full' : 'hidden md:flex'
        )}>
          <div className="flex-1 overflow-hidden">
            <BuilderForm data={data} onChange={handleDataChange} />
          </div>
        </div>

        {/* RIGHT — Preview / Templates: visible on desktop or when mobile tab is active */}
        <div className={cn(
          'flex-1 flex flex-col overflow-hidden',
          mobilePanel === 'form' ? 'hidden md:flex' : 'flex'
        )}>

          {/* Right tab bar — desktop only */}
          <div className="hidden md:flex items-center border-b border-border bg-card shrink-0 px-2">
            <button
              onClick={() => setRightTab('preview')}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                rightTab === 'preview'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <Eye className="h-3.5 w-3.5" />
              Live Preview
            </button>
            <button
              onClick={() => setRightTab('templates')}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                rightTab === 'templates'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <LayoutTemplate className="h-3.5 w-3.5" />
              Templates
              {rightTab !== 'templates' && (
                <span className="ml-1 text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full font-medium">
                  {currentTemplate.name}
                </span>
              )}
            </button>
            <button
              onClick={() => setRightTab('tailor')}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                rightTab === 'tailor'
                  ? 'border-violet-500 text-violet-600 dark:text-violet-400'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <Sparkles className="h-3.5 w-3.5" />
              AI Tailor
            </button>
          </div>

          {/* Preview panel — auto-scales resume to fit available width */}
          {(rightTab === 'preview' || mobilePanel === 'preview') && (
            <ResumePreviewPanel data={data} templateId={templateId} />
          )}

          {/* Templates panel */}
          {(rightTab === 'templates' || mobilePanel === 'templates') && (
            <div className="flex-1 overflow-y-auto bg-muted/20">
              <div className="px-4 pt-5 pb-2">
                <h3 className="text-sm font-semibold">Choose a Template</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  15 ATS-friendly designs — hover to preview, click to apply.
                </p>
              </div>
              <TemplatePicker selectedId={templateId} onSelect={handleTemplateChange} />
            </div>
          )}

          {/* AI Tailor panel — desktop: rightTab === 'tailor', mobile: mobilePanel === 'tailor' */}
          {(rightTab === 'tailor' || mobilePanel === 'tailor') && (
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Header */}
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-xl bg-violet-100 dark:bg-violet-950 flex items-center justify-center shrink-0">
                  <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">AI Resume Tailor</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Paste a job description and AI will rewrite your summary and bullets to match the role's keywords for maximum ATS score.
                  </p>
                </div>
              </div>

              {/* Job description input */}
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Job Description
                </label>
                <textarea
                  value={jobDesc}
                  onChange={e => setJobDesc(e.target.value)}
                  rows={10}
                  placeholder="Paste the full job description here — including responsibilities, requirements, and nice-to-haves..."
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                />
              </div>

              <Button
                onClick={tailorToJob}
                disabled={tailoring || !jobDesc.trim()}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white"
              >
                {tailoring
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Tailoring resume…</>
                  : <><Sparkles className="h-4 w-4 mr-2" />Tailor to this Job</>}
              </Button>

              {/* Results */}
              {tailorResult && (
                <div className="space-y-4">
                  {tailorResult.matchBoost > 0 && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                      <span className="text-green-700 dark:text-green-400 text-sm font-semibold">
                        +{tailorResult.matchBoost}% estimated ATS boost
                      </span>
                    </div>
                  )}

                  {/* Tailored summary */}
                  {tailorResult.summary && (
                    <div className="border border-border rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/40 border-b border-border">
                        <span className="text-xs font-semibold">Tailored Summary</span>
                        <button onClick={applyTailoredSummary} className="text-[11px] font-semibold text-primary hover:underline">
                          Apply
                        </button>
                      </div>
                      <p className="p-4 text-xs text-foreground leading-relaxed">{tailorResult.summary}</p>
                    </div>
                  )}

                  {/* Tailored bullets */}
                  {tailorResult.tailoredBullets?.length > 0 && (
                    <div className="border border-border rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/40 border-b border-border">
                        <span className="text-xs font-semibold">Improved Bullets ({tailorResult.tailoredBullets.length})</span>
                        <button onClick={applyTailoredBullets} className="text-[11px] font-semibold text-primary hover:underline">
                          Apply All
                        </button>
                      </div>
                      <div className="divide-y divide-border">
                        {tailorResult.tailoredBullets.map((b: any, i: number) => (
                          <div key={i} className="p-4 space-y-2">
                            <p className="text-[11px] text-muted-foreground line-through leading-relaxed">{b.original}</p>
                            <p className="text-xs text-foreground font-medium leading-relaxed">{b.tailored}</p>
                            {b.reason && <p className="text-[10px] text-violet-600 dark:text-violet-400 italic">{b.reason}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Skills to add */}
                  {tailorResult.skillsToHighlight?.length > 0 && (
                    <div className="p-4 rounded-xl border border-border bg-muted/20">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Highlight These Skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {tailorResult.skillsToHighlight.map((s: string) => (
                          <span key={s} className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {tailorResult.coverLetterHint && (
                    <div className="flex gap-3 p-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950">
                      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                        <strong>Cover letter tip:</strong> {tailorResult.coverLetterHint}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
