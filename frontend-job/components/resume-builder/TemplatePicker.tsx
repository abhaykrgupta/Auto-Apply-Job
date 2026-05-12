'use client';

import { useState } from 'react';
import { TEMPLATES } from './templates/templateList';
import { HtmlPreview } from './HtmlPreview';
import { type ResumeData } from './types';
import { cn } from '@/lib/utils';
import { Check, X, Maximize2, ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';

// ─── Rich sample data — ALWAYS used in thumbnails so they look full ───────────
const SAMPLE: ResumeData = {
  personal: {
    name: 'Alex Johnson',
    email: 'alex@company.com',
    phone: '+1 (555) 234-5678',
    location: 'San Francisco, CA',
    linkedin: 'linkedin.com/in/alexj',
    github: 'github.com/alexj',
    website: 'alexj.dev',
    headline: 'Senior Software Engineer · Full-Stack · Open to Remote',
  },
  summary: {
    text: 'Senior software engineer with 6+ years building scalable systems. Passionate about clean code and shipping products that users love. Led teams of 5+ engineers at high-growth startups.',
  },
  experience: [
    {
      id: '1',
      company: 'Stripe',
      title: 'Senior Software Engineer',
      location: 'San Francisco, CA',
      startDate: 'Jan 2022',
      endDate: '',
      current: true,
      bullets: [
        'Led migration of payment infrastructure serving 10M+ daily transactions',
        'Reduced API latency by 40% via caching and query optimization',
        'Mentored 4 junior engineers, conducted 50+ code reviews per quarter',
      ],
    },
    {
      id: '2',
      company: 'Airbnb',
      title: 'Software Engineer',
      location: 'Remote',
      startDate: 'Mar 2019',
      endDate: 'Dec 2021',
      current: false,
      bullets: [
        'Built real-time booking system handling 500K concurrent users',
        'Improved search ranking algorithm, boosting conversion by 18%',
      ],
    },
    {
      id: '3',
      company: 'Google',
      title: 'Software Engineer Intern',
      location: 'Mountain View, CA',
      startDate: 'Jun 2018',
      endDate: 'Aug 2018',
      current: false,
      bullets: ['Contributed to Google Maps performance pipeline'],
    },
  ],
  education: [
    {
      id: '1',
      school: 'UC Berkeley',
      degree: 'B.S.',
      field: 'Computer Science',
      startDate: '2015',
      endDate: '2019',
      gpa: '3.9',
    },
  ],
  skills: {
    technical: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'AWS', 'Docker', 'GraphQL'],
    soft: ['Leadership', 'Communication', 'Problem Solving'],
    languages: ['English (Native)', 'Spanish (B2)'],
    certifications: ['AWS Solutions Architect', 'Google Cloud Pro'],
  },
  projects: [
    {
      id: '1',
      name: 'OpenMetrics',
      description: 'Open-source observability platform with 2K+ GitHub stars',
      url: 'github.com/alexj/openmetrics',
      technologies: ['Go', 'React', 'Prometheus'],
      bullets: ['Designed plugin architecture supporting 30+ data sources'],
    },
  ],
  awards: [],
  volunteer: [],
  sectionOrder: ['summary', 'experience', 'education', 'skills', 'projects', 'awards', 'volunteer'],
  sectionVisibility: { summary: true, experience: true, education: true, skills: true, projects: true, awards: true, volunteer: true },
};

// A4: 794 × 1123px. Thumbnail rendered at full width, scaled down with CSS.
const THUMB_W = 174;
const THUMB_H = 246;
const FULL_W  = 794;
const SCALE   = THUMB_W / FULL_W; // ≈ 0.219

interface Props {
  selectedId: string;
  onSelect: (id: string) => void;
}

export function TemplatePicker({ selectedId, onSelect }: Props) {
  const [previewId, setPreviewId] = useState<string | null>(null);

  return (
    <>
      {/* Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 px-4 pb-6">
        {TEMPLATES.map(t => {
          const isSelected = selectedId === t.id;
          return (
            <div
              key={t.id}
              className={cn(
                'group relative flex flex-col rounded-xl border-2 overflow-hidden cursor-pointer',
                'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl',
                isSelected
                  ? 'border-primary shadow-lg shadow-primary/20 ring-2 ring-primary/10'
                  : 'border-border hover:border-primary/50 shadow-sm'
              )}
              onClick={() => onSelect(t.id)}
            >
              {/* ── Thumbnail area ── */}
              <div
                className="relative bg-white shrink-0 overflow-hidden"
                style={{ height: THUMB_H }}
              >
                {/* Resume rendered at full A4 width, then CSS-scaled down */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: FULL_W,
                    transformOrigin: 'top left',
                    transform: `scale(${SCALE})`,
                    pointerEvents: 'none',
                    userSelect: 'none',
                  }}
                >
                  <HtmlPreview data={SAMPLE} templateId={t.id} />
                </div>

                {/* Hover overlay — "Preview" button */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <button
                    onClick={e => { e.stopPropagation(); setPreviewId(t.id); }}
                    className="flex items-center gap-1.5 bg-white text-gray-900 text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg hover:bg-gray-50 transition-colors"
                  >
                    <Maximize2 className="h-3 w-3" />
                    Preview
                  </button>
                </div>

                {/* Selected checkmark */}
                {isSelected && (
                  <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-primary flex items-center justify-center shadow-md">
                    <Check className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
              </div>

              {/* ── Label strip ── */}
              <div className={cn(
                'flex flex-col px-3 py-2.5 border-t transition-colors',
                isSelected ? 'bg-primary/5 border-primary/20' : 'bg-card border-border'
              )}>
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div
                    className="h-3 w-3 rounded-full shrink-0 ring-1 ring-black/10"
                    style={{ backgroundColor: t.accentColor }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold truncate leading-tight">{t.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate capitalize">{t.layout} layout</div>
                  </div>
                  {isSelected && (
                    <span className="text-[10px] font-bold text-primary shrink-0 bg-primary/10 px-1.5 py-0.5 rounded-full">Active</span>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  {t.atsRiskLevel === 'safe' && <><ShieldCheck className="h-3 w-3 text-green-500" /><span className="text-[9px] text-green-600 dark:text-green-400 font-medium tracking-wide uppercase">ATS Safe</span></>}
                  {t.atsRiskLevel === 'medium' && <><ShieldAlert className="h-3 w-3 text-amber-500" /><span className="text-[9px] text-amber-600 dark:text-amber-400 font-medium tracking-wide uppercase">Medium ATS Risk</span></>}
                  {t.atsRiskLevel === 'high' && <><ShieldX className="h-3 w-3 text-red-500" /><span className="text-[9px] text-red-600 dark:text-red-400 font-medium tracking-wide uppercase">Creative / ATS Risky</span></>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Full-size preview modal ── */}
      {previewId && (
        <div
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewId(null)}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            style={{ width: '90vw', maxWidth: 860, maxHeight: '92vh' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b bg-gray-50 shrink-0">
              <div>
                <div className="text-sm font-bold flex items-center gap-2 mb-0.5 text-gray-900">
                  {TEMPLATES.find(t => t.id === previewId)?.name} Template
                  {TEMPLATES.find(t => t.id === previewId)?.atsRiskLevel === 'safe' && <span className="text-[10px] font-medium bg-green-100 text-green-700 px-1.5 py-0.5 rounded flex items-center gap-1"><ShieldCheck className="h-3 w-3"/> ATS Safe</span>}
                  {TEMPLATES.find(t => t.id === previewId)?.atsRiskLevel === 'medium' && <span className="text-[10px] font-medium bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded flex items-center gap-1"><ShieldAlert className="h-3 w-3"/> Medium Risk</span>}
                  {TEMPLATES.find(t => t.id === previewId)?.atsRiskLevel === 'high' && <span className="text-[10px] font-medium bg-red-100 text-red-700 px-1.5 py-0.5 rounded flex items-center gap-1"><ShieldX className="h-3 w-3"/> ATS Risky</span>}
                </div>
                <div className="text-xs text-muted-foreground capitalize">{TEMPLATES.find(t => t.id === previewId)?.description}</div>
                <div className="text-[10px] text-muted-foreground mt-1 italic">{TEMPLATES.find(t => t.id === previewId)?.atsNotes}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { onSelect(previewId!); setPreviewId(null); }}
                  className="text-xs font-semibold bg-primary text-primary-foreground px-3.5 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
                >
                  Use this template
                </button>
                <button
                  onClick={() => setPreviewId(null)}
                  className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Scrollable preview */}
            <div className="flex-1 overflow-y-auto bg-gray-100 p-6">
              <div className="mx-auto shadow-2xl" style={{ width: 794, backgroundColor: '#fff' }}>
                <HtmlPreview data={SAMPLE} templateId={previewId} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
