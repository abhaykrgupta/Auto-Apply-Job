/**
 * Typed task contracts shared between Next.js API routes (producers)
 * and worker processes (consumers).
 *
 * Rules:
 *  - All payloads must be JSON-serializable.
 *  - Task types must be string literals (used as DB column values).
 *  - Results must be typed and match what workers actually return.
 */

// ── Task type registry ────────────────────────────────────────────────────────

export type WorkerTaskType =
  | 'apply_job'
  | 'scrape_jobs'
  | 'scrape_company'
  | 'match_jobs'
  | 'tailor_resume'
  | 'generate_cover_letter'
  | 'parse_resume';

// ── Task payloads ─────────────────────────────────────────────────────────────

export interface ApplyJobPayload {
  applicationId: string;
  job: {
    id: string;
    title: string;
    company: string;
    description: string;
    applyUrl: string;
    requirements: string | null;
  };
  resume: {
    id: string;
    filePath: string;
    parsedData: Record<string, unknown> | null;
  };
  options?: {
    requireConfirmation?: boolean;
    warmSession?: boolean;
  };
}

export interface ScrapeJobsPayload {
  sources: string[];
  role?: string;
  location?: string;
  remote?: string;
  datePosted?: string;
  limit?: number;
  boardUrls?: string[];
}

export interface ScrapeCompanyPayload {
  companyId: string;
  companyName: string;
  websiteUrl: string;
  careerPage?: string;
}

export interface MatchJobsPayload {
  resumeId: string;
  jobIds?: string[];   // if empty, match all unmatched jobs
  threshold?: number;
}

export interface TailorResumePayload {
  resumeId: string;
  jobId: string;
}

export interface GenerateCoverLetterPayload {
  resumeId: string;
  jobId: string;
}

export interface ParseResumePayload {
  resumeId: string;
  filePath: string;
}

// ── Task payload map ──────────────────────────────────────────────────────────

export interface TaskPayloadMap {
  apply_job: ApplyJobPayload;
  scrape_jobs: ScrapeJobsPayload;
  scrape_company: ScrapeCompanyPayload;
  match_jobs: MatchJobsPayload;
  tailor_resume: TailorResumePayload;
  generate_cover_letter: GenerateCoverLetterPayload;
  parse_resume: ParseResumePayload;
}

// ── Task results ──────────────────────────────────────────────────────────────

export interface ApplyJobResult {
  status: 'applied' | 'failed' | 'manual_review' | 'pending_confirmation';
  method: string;
  screenshotPath?: string;
  error?: string;
  logs: string[];
}

export interface ScrapeJobsResult {
  found: number;
  saved: number;
  bySource: Record<string, number>;
}

export interface ScrapeCompanyResult {
  companyId: string;
  jobsFound: number;
  jobsSaved: number;
}

export interface MatchJobsResult {
  matched: number;
  highMatches: number;
}

export interface TailorResumeResult {
  tailored: boolean;
  matchBoost: number;
}

// ── Typed task record ─────────────────────────────────────────────────────────

export interface WorkerTask<T extends WorkerTaskType = WorkerTaskType> {
  id: string;
  taskType: T;
  payload: TaskPayloadMap[T];
  status: 'pending' | 'running' | 'completed' | 'failed';
  workerId: string | null;
  priority: number;
  retryCount: number;
  maxRetries: number;
  result: unknown;
  error: string | null;
  createdAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
}

/** Which worker process handles which task types */
export const TASK_WORKER_MAP: Record<WorkerTaskType, 'automation' | 'scraper' | 'ai'> = {
  apply_job: 'automation',
  scrape_jobs: 'scraper',
  scrape_company: 'scraper',
  match_jobs: 'ai',
  tailor_resume: 'ai',
  generate_cover_letter: 'ai',
  parse_resume: 'ai',
};
