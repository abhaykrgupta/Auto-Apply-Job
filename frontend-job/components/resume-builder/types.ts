export interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  website: string;
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

export interface ResumeData {
  personal: PersonalInfo;
  summary: Summary;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: Skills;
  projects: ProjectEntry[];
}

export const defaultResumeData: ResumeData = {
  personal: { name: '', email: '', phone: '', location: '', linkedin: '', github: '', website: '' },
  summary: { text: '' },
  experience: [],
  education: [],
  skills: { technical: [], soft: [], languages: [], certifications: [] },
  projects: [],
};
