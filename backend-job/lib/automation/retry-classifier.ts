/**
 * Retry Classifier & Policy Engine
 *
 * Classifies application and scraper failures into typed categories, then
 * applies per-category retry policies: max attempts, backoff, cooldown.
 *
 * Non-retryable failures are immediately marked as such, preventing wasted
 * Playwright/GPT execution on definitively failed attempts.
 */

// ── Failure taxonomy ──────────────────────────────────────────────────────────

export type FailureType =
  // Transient — safe to retry with backoff
  | 'network_timeout'
  | 'slow_page_load'
  | 'server_error_5xx'
  | 'openai_rate_limit'
  | 'openai_server_error'
  | 'navigation_failed'
  // Structural — retry but limited
  | 'form_not_found'
  | 'submit_failed'
  // Permanent — do NOT retry
  | 'captcha_detected'
  | 'session_banned'
  | 'invalid_url'
  | 'form_validation_error'
  | 'resume_missing'
  | 'job_expired'
  // Fallback
  | 'unknown';

export interface RetryPolicy {
  maxAttempts: number;
  backoffMs: number;           // base backoff (doubles per retry)
  cooldownMs: number;          // minimum time between retries
  isRetryable: boolean;
}

const POLICIES: Record<FailureType, RetryPolicy> = {
  network_timeout:      { maxAttempts: 4, backoffMs: 5_000,   cooldownMs: 60_000,    isRetryable: true  },
  slow_page_load:       { maxAttempts: 3, backoffMs: 10_000,  cooldownMs: 120_000,   isRetryable: true  },
  server_error_5xx:     { maxAttempts: 3, backoffMs: 15_000,  cooldownMs: 180_000,   isRetryable: true  },
  openai_rate_limit:    { maxAttempts: 5, backoffMs: 30_000,  cooldownMs: 60_000,    isRetryable: true  },
  openai_server_error:  { maxAttempts: 3, backoffMs: 20_000,  cooldownMs: 120_000,   isRetryable: true  },
  navigation_failed:    { maxAttempts: 3, backoffMs: 8_000,   cooldownMs: 90_000,    isRetryable: true  },
  form_not_found:       { maxAttempts: 2, backoffMs: 30_000,  cooldownMs: 3_600_000, isRetryable: true  }, // 1h cooldown
  submit_failed:        { maxAttempts: 2, backoffMs: 20_000,  cooldownMs: 3_600_000, isRetryable: true  },
  // Non-retryable
  captcha_detected:     { maxAttempts: 0, backoffMs: 0,       cooldownMs: 0,         isRetryable: false },
  session_banned:       { maxAttempts: 0, backoffMs: 0,       cooldownMs: 0,         isRetryable: false },
  invalid_url:          { maxAttempts: 0, backoffMs: 0,       cooldownMs: 0,         isRetryable: false },
  form_validation_error:{ maxAttempts: 0, backoffMs: 0,       cooldownMs: 0,         isRetryable: false },
  resume_missing:       { maxAttempts: 0, backoffMs: 0,       cooldownMs: 0,         isRetryable: false },
  job_expired:          { maxAttempts: 0, backoffMs: 0,       cooldownMs: 0,         isRetryable: false },
  unknown:              { maxAttempts: 2, backoffMs: 30_000,  cooldownMs: 1_800_000, isRetryable: true  },
};

// ── Classification patterns ───────────────────────────────────────────────────

interface Pattern {
  type: FailureType;
  matchers: Array<string | RegExp>;
}

const PATTERNS: Pattern[] = [
  // CAPTCHA — highest priority, always non-retryable
  {
    type: 'captcha_detected',
    matchers: ['captcha', 'cloudflare', 'datadome', 'arkose', 'hcaptcha', 'recaptcha',
               'just a moment', 'checking your browser', 'verify you are human'],
  },
  // Session banned
  {
    type: 'session_banned',
    matchers: ['403 forbidden', 'access denied', 'your ip', 'account suspended',
               'banned', 'blocked permanently', 'too many requests from this'],
  },
  // Invalid URL / job expired
  {
    type: 'invalid_url',
    matchers: ['invalid url', 'malformed url', 'unsupported protocol', 'blocked unsafe url protocol'],
  },
  {
    type: 'job_expired',
    matchers: ['this job is no longer', 'position has been filled', 'posting has expired',
               'this role is no longer available', '404', 'page not found'],
  },
  // OpenAI
  {
    type: 'openai_rate_limit',
    matchers: ['rate_limit_exceeded', '429', 'rate limit', 'too many requests'],
  },
  {
    type: 'openai_server_error',
    matchers: ['openai', '500', '503', 'service unavailable', 'internal server error'],
  },
  // Network
  {
    type: 'network_timeout',
    matchers: ['etimedout', 'econnreset', 'econnrefused', 'enotfound', 'timeout exceeded',
               'err_network', 'net::err_', /timeout/i, /timed out/i],
  },
  {
    type: 'slow_page_load',
    matchers: ['waiting for selector', 'page.waitfor', 'locator.waitfor', /wait.*exceeded/i],
  },
  {
    type: 'navigation_failed',
    matchers: ['navigation failed', 'goto', 'failed to navigate', 'err_connection'],
  },
  {
    type: 'server_error_5xx',
    matchers: [/5\d{2}/, 'internal server error', 'bad gateway', 'service unavailable'],
  },
  // Form
  {
    type: 'form_not_found',
    matchers: ['form not found', 'no form', 'complex form detected', 'unsupported form'],
  },
  {
    type: 'submit_failed',
    matchers: ['submit failed', 'failed to click submit', 'submission unclear'],
  },
  // Resume
  {
    type: 'resume_missing',
    matchers: ['no resume', 'resume not found', 'upload a resume'],
  },
  // Validation
  {
    type: 'form_validation_error',
    matchers: ['invalid credentials', 'email already registered', 'duplicate application',
               'already applied', 'application exists'],
  },
];

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Classifies an error message or Error object into a FailureType.
 * Uses pattern matching against a prioritized list of known error signatures.
 */
export function classifyFailure(error: Error | string): FailureType {
  const msg = (typeof error === 'string' ? error : error.message).toLowerCase();

  for (const pattern of PATTERNS) {
    for (const matcher of pattern.matchers) {
      if (typeof matcher === 'string') {
        if (msg.includes(matcher)) return pattern.type;
      } else {
        if (matcher.test(msg)) return pattern.type;
      }
    }
  }

  return 'unknown';
}

/** Returns the retry policy for a given failure type */
export function getRetryPolicy(failureType: FailureType): RetryPolicy {
  return POLICIES[failureType];
}

/** Returns true if the failure is safe to retry */
export function isRetryable(failureType: FailureType): boolean {
  return POLICIES[failureType].isRetryable;
}

/**
 * Computes the cooldown expiry timestamp for a given failure type and attempt count.
 * Uses exponential backoff: cooldown = max(cooldownMs, backoffMs * 2^attempt)
 */
export function computeCooldownUntil(failureType: FailureType, attemptCount: number): Date | null {
  const policy = POLICIES[failureType];
  if (!policy.isRetryable) return null; // non-retryable = no cooldown needed

  const exponentialMs = policy.backoffMs * Math.pow(2, Math.max(0, attemptCount - 1));
  const waitMs = Math.max(policy.cooldownMs, exponentialMs);
  return new Date(Date.now() + waitMs);
}
