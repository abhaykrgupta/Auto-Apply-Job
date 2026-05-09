export type LayoutType = 'single' | 'sidebar' | 'banner' | 'timeline' | 'two-col' | 'traditional';
export type SkillStyle = 'text' | 'pills' | 'dots';

export interface TemplateConfig {
  id: string;
  name: string;
  description: string;
  accentColor: string;
  sidebarBg?: string;
  sidebarText?: string;
  fontFamily: 'serif' | 'sans-serif';
  layout: LayoutType;
  headerAlign: 'left' | 'center';
  dividerStyle: 'line' | 'thick' | 'none' | 'dot' | 'border-left';
  spacing: 'tight' | 'normal' | 'relaxed';
  skillStyle: SkillStyle;
}

export const TEMPLATES: TemplateConfig[] = [
  // ── SINGLE COLUMN ──────────────────────────────────────────────
  {
    id: 'classic',
    name: 'Classic',
    description: 'Timeless serif, centered header',
    accentColor: '#1e3a5f',
    fontFamily: 'serif',
    layout: 'single',
    headerAlign: 'center',
    dividerStyle: 'line',
    spacing: 'normal',
    skillStyle: 'text',
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean sans-serif, indigo accents',
    accentColor: '#4f46e5',
    fontFamily: 'sans-serif',
    layout: 'single',
    headerAlign: 'left',
    dividerStyle: 'line',
    spacing: 'normal',
    skillStyle: 'pills',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Whitespace-forward, no dividers',
    accentColor: '#374151',
    fontFamily: 'sans-serif',
    layout: 'single',
    headerAlign: 'left',
    dividerStyle: 'none',
    spacing: 'relaxed',
    skillStyle: 'pills',
  },
  {
    id: 'executive',
    name: 'Executive',
    description: 'Bold serif, formal & elegant',
    accentColor: '#111827',
    fontFamily: 'serif',
    layout: 'single',
    headerAlign: 'left',
    dividerStyle: 'thick',
    spacing: 'relaxed',
    skillStyle: 'text',
  },
  {
    id: 'sharp',
    name: 'Sharp',
    description: 'Left border accent on sections',
    accentColor: '#0f172a',
    fontFamily: 'sans-serif',
    layout: 'single',
    headerAlign: 'left',
    dividerStyle: 'border-left',
    spacing: 'normal',
    skillStyle: 'pills',
  },
  {
    id: 'scholar',
    name: 'Scholar',
    description: 'Academic serif, centered formal',
    accentColor: '#4a1942',
    fontFamily: 'serif',
    layout: 'single',
    headerAlign: 'center',
    dividerStyle: 'dot',
    spacing: 'relaxed',
    skillStyle: 'text',
  },
  {
    id: 'compact',
    name: 'Compact',
    description: 'Dense layout, max content density',
    accentColor: '#1e40af',
    fontFamily: 'sans-serif',
    layout: 'single',
    headerAlign: 'left',
    dividerStyle: 'line',
    spacing: 'tight',
    skillStyle: 'pills',
  },

  // ── BANNER HEADER ───────────────────────────────────────────────
  {
    id: 'banner',
    name: 'Banner',
    description: 'Bold full-width colored header',
    accentColor: '#1d4ed8',
    fontFamily: 'sans-serif',
    layout: 'banner',
    headerAlign: 'left',
    dividerStyle: 'none',
    spacing: 'normal',
    skillStyle: 'pills',
  },
  {
    id: 'teal-banner',
    name: 'Teal Banner',
    description: 'Teal header band, clean body',
    accentColor: '#0f766e',
    fontFamily: 'sans-serif',
    layout: 'banner',
    headerAlign: 'center',
    dividerStyle: 'line',
    spacing: 'normal',
    skillStyle: 'pills',
  },

  // ── TIMELINE ───────────────────────────────────────────────────
  {
    id: 'timeline',
    name: 'Timeline',
    description: 'Vertical dot timeline on experience',
    accentColor: '#059669',
    fontFamily: 'sans-serif',
    layout: 'timeline',
    headerAlign: 'left',
    dividerStyle: 'line',
    spacing: 'normal',
    skillStyle: 'pills',
  },

  // ── SIDEBAR dark ───────────────────────────────────────────────
  {
    id: 'atlantic',
    name: 'Atlantic',
    description: 'Navy sidebar + white content area',
    accentColor: '#1e3a5f',
    sidebarBg: '#1e3a5f',
    sidebarText: '#ffffff',
    fontFamily: 'sans-serif',
    layout: 'sidebar',
    headerAlign: 'left',
    dividerStyle: 'line',
    spacing: 'normal',
    skillStyle: 'dots',
  },
  {
    id: 'slate-sidebar',
    name: 'Slate',
    description: 'Charcoal sidebar, modern profile',
    accentColor: '#4f46e5',
    sidebarBg: '#1e293b',
    sidebarText: '#f1f5f9',
    fontFamily: 'sans-serif',
    layout: 'sidebar',
    headerAlign: 'left',
    dividerStyle: 'none',
    spacing: 'normal',
    skillStyle: 'pills',
  },
  {
    id: 'sidebar-light',
    name: 'Sidebar Light',
    description: 'Light gray sidebar, elegant split',
    accentColor: '#4f46e5',
    sidebarBg: '#f1f5f9',
    sidebarText: '#1e293b',
    fontFamily: 'sans-serif',
    layout: 'sidebar',
    headerAlign: 'left',
    dividerStyle: 'line',
    spacing: 'normal',
    skillStyle: 'pills',
  },

  // ── TWO COLUMN ─────────────────────────────────────────────────
  {
    id: 'two-col',
    name: 'Two Column',
    description: 'Balanced two-column layout',
    accentColor: '#7c3aed',
    fontFamily: 'sans-serif',
    layout: 'two-col',
    headerAlign: 'left',
    dividerStyle: 'line',
    spacing: 'normal',
    skillStyle: 'pills',
  },
  {
    id: 'mercury',
    name: 'Mercury',
    description: 'Narrow left panel, wide experience',
    accentColor: '#0369a1',
    fontFamily: 'sans-serif',
    layout: 'two-col',
    headerAlign: 'left',
    dividerStyle: 'none',
    spacing: 'normal',
    skillStyle: 'dots',
  },

  // ── TRADITIONAL (All-caps name, skills-first, icons) ───────────────────
  {
    id: 'traditional',
    name: 'Traditional',
    description: 'ALL CAPS serif, skills-first, bold categories',
    accentColor: '#000000',
    fontFamily: 'serif',
    layout: 'traditional',
    headerAlign: 'center',
    dividerStyle: 'line',
    spacing: 'normal',
    skillStyle: 'text',
  },
];

export function getTemplate(id: string): TemplateConfig {
  return TEMPLATES.find(t => t.id === id) ?? TEMPLATES[0];
}
