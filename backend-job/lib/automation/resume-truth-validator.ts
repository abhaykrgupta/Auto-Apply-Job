import { logger } from '@/lib/utils/logger';

/**
 * Resume Truth Validator
 *
 * Enforces an immutable truth layer on top of GPT-generated resume tailoring.
 *
 * The canonical resume data (company names, dates, degrees, certifications) is
 * treated as ground truth. Any tailored bullet that introduces content not
 * traceable to the original is flagged and reverted.
 *
 * GPT is allowed to:
 *  ✅  Rewrite phrasing / improve wording
 *  ✅  Reorder bullet points
 *  ✅  Emphasize keywords from the job description
 *  ✅  Improve ATS terminology
 *
 * GPT is NEVER allowed to:
 *  ❌  Fabricate companies or employers
 *  ❌  Invent dates or tenure (X years of experience)
 *  ❌  Hallucinate certifications or degrees
 *  ❌  Introduce quantitative metrics not present in the original
 *  ❌  Add skills not found in the original resume
 */

interface Experience {
  company?: string;
  title?: string;
  description?: string;
  bullets?: string[];
  years?: string | number;
  startDate?: string;
  endDate?: string;
}

interface CanonicalResume {
  name?: string;
  email?: string;
  skills?: string[];
  experience?: Experience[];
  education?: Array<{ institution?: string; degree?: string; field?: string; year?: string | number }>;
  certifications?: Array<{ name?: string; issuer?: string }>;
  projects?: Array<{ name?: string; description?: string }>;
}

interface TailoredBullet {
  original: string;
  tailored: string;
  reason: string;
}

export interface ValidationResult {
  passed: boolean;
  violations: string[];
  sanitizedBullets: TailoredBullet[];
  sanitizedSkills: string[];
}

/**
 * Validates tailored resume output against the canonical resume data.
 * Returns a sanitized version that strips or reverts any hallucinated content.
 */
export function validateTailoredResume(
  canonical: CanonicalResume,
  tailored: {
    tailoredBullets: TailoredBullet[];
    skillsToHighlight: string[];
    skillsToAdd: string[];
  }
): ValidationResult {
  const violations: string[] = [];

  // ── Build canonical fact sets ─────────────────────────────────────────────
  const canonicalCompanies = extractCompanies(canonical);
  const canonicalSkills = normalizeSkills(canonical.skills ?? []);
  const canonicalYears = extractYearMentions(canonical);
  const canonicalCerts = extractCertifications(canonical);
  const canonicalDegrees = extractDegrees(canonical);
  const canonicalMetrics = extractMetrics(canonical);

  // ── Validate tailored bullets ─────────────────────────────────────────────
  const sanitizedBullets: TailoredBullet[] = tailored.tailoredBullets.map((bullet) => {
    const bulletViolations: string[] = [];
    const tailoredLower = bullet.tailored.toLowerCase();

    // 1. Check for fabricated companies
    const tailoredCompanies = extractCompaniesFromText(bullet.tailored);
    for (const company of tailoredCompanies) {
      if (!isInCanonical(company, canonicalCompanies)) {
        bulletViolations.push(`Fabricated company in bullet: "${company}"`);
      }
    }

    // 2. Check for fabricated year claims ("X years of experience")
    const yearClaims = extractYearClaimsFromText(bullet.tailored);
    for (const claim of yearClaims) {
      if (!canonicalYears.has(claim) && !isReasonableYearDerivation(claim, canonicalYears)) {
        bulletViolations.push(`Unverified year claim: "${claim}"`);
      }
    }

    // 3. Check for hallucinated certifications
    const certMentions = extractCertMentionsFromText(bullet.tailored);
    for (const cert of certMentions) {
      if (!isInCanonical(cert, canonicalCerts)) {
        bulletViolations.push(`Unverified certification: "${cert}"`);
      }
    }

    // 4. Check for hallucinated degree claims
    const degreeMentions = extractDegreeMentionsFromText(bullet.tailored);
    for (const deg of degreeMentions) {
      if (!isInCanonical(deg, canonicalDegrees)) {
        bulletViolations.push(`Unverified degree: "${deg}"`);
      }
    }

    // 5. Check for fabricated quantitative metrics not in original
    if (bullet.original) {
      const tailoredMetrics = extractQuantitativeMetrics(bullet.tailored);
      const originalMetrics = extractQuantitativeMetrics(bullet.original);
      const newMetrics = tailoredMetrics.filter((m) => !originalMetrics.includes(m) && !canonicalMetrics.has(m));
      if (newMetrics.length > 0) {
        bulletViolations.push(`Potential fabricated metrics not in original: ${newMetrics.join(', ')}`);
      }
    }

    if (bulletViolations.length > 0) {
      violations.push(...bulletViolations);
      logger.warn({ bulletViolations, original: bullet.original }, 'Truth violation — reverting to original bullet');
      // Revert: keep the original bullet, but still pass the reason
      return { original: bullet.original, tailored: bullet.original, reason: `[REVERTED — truth violation] ${bullet.reason}` };
    }

    return bullet;
  });

  // ── Validate skillsToHighlight ────────────────────────────────────────────
  // Only allow highlighting skills actually present in canonical resume
  const sanitizedSkills = tailored.skillsToHighlight.filter((skill) => {
    const normalized = skill.toLowerCase().trim();
    const inCanonical = canonicalSkills.some(
      (cs) => cs.includes(normalized) || normalized.includes(cs)
    );
    if (!inCanonical) {
      violations.push(`Skill to highlight not in resume: "${skill}"`);
    }
    return inCanonical;
  });

  return {
    passed: violations.length === 0,
    violations,
    sanitizedBullets,
    sanitizedSkills,
  };
}

// ── Extraction utilities ──────────────────────────────────────────────────────

function extractCompanies(resume: CanonicalResume): Set<string> {
  const companies = new Set<string>();
  for (const exp of resume.experience ?? []) {
    if (exp.company) companies.add(exp.company.toLowerCase().trim());
  }
  for (const edu of resume.education ?? []) {
    if (edu.institution) companies.add(edu.institution.toLowerCase().trim());
  }
  return companies;
}

function normalizeSkills(skills: string[]): string[] {
  return skills.map((s) => s.toLowerCase().trim());
}

function extractYearMentions(resume: CanonicalResume): Set<string> {
  const years = new Set<string>();
  const text = JSON.stringify(resume);
  const matches = text.match(/\b(\d{4})\b/g) ?? [];
  matches.forEach((y) => years.add(y));
  // Also extract duration hints like "3 years", "5+ years"
  const durationMatches = text.match(/\b(\d+)\+?\s*years?\b/gi) ?? [];
  durationMatches.forEach((d) => years.add(d.toLowerCase().trim()));
  return years;
}

function extractCertifications(resume: CanonicalResume): Set<string> {
  const certs = new Set<string>();
  for (const cert of resume.certifications ?? []) {
    if (cert.name) certs.add(cert.name.toLowerCase().trim());
    if (cert.issuer) certs.add(cert.issuer.toLowerCase().trim());
  }
  return certs;
}

function extractDegrees(resume: CanonicalResume): Set<string> {
  const degrees = new Set<string>();
  for (const edu of resume.education ?? []) {
    if (edu.degree) degrees.add(edu.degree.toLowerCase().trim());
    if (edu.field) degrees.add(edu.field.toLowerCase().trim());
  }
  return degrees;
}

function extractMetrics(resume: CanonicalResume): Set<string> {
  const metrics = new Set<string>();
  const text = JSON.stringify(resume);
  // Extract patterns like "50%", "$2M", "10x", "200k"
  const matches = text.match(/\b(\d+(?:\.\d+)?[%xkKmMbB]?)\b/g) ?? [];
  matches.forEach((m) => metrics.add(m));
  return metrics;
}

function extractCompaniesFromText(text: string): string[] {
  // Heuristic: capitalized proper nouns followed by Inc, Corp, LLC, Ltd, or standalone
  const matches = text.match(/\b([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*(?:\s(?:Inc|Corp|LLC|Ltd|Co))?)\b/g) ?? [];
  return matches.map((m) => m.toLowerCase().trim());
}

function extractYearClaimsFromText(text: string): string[] {
  return (text.match(/\b(\d+)\+?\s*years?\s+(?:of\s+)?(?:experience|expertise|work)/gi) ?? [])
    .map((m) => m.toLowerCase().trim());
}

function extractCertMentionsFromText(text: string): string[] {
  // Common cert patterns: AWS, Google, Certified, Professional, Associate
  return (text.match(/\b(?:AWS|GCP|Azure|Certified|Professional|Associate|PMP|CPA|CFA|CISSP|CISM|PhD|MBA|MS|BS|BA)\b[^,.]*/g) ?? [])
    .map((m) => m.toLowerCase().trim());
}

function extractDegreeMentionsFromText(text: string): string[] {
  return (text.match(/\b(?:Bachelor|Master|PhD|Doctor|Associate|MBA|MS|BS|BA|BEng|MEng)(?:\s+of\s+[^,.\n]+)?/g) ?? [])
    .map((m) => m.toLowerCase().trim());
}

function extractQuantitativeMetrics(text: string): string[] {
  return (text.match(/\b\d+(?:\.\d+)?[%xkKmMbB$]?\b/g) ?? []).map((m) => m.toLowerCase());
}

function isInCanonical(value: string, canonicalSet: Set<string>): boolean {
  const normalized = value.toLowerCase().trim();
  return Array.from(canonicalSet).some(
    (c) => c.includes(normalized) || normalized.includes(c) || levenshteinSimilar(c, normalized)
  );
}

function isReasonableYearDerivation(claim: string, canonicalYears: Set<string>): boolean {
  // Extract the number from claim and check if it's close to any canonical year count
  const num = parseInt(claim.match(/\d+/)?.[0] ?? '0', 10);
  return Array.from(canonicalYears).some((y) => {
    const yNum = parseInt(y.match(/\d+/)?.[0] ?? '-1', 10);
    return Math.abs(num - yNum) <= 1; // allow ±1 year rounding
  });
}

function levenshteinSimilar(a: string, b: string): boolean {
  if (a.length < 3 || b.length < 3) return false;
  // Simple containment check as a proxy for similarity
  return a.includes(b.slice(0, Math.min(b.length, 6))) || b.includes(a.slice(0, Math.min(a.length, 6)));
}
