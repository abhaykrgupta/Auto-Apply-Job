export interface DiscoveredCompany {
  name: string;
  website?: string;
  careerPage?: string;
  atsType?: string;
  atsUrl?: string;
  description?: string;
  industry?: string;
  employeeCount?: string;
  location?: string;
  fundingStage?: string;
  logoUrl?: string;
  tags?: string[];
  source: string;
  batch?: string; // YC batch
}

export interface ATSDetectionResult {
  type: 'greenhouse' | 'lever' | 'workday' | 'ashby' | 'bamboohr' | 'smartrecruiters' | 'custom' | 'none' | 'unknown';
  url: string | null;
}

export interface DiscoveryResult {
  total: number;
  newCompanies: number;
  sources: Record<string, number>;
}
