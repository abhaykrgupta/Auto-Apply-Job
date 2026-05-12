export interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  website: string;
  headline: string; // editable job title / tagline below name
}

export interface Summary {
  text: string;
}

export interface ExperienceEntry {
  id: string;
  company: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
  metrics?: string[];
}

export interface EducationEntry {
  id: string;
  school: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa: string;
}

export interface Skills {
  technical: string[];
  soft: string[];
  languages: string[];
  certifications: string[];
}

export interface ProjectEntry {
  id: string;
  name: string;
  description: string;
  url: string;
  technologies: string[];
  bullets: string[];
}

export interface AwardEntry {
  id: string;
  title: string;
  issuer: string;
  date: string;
  description: string;
}

export interface VolunteerEntry {
  id: string;
  role: string;
  organization: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export type SectionKey = 'summary' | 'experience' | 'education' | 'skills' | 'projects' | 'awards' | 'volunteer';

export interface ResumeData {
  personal: PersonalInfo;
  summary: Summary;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: Skills;
  projects: ProjectEntry[];
  awards: AwardEntry[];
  volunteer: VolunteerEntry[];
  // UI metadata — not rendered in resume output
  sectionOrder: SectionKey[];
  sectionVisibility: Record<SectionKey, boolean>;
  customAccentColor?: string; // overrides template accent when set
}

export const DEFAULT_SECTION_ORDER: SectionKey[] = [
  'summary', 'experience', 'education', 'skills', 'projects', 'awards', 'volunteer',
];

export const defaultResumeData: ResumeData = {
  personal: { name: '', email: '', phone: '', location: '', linkedin: '', github: '', website: '', headline: '' },
  summary: { text: '' },
  experience: [],
  education: [],
  skills: { technical: [], soft: [], languages: [], certifications: [] },
  projects: [],
  awards: [],
  volunteer: [],
  sectionOrder: [...DEFAULT_SECTION_ORDER],
  sectionVisibility: {
    summary: true,
    experience: true,
    education: true,
    skills: true,
    projects: true,
    awards: true,
    volunteer: true,
  },
};

