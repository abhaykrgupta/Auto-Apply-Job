/**
 * Direct Apply API
 *
 * Submits job applications via ATS public APIs — NO browser, NO CAPTCHA.
 * Called by apply-engine.ts before falling back to Playwright.
 *
 * Supported:
 *   - Lever      → POST https://api.lever.co/v0/postings/{company}/{id}/apply
 *   - Ashby      → POST https://api.ashbyhq.com/posting-api/job-board/{company}/application
 *
 * Not supported via API (require browser):
 *   - Greenhouse  (hosted form has CSRF token + reCAPTCHA)
 *   - Workday     (fully JS-rendered, no public apply API)
 *   - SmartRecruiters (API requires company auth)
 */

import { readFile } from 'fs/promises';
import { basename } from 'path';
import { logger } from '@/lib/utils/logger';

export interface DirectApplyPayload {
  firstName: string;
  lastName:  string;
  email:     string;
  phone:     string;
  resumeFilePath: string;
  coverLetter?:   string;
  linkedinUrl?:   string;
  githubUrl?:     string;
  currentCompany?: string;
}

export interface DirectApplyResult {
  success:    boolean;
  method:     'lever_api' | 'ashby_api' | 'unsupported';
  applicationId?: string;
  error?:     string;
}

// ── URL detection ─────────────────────────────────────────────────────────────

function detectAts(applyUrl: string): { ats: 'lever' | 'ashby' | null; company: string; jobId: string } {
  try {
    const u = new URL(applyUrl);

    // Lever: jobs.lever.co/{company}/{uuid}
    const leverMatch = u.hostname === 'jobs.lever.co' && u.pathname.match(/^\/([^/]+)\/([a-f0-9-]{36})/);
    if (leverMatch) return { ats: 'lever', company: leverMatch[1], jobId: leverMatch[2] };

    // Ashby: jobs.ashbyhq.com/{company}/{uuid}
    const ashbyMatch = u.hostname === 'jobs.ashbyhq.com' && u.pathname.match(/^\/([^/]+)\/([a-f0-9-]{36})/);
    if (ashbyMatch) return { ats: 'ashby', company: ashbyMatch[1], jobId: ashbyMatch[2] };

  } catch {
    // invalid URL — handled by apply-engine before reaching here
  }
  return { ats: null, company: '', jobId: '' };
}

// ── Lever ─────────────────────────────────────────────────────────────────────

async function applyViaLever(
  company: string,
  jobId: string,
  payload: DirectApplyPayload,
): Promise<DirectApplyResult> {
  const url = `https://api.lever.co/v0/postings/${company}/${jobId}/apply`;

  let resumeBytes: Buffer;
  try {
    resumeBytes = await readFile(payload.resumeFilePath);
  } catch (err) {
    return { success: false, method: 'lever_api', error: `Could not read resume file: ${err}` };
  }

  const form = new FormData();
  form.append('name',  `${payload.firstName} ${payload.lastName}`.trim());
  form.append('email', payload.email);
  form.append('phone', payload.phone || '');
  if (payload.currentCompany) form.append('org', payload.currentCompany);
  if (payload.coverLetter)    form.append('comments', payload.coverLetter);

  // URLs object (Lever expects urls[LinkedIn] etc.)
  if (payload.linkedinUrl) form.append('urls[LinkedIn]', payload.linkedinUrl);
  if (payload.githubUrl)   form.append('urls[GitHub]',   payload.githubUrl);

  // Resume file
  const resumeBlob = new Blob([resumeBytes], { type: 'application/pdf' });
  form.append('resume', resumeBlob, basename(payload.resumeFilePath));

  try {
    const res = await fetch(url, {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(20000),
    });

    const text = await res.text();
    let json: Record<string, unknown> = {};
    try { json = JSON.parse(text); } catch { /* non-JSON response */ }

    if (res.ok) {
      logger.info({ company, jobId, applicationId: json.applicationId }, '[DirectApply] Lever: success');
      return {
        success: true,
        method: 'lever_api',
        applicationId: String(json.applicationId ?? ''),
      };
    }

    const error = String(json.error ?? json.message ?? text).slice(0, 200);
    logger.warn({ company, jobId, status: res.status, error }, '[DirectApply] Lever: rejected');
    return { success: false, method: 'lever_api', error: `Lever API ${res.status}: ${error}` };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    logger.warn({ company, jobId, error }, '[DirectApply] Lever: network error');
    return { success: false, method: 'lever_api', error };
  }
}

// ── Ashby ─────────────────────────────────────────────────────────────────────

async function applyViaAshby(
  company: string,
  jobId: string,
  payload: DirectApplyPayload,
): Promise<DirectApplyResult> {
  // Step 1: upload resume to get a file handle
  let resumeBytes: Buffer;
  try {
    resumeBytes = await readFile(payload.resumeFilePath);
  } catch (err) {
    return { success: false, method: 'ashby_api', error: `Could not read resume file: ${err}` };
  }

  let resumeHandle: string | undefined;
  try {
    const uploadForm = new FormData();
    const resumeBlob = new Blob([resumeBytes], { type: 'application/pdf' });
    uploadForm.append('file', resumeBlob, basename(payload.resumeFilePath));

    const uploadRes = await fetch(
      `https://api.ashbyhq.com/posting-api/job-board/${company}/file-upload`,
      { method: 'POST', body: uploadForm, signal: AbortSignal.timeout(20000) },
    );

    if (uploadRes.ok) {
      const uploadJson = await uploadRes.json() as { fileHandle?: string };
      resumeHandle = uploadJson.fileHandle;
    } else {
      logger.warn({ status: uploadRes.status }, '[DirectApply] Ashby: resume upload failed — proceeding without');
    }
  } catch (err) {
    logger.warn({ err }, '[DirectApply] Ashby: resume upload error — proceeding without');
  }

  // Step 2: submit application
  const body: Record<string, unknown> = {
    jobPostingId: jobId,
    email:        payload.email,
    firstName:    payload.firstName,
    lastName:     payload.lastName,
    phone:        payload.phone || undefined,
  };
  if (resumeHandle)       body.resumeFileHandle = resumeHandle;
  if (payload.coverLetter) body.coverLetter      = payload.coverLetter;
  if (payload.linkedinUrl) body.linkedinUrl      = payload.linkedinUrl;
  if (payload.githubUrl)   body.githubUrl        = payload.githubUrl;

  try {
    const res = await fetch(
      `https://api.ashbyhq.com/posting-api/job-board/${company}/application`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
        signal:  AbortSignal.timeout(20000),
      },
    );

    const json = await res.json() as Record<string, unknown>;

    if (res.ok) {
      logger.info({ company, jobId }, '[DirectApply] Ashby: success');
      return { success: true, method: 'ashby_api', applicationId: String(json.id ?? '') };
    }

    const error = String(json.error ?? json.message ?? '').slice(0, 200);
    logger.warn({ company, jobId, status: res.status, error }, '[DirectApply] Ashby: rejected');
    return { success: false, method: 'ashby_api', error: `Ashby API ${res.status}: ${error}` };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    logger.warn({ company, jobId, error }, '[DirectApply] Ashby: network error');
    return { success: false, method: 'ashby_api', error };
  }
}

// ── Public entry point ────────────────────────────────────────────────────────

/**
 * Attempts to submit an application via the ATS's public API.
 * Returns { method: 'unsupported' } if the URL is not a supported ATS.
 * Returns { success: false } if the API call failed — caller should fall back to Playwright.
 */
export async function tryDirectApply(
  applyUrl: string,
  payload: DirectApplyPayload,
): Promise<DirectApplyResult> {
  const { ats, company, jobId } = detectAts(applyUrl);

  if (!ats) return { success: false, method: 'unsupported' };

  logger.info({ ats, company, jobId }, '[DirectApply] Attempting direct API apply');

  if (ats === 'lever') return applyViaLever(company, jobId, payload);
  if (ats === 'ashby') return applyViaAshby(company, jobId, payload);

  return { success: false, method: 'unsupported' };
}
