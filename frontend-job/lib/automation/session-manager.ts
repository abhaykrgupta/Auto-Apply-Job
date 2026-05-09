import { type BrowserContext } from 'playwright';
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import path from 'node:path';
import { logger } from '@/lib/utils/logger';

/**
 * Browser Session Manager
 *
 * Persists Playwright browser sessions (cookies, localStorage, sessionStorage)
 * to disk so that repeated visits to the same site reuse authenticated state
 * and established browser fingerprints — significantly reducing bot detection risk.
 *
 * Profile directory:
 *  - Development: <cwd>/profiles/<domain>/
 *  - Production:  PROFILE_DIR env var (e.g. mounted persistent volume) or /tmp/job-agent-profiles/
 *
 * Note: On Vercel serverless /tmp is ephemeral and limited. For true persistence
 * in production, set PROFILE_DIR to an external volume mount.
 */

const PROFILES_BASE = process.env.PROFILE_DIR
  ?? (process.env.NODE_ENV === 'production'
    ? '/tmp/job-agent-profiles'
    : path.join(process.cwd(), 'profiles'));

interface PersistedFingerprint {
  userAgent: string;
  viewport: { width: number; height: number };
  locale: string;
  timezoneId: string;
  colorScheme: 'dark' | 'light';
  createdAt: string;
}

const STATIC_FINGERPRINTS: Record<string, PersistedFingerprint> = {
  default: {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1440, height: 900 },
    locale: 'en-US',
    timezoneId: 'America/New_York',
    colorScheme: 'light',
    createdAt: new Date().toISOString(),
  },
};

export class SessionManager {
  private static getProfileDir(domain: string): string {
    // Sanitize domain so it's a valid directory name
    const safe = domain.replace(/[^a-zA-Z0-9.-]/g, '_');
    return path.join(PROFILES_BASE, safe);
  }

  private static sessionPath(domain: string): string {
    return path.join(this.getProfileDir(domain), 'session.json');
  }

  private static fingerprintPath(domain: string): string {
    return path.join(this.getProfileDir(domain), 'fingerprint.json');
  }

  /** Returns stored Playwright storageState path if it exists, undefined otherwise */
  static async getStorageStatePath(domain: string): Promise<string | undefined> {
    const p = this.sessionPath(domain);
    try {
      await access(p, fsConstants.R_OK);
      return p;
    } catch {
      return undefined;
    }
  }

  /** Saves browser context state to disk (cookies + localStorage) */
  static async saveSession(context: BrowserContext, domain: string): Promise<void> {
    try {
      const dir = this.getProfileDir(domain);
      await mkdir(dir, { recursive: true });
      await context.storageState({ path: this.sessionPath(domain) });
      logger.debug({ domain }, 'Browser session saved');
    } catch (err) {
      logger.debug({ err, domain }, 'Failed to save browser session — non-critical');
    }
  }

  /**
   * Returns a stable fingerprint for this domain.
   * If a persisted fingerprint exists it is reused; otherwise a stable one is
   * generated and saved so the profile is consistent across runs.
   */
  static async getFingerprint(domain: string): Promise<PersistedFingerprint> {
    const fpPath = this.fingerprintPath(domain);
    try {
      await access(fpPath, fsConstants.R_OK);
      const raw = await readFile(fpPath, 'utf-8');
      return JSON.parse(raw) as PersistedFingerprint;
    } catch {
      // Generate a stable fingerprint for this domain (deterministic seeding)
      const fingerprint: PersistedFingerprint = { ...STATIC_FINGERPRINTS.default };
      try {
        const dir = this.getProfileDir(domain);
        await mkdir(dir, { recursive: true });
        await writeFile(fpPath, JSON.stringify(fingerprint, null, 2));
      } catch {
        // Non-critical
      }
      return fingerprint;
    }
  }

  /** Clears the stored session for a domain (call after auth failure) */
  static async clearSession(domain: string): Promise<void> {
    try {
      const { unlink } = await import('node:fs/promises');
      await unlink(this.sessionPath(domain)).catch(() => {});
      logger.info({ domain }, 'Browser session cleared');
    } catch {
      // Non-critical
    }
  }
}
