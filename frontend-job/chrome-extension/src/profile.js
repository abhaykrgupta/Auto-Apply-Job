/**
 * profile.js — Profile schema & chrome.storage.local helpers
 * Can be imported as a module or loaded as a plain script (uses globalThis).
 *
 * Schema (all fields optional except email):
 * {
 *   personal: {
 *     firstName, lastName, email, phone,
 *     city, state, country,
 *     linkedIn, github, portfolio
 *   },
 *   work: {
 *     title,            // current/desired job title
 *     yearsExp,         // number
 *     currentCompany,
 *     summary,          // 150-word professional summary
 *     openToRelocate,   // boolean
 *     remoteOnly,       // boolean
 *     availableDate,    // ISO date string
 *   },
 *   compensation: {
 *     desiredSalary,    // number (annual, USD or currency)
 *     currency,         // 'USD' | 'GBP' | 'EUR' | ...
 *     salaryFlexible,   // boolean
 *   },
 *   workAuth: {
 *     status,           // 'citizen' | 'gc' | 'h1b' | 'opt' | 'ead' | 'other'
 *     requireSponsorship, // boolean
 *   },
 *   education: [
 *     { degree, field, school, graduationYear }
 *   ],
 *   eeoc: {
 *     gender,    // 'male' | 'female' | 'nonbinary' | 'decline'
 *     veteran,   // 'yes' | 'no' | 'decline'
 *     disability,// 'yes' | 'no' | 'decline'
 *     race,      // string or 'decline'
 *   },
 *   resumeUrl,          // URL to base PDF (S3 / Supabase Storage)
 *   resumeVersion,      // string e.g. "2025-05"
 *   coverLetterTemplate,// string with {{COMPANY}} {{ROLE}} placeholders
 *   _syncedAt,          // ISO timestamp of last dashboard sync
 * }
 */

'use strict';

const PROFILE_KEY = 'jobagent_profile';
const RESUME_VERSION_KEY = 'jobagent_resume_version';

/** Returns the stored profile, or null if not set. */
async function getProfile() {
  return new Promise((resolve) => {
    chrome.storage.local.get(PROFILE_KEY, (result) => {
      resolve(result[PROFILE_KEY] ?? null);
    });
  });
}

/** Saves (merges) profile data. Pass a partial object to update only specific fields. */
async function saveProfile(partial) {
  const existing = (await getProfile()) ?? {};
  const merged = deepMerge(existing, partial);
  merged._syncedAt = new Date().toISOString();
  return new Promise((resolve) => {
    chrome.storage.local.set({ [PROFILE_KEY]: merged }, resolve);
  });
}

/** Clears the stored profile. */
async function clearProfile() {
  return new Promise((resolve) => {
    chrome.storage.local.remove(PROFILE_KEY, resolve);
  });
}

/**
 * Returns a flat lookup map for the field classifier.
 * e.g. { email: 'abhay@example.com', firstName: 'Abhay', ... }
 */
async function getProfileFlat() {
  const profile = await getProfile();
  if (!profile) return {};

  const p = profile.personal ?? {};
  const w = profile.work ?? {};
  const c = profile.compensation ?? {};
  const a = profile.workAuth ?? {};
  const edu = (profile.education ?? [])[0] ?? {};

  return {
    // Personal
    firstName:       p.firstName ?? '',
    lastName:        p.lastName ?? '',
    email:           p.email ?? '',
    phone:           p.phone ?? '',
    city:            p.city ?? '',
    state:           p.state ?? '',
    country:         p.country ?? '',
    linkedIn:        p.linkedIn ?? '',
    github:          p.github ?? '',
    portfolio:       p.portfolio ?? '',
    fullName:        [p.firstName, p.lastName].filter(Boolean).join(' '),

    // Work
    jobTitle:        w.title ?? '',
    yearsExp:        String(w.yearsExp ?? ''),
    currentCompany:  w.currentCompany ?? '',
    summary:         w.summary ?? '',
    openToRelocate:  w.openToRelocate ? 'yes' : 'no',
    remoteOnly:      w.remoteOnly ? 'yes' : 'no',
    availableDate:   w.availableDate ?? '',

    // Compensation
    desiredSalary:   String(c.desiredSalary ?? ''),
    currency:        c.currency ?? 'USD',
    salaryFlexible:  c.salaryFlexible ? 'yes' : 'no',

    // Work auth
    workAuthStatus:      a.status ?? '',
    requireSponsorship:  a.requireSponsorship ? 'yes' : 'no',

    // Education (first / highest degree)
    degree:          edu.degree ?? '',
    educationField:  edu.field ?? '',
    school:          edu.school ?? '',
    graduationYear:  String(edu.graduationYear ?? ''),

    // EEOC
    eeocGender:      profile.eeoc?.gender ?? 'decline',
    eeocVeteran:     profile.eeoc?.veteran ?? 'decline',
    eeocDisability:  profile.eeoc?.disability ?? 'decline',
    eeocRace:        profile.eeoc?.race ?? 'decline',

    // Resume
    resumeUrl:       profile.resumeUrl ?? '',
    resumeVersion:   profile.resumeVersion ?? '',
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Deep merge two plain objects (non-destructive to base). */
function deepMerge(base, override) {
  const result = Object.assign({}, base);
  for (const [key, val] of Object.entries(override)) {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      result[key] = deepMerge(result[key] ?? {}, val);
    } else {
      result[key] = val;
    }
  }
  return result;
}

// Export for background.js (MV3 service worker) via globalThis
// and also make available to content scripts that load this file directly.
if (typeof globalThis !== 'undefined') {
  globalThis.JobAgentProfile = { getProfile, saveProfile, clearProfile, getProfileFlat };
}
