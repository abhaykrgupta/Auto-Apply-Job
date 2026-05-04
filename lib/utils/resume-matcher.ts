/**
 * Fast keyword-based resume scorer. No API calls — runs in <1ms per resume.
 * Returns a score 0–100 representing how well a resume matches a job.
 */
export function scoreResumeAgainstJob(
  resume: { parsedData: unknown; label?: string | null },
  job: { title: string; description: string; requirements?: string | null }
): number {
  const jobText = `${job.title} ${job.description} ${job.requirements ?? ''}`.toLowerCase();

  if (!resume.parsedData || typeof resume.parsedData !== 'object') return 0;

  const pd = resume.parsedData as Record<string, unknown>;
  const skills: string[] = Array.isArray(pd.skills) ? (pd.skills as string[]) : [];
  const experience: Array<{ title?: string; description?: string }> = Array.isArray(pd.experience)
    ? (pd.experience as Array<{ title?: string; description?: string }>)
    : [];

  const jobWords = new Set(
    jobText
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );

  let hits = 0;
  let total = 0;

  for (const skill of skills) {
    const skillLower = skill.toLowerCase();
    total += 2;
    if (jobWords.has(skillLower) || jobText.includes(skillLower)) hits += 2;
  }

  for (const exp of experience) {
    const expText = `${exp.title ?? ''} ${exp.description ?? ''}`.toLowerCase();
    const expWords = expText.split(/\s+/).filter((w) => w.length > 2);
    for (const word of expWords) {
      total += 1;
      if (jobWords.has(word)) hits += 1;
    }
  }

  if (total === 0) return 0;
  return Math.min(100, Math.round((hits / total) * 150));
}

/**
 * Given a list of active resumes, pick the best one for a job.
 * Returns the resume and its score.
 */
export function pickBestResume<T extends { parsedData: unknown; label?: string | null }>(
  resumes: T[],
  job: { title: string; description: string; requirements?: string | null }
): { resume: T; score: number } | null {
  if (resumes.length === 0) return null;
  if (resumes.length === 1) return { resume: resumes[0], score: scoreResumeAgainstJob(resumes[0], job) };

  let best: T = resumes[0];
  let bestScore = scoreResumeAgainstJob(resumes[0], job);

  for (let i = 1; i < resumes.length; i++) {
    const score = scoreResumeAgainstJob(resumes[i], job);
    if (score > bestScore) {
      bestScore = score;
      best = resumes[i];
    }
  }

  return { resume: best, score: bestScore };
}
