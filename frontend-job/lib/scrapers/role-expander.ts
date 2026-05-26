/**
 * Role Expander
 *
 * Maps a broad job category to related titles that companies use interchangeably.
 * Used so that searching "Software Engineer" also catches "Full Stack Developer",
 * "Backend Developer", "Mobile Engineer", etc.
 *
 * Strategy: return 3–5 aliases max (more = slower scrapes, diminishing returns).
 */

const ROLE_MAP: Record<string, string[]> = {
  // ── Software / Engineering ─────────────────────────────────────────────
  'software engineer': [
    'Software Engineer',
    'Software Developer',
    'Full Stack Developer',
    'Backend Developer',
    'Application Developer',
  ],
  'software developer': [
    'Software Developer',
    'Software Engineer',
    'Full Stack Developer',
    'Backend Developer',
    'Application Developer',
  ],
  'full stack': [
    'Full Stack Developer',
    'Full Stack Engineer',
    'Software Engineer',
    'Web Developer',
  ],
  'frontend': [
    'Frontend Developer',
    'Frontend Engineer',
    'React Developer',
    'UI Engineer',
    'Web Developer',
  ],
  'front end': [
    'Frontend Developer',
    'Frontend Engineer',
    'React Developer',
    'UI Engineer',
    'Web Developer',
  ],
  'backend': [
    'Backend Developer',
    'Backend Engineer',
    'Software Engineer',
    'API Developer',
    'Server-Side Developer',
  ],
  'back end': [
    'Backend Developer',
    'Backend Engineer',
    'Software Engineer',
    'API Developer',
  ],
  'mobile': [
    'Mobile Engineer',
    'Mobile Developer',
    'iOS Developer',
    'Android Developer',
    'React Native Developer',
  ],
  'ios': [
    'iOS Developer',
    'iOS Engineer',
    'Swift Developer',
    'Mobile Engineer',
  ],
  'android': [
    'Android Developer',
    'Android Engineer',
    'Kotlin Developer',
    'Mobile Engineer',
  ],
  // ── Data / ML / AI ─────────────────────────────────────────────────────
  'data scientist': [
    'Data Scientist',
    'Machine Learning Engineer',
    'ML Engineer',
    'AI Engineer',
    'Research Scientist',
  ],
  'machine learning': [
    'Machine Learning Engineer',
    'ML Engineer',
    'AI Engineer',
    'Data Scientist',
    'Research Engineer',
  ],
  'data engineer': [
    'Data Engineer',
    'Analytics Engineer',
    'Big Data Engineer',
    'Platform Engineer',
  ],
  'data analyst': [
    'Data Analyst',
    'Business Analyst',
    'Analytics Engineer',
    'BI Developer',
  ],
  // ── DevOps / Platform / SRE ────────────────────────────────────────────
  'devops': [
    'DevOps Engineer',
    'Platform Engineer',
    'Site Reliability Engineer',
    'SRE',
    'Infrastructure Engineer',
  ],
  'sre': [
    'Site Reliability Engineer',
    'SRE',
    'DevOps Engineer',
    'Platform Engineer',
  ],
  'cloud': [
    'Cloud Engineer',
    'Cloud Architect',
    'DevOps Engineer',
    'Infrastructure Engineer',
    'Platform Engineer',
  ],
  // ── Design / Product ────────────────────────────────────────────────────
  'product manager': [
    'Product Manager',
    'Product Owner',
    'Senior PM',
    'Technical Product Manager',
  ],
  'ux designer': [
    'UX Designer',
    'UI/UX Designer',
    'Product Designer',
    'Interaction Designer',
  ],
  'ui designer': [
    'UI Designer',
    'UI/UX Designer',
    'Product Designer',
    'Visual Designer',
  ],
  // ── QA / Security ───────────────────────────────────────────────────────
  'qa': [
    'QA Engineer',
    'Test Engineer',
    'SDET',
    'Quality Engineer',
    'Automation Engineer',
  ],
  'security': [
    'Security Engineer',
    'Application Security Engineer',
    'Cybersecurity Engineer',
    'InfoSec Engineer',
    'Penetration Tester',
  ],
};

/**
 * Given a user's role input, returns an array of related job titles to search for.
 * Falls back to `[role]` if no mapping found (so scrapers always get something).
 */
export function expandRole(role: string): string[] {
  if (!role?.trim()) return [];

  const normalized = role.trim().toLowerCase();

  // Exact key match
  if (ROLE_MAP[normalized]) return ROLE_MAP[normalized];

  // Partial key match (e.g. "senior software engineer" → matches "software engineer")
  for (const [key, aliases] of Object.entries(ROLE_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      // Keep the user's original term first, then append aliases (skip duplicates)
      const original = role.trim();
      return [original, ...aliases.filter(a => a.toLowerCase() !== normalized)].slice(0, 5);
    }
  }

  // No match — return as-is
  return [role.trim()];
}
