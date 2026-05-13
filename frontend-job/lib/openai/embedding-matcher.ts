/**
 * Embedding-based job matching — replaces gpt-4o for bulk/pipeline scoring.
 * Cost: ~$0.00002/call (vs $0.014 for gpt-4o) — 700× cheaper.
 *
 * Scoring formula:
 *   - 70% semantic similarity (embedding cosine)
 *   - 20% keyword overlap
 *   - 10% title match bonus
 */
import { getEmbedding } from './embeddings';
import { cosineSimilarity } from './cosine-similarity';

export interface EmbeddingMatchResult {
  score: number;          // 0–100
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
  confidence: number;
}

/** Build a plain-text "resume blob" from parsed resume data. */
function resumeToText(resumeData: Record<string, unknown>): string {
  const parts: string[] = [];

  const summary = resumeData.summary ?? resumeData.professionalSummary;
  if (typeof summary === 'string') parts.push(summary);

  const skills = resumeData.skills ?? resumeData.technicalSkills;
  if (Array.isArray(skills)) parts.push(skills.join(', '));
  else if (typeof skills === 'string') parts.push(skills);

  const experience = resumeData.experience ?? resumeData.workExperience;
  if (Array.isArray(experience)) {
    for (const exp of experience) {
      if (exp && typeof exp === 'object') {
        const e = exp as Record<string, unknown>;
        parts.push([e.title, e.company, e.description].filter(Boolean).join(' — '));
      }
    }
  }

  const education = resumeData.education;
  if (Array.isArray(education)) {
    for (const edu of education) {
      if (edu && typeof edu === 'object') {
        const e = edu as Record<string, unknown>;
        parts.push([e.degree, e.field, e.institution].filter(Boolean).join(' '));
      }
    }
  }

  return parts.join('\n').slice(0, 6000);
}

/** Build a plain-text "job blob" from a job object. */
function jobToText(job: { title: string; description: string; requirements?: string | null }): string {
  return [job.title, job.description, job.requirements].filter(Boolean).join('\n').slice(0, 4000);
}

/** Extract simple word tokens for keyword overlap heuristic. */
function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s+#]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2),
  );
}

function keywordOverlap(a: string, b: string): number {
  const ta = tokenize(a);
  const tb = tokenize(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let shared = 0;
  for (const t of ta) if (tb.has(t)) shared++;
  return shared / Math.min(ta.size, tb.size);
}

function titleBonus(resumeText: string, jobTitle: string): number {
  const words = jobTitle.toLowerCase().split(/\s+/);
  const resume = resumeText.toLowerCase();
  const matched = words.filter((w) => w.length > 3 && resume.includes(w));
  return matched.length / Math.max(words.length, 1);
}

export async function scoreJobMatchEmbedding(
  job: { title: string; company: string; description: string; requirements?: string | null; location?: string | null },
  resumeData: Record<string, unknown>,
): Promise<EmbeddingMatchResult> {
  const resumeText = resumeToText(resumeData);
  const jobText    = jobToText(job);

  if (!resumeText.trim()) {
    return {
      score: 0,
      strengths: [],
      weaknesses: ['Resume data is empty'],
      recommendation: 'Upload and parse a resume first.',
      confidence: 0,
    };
  }

  const [resumeEmb, jobEmb] = await Promise.all([
    getEmbedding(resumeText),
    getEmbedding(jobText),
  ]);

  const similarity = cosineSimilarity(resumeEmb, jobEmb); // 0–1
  const overlap    = keywordOverlap(resumeText, jobText);  // 0–1
  const bonus      = titleBonus(resumeText, job.title);    // 0–1

  // Weighted blend → 0–100
  const raw = similarity * 0.70 + overlap * 0.20 + bonus * 0.10;
  const score = Math.round(Math.min(100, Math.max(0, raw * 130))); // scale so ~0.75 sim → ~80

  // Lightweight strengths/weaknesses from keyword overlap
  const resumeTokens = tokenize(resumeText);
  const jobTokens    = tokenize(jobText);

  const strengths: string[] = [];
  const weaknesses: string[] = [];

  // Find tech-like tokens in job that are (or aren't) in resume
  const techPat = /^(react|node|python|java|sql|aws|gcp|azure|docker|k8s|kubernetes|typescript|javascript|go|rust|swift|kotlin|vue|angular|next|express|django|flask|spring|graphql|postgres|mongo|redis|kafka|spark|ml|ai|llm)$/;
  for (const tok of jobTokens) {
    if (!techPat.test(tok)) continue;
    if (resumeTokens.has(tok)) strengths.push(tok);
    else weaknesses.push(tok);
  }

  const rec =
    score >= 80
      ? `Strong match for ${job.title} at ${job.company}.`
      : score >= 60
        ? `Decent match — consider highlighting relevant skills.`
        : `Lower match — focus on tailoring your resume for this role.`;

  return {
    score,
    strengths: strengths.slice(0, 5),
    weaknesses: weaknesses.slice(0, 5),
    recommendation: rec,
    confidence: Math.min(1, similarity + 0.2),
  };
}
