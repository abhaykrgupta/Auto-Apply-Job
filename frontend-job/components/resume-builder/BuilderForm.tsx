'use client';

import { useState, useRef } from 'react';
import { ResumeData, ExperienceEntry, EducationEntry, ProjectEntry } from './types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Plus, Trash2, ChevronDown, ChevronUp, GripVertical, Sparkles, Loader2, CheckCircle2, AlertTriangle, ShieldCheck, PenLine } from 'lucide-react';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';

// ─────────────────────────────────────────────────────────────────────────────
// CRITICAL: Field and Textarea MUST be defined OUTSIDE the BuilderForm component.
// Defining them inside causes React to treat them as new component types on every
// render → unmount/remount → input loses focus after each keystroke.
// ─────────────────────────────────────────────────────────────────────────────

function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
        'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1',
        'focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none',
        className
      )}
      {...props}
    />
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-1.5 mb-4', className)}>
      <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</Label>
      {children}
    </div>
  );
}

// Tag chip input — press Enter or comma to add, click × to remove
function TagInput({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function add(raw: string) {
    const tags = raw.split(',').map(s => s.trim()).filter(Boolean);
    const next = [...value, ...tags.filter(t => !value.includes(t))];
    onChange(next);
    setInput('');
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (input.trim()) add(input);
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  function remove(tag: string) {
    onChange(value.filter(t => t !== tag));
  }

  return (
    <div
      className={cn(
        'flex flex-wrap gap-1.5 min-h-[40px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm cursor-text',
        'focus-within:ring-1 focus-within:ring-ring'
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {value.map(tag => (
        <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-medium">
          {tag}
          <button
            type="button"
            onClick={e => { e.stopPropagation(); remove(tag); }}
            className="hover:text-destructive transition-colors leading-none"
            aria-label={`Remove ${tag}`}
          >
            ×
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKey}
        onBlur={() => { if (input.trim()) add(input); }}
        placeholder={value.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[120px] bg-transparent outline-none text-sm placeholder:text-muted-foreground"
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const TABS = ['Personal', 'Summary', 'Experience', 'Education', 'Skills', 'Projects'] as const;
type Tab = typeof TABS[number];

interface Props { 
  data: ResumeData; 
  onChange: (data: ResumeData) => void; 
  projectName: string;
  onProjectNameChange: (name: string) => void;
}

function AtsHealthScore({ data }: { data: ResumeData }) {
  let score = 0;
  const tips: { msg: string, type: 'error' | 'warn' | 'good' }[] = [];

  // Contact
  if (data.personal.name && data.personal.email && data.personal.phone) {
    score += 15;
  } else {
    tips.push({ msg: 'Missing essential contact info (Name, Email, Phone).', type: 'error' });
  }

  if (data.personal.linkedin) {
    score += 5;
  } else {
    tips.push({ msg: 'Add LinkedIn URL to increase trust.', type: 'warn' });
  }

  // Summary
  if (data.summary.text.length > 50) {
    score += 15;
    if (/\d+/.test(data.summary.text)) {
      score += 5;
    } else {
      tips.push({ msg: 'Add metrics (numbers) to your summary to show impact.', type: 'warn' });
    }
  } else {
    tips.push({ msg: 'Professional summary is too short or missing.', type: 'error' });
  }

  // Experience
  if (data.experience.length > 0) {
    score += 20;
    let hasMetrics = false;
    let bulletsTooShort = false;

    data.experience.forEach(exp => {
      exp.bullets.forEach(b => {
        if (/\d+/.test(b) || /%/.test(b) || /\$/.test(b)) hasMetrics = true;
        if (b.length > 0 && b.length < 30) bulletsTooShort = true;
      });
      if (exp.metrics && exp.metrics.length > 0 && exp.metrics.some(Boolean)) {
        hasMetrics = true; // explicitly separating metrics proves quantifiable data
      }
    });

    if (hasMetrics) {
      score += 15;
    } else {
      tips.push({ msg: 'Experience bullets lack quantifiable metrics (%, $, numbers).', type: 'error' });
    }

    if (bulletsTooShort) {
      tips.push({ msg: 'Some experience bullets are too short to be impactful.', type: 'warn' });
    } else {
      score += 5;
    }
  } else {
    tips.push({ msg: 'Add at least one work experience entry.', type: 'error' });
  }

  // Education
  if (data.education.length > 0) {
    score += 10;
  } else {
    tips.push({ msg: 'Add education history.', type: 'warn' });
  }

  // Skills
  const totalSkills = data.skills.technical.length + data.skills.soft.length + data.skills.languages.length;
  if (totalSkills > 5) {
    score += 10;
  } else {
    tips.push({ msg: 'Add more skills to match ATS keywords.', type: 'warn' });
  }

  const getScoreColor = () => {
    if (score >= 80) return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900';
    if (score >= 60) return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900';
    return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900';
  };

  return (
    <div className="mb-8 rounded-xl border border-border overflow-hidden bg-card shadow-sm">
      <div className={cn("px-4 py-3 border-b flex items-center justify-between", getScoreColor())}>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          <h3 className="font-semibold text-sm">ATS Health Score</h3>
        </div>
        <div className="text-xl font-bold">{score}<span className="text-sm font-medium opacity-70">/100</span></div>
      </div>
      {tips.length > 0 && (
        <div className="p-4 bg-background">
          <ul className="space-y-2.5">
            {tips.map((t, i) => (
              <li key={i} className="flex items-start gap-2 text-xs">
                {t.type === 'error' ? (
                  <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                ) : t.type === 'warn' ? (
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                )}
                <span className="text-muted-foreground leading-tight pt-0.5">{t.msg}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function BuilderForm({ data, onChange, projectName, onProjectNameChange }: Props) {
  const [openEntries, setOpenEntries] = useState<Record<string, boolean>>({});
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const dragSrc = useRef<{ section: 'experience' | 'education' | 'projects'; idx: number } | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [improvingBullets, setImprovingBullets] = useState<string | null>(null); // entry id being improved

  const aiCall = async (action: string, payload: object) => {
    const res = await fetch('/api/resume-builder/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, data: payload }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'AI request failed');
    return json.result;
  };

  const update = (partial: Partial<ResumeData>) => onChange({ ...data, ...partial });
  const toggleEntry = (id: string) => setOpenEntries(p => ({ ...p, [id]: !p[id] }));

  function reorder<T>(arr: T[], from: number, to: number): T[] {
    const next = [...arr];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
  }

  const handleDrop = (section: 'experience' | 'education' | 'projects', toIdx: number) => {
    if (!dragSrc.current || dragSrc.current.section !== section || dragSrc.current.idx === toIdx) {
      dragSrc.current = null;
      setDragOverIdx(null);
      return;
    }
    const from = dragSrc.current.idx;
    if (section === 'experience') update({ experience: reorder(data.experience, from, toIdx) });
    else if (section === 'education') update({ education: reorder(data.education, from, toIdx) });
    else update({ projects: reorder(data.projects, from, toIdx) });
    dragSrc.current = null;
    setDragOverIdx(null);
  };

  // ── Personal ──────────────────────────────────────────────────────────────
  const renderPersonal = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3">
      {/* Resume Project Name — added for user accessibility */}
      <Field label="Resume Name (Internal)" className="sm:col-span-2">
        <div className="relative group/prj">
          <Input
            value={projectName}
            onChange={e => onProjectNameChange(e.target.value)}
            className="border-primary/20 bg-primary/5 focus:bg-background transition-all"
            placeholder="e.g. Senior Software Engineer - Google"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
             <PenLine className="h-3.5 w-3.5 text-primary opacity-40" />
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">This is the name shown on your dashboard and used for the filename.</p>
      </Field>

      <div className="sm:col-span-2 h-px bg-border my-2" />

      <Field label="Full Name" className="sm:col-span-2">
        <Input
          value={data.personal.name}
          onChange={e => update({ personal: { ...data.personal, name: e.target.value } })}
          placeholder="Jane Smith"
        />
      </Field>
      <Field label="Email">
        <Input
          value={data.personal.email}
          onChange={e => update({ personal: { ...data.personal, email: e.target.value } })}
          placeholder="jane@example.com"
          type="email"
        />
      </Field>
      <Field label="Phone">
        <Input
          value={data.personal.phone}
          onChange={e => update({ personal: { ...data.personal, phone: e.target.value } })}
          placeholder="+1 (555) 000-0000"
        />
      </Field>
      <Field label="Location">
        <Input
          value={data.personal.location}
          onChange={e => update({ personal: { ...data.personal, location: e.target.value } })}
          placeholder="San Francisco, CA"
        />
      </Field>
      <Field label="Website">
        <Input
          value={data.personal.website}
          onChange={e => update({ personal: { ...data.personal, website: e.target.value } })}
          placeholder="jane.dev"
        />
      </Field>
      <Field label="LinkedIn">
        <Input
          value={data.personal.linkedin}
          onChange={e => update({ personal: { ...data.personal, linkedin: e.target.value } })}
          placeholder="linkedin.com/in/jane"
        />
      </Field>
      <Field label="GitHub">
        <Input
          value={data.personal.github}
          onChange={e => update({ personal: { ...data.personal, github: e.target.value } })}
          placeholder="github.com/jane"
        />
      </Field>
    </div>
  );

  // ── Summary ───────────────────────────────────────────────────────────────
  const generateSummary = async () => {
    if (data.experience.length === 0) { toast.error('Add at least one experience entry first'); return; }
    setSummaryLoading(true);
    try {
      const result = await aiCall('generate-summary', { experience: data.experience, education: data.education, skills: data.skills });
      update({ summary: { text: result } });
      toast.success('Summary generated!');
    } catch (e: any) { toast.error(e.message); }
    finally { setSummaryLoading(false); }
  };

  const renderSummary = () => (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Write 2–3 sentences highlighting your expertise, key achievements, and career goals.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={generateSummary}
          disabled={summaryLoading}
          className="shrink-0 ml-3 h-7 text-xs gap-1.5 border-violet-200 text-violet-700 hover:bg-violet-50 dark:border-violet-800 dark:text-violet-400 dark:hover:bg-violet-950"
        >
          {summaryLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          {summaryLoading ? 'Writing…' : 'Write with AI'}
        </Button>
      </div>
      <Textarea
        rows={7}
        value={data.summary.text}
        onChange={e => update({ summary: { text: e.target.value } })}
        placeholder="Results-driven software engineer with 5+ years building scalable web applications. Passionate about clean architecture and developer experience. Looking for senior roles in fast-paced product teams."
      />
      <p className="text-[11px] text-muted-foreground mt-2">{data.summary.text.length} characters</p>
    </div>
  );

  // ── Experience ────────────────────────────────────────────────────────────
  const addExperience = () => {
    const id = nanoid();
    const entry: ExperienceEntry = { id, company: '', title: '', location: '', startDate: '', endDate: '', current: false, bullets: [''], metrics: [] };
    update({ experience: [...data.experience, entry] });
    setOpenEntries(p => ({ ...p, [id]: true }));
  };

  const updateExp = (id: string, partial: Partial<ExperienceEntry>) =>
    update({ experience: data.experience.map(e => e.id === id ? { ...e, ...partial } : e) });

  const renderExperience = () => (
    <div>
      {data.experience.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-border rounded-xl mb-4 bg-muted/20">
          <p className="text-sm text-muted-foreground font-medium">No experience added yet</p>
          <p className="text-xs text-muted-foreground mt-1">Add your work history below</p>
        </div>
      )}
      {data.experience.map((exp, i) => (
        <div
          key={exp.id}
          draggable
          onDragStart={() => { dragSrc.current = { section: 'experience', idx: i }; }}
          onDragOver={e => { e.preventDefault(); setDragOverIdx(i); }}
          onDragLeave={() => setDragOverIdx(null)}
          onDrop={() => handleDrop('experience', i)}
          onDragEnd={() => { dragSrc.current = null; setDragOverIdx(null); }}
          className={cn(
            'border border-border rounded-xl mb-3 overflow-hidden bg-card shadow-sm transition-all',
            dragOverIdx === i && dragSrc.current?.section === 'experience' && dragSrc.current.idx !== i
              ? 'ring-2 ring-primary border-primary scale-[1.01]'
              : ''
          )}
        >
          <div
            className="flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors select-none"
            onClick={() => toggleEntry(exp.id)}
          >
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0 cursor-grab active:cursor-grabbing" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{exp.title || 'New Position'}</div>
              <div className="text-xs text-muted-foreground truncate">
                {exp.company || 'Company'}{(exp.current || exp.endDate) ? ` · ${exp.current ? 'Present' : exp.endDate}` : ''}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={e => { e.stopPropagation(); update({ experience: data.experience.filter(e => e.id !== exp.id) }); }}
                className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              {openEntries[exp.id]
                ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </div>
          </div>
          {openEntries[exp.id] && (
            <div className="border-t border-border p-4 bg-background space-y-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3">
                <Field label="Job Title">
                  <Input value={exp.title} onChange={e => updateExp(exp.id, { title: e.target.value })} placeholder="Software Engineer" />
                </Field>
                <Field label="Company">
                  <Input value={exp.company} onChange={e => updateExp(exp.id, { company: e.target.value })} placeholder="Acme Corp" />
                </Field>
                <Field label="Location">
                  <Input value={exp.location} onChange={e => updateExp(exp.id, { location: e.target.value })} placeholder="San Francisco, CA" />
                </Field>
                <Field label="Start Date">
                  <Input value={exp.startDate} onChange={e => updateExp(exp.id, { startDate: e.target.value })} placeholder="Jan 2022" />
                </Field>
                <Field label="End Date">
                  <Input value={exp.endDate} onChange={e => updateExp(exp.id, { endDate: e.target.value })} placeholder="Dec 2024" disabled={exp.current} />
                </Field>
                <Field label=" " className="flex justify-start items-end">
                  <label className="flex items-center gap-2 cursor-pointer h-9 pb-0.5">
                    <input
                      type="checkbox"
                      checked={exp.current}
                      onChange={e => updateExp(exp.id, { current: e.target.checked, endDate: e.target.checked ? '' : exp.endDate })}
                      className="rounded border-input h-4 w-4 accent-primary"
                    />
                    <span className="text-sm">Currently here</span>
                  </label>
                </Field>
              </div>
              <div className="flex flex-col gap-1.5 mb-4">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Bullet Points — one per line</Label>
                  <button
                    type="button"
                    onClick={async () => {
                      const bullets = exp.bullets.filter(Boolean);
                      if (!bullets.length) { toast.error('Add at least one bullet first'); return; }
                      setImprovingBullets(exp.id);
                      try {
                        const improved = await aiCall('improve-bullets', { title: exp.title, company: exp.company, bullets });
                        updateExp(exp.id, { bullets: improved });
                        toast.success('Bullets improved!');
                      } catch (e: any) { toast.error(e.message); }
                      finally { setImprovingBullets(null); }
                    }}
                    disabled={improvingBullets === exp.id}
                    className="flex items-center gap-1 text-[11px] font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400 disabled:opacity-50 transition-colors"
                  >
                    {improvingBullets === exp.id
                      ? <Loader2 className="h-3 w-3 animate-spin" />
                      : <Sparkles className="h-3 w-3" />}
                    {improvingBullets === exp.id ? 'Improving…' : '✨ Improve with AI'}
                  </button>
                </div>
                <Textarea
                  rows={4}
                  value={exp.bullets.join('\n')}
                  onChange={e => updateExp(exp.id, { bullets: e.target.value.split('\n') })}
                  placeholder={"Led a cross-functional team of 5 engineers\nShipped 3 major product features"}
                />
              </div>

              <div className="flex flex-col gap-1.5 mb-2">
                <Label className="text-[11px] font-semibold text-amber-600 dark:text-amber-500 uppercase tracking-wider">Key Achievements & Metrics</Label>
                <Textarea
                  rows={2}
                  value={(exp.metrics || []).join('\n')}
                  onChange={e => updateExp(exp.id, { metrics: e.target.value.split('\n') })}
                  placeholder={"Increased system performance by 40%\nGrew revenue from $1M to $3M"}
                  className="bg-amber-50/30 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-900/50"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Separate your best quantified metrics here to boost your ATS semantic matching.
                </p>
              </div>
            </div>
          )}
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addExperience} className="w-full border-dashed h-9">
        <Plus className="h-4 w-4 mr-2" />Add Experience
      </Button>
    </div>
  );

  // ── Education ─────────────────────────────────────────────────────────────
  const addEducation = () => {
    const id = nanoid();
    const entry: EducationEntry = { id, school: '', degree: '', field: '', startDate: '', endDate: '', gpa: '' };
    update({ education: [...data.education, entry] });
    setOpenEntries(p => ({ ...p, [id]: true }));
  };

  const updateEdu = (id: string, partial: Partial<EducationEntry>) =>
    update({ education: data.education.map(e => e.id === id ? { ...e, ...partial } : e) });

  const renderEducation = () => (
    <div>
      {data.education.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-border rounded-xl mb-4 bg-muted/20">
          <p className="text-sm text-muted-foreground font-medium">No education added yet</p>
        </div>
      )}
      {data.education.map((edu, i) => (
        <div
          key={edu.id}
          draggable
          onDragStart={() => { dragSrc.current = { section: 'education', idx: i }; }}
          onDragOver={e => { e.preventDefault(); setDragOverIdx(i + 1000); }}
          onDragLeave={() => setDragOverIdx(null)}
          onDrop={() => handleDrop('education', i)}
          onDragEnd={() => { dragSrc.current = null; setDragOverIdx(null); }}
          className={cn(
            'border border-border rounded-xl mb-3 overflow-hidden bg-card shadow-sm transition-all',
            dragOverIdx === i + 1000 && dragSrc.current?.section === 'education' && dragSrc.current.idx !== i
              ? 'ring-2 ring-primary border-primary scale-[1.01]'
              : ''
          )}
        >
          <div
            className="flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors select-none"
            onClick={() => toggleEntry(edu.id)}
          >
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0 cursor-grab active:cursor-grabbing" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{edu.school || 'School Name'}</div>
              <div className="text-xs text-muted-foreground">{edu.degree}{edu.field ? ` in ${edu.field}` : ''}</div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={e => { e.stopPropagation(); update({ education: data.education.filter(e => e.id !== edu.id) }); }}
                className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              {openEntries[edu.id] ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </div>
          </div>
          {openEntries[edu.id] && (
            <div className="border-t border-border p-4 bg-background">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3">
                <Field label="School" className="sm:col-span-2">
                  <Input value={edu.school} onChange={e => updateEdu(edu.id, { school: e.target.value })} placeholder="MIT" />
                </Field>
                <Field label="Degree">
                  <Input value={edu.degree} onChange={e => updateEdu(edu.id, { degree: e.target.value })} placeholder="B.S." />
                </Field>
                <Field label="Field of Study">
                  <Input value={edu.field} onChange={e => updateEdu(edu.id, { field: e.target.value })} placeholder="Computer Science" />
                </Field>
                <Field label="Start Date">
                  <Input value={edu.startDate} onChange={e => updateEdu(edu.id, { startDate: e.target.value })} placeholder="Sep 2018" />
                </Field>
                <Field label="End Date">
                  <Input value={edu.endDate} onChange={e => updateEdu(edu.id, { endDate: e.target.value })} placeholder="Jun 2022" />
                </Field>
                <Field label="GPA (optional)">
                  <Input value={edu.gpa} onChange={e => updateEdu(edu.id, { gpa: e.target.value })} placeholder="3.9" />
                </Field>
              </div>
            </div>
          )}
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addEducation} className="w-full border-dashed h-9">
        <Plus className="h-4 w-4 mr-2" />Add Education
      </Button>
    </div>
  );

  // ── Skills ────────────────────────────────────────────────────────────────
  const setSkills = (cat: keyof typeof data.skills, val: string[]) =>
    update({ skills: { ...data.skills, [cat]: val } });

  const renderSkills = () => (
    <div>
      <p className="text-xs text-muted-foreground mb-4 leading-relaxed">Type a skill and press <kbd className="bg-muted px-1 rounded text-[10px]">Enter</kbd> or <kbd className="bg-muted px-1 rounded text-[10px]">,</kbd> to add it. Click the × on any tag to remove it.</p>
      <Field label="Technical Skills">
        <TagInput
          value={data.skills.technical}
          onChange={v => setSkills('technical', v)}
          placeholder="React, TypeScript, Node.js… (press Enter to add)"
        />
      </Field>
      <Field label="Soft Skills">
        <TagInput
          value={data.skills.soft}
          onChange={v => setSkills('soft', v)}
          placeholder="Leadership, Communication… (press Enter to add)"
        />
      </Field>
      <Field label="Languages">
        <TagInput
          value={data.skills.languages}
          onChange={v => setSkills('languages', v)}
          placeholder="English (Native), Spanish (B2)…"
        />
      </Field>
      <Field label="Certifications">
        <TagInput
          value={data.skills.certifications}
          onChange={v => setSkills('certifications', v)}
          placeholder="AWS Solutions Architect…"
        />
      </Field>
    </div>
  );

  // ── Projects ──────────────────────────────────────────────────────────────
  const addProject = () => {
    const id = nanoid();
    const entry: ProjectEntry = { id, name: '', description: '', url: '', technologies: [], bullets: [] };
    update({ projects: [...data.projects, entry] });
    setOpenEntries(p => ({ ...p, [id]: true }));
  };

  const updateProj = (id: string, partial: Partial<ProjectEntry>) =>
    update({ projects: data.projects.map(p => p.id === id ? { ...p, ...partial } : p) });

  const renderProjects = () => (
    <div>
      {data.projects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-border rounded-xl mb-4 bg-muted/20">
          <p className="text-sm text-muted-foreground font-medium">No projects added yet</p>
        </div>
      )}
      {data.projects.map((proj, i) => (
        <div
          key={proj.id}
          draggable
          onDragStart={() => { dragSrc.current = { section: 'projects', idx: i }; }}
          onDragOver={e => { e.preventDefault(); setDragOverIdx(i + 2000); }}
          onDragLeave={() => setDragOverIdx(null)}
          onDrop={() => handleDrop('projects', i)}
          onDragEnd={() => { dragSrc.current = null; setDragOverIdx(null); }}
          className={cn(
            'border border-border rounded-xl mb-3 overflow-hidden bg-card shadow-sm transition-all',
            dragOverIdx === i + 2000 && dragSrc.current?.section === 'projects' && dragSrc.current.idx !== i
              ? 'ring-2 ring-primary border-primary scale-[1.01]'
              : ''
          )}
        >
          <div
            className="flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors select-none"
            onClick={() => toggleEntry(proj.id)}
          >
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0 cursor-grab active:cursor-grabbing" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{proj.name || 'New Project'}</div>
              {proj.technologies.length > 0 && <div className="text-xs text-muted-foreground truncate">{proj.technologies.join(', ')}</div>}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={e => { e.stopPropagation(); update({ projects: data.projects.filter(p => p.id !== proj.id) }); }}
                className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              {openEntries[proj.id] ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </div>
          </div>
          {openEntries[proj.id] && (
            <div className="border-t border-border p-4 bg-background">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3">
                <Field label="Project Name">
                  <Input value={proj.name} onChange={e => updateProj(proj.id, { name: e.target.value })} placeholder="OpenMetrics" />
                </Field>
                <Field label="URL (optional)">
                  <Input value={proj.url} onChange={e => updateProj(proj.id, { url: e.target.value })} placeholder="github.com/jane/project" />
                </Field>
              </div>
              <Field label="Technologies (comma-separated)">
                <Input
                  value={proj.technologies.join(', ')}
                  onChange={e => updateProj(proj.id, { technologies: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  placeholder="React, TypeScript, Tailwind"
                />
              </Field>
              <Field label="Description">
                <Input value={proj.description} onChange={e => updateProj(proj.id, { description: e.target.value })} placeholder="Brief one-line description" />
              </Field>
              <Field label="Bullets (optional, one per line)">
                <Textarea
                  rows={3}
                  value={proj.bullets.join('\n')}
                  onChange={e => updateProj(proj.id, { bullets: e.target.value.split('\n') })}
                  placeholder="Built responsive UI with 99% Lighthouse score"
                />
              </Field>
            </div>
          )}
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addProject} className="w-full border-dashed h-9">
        <Plus className="h-4 w-4 mr-2" />Add Project
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-y-auto p-5 space-y-8 pb-20">
      <AtsHealthScore data={data} />
      
      <section>
        <h2 className="text-lg font-semibold mb-4 text-foreground">Personal Information</h2>
        {renderPersonal()}
      </section>
      <hr className="border-border" />
      <section>
        <h2 className="text-lg font-semibold mb-4 text-foreground">Professional Summary</h2>
        {renderSummary()}
      </section>
      <hr className="border-border" />
      <section>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold text-foreground">Work Experience</h2>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
            {data.experience.length}
          </span>
        </div>
        {renderExperience()}
      </section>
      <hr className="border-border" />
      <section>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold text-foreground">Education</h2>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
            {data.education.length}
          </span>
        </div>
        {renderEducation()}
      </section>
      <hr className="border-border" />
      <section>
        <h2 className="text-lg font-semibold mb-4 text-foreground">Skills</h2>
        {renderSkills()}
      </section>
      <hr className="border-border" />
      <section>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold text-foreground">Projects</h2>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
            {data.projects.length}
          </span>
        </div>
        {renderProjects()}
      </section>
    </div>
  );
}
